"""
Central Model Registry and Automated Health-Check Service.

Manages automated provisioning, integrity verification, local caching, and
graceful fallbacks for neural models required by AI Director:
1. Robust Video Matting (RVM MobileNetV3) for 3D behind-speaker rotoscoping.
2. MediaPipe Pose Landmarker for presenter safe-zone tracking.
3. MediaPipe Face Detector for 16:9 to 9:16 kinetic auto-reframing.
"""

import os
import sys
import time
import shutil
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class ModelMetadata:
    name: str
    filename: str
    url: str
    min_size_bytes: int
    description: str


# System-wide Model Registry Catalog
MODEL_CATALOG: Dict[str, ModelMetadata] = {
    "rvm_mobilenetv3": ModelMetadata(
        name="rvm_mobilenetv3",
        filename="rvm_mobilenetv3_fp32.onnx",
        url="https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx",
        min_size_bytes=10 * 1024 * 1024,  # ~16.6 MB
        description="RVM MobileNetV3 FP32 recurrent matting model for foreground extraction",
    ),
    "pose_landmarker": ModelMetadata(
        name="pose_landmarker",
        filename="pose_landmarker_lite.task",
        url="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        min_size_bytes=4 * 1024 * 1024,  # ~9.2 MB
        description="MediaPipe Pose Landmarker Lite for body safe-zone detection",
    ),
    "face_detector": ModelMetadata(
        name="face_detector",
        filename="blaze_face_short_range.tflite",
        url="https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        min_size_bytes=200 * 1024,  # ~230 KB
        description="MediaPipe BlazeFace Short-Range detector for kinetic 9:16 auto-framing",
    ),
}


def get_models_cache_dir() -> Path:
    """
    Returns the designated local storage directory for neural weights.
    Evaluates AI_CONTENT_MANAGER_MODELS_DIR, AI_CONTENT_MANAGER_CACHE, or ~/.cache/ai-content-manager/models.
    """
    env_models = os.environ.get("AI_CONTENT_MANAGER_MODELS_DIR")
    if env_models:
        path = Path(env_models)
    else:
        cache_base = os.environ.get("AI_CONTENT_MANAGER_CACHE", Path.home() / ".cache" / "ai-content-manager")
        path = Path(cache_base) / "models"

    path.mkdir(parents=True, exist_ok=True)
    return path


def get_model_path(model_name: str) -> Path:
    """Resolves the local path for a named model in the registry."""
    if model_name not in MODEL_CATALOG:
        raise KeyError(f"Model '{model_name}' not registered. Registered models: {list(MODEL_CATALOG.keys())}")
    meta = MODEL_CATALOG[model_name]
    return get_models_cache_dir() / meta.filename


def is_model_healthy(model_name: str) -> bool:
    """Fast non-blocking check whether the model file is present and meets size requirements."""
    try:
        path = get_model_path(model_name)
        if not path.exists():
            return False
        meta = MODEL_CATALOG[model_name]
        return path.stat().st_size >= meta.min_size_bytes
    except Exception:
        return False


def get_model_health_summary() -> Dict[str, Any]:
    """Generates an operational health report for all models in the registry."""
    models_dir = get_models_cache_dir()
    summary = {
        "models_dir": str(models_dir),
        "all_healthy": True,
        "models": {},
    }

    for name, meta in MODEL_CATALOG.items():
        path = models_dir / meta.filename
        exists = path.exists()
        size_bytes = path.stat().st_size if exists else 0
        healthy = exists and size_bytes >= meta.min_size_bytes
        if not healthy:
            summary["all_healthy"] = False

        summary["models"][name] = {
            "healthy": healthy,
            "filename": meta.filename,
            "path": str(path),
            "size_bytes": size_bytes,
            "min_required_bytes": meta.min_size_bytes,
            "description": meta.description,
        }

    return summary


def ensure_model_provisioned(model_name: str, timeout: int = 120, max_retries: int = 3) -> Path:
    """
    Guarantees that a specific model is provisioned locally.
    Performs an atomic download with temporary staging and byte-length verification.
    """
    if model_name not in MODEL_CATALOG:
        raise KeyError(f"Unknown model name '{model_name}'")

    meta = MODEL_CATALOG[model_name]
    target_path = get_model_path(model_name)

    if target_path.exists() and target_path.stat().st_size >= meta.min_size_bytes:
        return target_path

    target_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = target_path.with_suffix(".tmp.download")

    headers = {"User-Agent": "AiDirector-ModelRegistry/1.0"}
    req = urllib.request.Request(meta.url, headers=headers)

    last_error: Optional[Exception] = None
    for attempt in range(1, max_retries + 1):
        try:
            print(f"[*] Downloading {meta.name} (attempt {attempt}/{max_retries}) from {meta.url}...")
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=timeout) as resp, open(temp_path, "wb") as f:
                shutil.copyfileobj(resp, f)

            downloaded_size = temp_path.stat().st_size
            if downloaded_size < meta.min_size_bytes:
                if temp_path.exists():
                    temp_path.unlink()
                raise ValueError(
                    f"Downloaded size ({downloaded_size} bytes) below minimum threshold ({meta.min_size_bytes} bytes)"
                )

            # Atomic swap
            os.replace(temp_path, target_path)
            print(f"[OK] Provisioned {meta.name} ({downloaded_size / (1024*1024):.2f} MB) in {time.time() - t0:.2f}s")
            return target_path

        except Exception as e:
            last_error = e
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
            print(f"[!] Provisioning attempt {attempt} failed for {meta.name}: {e}")
            if attempt < max_retries:
                time.sleep(1.5 * attempt)

    raise RuntimeError(f"Failed to provision model '{model_name}' after {max_retries} attempts: {last_error}")


def ensure_all_models_provisioned(timeout: int = 120) -> Dict[str, bool]:
    """Ensures all cataloged models are downloaded and verified."""
    results = {}
    for name in MODEL_CATALOG:
        try:
            ensure_model_provisioned(name, timeout=timeout)
            results[name] = True
        except Exception as e:
            print(f"[!] Model {name} provisioning error: {e}")
            results[name] = False
    return results


if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "check"
    if action == "check":
        report = get_model_health_summary()
        print("=== Model Registry Health Report ===")
        print(f"Directory: {report['models_dir']}")
        print(f"All Models Healthy: {report['all_healthy']}")
        for m_name, m_info in report["models"].items():
            status = "HEALTHY" if m_info["healthy"] else "MISSING/CORRUPT"
            print(f"  [{status}] {m_name}: {m_info['size_bytes']} bytes -> {m_info['path']}")
        sys.exit(0 if report["all_healthy"] else 1)

    elif action == "download":
        print("Provisioning all registered models...")
        res = ensure_all_models_provisioned()
        all_ok = all(res.values())
        print(f"Provisioning Complete. Success: {all_ok}")
        sys.exit(0 if all_ok else 1)

    else:
        print(f"Usage: python -m services.model_registry [check|download]")
        sys.exit(2)
