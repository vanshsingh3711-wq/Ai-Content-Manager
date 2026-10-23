"""
Render Progress Tracking Service.
Provides thread-safe and distributed tracking of video timeline render jobs
for polling and Server-Sent Events (SSE) streaming.
"""

import json
import logging
import threading
import time
from typing import Any, Dict, Optional

logger = logging.getLogger("render_tracker")

# In-memory thread-safe progress store
_RENDER_LOCK = threading.Lock()
_RENDER_STORE: Dict[str, Dict[str, Any]] = {}


def _get_redis_client():
    """Attempts to connect to Redis if available, else returns None."""
    try:
        import redis
        # Use localhost / default port
        r = redis.Redis(host="localhost", port=6379, db=0, socket_connect_timeout=0.3, socket_timeout=0.3)
        r.ping()
        return r
    except Exception:
        return None


def update_render_progress(
    render_id: str,
    video_id: Optional[str] = None,
    progress: int = 0,
    stage: str = "rendering",
    message: str = "",
    extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Updates progress state for an active render job.
    Stores in local cache, Redis (if connected), and returns state dict.
    """
    extra = extra or {}
    record: Dict[str, Any] = {
        "render_id": render_id,
        "video_id": str(video_id) if video_id else "",
        "status": "completed" if progress >= 100 or stage == "completed" else ("error" if stage == "error" else "rendering"),
        "stage": stage,
        "progress": max(0, min(100, int(progress))),
        "message": message or f"Rendering stage: {stage}",
        "timestamp": time.time(),
        **extra,
    }

    # 1. Thread-safe in-memory store
    with _RENDER_LOCK:
        _RENDER_STORE[render_id] = record
        if video_id:
            _RENDER_STORE[str(video_id)] = record

    # 2. Redis store (distributed fallback)
    try:
        r = _get_redis_client()
        if r:
            serialized = json.dumps(record)
            r.set(f"render_progress:{render_id}", serialized, ex=3600)
            if video_id:
                r.set(f"render_progress:{video_id}", serialized, ex=3600)
    except Exception as e:
        logger.debug(f"Redis progress store note: {e}")

    return record


def get_render_progress(
    render_id: Optional[str] = None,
    video_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Retrieves the current render progress for a render_id or video_id.
    Checks memory first, then Redis.
    """
    # 1. In-memory check
    with _RENDER_LOCK:
        if render_id and render_id in _RENDER_STORE:
            return dict(_RENDER_STORE[render_id])
        if video_id and str(video_id) in _RENDER_STORE:
            return dict(_RENDER_STORE[str(video_id)])

    # 2. Redis check
    try:
        r = _get_redis_client()
        if r:
            if render_id:
                raw = r.get(f"render_progress:{render_id}")
                if raw:
                    return json.loads(raw.decode("utf-8"))
            if video_id:
                raw = r.get(f"render_progress:{video_id}")
                if raw:
                    return json.loads(raw.decode("utf-8"))
    except Exception as e:
        logger.debug(f"Redis progress lookup note: {e}")

    return None


def clear_render_progress(render_id: Optional[str] = None, video_id: Optional[str] = None) -> None:
    """Cleans up render tracking records after completion."""
    with _RENDER_LOCK:
        if render_id and render_id in _RENDER_STORE:
            _RENDER_STORE.pop(render_id, None)
        if video_id and str(video_id) in _RENDER_STORE:
            _RENDER_STORE.pop(str(video_id), None)

    try:
        r = _get_redis_client()
        if r:
            if render_id:
                r.delete(f"render_progress:{render_id}")
            if video_id:
                r.delete(f"render_progress:{video_id}")
    except Exception:
        pass
