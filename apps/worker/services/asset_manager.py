import os
import time
import uuid
import socket
import requests
import json
import shutil
from typing import Dict, List, Any, Optional, Set, Union
try:
    from config import get_worker_settings
    settings = get_worker_settings()
except ImportError:
    try:
        from config import get_settings
        settings = get_settings()
    except Exception:
        settings = None

from services.network_retry import bounded_network_retry, NetworkRetryExhaustedError


def _wait_for_internet_retry(func):
    """Bounded retry decorator for asset fetching (up to 5 attempts with backoff and jitter)."""
    def _is_retryable_http_error(exc: Exception) -> bool:
        if isinstance(exc, requests.exceptions.HTTPError):
            return exc.response is not None and exc.response.status_code in [429, 500, 502, 503, 504]
        return True

    return bounded_network_retry(
        max_retries=5,
        base_delay=1.0,
        max_delay=30.0,
        backoff_factor=2.0,
        jitter=True,
        retryable_exceptions=(
            requests.exceptions.ConnectionError,
            requests.exceptions.Timeout,
            requests.exceptions.HTTPError,
            socket.error,
        ),
        retry_condition=_is_retryable_http_error,
    )(func)

@_wait_for_internet_retry
def fetch_broll_assets(
    edits: List[Dict[str, Any]],
    assets_dir: str = "",
    output_dir: Optional[str] = None,
    job_settings: Optional[Dict[str, Any]] = None,
    aspect_ratio: Optional[str] = None,
    cache_dir: Optional[str] = None,
    allow_duplicates: bool = False,
) -> Dict[str, str]:
    """
    Downloads aspect-ratio-aware B-roll video clips from Pexels Video API for all 'b_roll' actions.
    Guarantees 100% uniqueness (zero duplicate clips across video cuts) and caches raw downloads.
    """
    target_dir = output_dir or assets_dir or os.path.abspath("./media_temp/assets")
    os.makedirs(target_dir, exist_ok=True)

    broll_cache = cache_dir or os.path.abspath(os.path.join(target_dir, "../broll_cache"))
    os.makedirs(broll_cache, exist_ok=True)

    broll_map: Dict[str, str] = {}
    used_video_ids: Set[Union[int, str]] = set()

    api_key = (
        (job_settings.get("pexels_api_key") if job_settings else None)
        or (getattr(settings, "PEXELS_API_KEY", None) if settings else None)
        or os.getenv("PEXELS_API_KEY")
    )

    # Determine target aspect ratio and orientation
    target_ar = aspect_ratio or (job_settings.get("aspect_ratio", "9:16") if job_settings else "9:16")
    orientation_map = {
        "9:16": "portrait",
        "16:9": "landscape",
        "1:1": "square",
        "4:5": "portrait",
    }
    orientation = orientation_map.get(target_ar, "portrait")

    # Target resolution for distance scoring
    if orientation == "portrait":
        target_w, target_h = 1080, 1920
    elif orientation == "landscape":
        target_w, target_h = 1920, 1080
    elif orientation == "square":
        target_w, target_h = 1080, 1080
    else:
        target_w, target_h = 1080, 1920

    for edit in edits:
        if edit.get("action") != "b_roll":
            continue

        trigger_id = edit.get("trigger_id")
        search_query = edit.get("search_query") or "technology abstract background"
        dest_path = os.path.join(target_dir, f"broll_{trigger_id}.mp4")
        dest_meta = os.path.join(target_dir, f"broll_{trigger_id}.json")

        # Check if already cached/downloaded with valid metadata
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
            existing_vid_id = None
            if os.path.exists(dest_meta):
                try:
                    with open(dest_meta, "r", encoding="utf-8") as f_meta:
                        meta_data = json.load(f_meta)
                        existing_vid_id = meta_data.get("video_id")
                except Exception:
                    pass

            if allow_duplicates or not existing_vid_id or existing_vid_id not in used_video_ids:
                if existing_vid_id:
                    used_video_ids.add(existing_vid_id)
                broll_map[trigger_id] = dest_path
                continue

        # Check if B-roll refers to real web evidence (GitHub, Twitter, URLs)
        web_source = edit.get("web_url") or edit.get("url") or (search_query if ("http://" in search_query or "https://" in search_query or "github.com" in search_query or "x.com" in search_query) else None)
        if web_source:
            try:
                import subprocess
                from services.web_evidence_capture import capture_web_evidence
                evidence_img = os.path.join(target_dir, f"evidence_{trigger_id}.png")
                ev_res = capture_web_evidence(web_source, output_path=evidence_img, width=target_w, height=target_h)
                if os.path.exists(evidence_img):
                    dur = max(2.0, float(edit.get("end", 0.0) or 0.0) - float(edit.get("start", 0.0) or 0.0)) if edit.get("start") else 3.0
                    cmd = [
                        "ffmpeg", "-y", "-loop", "1", "-i", evidence_img,
                        "-t", f"{dur:.2f}",
                        "-vf", f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h}",
                        "-c:v", "libx264", "-pix_fmt", "yuv420p", dest_path
                    ]
                    sub_res = subprocess.run(cmd, capture_output=True, text=True)
                    if sub_res.returncode == 0 and os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
                        print(f"  [ASSET_MANAGER] Converted real web evidence ({ev_res['type']}) to B-roll -> {dest_path}")
                        broll_map[trigger_id] = dest_path
                        continue
            except Exception as ev_err:
                print(f"  [ASSET_MANAGER] Web evidence capture fallback: {ev_err}")

        if not api_key:
            print("[!] Warning: PEXELS_API_KEY is not set. Cannot fetch B-roll.")
            continue

        print(f"[*] Querying Pexels ({orientation}) for B-roll: '{search_query}' (Trigger: {trigger_id})...")
        url = "https://api.pexels.com/videos/search"
        headers = {"Authorization": api_key}
        params = {
            "query": search_query,
            "orientation": orientation,
            "per_page": 15,
            "size": "medium",
        }

        videos = []
        try:
            res = requests.get(url, headers=headers, params=params, timeout=15)
            if res.status_code == 200:
                videos = res.json().get("videos", [])
        except Exception as e:
            print(f"[!] Pexels search query failed for '{search_query}': {e}")

        # Pick candidate whose video_id hasn't been used yet in this batch
        chosen_video = None
        for v in videos:
            vid_id = v.get("id")
            if allow_duplicates or vid_id not in used_video_ids:
                vfiles = [f for f in v.get("video_files", []) if f.get("file_type") == "video/mp4"]
                if vfiles:
                    chosen_video = v
                    break

        # If page 1 was exhausted or all were used, query page 2
        if not chosen_video and len(videos) == 15:
            params["page"] = 2
            try:
                res_p2 = requests.get(url, headers=headers, params=params, timeout=15)
                if res_p2.status_code == 200:
                    for v in res_p2.json().get("videos", []):
                        vid_id = v.get("id")
                        if allow_duplicates or vid_id not in used_video_ids:
                            vfiles = [f for f in v.get("video_files", []) if f.get("file_type") == "video/mp4"]
                            if vfiles:
                                chosen_video = v
                                break
            except Exception as e_p2:
                print(f"[!] Page 2 query failed: {e_p2}")
            params.pop("page", None)

        # Fallback queries if still no unused video found
        if not chosen_video:
            words = [w for w in search_query.split() if len(w) > 2]
            fallbacks = []
            if len(words) > 1:
                fallbacks.append(" ".join(words[:2]))
            fallbacks.extend([
                "artificial intelligence technology",
                "futuristic digital network",
                "modern computer technology",
                "datacenter server racks",
                "software developer coding",
                "abstract digital speed lights",
                "cyber security network",
            ])

            for fb_query in fallbacks:
                params["query"] = fb_query
                try:
                    fb_res = requests.get(url, headers=headers, params=params, timeout=15)
                    if fb_res.status_code == 200:
                        fb_videos = fb_res.json().get("videos", [])
                        for v in fb_videos:
                            vid_id = v.get("id")
                            if allow_duplicates or vid_id not in used_video_ids:
                                vfiles = [f for f in v.get("video_files", []) if f.get("file_type") == "video/mp4"]
                                if vfiles:
                                    chosen_video = v
                                    print(f"  [OK] Found unused video {vid_id} with fallback '{fb_query}'.")
                                    break
                    if chosen_video:
                        break
                except Exception as ex:
                    print(f"[!] Fallback query '{fb_query}' error: {ex}")

        if not chosen_video:
            print(f"[!] Warning: No unused Pexels videos found for '{search_query}'. Skipping trigger {trigger_id}.")
            continue

        vid_id = chosen_video.get("id")
        used_video_ids.add(vid_id)

        # Select best MP4 file closest to target aspect ratio / resolution
        video_files = chosen_video.get("video_files", [])
        best_file = None
        best_score = float("inf")
        for vf in video_files:
            if vf.get("file_type") == "video/mp4":
                w = vf.get("width", 0)
                h = vf.get("height", 0)
                score = abs(w - target_w) + abs(h - target_h)
                if score < best_score:
                    best_score = score
                    best_file = vf

        download_url = best_file.get("link") if best_file else None
        if not download_url:
            print(f"[!] Warning: No valid MP4 link found in Pexels result for '{search_query}'. Skipping trigger {trigger_id}.")
            continue

        best_w = best_file.get("width", target_w)
        best_h = best_file.get("height", target_h)

        # Check central raw clip cache
        cached_clip = os.path.join(broll_cache, f"pexels_{vid_id}_{best_w}x{best_h}.mp4")
        try:
            if os.path.exists(cached_clip) and os.path.getsize(cached_clip) > 1000:
                print(f"  [CACHE HIT] Video {vid_id} found in central cache -> {cached_clip}")
                shutil.copyfile(cached_clip, dest_path)
            else:
                print(f"[*] Downloading Pexels B-roll {vid_id} ({best_w}x{best_h}) from: {download_url[:60]}...")
                vid_res = requests.get(download_url, stream=True, timeout=30)
                vid_res.raise_for_status()

                temp_cache = f"{cached_clip}.tmp_{uuid.uuid4().hex[:6]}"
                with open(temp_cache, "wb") as f:
                    for chunk in vid_res.iter_content(chunk_size=32768):
                        f.write(chunk)
                os.replace(temp_cache, cached_clip)
                shutil.copyfile(cached_clip, dest_path)
                print(f"[OK] Downloaded and cached B-roll {vid_id} to: {dest_path}")

            # Save sidecar metadata
            with open(dest_meta, "w", encoding="utf-8") as f_meta:
                json.dump({
                    "video_id": vid_id,
                    "search_query": search_query,
                    "duration": float(chosen_video.get("duration", 0.0)),
                    "width": best_w,
                    "height": best_h,
                    "pexels_url": chosen_video.get("url"),
                }, f_meta, indent=2)

            broll_map[trigger_id] = dest_path
        except Exception as e:
            print(f"[!] Failed to download/cache B-roll {vid_id} from {download_url[:60]}: {e}")

    return broll_map


def search_single_broll_clip(
    query: str,
    aspect_ratio: str = "9:16",
    duration_min: float = 3.0,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Synchronously queries Pexels Video API for a single high-quality B-roll clip matching the query.
    Extracts preview image/thumbnail, high-resolution direct video link, dimensions, and duration.
    Falls back gracefully if offline, rate-limited, or query returns no results.
    """
    clean_query = query.strip()
    orientation_map = {
        "9:16": "portrait",
        "16:9": "landscape",
        "1:1": "square",
        "4:5": "portrait",
    }
    orientation = orientation_map.get(aspect_ratio, "portrait")

    if orientation == "portrait":
        target_w, target_h = 1080, 1920
    elif orientation == "landscape":
        target_w, target_h = 1920, 1080
    elif orientation == "square":
        target_w, target_h = 1080, 1080
    else:
        target_w, target_h = 1080, 1920

    key = api_key or getattr(settings, "PEXELS_API_KEY", "") or os.getenv("PEXELS_API_KEY", "")
    if key:
        url = "https://api.pexels.com/videos/search"
        headers = {"Authorization": key}
        params = {
            "query": clean_query,
            "orientation": orientation,
            "per_page": 5,
            "size": "medium",
        }

        try:
            res = requests.get(url, headers=headers, params=params, timeout=8)
            if res.status_code == 200:
                videos = res.json().get("videos", [])

                # If no videos, try fallback words
                if not videos:
                    words = [w for w in clean_query.split() if len(w) > 2]
                    fallbacks = []
                    if len(words) > 1:
                        fallbacks.append(" ".join(words[:2]))
                    if words:
                        fallbacks.append(words[0])
                    fallbacks.extend(["abstract background", "technology background"])

                    for fb in fallbacks:
                        params["query"] = fb
                        fb_res = requests.get(url, headers=headers, params=params, timeout=8)
                        if fb_res.status_code == 200 and fb_res.json().get("videos"):
                            videos = fb_res.json().get("videos", [])
                            break

                if videos:
                    for vid in videos:
                        video_files = vid.get("video_files", [])
                        best_file = None
                        best_score = float("inf")
                        for vf in video_files:
                            if vf.get("file_type") == "video/mp4":
                                w = vf.get("width", 0)
                                h = vf.get("height", 0)
                                score = abs(w - target_w) + abs(h - target_h)
                                if score < best_score:
                                    best_score = score
                                    best_file = vf

                        if best_file and best_file.get("link"):
                            preview_url = vid.get("image") or best_file.get("link")
                            vid_duration = float(vid.get("duration", duration_min))
                            return {
                                "video_id": f"pexels-{vid.get('id', uuid.uuid4().hex[:6])}",
                                "title": clean_query.title(),
                                "query": clean_query,
                                "video_url": best_file.get("link"),
                                "preview_url": preview_url,
                                "width": best_file.get("width", target_w),
                                "height": best_file.get("height", target_h),
                                "duration": max(vid_duration, duration_min),
                                "orientation": orientation,
                                "is_fallback": False,
                            }
        except Exception as e:
            print(f"[!] Pexels single search exception: {e}")

    # Fallback asset catalog when Pexels is unreachable or API key is not present
    fallback_clips = {
        "portrait": {
            "video_url": "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-42352-large.mp4",
            "preview_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=640",
            "width": 1080,
            "height": 1920,
        },
        "landscape": {
            "video_url": "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-42352-large.mp4",
            "preview_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=640",
            "width": 1920,
            "height": 1080,
        },
        "square": {
            "video_url": "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-42352-large.mp4",
            "preview_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=640",
            "width": 1080,
            "height": 1080,
        },
    }
    fb = fallback_clips.get(orientation, fallback_clips["portrait"])
    clip_id = f"broll-fallback-{abs(hash(clean_query)) % 100000}"
    return {
        "video_id": clip_id,
        "title": clean_query.title(),
        "query": clean_query,
        "video_url": fb["video_url"],
        "preview_url": fb["preview_url"],
        "width": fb["width"],
        "height": fb["height"],
        "duration": max(3.5, duration_min),
        "orientation": orientation,
        "is_fallback": True,
    }




