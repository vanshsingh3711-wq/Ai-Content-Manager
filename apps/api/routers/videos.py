from datetime import datetime, timezone
import json
import os
import sys
import tempfile
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse, StreamingResponse, RedirectResponse
from pydantic import BaseModel, Field, model_validator
from sqlmodel import Session, select, desc, func

from config import get_settings
from database import get_session
from models import User, VideoJob, VideoJobStatus, VideoType, ProjectSnapshot
from routers.jobs import (
    dispatch_job_to_celery,
    dispatch_timeline_render_to_celery,
    dispatch_publish_socials_to_celery,
)
from storage import get_presigned_url_from_full_url

settings = get_settings()

router = APIRouter(prefix="/api/v1/videos", tags=["Videos & Jobs"])


class CreateVideoJobRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    source_url: str = Field(default="", description="S3/R2 direct upload URI. Empty for faceless videos.")
    video_type: VideoType = Field(default=VideoType.TALKING_HEAD)
    clerk_id: Optional[str] = Field("user_default", description="Clerk user ID")
    email: Optional[str] = Field("user@example.com", description="User email")
    settings: Optional[dict] = Field(default=None, description="Video style, aspect ratio, and editing preferences")

    @model_validator(mode="after")
    def validate_job_contract(self):
        # 1. Talking Head videos MUST have a valid source URL
        if self.video_type == VideoType.TALKING_HEAD:
            clean_url = (self.source_url or "").strip()
            if not clean_url:
                raise ValueError("Talking head videos require a valid, non-empty source_url for footage.")
            allowed_schemes = ("http://", "https://", "s3://", "r2://")
            if not any(clean_url.startswith(scheme) for scheme in allowed_schemes):
                raise ValueError(f"Invalid source_url protocol. Allowed schemes: {allowed_schemes}")

        # 2. Faceless videos require a script or topic
        elif self.video_type == VideoType.FACELESS_SHORT:
            settings_dict = self.settings or {}
            script_text = (
                settings_dict.get("script_text")
                or settings_dict.get("script")
                or settings_dict.get("topic")
                or ""
            )
            if not isinstance(script_text, str) or not script_text.strip():
                raise ValueError("Faceless short videos require 'script_text' in job settings.")

        # 3. Guard against SSRF / local path injection in source_url
        if self.source_url:
            clean_url = self.source_url.strip()
            disallowed_schemes = ("file://", "gopher://", "ftp://", "javascript:")
            if any(clean_url.lower().startswith(d) for d in disallowed_schemes):
                raise ValueError("Disallowed URI protocol in source_url.")

        return self


class VideoJobResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    source_url: str
    rendered_url: Optional[str] = None
    video_type: VideoType
    status: VideoJobStatus
    edit_decision_list: Optional[str] = None
    error_log: Optional[str] = None
    settings: Optional[dict] = None
    created_at: datetime
    updated_at: datetime


class UpdateJobStatusRequest(BaseModel):
    status: VideoJobStatus
    rendered_url: Optional[str] = None
    edit_decision_list: Optional[str] = None
    error_log: Optional[str] = None


class SaveTimelineRequest(BaseModel):
    project: dict = Field(..., description="CanonicalVideoProject (TimelineProject) model")
    fps: Optional[int] = Field(30, description="Frames per second")


class RenderTimelineRequest(BaseModel):
    project: dict = Field(..., description="CanonicalVideoProject (TimelineProject) model")
    resolution: Optional[str] = Field("1080p", description="Output render resolution (720p, 1080p, 4k)")
    format: Optional[str] = Field("mp4", description="Output video format")
    generate_nle: Optional[bool] = Field(True, description="Whether to compile NLE export packages")
    fps: Optional[int] = Field(30, description="Frames per second")
    clerk_id: Optional[str] = Field("user_default", description="Owner user ID")


class CreateSnapshotRequest(BaseModel):
    label: str = Field(..., min_length=1, max_length=255, description="Snapshot checkpoint label")
    description: Optional[str] = Field(None, description="Optional snapshot notes")
    timeline_project: Optional[dict] = Field(None, description="Explicit TimelineProject state to freeze")


class ProjectSnapshotResponse(BaseModel):
    id: uuid.UUID
    video_id: uuid.UUID
    version: int
    label: str
    description: Optional[str] = None
    created_at: datetime
    clip_counts: Optional[dict] = None
    timeline_project: Optional[dict] = None


@router.post("/create-job", response_model=VideoJobResponse, status_code=status.HTTP_201_CREATED)
def create_video_job(
    payload: CreateVideoJobRequest,
    session: Session = Depends(get_session),
):
    """
    Registers a new video job in PostgreSQL once direct R2/S3 upload completes.
    Initializes the state machine in status QUEUED and dispatches to Celery.
    """
    clerk_id = payload.clerk_id or "user_default"
    email = payload.email or "user@example.com"
    print(f"\n[API: VIDEOS] 🚀 Received Create Job Request: '{payload.title}' ({payload.video_type})")
    print(f"[API: VIDEOS] 🔗 Source URL: {payload.source_url}")

    # Find or create user
    user = session.exec(select(User).where(User.clerk_id == clerk_id)).first()
    if not user:
        user = User(
            clerk_id=clerk_id,
            email=email,
            created_at=datetime.now(timezone.utc),
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"[API: VIDEOS] 👤 Created new User profile: {user.id} ({email})")

    # Create VideoJob
    job = VideoJob(
        user_id=user.id,
        title=payload.title,
        source_url=payload.source_url,
        video_type=payload.video_type,
        status=VideoJobStatus.QUEUED,
        settings=payload.settings,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    print(f"[API: VIDEOS] ✅ Registered VideoJob {job.id} with status QUEUED")

    # Auto-dispatch to Celery worker if enabled
    auto_dispatch = getattr(settings, "AUTO_DISPATCH_JOBS", True)
    queue_name = getattr(settings, "CELERY_TASK_DEFAULT_QUEUE", "video_processing_queue")
    if auto_dispatch:
        print(f"[API: VIDEOS] ⚡ Auto-dispatching job {job.id} to Celery queue '{queue_name}'...")
        try:
            dispatch_job_to_celery(job.id)
        except Exception as dispatch_err:
            print(f"[API: VIDEOS] ⚠️ Celery dispatch deferred for Job {job.id}: {dispatch_err}")

    # Sign the urls before returning
    job.source_url = get_presigned_url_from_full_url(job.source_url)
    job.rendered_url = get_presigned_url_from_full_url(job.rendered_url)
    return job


@router.get("", response_model=List[VideoJobResponse])
def list_video_jobs(
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
):
    """Lists all video processing jobs ordered by creation date."""
    statement = select(VideoJob).order_by(desc(VideoJob.created_at)).offset(offset).limit(limit)
    jobs = session.exec(statement).all()
    print(f"[API: VIDEOS] 📋 Listing {len(jobs)} video jobs from database")
    # Sign urls
    for j in jobs:
        j.source_url = get_presigned_url_from_full_url(j.source_url)
        j.rendered_url = get_presigned_url_from_full_url(j.rendered_url)
    return jobs


@router.get("/{video_id}", response_model=VideoJobResponse)
def get_video_job(
    video_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """Retrieves a single video job and its current processing status."""
    job = session.get(VideoJob, video_id)
    if not job:
        print(f"[API: VIDEOS] ❌ Video job {video_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )
    print(f"[API: VIDEOS] 🔍 Retrieved job {job.id}: Status={job.status}")
    # Sign urls
    job.source_url = get_presigned_url_from_full_url(job.source_url)
    job.rendered_url = get_presigned_url_from_full_url(job.rendered_url)
    return job


@router.get("/{video_id}/visual-timeline")
def get_video_visual_timeline(
    video_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """
    Retrieves the pre-computed visual intelligence timeline for a video job,
    including detected scenes, subjects (presenter bounding boxes), composition
    segments, and calculated safe zones.
    """
    import json
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )

    # 1. Check if edit_decision_list has unified_analysis -> visual_analysis
    if job.edit_decision_list:
        try:
            edl = json.loads(job.edit_decision_list)
            if isinstance(edl, dict):
                visual = (
                    edl.get("unified_analysis", {}).get("visual_analysis")
                    or edl.get("visual_analysis")
                    or edl.get("visual_timeline")
                )
                if visual and isinstance(visual, dict):
                    return visual
        except Exception as e:
            print(f"[API: VIDEOS] Warning: failed to parse EDL for visual timeline: {e}")

    # 2. Check if job settings has visual_timeline
    if job.settings and isinstance(job.settings, dict):
        visual = job.settings.get("visual_timeline") or job.settings.get("visual_analysis")
        if visual and isinstance(visual, dict):
            return visual

    # 3. Fallback default timeline (e.g. faceless, queued, or pending analysis)
    return {
        "video_id": str(video_id),
        "scenes": [],
        "subjects": [],
        "composition_segments": [],
        "safe_regions": ["top-left", "top-right", "bottom-left", "bottom-right"],
        "observations": [],
    }


@router.get("/{video_id}/transcript")
def get_video_transcript(
    video_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """
    Retrieves the Faster-Whisper word-level transcript, timestamp_map chunks,
    and narrative BeatSheet for spoken synchronization and storytelling anchoring.
    """
    import json
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )

    timestamp_map = {}
    beat_sheet = {"beats": []}
    words = []
    full_text = ""

    if job.edit_decision_list:
        try:
            edl = json.loads(job.edit_decision_list)
            if isinstance(edl, dict):
                timestamp_map = edl.get("timestamp_map") or {}
                unified = edl.get("unified_analysis") or {}
                if isinstance(unified, dict):
                    beat_sheet = unified.get("beat_sheet") or edl.get("beat_sheet") or {"beats": []}
                else:
                    beat_sheet = edl.get("beat_sheet") or {"beats": []}

                # Flatten words in chronological sequence
                sorted_chunks = sorted(
                    timestamp_map.items(),
                    key=lambda item: item[1].get("start", 0) if isinstance(item[1], dict) else 0
                )

                chunk_texts = []
                for chunk_id, chunk in sorted_chunks:
                    if not isinstance(chunk, dict):
                        continue
                    c_text = chunk.get("text", "").strip()
                    if c_text:
                        chunk_texts.append(c_text)

                    chunk_words = chunk.get("words", [])
                    if chunk_words:
                        for w in chunk_words:
                            if isinstance(w, dict):
                                w_dict = dict(w)
                                w_dict["chunk_id"] = chunk_id
                                words.append(w_dict)
                    elif c_text:
                        words.append({
                            "word": c_text,
                            "start": chunk.get("start", 0.0),
                            "end": chunk.get("end", 0.0),
                            "probability": 1.0,
                            "chunk_id": chunk_id,
                        })

                full_text = " ".join(chunk_texts)
        except Exception as e:
            print(f"[API: VIDEOS] Warning: failed to parse EDL for transcript: {e}")

    return {
        "video_id": str(video_id),
        "timestamp_map": timestamp_map,
        "words": words,
        "beat_sheet": beat_sheet,
        "text": full_text,
    }


@router.patch("/{video_id}/status", response_model=VideoJobResponse)
def update_video_job_status(
    video_id: uuid.UUID,
    payload: UpdateJobStatusRequest,
    session: Session = Depends(get_session),
):
    """Updates the state machine status of a video job (used by background workers)."""
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )
    
    job.status = payload.status
    if payload.rendered_url is not None:
        job.rendered_url = payload.rendered_url
    if payload.edit_decision_list is not None:
        job.edit_decision_list = payload.edit_decision_list
    if payload.error_log is not None:
        job.error_log = payload.error_log
        
    job.updated_at = datetime.now(timezone.utc)
    session.add(job)
    session.commit()
    session.refresh(job)
    
    job.source_url = get_presigned_url_from_full_url(job.source_url)
    job.rendered_url = get_presigned_url_from_full_url(job.rendered_url)
    return job

@router.post("/{video_id}/retry", response_model=VideoJobResponse)
def retry_video_job(
    video_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """Retries a failed video job by resetting its status and dispatching it to Celery."""
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )
    if job.status != VideoJobStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only failed jobs can be retried. Current status is {job.status}",
        )
    
    # Reset job state
    job.status = VideoJobStatus.QUEUED
    job.error_log = None
    job.rendered_url = None
    job.updated_at = datetime.now(timezone.utc)
    
    session.add(job)
    session.commit()
    session.refresh(job)
    print(f"[API: VIDEOS] 🔄 Retrying VideoJob {job.id} (Status reset to QUEUED)")
    
    if settings.AUTO_DISPATCH_JOBS:
        print(f"[API: VIDEOS] ⚡ Auto-dispatching job {job.id} to Celery queue '{settings.CELERY_TASK_DEFAULT_QUEUE}'...")
        dispatch_job_to_celery(job.id)
        
    job.source_url = get_presigned_url_from_full_url(job.source_url)
    job.rendered_url = get_presigned_url_from_full_url(job.rendered_url)
    return job


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video_job(
    video_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """Deletes a video job from PostgreSQL."""
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )
    session.delete(job)
    session.commit()
    return None


@router.get("/{video_id}/export-nle")
def export_video_job_nle(
    video_id: uuid.UUID,
    format: str = "all",
    session: Session = Depends(get_session),
):
    """
    Exports a completed video job into professional NLE multi-track timelines:
    - format=all (default): returns a ZIP archive with .fcpxml, .xml, .edl, .srt, CAPCUT.md and media/
    - format=premiere: returns Adobe Premiere Pro XML (.xml, xmeml version 4)
    - format=resolve or format=fcpxml: returns DaVinci Resolve & FCPX FCPXML (.fcpxml, version 1.10)
    - format=edl: returns CMX3600 Edit Decision List (.edl)
    - format=srt: returns SubRip subtitle file (.srt)
    - format=capcut: returns CapCut rebuild guide (CAPCUT.md)
    """
    import json
    import os
    import sys
    import tempfile
    from pathlib import Path

    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )

    if not job.edit_decision_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job has no edit decisions yet. Wait for processing to complete before exporting timeline.",
        )

    try:
        data = json.loads(job.edit_decision_list)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse edit decision list: {e}",
        )

    edits = data.get("validated_edits") or data.get("edits") or []
    timestamp_map = data.get("timestamp_map") or {}
    job_settings = data.get("settings") or job.settings or {}

    # Import NLE exporter from worker services
    worker_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "worker"))
    if worker_path not in sys.path:
        sys.path.insert(0, worker_path)

    from services.nle_exporter import export_nle_project

    # Locate source video if accessible locally
    source_candidate = job.source_url or ""
    raw_video_path = source_candidate
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    media_temp_base = os.path.join(repo_root, "media_temp")
    for candidate_dir in [media_temp_base, os.path.join(worker_path, "media_temp")]:
        local_cand = os.path.join(candidate_dir, os.path.basename(source_candidate))
        if os.path.exists(local_cand):
            raw_video_path = local_cand
            break

    # If raw video file path does not exist on disk, create a lightweight reference placeholder
    if not raw_video_path or not os.path.exists(raw_video_path):
        temp_dir = tempfile.mkdtemp(prefix="nle_placeholder_")
        placeholder = os.path.join(temp_dir, os.path.basename(source_candidate) or "source_raw.mp4")
        if not os.path.exists(placeholder):
            with open(placeholder, "wb") as pf:
                pf.write(b"\x00" * 1024)
        raw_video_path = placeholder

    export_dir = tempfile.mkdtemp(prefix=f"nle_export_{job.id}_")
    export_result = export_nle_project(
        output_dir=export_dir,
        project_name=job.title,
        raw_video_path=raw_video_path,
        edits=edits,
        timestamp_map=timestamp_map,
        settings=job_settings,
        create_zip=(format == "all"),
    )

    clean_name = export_result["project_name"]
    fmt = format.lower().strip()

    if fmt in ("fcpxml", "resolve", "finalcut"):
        return FileResponse(
            export_result["files"]["fcpxml"],
            media_type="application/xml",
            filename=f"{clean_name}.fcpxml"
        )
    elif fmt in ("premiere", "xml", "fcp7"):
        return FileResponse(
            export_result["files"]["premiere_xml"],
            media_type="application/xml",
            filename=f"{clean_name}.xml"
        )
    elif fmt == "edl":
        return FileResponse(
            export_result["files"]["edl"],
            media_type="text/plain",
            filename=f"{clean_name}.edl"
        )
    elif fmt == "srt":
        return FileResponse(
            export_result["files"]["srt"],
            media_type="text/plain",
            filename=f"{clean_name}.srt"
        )
    elif fmt in ("capcut", "md"):
        return FileResponse(
            export_result["files"]["capcut_md"],
            media_type="text/markdown",
            filename="CAPCUT.md"
        )
    else:
        # Default: full ZIP package with all XMLs, EDL, SRT, guide, and media assets
        return FileResponse(
            export_result["zip_path"],
            media_type="application/zip",
            filename=f"{clean_name}_nle_export.zip"
        )


def _compile_timeline_project_to_edl(project: dict, fps: int = 30) -> dict:
    tracks = project.get("tracks") or {}

    video_track = []
    broll_track = []
    text_track = []
    graphics_track = []
    audio_track = []

    if isinstance(tracks, dict):
        video_track = tracks.get("videoTrack", []) or []
        broll_track = tracks.get("brollTrack", []) or []
        text_track = tracks.get("textTrack", []) or []
        graphics_track = tracks.get("graphicsTrack", []) or []
        audio_track = tracks.get("audioTrack", []) or []
    elif isinstance(tracks, list):
        for tr in tracks:
            if not isinstance(tr, dict):
                continue
            t_type = (tr.get("type") or "").lower()
            clips = tr.get("clips") or []
            if t_type == "video":
                video_track.extend(clips)
            elif t_type in ("broll", "overlay"):
                broll_track.extend(clips)
            elif t_type in ("text", "caption", "subtitle"):
                text_track.extend(clips)
            elif t_type in ("graphic", "graphics", "asset"):
                graphics_track.extend(clips)
            elif t_type == "audio":
                audio_track.extend(clips)

    # Also check if project has elements directly (e.g. from canonical layout)
    elements = project.get("elements") or []
    for el in elements:
        if not isinstance(el, dict):
            continue
        el_type = el.get("type", "")
        if el_type in ("headline", "metric", "card", "counter", "lower-third", "asset"):
            graphics_track.append({
                "id": el.get("id"),
                "name": el.get("name") or el.get("compositionId") or el.get("motionComponentId") or "Graphic Element",
                "compositionId": el.get("motionComponentId") or el.get("compositionId") or "hero_reveal",
                "start": el.get("startTime", el.get("start", 0)),
                "end": el.get("endTime", el.get("end", (el.get("startTime", 0) + el.get("duration", 3.0)))),
                "props": el.get("props", {}),
                "position": el.get("position", {"x": 50, "y": 50}),
                "scale": el.get("scale", 1.0),
            })

    edits = []

    # Transcript / Timestamp map
    transcript = project.get("transcript", {}) or {}
    timestamp_map = transcript.get("timestampMap") or {}
    if not isinstance(timestamp_map, dict):
        timestamp_map = {}
    else:
        timestamp_map = dict(timestamp_map)

    # 1. Video cuts
    for clip in video_track:
        start = float(clip.get("start", 0))
        end = float(clip.get("end", 0))
        if end <= start and clip.get("duration"):
            end = start + float(clip.get("duration", 0))

        cid = clip.get("id") or str(uuid.uuid4())[:8]
        edits.append({
            "id": cid,
            "trigger_id": cid,
            "action": "cut",
            "type": "cut",
            "start": start,
            "end": end,
            "sourceStart": float(clip.get("sourceStart", 0)),
            "sourceEnd": float(clip.get("sourceEnd", end - start if end > start else 0)),
            "speed": float(clip.get("speed", 1.0)),
            "zoomFactor": float(clip.get("zoomFactor", 1.0)),
            "sourceUrl": clip.get("sourceUrl", ""),
            "name": clip.get("name", "Video Clip"),
        })

    # 2. B-Roll overlays
    for b in broll_track:
        start = float(b.get("start", 0))
        end = float(b.get("end", 0))
        if end <= start and b.get("duration"):
            end = start + float(b.get("duration", 0))
        bid = b.get("id") or str(uuid.uuid4())[:8]
        b_path = b.get("path") or b.get("sourceUrl", "")
        edits.append({
            "id": bid,
            "trigger_id": bid,
            "action": "b_roll",
            "type": "broll",
            "start": start,
            "end": end,
            "sourceUrl": b.get("sourceUrl", ""),
            "path": b_path,
            "broll_path": b_path,
            "broll_query": b.get("name", "B-Roll Cut"),
            "opacity": int(b.get("opacity", 100)),
            "fitMode": b.get("fitMode", "cover"),
            "name": b.get("name", "B-Roll Cut"),
        })

    is_faceless = (
        project.get("videoType") == "faceless_short"
        or project.get("isFaceless") is True
        or "faceless" in str(project.get("videoType", "")).lower()
        or bool((project.get("settings") or {}).get("is_faceless"))
    )
    default_caption_y = 50 if is_faceless else 75

    # 3. Subtitles / Captions
    for c in text_track:
        start = float(c.get("start", 0))
        end = float(c.get("end", 0))
        if end <= start and c.get("duration"):
            end = start + float(c.get("duration", 0))
        cid = c.get("id") or str(uuid.uuid4())[:8]
        txt = c.get("text", "")
        pos = c.get("position") if isinstance(c.get("position"), dict) else {}
        cap_y = c.get("positionY") or pos.get("y", default_caption_y)
        edits.append({
            "id": cid,
            "trigger_id": cid,
            "action": "subtitle",
            "type": "subtitle",
            "start": start,
            "end": end,
            "text": txt,
            "stylePreset": c.get("stylePreset", "tiktok_yellow"),
            "position": {"x": pos.get("x", 50), "y": cap_y},
            "positionY": cap_y,
            "scale": float(c.get("scale", 1.0)),
        })
        if cid not in timestamp_map and txt:
            timestamp_map[cid] = {
                "start": start,
                "end": end,
                "text": txt,
                "words": [],
            }

    # 4. Motion Graphics
    for g in graphics_track:
        g_elem = g.get("graphicElement") if isinstance(g.get("graphicElement"), dict) else {}
        start = float(g.get("start", g.get("startTime", g_elem.get("startTime", 0))))
        end = float(g.get("end", g.get("endTime", 0)))
        dur = float(g.get("duration", g_elem.get("duration", 0)))
        if end <= start and dur > 0:
            end = start + dur
        comp_id = (
            g.get("compositionId")
            or g.get("motionComponentId")
            or g_elem.get("motionComponentId")
            or "hero_reveal"
        )
        props = g.get("props") or g_elem.get("props") or {}
        pos = g.get("position") or g_elem.get("position") or {"x": 50, "y": 50}
        scale = float(g.get("scale", g_elem.get("scale", 1.0)))
        gid = g.get("id") or g_elem.get("id") or str(uuid.uuid4())[:8]
        gname = g.get("name") or comp_id

        edits.append({
            "id": gid,
            "trigger_id": gid,
            "action": "motion_graphics",
            "type": "motion_graphic",
            "start": start,
            "end": end,
            "name": gname,
            "compositionId": comp_id,
            "template": comp_id,
            "motion_graphics_type": comp_id,
            "motion_graphics_targets": props,
            "motion_graphics_text": props.get("text") or gname,
            "props": props,
            "position": pos,
            "scale": scale,
        })

    # 5. Audio Tracks
    for a in audio_track:
        start = float(a.get("start", 0))
        end = float(a.get("end", 0))
        if end <= start and a.get("duration"):
            end = start + float(a.get("duration", 0))
        aid = a.get("id") or str(uuid.uuid4())[:8]
        is_bgm = bool(a.get("isBgm", False))
        ducking_val = a.get("ducking", False)
        is_ducking = bool(ducking_val) if not isinstance(ducking_val, dict) else bool(ducking_val.get("enabled", True))
        ducking_db = float(a.get("duckingDb", a.get("ducking_db", -14.0))) if not isinstance(ducking_val, dict) else float(ducking_val.get("attenuationDb", -14.0))

        edits.append({
            "id": aid,
            "trigger_id": aid,
            "action": "audio" if is_bgm else "sfx",
            "type": "audio",
            "start": start,
            "end": end,
            "sourceUrl": a.get("sourceUrl", ""),
            "volume": int(a.get("volume", 80)),
            "isBgm": is_bgm,
            "sound_effect": a.get("name", "pop"),
            "ducking": is_ducking,
            "ducking_db": ducking_db,
            "fade_in": float(a.get("fadeIn", a.get("fade_in", 0.0))),
            "fade_out": float(a.get("fadeOut", a.get("fade_out", 0.0))),
        })

    total_duration = float(project.get("duration") or 0)
    if total_duration <= 0 and project.get("durationFrames"):
        total_duration = float(project.get("durationFrames")) / fps
    if total_duration <= 0:
        total_duration = 10.0

    return {
        "edits": edits,
        "validated_edits": edits,
        "timestamp_map": timestamp_map,
        "settings": {
            "aspect_ratio": project.get("aspectRatio", "9:16"),
            "fps": fps,
            "duration": total_duration,
            "title": project.get("title", "Studio Video"),
        }
    }


@router.get("/{video_id}/timeline")
def get_video_timeline(
    video_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """
    Retrieves the persisted TimelineProject for a video job, allowing the web editor
    to restore state seamlessly across page refreshes and multi-client workflows.
    """
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )

    # Sign S3 URLs with fresh authorization tokens
    signed_source = get_presigned_url_from_full_url(job.source_url)
    signed_rendered = get_presigned_url_from_full_url(job.rendered_url)
    job.source_url = signed_source
    job.rendered_url = signed_rendered
    primary_source = signed_rendered or signed_source or ""

    # 1. Check if edit_decision_list has persisted timeline_project
    is_faceless_job = (
        job.video_type == VideoType.FACELESS_SHORT
        or "faceless" in str(job.video_type).lower()
        or bool((job.settings or {}).get("is_faceless"))
    )
    default_caption_y = 50 if is_faceless_job else 75

    if job.edit_decision_list:
        try:
            parsed = json.loads(job.edit_decision_list) if isinstance(job.edit_decision_list, str) else job.edit_decision_list
            if isinstance(parsed, dict) and "timeline_project" in parsed and parsed["timeline_project"]:
                tp = parsed["timeline_project"]
                if "videoType" not in tp:
                    tp["videoType"] = job.video_type.value if hasattr(job.video_type, "value") else str(job.video_type)
                if "isFaceless" not in tp:
                    tp["isFaceless"] = is_faceless_job
                # Ensure videoTrack has a playable media source if missing
                tracks = tp.get("tracks") or {}
                v_track = tracks.get("videoTrack") or []
                if not v_track and primary_source:
                    v_track.append({
                        "id": f"clip_{uuid.uuid4().hex[:8]}",
                        "name": job.title or "AI Video Clip",
                        "sourceUrl": primary_source,
                        "proxyUrl": f"/api/v1/videos/{video_id}/rendered-file",
                        "start": 0.0,
                        "end": float(tp.get("duration", 12.0)),
                        "sourceStart": 0.0,
                        "sourceEnd": float(tp.get("duration", 12.0)),
                        "speed": 1.0,
                        "volume": 100,
                        "zoomFactor": 1.0,
                    })
                    tracks["videoTrack"] = v_track
                    tp["tracks"] = tracks
                elif v_track and primary_source:
                    # Update expired/unsigned S3 URLs with fresh signed URL and proxyUrl
                    for clip in v_track:
                        if not clip.get("sourceUrl") or ("amazonaws.com" in clip.get("sourceUrl", "") and "X-Amz-" not in clip.get("sourceUrl", "")):
                            clip["sourceUrl"] = primary_source
                        if not clip.get("proxyUrl"):
                            clip["proxyUrl"] = f"/api/v1/videos/{video_id}/rendered-file"
                return tp
            elif isinstance(parsed, dict) and ("edits" in parsed or "validated_edits" in parsed or "raw_edits" in parsed):
                # Reconstruct timeline project from AI pipeline edits
                edits = parsed.get("edits") or parsed.get("validated_edits") or parsed.get("raw_edits") or []
                v_track = []
                b_track = []
                t_track = []
                g_track = []
                a_track = []
                transitions = []

                primary_source = job.rendered_url or job.source_url or ""

                for e in edits:
                    act = e.get("action") or e.get("type") or ""
                    start_t = float(e.get("start", 0))
                    end_t = float(e.get("end", 0))

                    if act == "cut":
                        v_track.append({
                            "id": e.get("id") or str(uuid.uuid4())[:8],
                            "name": e.get("name", "Video Clip"),
                            "sourceUrl": e.get("sourceUrl") or primary_source,
                            "start": start_t,
                            "end": end_t,
                            "sourceStart": float(e.get("sourceStart", start_t)),
                            "sourceEnd": float(e.get("sourceEnd", end_t)),
                            "speed": float(e.get("speed", 1.0)),
                            "volume": 100,
                            "zoomFactor": float(e.get("zoomFactor", 1.0)),
                        })
                    elif act in ("b_roll", "broll"):
                        b_track.append({
                            "id": e.get("id") or str(uuid.uuid4())[:8],
                            "name": e.get("name") or e.get("search_query") or e.get("broll_query", "B-Roll Cut"),
                            "sourceUrl": e.get("sourceUrl") or e.get("broll_path") or e.get("url") or "",
                            "start": start_t,
                            "end": end_t,
                            "opacity": int(e.get("opacity", 100)),
                            "fitMode": e.get("fitMode", "cover"),
                        })
                    elif act in ("subtitle", "caption", "text"):
                        t_track.append({
                            "id": e.get("id") or str(uuid.uuid4())[:8],
                            "text": e.get("text", ""),
                            "start": start_t,
                            "end": end_t,
                            "stylePreset": e.get("stylePreset") or (job.settings or {}).get("caption_preset", "tiktok_yellow"),
                            "positionY": e.get("positionY") or (e.get("position", {}).get("y") if isinstance(e.get("position"), dict) else default_caption_y),
                        })
                    elif act in ("motion_graphics", "motion_graphic"):
                        comp_id = e.get("compositionId") or e.get("motion_graphics_type") or e.get("template") or "hero_reveal"
                        mg_name = e.get("name") or e.get("motion_graphics_type") or e.get("template", "Graphic")
                        mg_props = e.get("props") or e.get("motion_graphics_targets") or {}
                        g_track.append({
                            "id": e.get("id") or str(uuid.uuid4())[:8],
                            "name": mg_name,
                            "compositionId": comp_id,
                            "start": start_t,
                            "end": end_t,
                            "props": mg_props,
                            "position": e.get("position", {"x": 50, "y": 50}),
                        })
                    elif act in ("audio", "sfx", "sound_effect"):
                        sfx_name = e.get("sound_effect") or e.get("sfx_name") or e.get("name", "Audio Effect")
                        a_track.append({
                            "id": e.get("id") or str(uuid.uuid4())[:8],
                            "name": sfx_name,
                            "sourceUrl": e.get("sourceUrl") or f"/assets/audio/{sfx_name}.mp3",
                            "start": start_t,
                            "end": end_t,
                            "volume": int(e.get("volume", 80)),
                            "isBgm": bool(e.get("isBgm", False)),
                        })
                    elif act == "transition":
                        transitions.append({
                            "id": e.get("id") or f"trans-{uuid.uuid4().hex[:6]}",
                            "preset": e.get("transition") or e.get("preset", "crossfade"),
                            "duration": float(e.get("duration", 0.5)),
                            "alignment": e.get("alignment", "center"),
                            "fromClipId": e.get("fromClipId", ""),
                            "toClipId": e.get("toClipId", ""),
                        })

                # If textTrack has no subtitles, populate directly from Whisper timestamp_map
                if not t_track:
                    t_map = parsed.get("timestamp_map") or {}
                    for chunk_id, chunk in sorted(t_map.items(), key=lambda x: x[1].get("start", 0) if isinstance(x[1], dict) else 0):
                        if isinstance(chunk, dict) and "start" in chunk and "end" in chunk:
                            t_track.append({
                                "id": f"cap_{chunk_id}",
                                "text": chunk.get("text", "").strip(),
                                "start": float(chunk.get("start", 0)),
                                "end": float(chunk.get("end", 0)),
                                "stylePreset": (job.settings or {}).get("caption_preset", "tiktok_yellow"),
                                "positionY": default_caption_y,
                            })

                # Calculate duration from tracks or job settings
                aspect = (job.settings or {}).get("aspect_ratio", "9:16")
                dur = float((job.settings or {}).get("duration", 0))
                all_clip_ends = (
                    [c["end"] for c in v_track] +
                    [c["end"] for c in b_track] +
                    [c["end"] for c in t_track] +
                    [c["end"] for c in g_track] +
                    [c["end"] for c in a_track]
                )
                max_clip_end = max(all_clip_ends) if all_clip_ends else 0
                if max_clip_end > 0 and (dur <= 0 or max_clip_end > dur):
                    dur = round(max_clip_end, 2)
                if dur <= 0:
                    dur = 12.0

                # Ensure base video track exists
                if not v_track and primary_source:
                    v_track.append({
                        "id": f"clip_{uuid.uuid4().hex[:8]}",
                        "name": job.title or "AI Video Clip",
                        "sourceUrl": primary_source,
                        "proxyUrl": f"/api/v1/videos/{video_id}/rendered-file",
                        "start": 0.0,
                        "end": dur,
                        "sourceStart": 0.0,
                        "sourceEnd": dur,
                        "speed": 1.0,
                        "volume": 100,
                        "zoomFactor": 1.0,
                    })

                return {
                    "id": str(job.id),
                    "videoId": str(job.id),
                    "title": job.title or "AI Studio Video",
                    "videoType": job.video_type.value if hasattr(job.video_type, "value") else str(job.video_type),
                    "isFaceless": is_faceless_job,
                    "aspectRatio": aspect,
                    "duration": dur,
                    "fps": (job.settings or {}).get("fps", 30),
                    "tracks": {
                        "videoTrack": v_track,
                        "brollTrack": b_track,
                        "textTrack": t_track,
                        "graphicsTrack": g_track,
                        "audioTrack": a_track,
                    },
                    "transitions": transitions,
                }
        except Exception as e:
            print(f"[API: VIDEOS] Warning parsing EDL for timeline: {e}")

    # Fallback default project for newly initialized job or completed job without edits
    aspect = (job.settings or {}).get("aspect_ratio", "9:16")
    dur = float((job.settings or {}).get("duration", 12.0))
    video_track = []
    primary_source = job.rendered_url or job.source_url or ""
    if primary_source:
        video_track.append({
            "id": f"clip_{uuid.uuid4().hex[:8]}",
            "name": job.title or "AI Video Clip",
            "sourceUrl": primary_source,
            "start": 0.0,
            "end": dur,
            "sourceStart": 0.0,
            "sourceEnd": dur,
            "speed": 1.0,
            "volume": 100,
            "zoomFactor": 1.0,
        })

    return {
        "id": str(job.id),
        "videoId": str(job.id),
        "title": job.title or "Studio Video",
        "videoType": job.video_type.value if hasattr(job.video_type, "value") else str(job.video_type),
        "isFaceless": is_faceless_job,
        "aspectRatio": aspect,
        "duration": dur,
        "fps": 30,
        "tracks": {
            "videoTrack": video_track,
            "brollTrack": [],
            "textTrack": [],
            "graphicsTrack": [],
            "audioTrack": [],
        },
    }


@router.patch("/{video_id}/timeline")
@router.put("/{video_id}/timeline")
def save_video_timeline(
    video_id: uuid.UUID,
    payload: SaveTimelineRequest,
    session: Session = Depends(get_session),
):
    """
    Persists user edits from the manual web editor directly into PostgreSQL,
    compiling validated EDLs in lockstep.
    """
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )

    project = payload.project
    fps = payload.fps or (project.get("fps") if isinstance(project, dict) else 30) or 30
    edl_data = _compile_timeline_project_to_edl(project, fps)

    payload_to_store = {
        "timeline_project": project,
        "edl": edl_data,
        "edits": edl_data["edits"],
        "timestamp_map": edl_data["timestamp_map"],
        "settings": edl_data["settings"],
    }
    job.edit_decision_list = json.dumps(payload_to_store)
    if project.get("title"):
        job.title = project["title"]
    if not job.settings:
        job.settings = {}
    if project.get("aspectRatio"):
        job.settings["aspect_ratio"] = project["aspectRatio"]
    if project.get("duration"):
        job.settings["duration"] = float(project["duration"])
    job.updated_at = datetime.now(timezone.utc)
    session.add(job)
    session.commit()
    session.refresh(job)

    return {
        "status": "saved",
        "video_id": str(job.id),
        "timeline_project": project,
        "edits_count": len(edl_data["edits"]),
    }


@router.post("/render-timeline")
@router.post("/{video_id}/render-timeline")
def render_timeline_job(
    payload: RenderTimelineRequest,
    video_id: Optional[uuid.UUID] = None,
    session: Session = Depends(get_session),
):
    """
    Renders user edits from the manual web editor timeline into high-resolution MP4
    and synchronizes professional multi-track NLE exports (.fcpxml, .xml, .edl, .srt).
    """
    project = payload.project
    fps = payload.fps or 30
    title = project.get("title") or "Studio Video"

    # 1. Resolve or Create Target VideoJob
    job = None
    if video_id:
        job = session.get(VideoJob, video_id)

    if not job and project.get("videoId"):
        try:
            p_vid = uuid.UUID(str(project.get("videoId")))
            job = session.get(VideoJob, p_vid)
        except Exception:
            pass

    if not job:
        clerk_id = payload.clerk_id or "user_default"
        user = session.exec(select(User).where(User.clerk_id == clerk_id)).first()
        if not user:
            user = User(
                clerk_id=clerk_id,
                email="user@example.com",
                created_at=datetime.now(timezone.utc),
            )
            session.add(user)
            session.commit()
            session.refresh(user)

        job = VideoJob(
            user_id=user.id,
            title=title,
            source_url="",
            video_type=VideoType.TALKING_HEAD,
            status=VideoJobStatus.RENDERING,
            settings={
                "aspect_ratio": project.get("aspectRatio", "9:16"),
                "fps": fps,
                "resolution": payload.resolution or "1080p",
            },
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(job)
        session.commit()
        session.refresh(job)

    # 2. Compile TimelineProject into unified EDL, store in DB, and set status to RENDERING
    edl_data = _compile_timeline_project_to_edl(project, fps)
    payload_to_store = {
        "timeline_project": project,
        "edl": edl_data,
        "edits": edl_data["edits"],
        "timestamp_map": edl_data["timestamp_map"],
        "settings": edl_data["settings"],
    }
    job.edit_decision_list = json.dumps(payload_to_store)
    job.status = VideoJobStatus.RENDERING
    job.updated_at = datetime.now(timezone.utc)
    session.add(job)
    session.commit()
    session.refresh(job)

    # 3. Pre-generate NLE exports if requested
    if payload.generate_nle:
        try:
            worker_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "worker"))
            if worker_path not in sys.path:
                sys.path.insert(0, worker_path)
            from services.nle_exporter import export_nle_project

            repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
            media_temp_base = os.path.join(repo_root, "media_temp")
            export_dir = os.path.join(media_temp_base, str(job.id), "nle_export")
            os.makedirs(export_dir, exist_ok=True)
            export_nle_project(
                output_dir=export_dir,
                project_name=job.title,
                raw_video_path="",
                edits=edl_data["edits"],
                timestamp_map=edl_data["timestamp_map"],
                settings=edl_data["settings"],
                create_zip=True,
            )
        except Exception as e:
            print(f"[API: RENDER] Warning: NLE pre-export failed: {e}")

    render_id = f"render_{uuid.uuid4().hex[:12]}"
    payload_to_store["render_id"] = render_id
    try:
        worker_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "worker"))
        if worker_path not in sys.path:
            sys.path.insert(0, worker_path)
        from services.render_tracker import update_render_progress
        update_render_progress(
            render_id=render_id,
            video_id=str(job.id),
            progress=15,
            stage="compiling",
            message="Render enqueued and compositing started",
        )
    except Exception:
        pass

    dispatch_timeline_render_to_celery(job.id, payload_to_store)

    return {
        "render_id": render_id,
        "video_id": str(job.id),
        "status": "rendering",
        "progress": 15,
        "message": "Render enqueued and compositing started",
        "aspect_ratio": project.get("aspectRatio", "9:16"),
        "duration": float(project.get("duration", 10.0)),
        "download_url": job.rendered_url or f"/api/v1/videos/{job.id}/rendered-file",
        "nle_exports": {
            "fcpxml": f"/api/v1/videos/{job.id}/export-nle?format=fcpxml",
            "premiere_xml": f"/api/v1/videos/{job.id}/export-nle?format=premiere",
            "edl": f"/api/v1/videos/{job.id}/export-nle?format=edl",
            "srt": f"/api/v1/videos/{job.id}/export-nle?format=srt",
            "zip": f"/api/v1/videos/{job.id}/export-nle?format=all",
        },
        "stats": {
            "cuts": len([e for e in edl_data["edits"] if e.get("type") == "cut"]),
            "captions": len([e for e in edl_data["edits"] if e.get("type") == "subtitle"]),
            "graphics": len([e for e in edl_data["edits"] if e.get("type") == "motion_graphic"]),
            "broll": len([e for e in edl_data["edits"] if e.get("type") == "broll"]),
        },
    }


@router.get("/{video_id}/render-status/{render_id}")
def get_render_job_status(
    video_id: uuid.UUID,
    render_id: str,
    session: Session = Depends(get_session),
):
    """Polls real-time progress of a timeline render job."""
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )

    tracker_data = None
    try:
        worker_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "worker"))
        if worker_path not in sys.path:
            sys.path.insert(0, worker_path)
        from services.render_tracker import get_render_progress
        tracker_data = get_render_progress(render_id, str(video_id))
    except Exception:
        pass

    is_complete = job.status == VideoJobStatus.COMPLETED or (tracker_data and tracker_data.get("status") == "completed")
    is_failed = job.status == VideoJobStatus.FAILED or (tracker_data and tracker_data.get("status") in ("error", "failed"))
    status_str = "completed" if is_complete else ("error" if is_failed else "rendering")
    stage_str = (tracker_data.get("stage") if tracker_data else None) or ("completed" if is_complete else ("error" if is_failed else "compositing"))
    progress_val = 100 if is_complete else (0 if is_failed else (tracker_data.get("progress", 65) if tracker_data else 65))
    msg = (
        tracker_data.get("message")
        if tracker_data and tracker_data.get("message")
        else ("Render completed successfully" if is_complete else (job.error_log or "Rendering failed" if is_failed else "Compositing video and graphics..."))
    )

    return {
        "render_id": render_id,
        "video_id": str(video_id),
        "status": status_str,
        "stage": stage_str,
        "progress": progress_val,
        "message": msg,
        "download_url": (tracker_data.get("download_url") if tracker_data else None) or job.rendered_url or f"/api/v1/videos/{video_id}/rendered-file",
        "proxy_url": (tracker_data.get("proxy_url") if tracker_data else None) or f"/api/v1/videos/{video_id}/proxy-file",
        "nle_exports": {
            "fcpxml": f"/api/v1/videos/{video_id}/export-nle?format=fcpxml",
            "premiere_xml": f"/api/v1/videos/{video_id}/export-nle?format=premiere",
            "edl": f"/api/v1/videos/{video_id}/export-nle?format=edl",
            "srt": f"/api/v1/videos/{video_id}/export-nle?format=srt",
            "zip": f"/api/v1/videos/{video_id}/export-nle?format=all",
        },
    }


@router.get("/{video_id}/render-stream/{render_id}")
async def stream_render_progress(
    video_id: uuid.UUID,
    render_id: str,
    request: Request,
    session: Session = Depends(get_session),
):
    """Server-Sent Events (SSE) stream providing real-time timeline render progress."""
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )

    async def event_generator():
        worker_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "worker"))
        if worker_path not in sys.path:
            sys.path.insert(0, worker_path)
        from services.render_tracker import get_render_progress

        max_ticks = 300  # 150 seconds timeout
        ticks = 0

        while ticks < max_ticks:
            if await request.is_disconnected():
                break

            progress_data = get_render_progress(render_id, str(video_id))
            if not progress_data:
                # Refresh job from DB
                s = session.get(VideoJob, video_id)
                is_done = s and s.status == VideoJobStatus.COMPLETED
                is_err = s and s.status == VideoJobStatus.FAILED
                progress_data = {
                    "render_id": render_id,
                    "video_id": str(video_id),
                    "status": "completed" if is_done else ("error" if is_err else "rendering"),
                    "stage": "completed" if is_done else ("error" if is_err else "compositing"),
                    "progress": 100 if is_done else (0 if is_err else 60),
                    "message": "Render completed successfully" if is_done else (s.error_log if is_err else "Rendering in progress..."),
                    "download_url": (s.rendered_url if s else None) or f"/api/v1/videos/{video_id}/rendered-file",
                    "proxy_url": f"/api/v1/videos/{video_id}/proxy-file",
                    "nle_exports": {
                        "fcpxml": f"/api/v1/videos/{video_id}/export-nle?format=fcpxml",
                        "premiere_xml": f"/api/v1/videos/{video_id}/export-nle?format=premiere",
                        "edl": f"/api/v1/videos/{video_id}/export-nle?format=edl",
                        "srt": f"/api/v1/videos/{video_id}/export-nle?format=srt",
                        "zip": f"/api/v1/videos/{video_id}/export-nle?format=all",
                    },
                }

            if not progress_data.get("download_url"):
                progress_data["download_url"] = f"/api/v1/videos/{video_id}/rendered-file"
            if not progress_data.get("proxy_url"):
                progress_data["proxy_url"] = f"/api/v1/videos/{video_id}/proxy-file"
            if not progress_data.get("nle_exports"):
                progress_data["nle_exports"] = {
                    "fcpxml": f"/api/v1/videos/{video_id}/export-nle?format=fcpxml",
                    "premiere_xml": f"/api/v1/videos/{video_id}/export-nle?format=premiere",
                    "edl": f"/api/v1/videos/{video_id}/export-nle?format=edl",
                    "srt": f"/api/v1/videos/{video_id}/export-nle?format=srt",
                    "zip": f"/api/v1/videos/{video_id}/export-nle?format=all",
                }

            event_type = "progress"
            if progress_data.get("status") == "completed" or progress_data.get("progress", 0) >= 100:
                event_type = "completed"
            elif progress_data.get("status") in ("error", "failed"):
                event_type = "error"

            yield f"event: {event_type}\ndata: {json.dumps(progress_data)}\n\n"

            if event_type in ("completed", "error"):
                break

            import asyncio
            await asyncio.sleep(0.5)
            ticks += 1

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no",
        },
    )


@router.api_route("/{video_id}/rendered-file", methods=["GET", "HEAD"])
def get_rendered_video_file(
    video_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """Streams or downloads the rendered MP4 file for a video job."""
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )

    if job.status == VideoJobStatus.RENDERING:
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="Video is currently rendering. Please try again shortly.",
        )
    if job.status == VideoJobStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Rendering failed: {job.error_log or 'Unknown render error'}",
        )

    # Check local candidate paths (both repo root media_temp, apps/media_temp, etc.)
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    media_temp_base = os.path.join(repo_root, "media_temp")
    api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    candidates = [
        os.path.join(media_temp_base, str(video_id), "final_rendered.mp4"),
        os.path.join(media_temp_base, f"{video_id}.mp4"),
        os.path.join(media_temp_base, str(video_id), "raw_source.mp4"),
        os.path.join(repo_root, "apps", "media_temp", str(video_id), "final_rendered.mp4"),
        os.path.join(api_dir, "media_temp", str(video_id), "final_rendered.mp4"),
        os.path.join(api_dir, "media_temp", f"{video_id}.mp4"),
    ]
    if job.rendered_url and not job.rendered_url.startswith("http") and os.path.exists(job.rendered_url):
        candidates.insert(0, job.rendered_url)

    for cand in candidates:
        if os.path.exists(cand) and os.path.getsize(cand) > 1024:
            return FileResponse(cand, media_type="video/mp4", filename=f"{job.title}.mp4")

    # If rendered to S3/Cloud storage, redirect to presigned signed URL
    if job.rendered_url and (job.rendered_url.startswith("http://") or job.rendered_url.startswith("https://")):
        signed_rendered = get_presigned_url_from_full_url(job.rendered_url)
        return RedirectResponse(url=signed_rendered, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    # Fallback to source video if available and valid
    if job.source_url:
        if not job.source_url.startswith("http") and os.path.exists(job.source_url) and os.path.getsize(job.source_url) > 1024:
            return FileResponse(job.source_url, media_type="video/mp4", filename=f"{job.title}.mp4")
        elif job.source_url.startswith("http://") or job.source_url.startswith("https://"):
            signed_source = get_presigned_url_from_full_url(job.source_url)
            return RedirectResponse(url=signed_source, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Rendered video file not found on disk or cloud storage. Please trigger a render.",
    )


@router.get("/{video_id}/proxy-file")
def get_proxy_video_file(
    video_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """Streams the lightweight 540p proxy MP4 file for fast browser scrubbing."""
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    media_temp_base = os.path.join(repo_root, "media_temp")
    proxy_candidates = [
        os.path.join(media_temp_base, f"{video_id}_proxy.mp4"),
        os.path.join(media_temp_base, str(video_id), "proxy_540p.mp4"),
        os.path.join(media_temp_base, str(video_id), "final_rendered.mp4"),
        os.path.join(media_temp_base, f"{video_id}.mp4"),
    ]

    for cand in proxy_candidates:
        if os.path.exists(cand) and os.path.getsize(cand) > 1024:
            return FileResponse(cand, media_type="video/mp4", filename=f"{job.title}_proxy540p.mp4")

    # Fall back to rendered file or source video if proxy is not yet generated
    candidates = [
        os.path.join(media_temp_base, f"{video_id}.mp4"),
        os.path.join(media_temp_base, str(video_id), "final_rendered.mp4"),
    ]
    if job.rendered_url and os.path.exists(job.rendered_url):
        candidates.insert(0, job.rendered_url)

    for cand in candidates:
        if os.path.exists(cand) and os.path.getsize(cand) > 1024:
            return FileResponse(cand, media_type="video/mp4", filename=f"{job.title}.mp4")

    if job.source_url and os.path.exists(job.source_url) and os.path.getsize(job.source_url) > 1024:
        return FileResponse(job.source_url, media_type="video/mp4", filename=f"{job.title}.mp4")

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Proxy video not found on disk.",
    )


@router.api_route("/{video_id}/asset/{filename}", methods=["GET", "HEAD"])
def get_video_asset_file(
    video_id: uuid.UUID,
    filename: str,
):
    """Streams local B-Roll video clips and SFX audio files for in-editor preview."""
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    job_dir = os.path.join(repo_root, "media_temp", str(video_id))
    
    candidates = [
        os.path.join(job_dir, "assets", filename),
        os.path.join(job_dir, "nle_export", "media", filename),
        os.path.join(job_dir, filename),
        os.path.join(repo_root, "apps", "media_temp", str(video_id), "assets", filename),
    ]

    for cand in candidates:
        if os.path.exists(cand) and os.path.isfile(cand):
            lower_name = filename.lower()
            if lower_name.endswith((".mp4", ".mov", ".webm", ".m4v")):
                media_type = "video/mp4"
            elif lower_name.endswith((".wav", ".mp3", ".aac", ".ogg")):
                media_type = "audio/wav" if lower_name.endswith(".wav") else "audio/mpeg"
            elif lower_name.endswith((".png", ".jpg", ".jpeg", ".webp")):
                media_type = "image/png"
            else:
                media_type = "application/octet-stream"
            return FileResponse(cand, media_type=media_type, filename=filename)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Asset file {filename} not found for video {video_id}",
    )


# ---------------------------------------------------------------------------
# Cloud Version Snapshots API
# ---------------------------------------------------------------------------

@router.post("/{video_id}/snapshots", response_model=ProjectSnapshotResponse, status_code=status.HTTP_201_CREATED)
def create_project_snapshot(
    video_id: uuid.UUID,
    payload: CreateSnapshotRequest,
    session: Session = Depends(get_session),
):
    """
    Creates an immutable cloud checkpoint snapshot of the timeline project.
    Automatically assigns the next version integer for the video.
    """
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )

    # Resolve timeline project to freeze
    project_to_freeze = payload.timeline_project
    if not project_to_freeze and job.edit_decision_list:
        try:
            parsed = json.loads(job.edit_decision_list)
            if isinstance(parsed, dict):
                project_to_freeze = parsed.get("timeline_project") or parsed
        except Exception:
            pass

    if not project_to_freeze:
        project_to_freeze = {
            "id": f"proj_{video_id}",
            "videoId": str(video_id),
            "title": job.title,
            "aspectRatio": "9:16",
            "duration": 10.0,
            "tracks": {"videoTrack": [], "audioTrack": [], "textTrack": [], "graphicsTrack": [], "brollTrack": []},
        }

    # Monotonically increasing version per video
    max_v_stmt = select(func.max(ProjectSnapshot.version)).where(ProjectSnapshot.video_id == video_id)
    current_max = session.exec(max_v_stmt).first()
    next_version = (current_max or 0) + 1

    tracks = project_to_freeze.get("tracks") or {}
    clip_counts = {
        "video": len(tracks.get("videoTrack") or []),
        "audio": len(tracks.get("audioTrack") or []),
        "captions": len(tracks.get("textTrack") or []),
        "graphics": len(tracks.get("graphicsTrack") or []),
        "broll": len(tracks.get("brollTrack") or []),
    }

    snapshot = ProjectSnapshot(
        video_id=video_id,
        version=next_version,
        label=payload.label,
        description=payload.description,
        timeline_project=project_to_freeze,
    )
    session.add(snapshot)
    session.commit()
    session.refresh(snapshot)

    return ProjectSnapshotResponse(
        id=snapshot.id,
        video_id=snapshot.video_id,
        version=snapshot.version,
        label=snapshot.label,
        description=snapshot.description,
        created_at=snapshot.created_at,
        clip_counts=clip_counts,
        timeline_project=snapshot.timeline_project,
    )


@router.get("/{video_id}/snapshots")
def list_project_snapshots(
    video_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """Lists all cloud version history snapshots for a video project in descending order."""
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )

    stmt = select(ProjectSnapshot).where(ProjectSnapshot.video_id == video_id).order_by(desc(ProjectSnapshot.version))
    snapshots = session.exec(stmt).all()

    result = []
    for snap in snapshots:
        tracks = (snap.timeline_project or {}).get("tracks") or {}
        clip_counts = {
            "video": len(tracks.get("videoTrack") or []),
            "audio": len(tracks.get("audioTrack") or []),
            "captions": len(tracks.get("textTrack") or []),
            "graphics": len(tracks.get("graphicsTrack") or []),
            "broll": len(tracks.get("brollTrack") or []),
        }
        result.append({
            "id": str(snap.id),
            "video_id": str(snap.video_id),
            "version": snap.version,
            "label": snap.label,
            "description": snap.description,
            "created_at": snap.created_at.isoformat(),
            "clip_counts": clip_counts,
        })

    return {"snapshots": result, "total": len(result)}


@router.get("/{video_id}/snapshots/{snapshot_id}", response_model=ProjectSnapshotResponse)
def get_project_snapshot(
    video_id: uuid.UUID,
    snapshot_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """Retrieves full details and TimelineProject payload for a specific snapshot."""
    snapshot = session.get(ProjectSnapshot, snapshot_id)
    if not snapshot or snapshot.video_id != video_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Snapshot {snapshot_id} for video {video_id} not found",
        )

    tracks = (snapshot.timeline_project or {}).get("tracks") or {}
    clip_counts = {
        "video": len(tracks.get("videoTrack") or []),
        "audio": len(tracks.get("audioTrack") or []),
        "captions": len(tracks.get("textTrack") or []),
        "graphics": len(tracks.get("graphicsTrack") or []),
        "broll": len(tracks.get("brollTrack") or []),
    }

    return ProjectSnapshotResponse(
        id=snapshot.id,
        video_id=snapshot.video_id,
        version=snapshot.version,
        label=snapshot.label,
        description=snapshot.description,
        created_at=snapshot.created_at,
        clip_counts=clip_counts,
        timeline_project=snapshot.timeline_project,
    )


@router.post("/{video_id}/snapshots/{snapshot_id}/restore")
def restore_project_snapshot(
    video_id: uuid.UUID,
    snapshot_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """
    Rolls back the active video timeline to the specified snapshot checkpoint.
    Updates the database record and returns the restored TimelineProject.
    """
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )

    snapshot = session.get(ProjectSnapshot, snapshot_id)
    if not snapshot or snapshot.video_id != video_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Snapshot {snapshot_id} for video {video_id} not found",
        )

    # Restore snapshot timeline into job's edit_decision_list
    edl_payload = {
        "timeline_project": snapshot.timeline_project,
        "restored_from_snapshot": str(snapshot.id),
        "restored_at": datetime.now(timezone.utc).isoformat(),
        "version": snapshot.version,
    }
    job.edit_decision_list = json.dumps(edl_payload)
    job.updated_at = datetime.now(timezone.utc)
    session.add(job)
    session.commit()

    return {
        "status": "restored",
        "snapshot_id": str(snapshot.id),
        "version": snapshot.version,
        "label": snapshot.label,
        "message": f"Successfully restored to version {snapshot.version} ('{snapshot.label}')",
        "timeline_project": snapshot.timeline_project,
    }


@router.delete("/{video_id}/snapshots/{snapshot_id}")
def delete_project_snapshot(
    video_id: uuid.UUID,
    snapshot_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """Deletes a snapshot checkpoint from the cloud version history."""
    snapshot = session.get(ProjectSnapshot, snapshot_id)
    if not snapshot or snapshot.video_id != video_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Snapshot {snapshot_id} for video {video_id} not found",
        )

    session.delete(snapshot)
    session.commit()
    return {"status": "deleted", "snapshot_id": str(snapshot_id)}


class PublishSocialsRequest(BaseModel):
    social_account_ids: List[str] = Field(..., min_length=1, description="List of connected SocialAccount UUIDs")
    title: Optional[str] = Field(None, description="Custom post title or short caption")
    description: Optional[str] = Field(None, description="Custom post description and hashtags")
    is_shorts: bool = Field(True, description="Whether to format publication for YouTube Shorts / vertical reels")


@router.post("/{video_id}/publish-socials")
def publish_video_to_socials(
    video_id: uuid.UUID,
    payload: PublishSocialsRequest,
    session: Session = Depends(get_session),
):
    """
    Dispatches rendered video publication to all designated connected social accounts
    (YouTube Shorts, TikTok, Instagram Reels) asynchronously via Celery.
    """
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )

    task_id = dispatch_publish_socials_to_celery(
        job_id=job.id,
        social_account_ids=payload.social_account_ids,
        title=payload.title or job.title,
        description=payload.description or "",
        is_shorts=payload.is_shorts,
    )

    return {
        "status": "enqueued",
        "task_id": task_id,
        "video_id": str(job.id),
        "social_account_ids": payload.social_account_ids,
        "message": f"Social publishing dispatched to {len(payload.social_account_ids)} accounts",
    }


