import os
import time
import uuid
import requests
from typing import Dict, List, Any, Optional
try:
    from config import get_worker_settings
    settings = get_worker_settings()
except ImportError:
    try:
        from config import get_settings
        settings = get_settings()
    except Exception:
        settings = None

def _wait_for_internet_retry(func):
    def wrapper(*args, **kwargs):
        attempt = 1
        while True:
            try:
                return func(*args, **kwargs)
            except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
                print(f"[!] Network connection lost. Waiting 10s for internet to return (Attempt {attempt})...")
                time.sleep(10)
                attempt += 1
            except requests.exceptions.HTTPError as e:
                if e.response is not None and e.response.status_code in [429, 500, 502, 503, 504]:
                    print(f"[!] API rate limit or server error ({e.response.status_code}). Retrying in 10s (Attempt {attempt})...")
                    time.sleep(10)
                    attempt += 1
                else:
                    raise
    return wrapper

@_wait_for_internet_retry
def fetch_broll_assets(
    edits: List[Dict[str, Any]],
    assets_dir: str = "",
    output_dir: Optional[str] = None,
    job_settings: Optional[Dict[str, Any]] = None,
    aspect_ratio: Optional[str] = None,
) -> Dict[str, str]:
    """
    Downloads aspect-ratio-aware B-roll video clips from Pexels Video API for all 'b_roll' actions.
    Supports query fallbacks and optimal resolution matching.
    """
    target_dir = output_dir or assets_dir or os.path.abspath("./media_temp/assets")
    os.makedirs(target_dir, exist_ok=True)
    broll_map: Dict[str, str] = {}
    api_key = settings.PEXELS_API_KEY or os.getenv("PEXELS_API_KEY")

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

        # Check if already cached/downloaded
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
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
            "per_page": 5,
            "size": "medium",
        }

        videos = []
        try:
            res = requests.get(url, headers=headers, params=params, timeout=15)
            if res.status_code == 200:
                videos = res.json().get("videos", [])
        except Exception as e:
            print(f"[!] Pexels search query failed: {e}")

        # Fallback retry if no videos found
        if not videos:
            words = [w for w in search_query.split() if len(w) > 2]
            fallbacks = []
            if len(words) > 1:
                fallbacks.append(" ".join(words[:2]))
            if words:
                fallbacks.append(words[0])
            fallbacks.extend(["abstract background", "technology background"])

            for fb_query in fallbacks:
                print(f"[*] Retrying Pexels query with fallback: '{fb_query}'...")
                params["query"] = fb_query
                try:
                    fb_res = requests.get(url, headers=headers, params=params, timeout=15)
                    if fb_res.status_code == 200:
                        fb_videos = fb_res.json().get("videos", [])
                        if fb_videos:
                            videos = fb_videos
                            print(f"[OK] Found {len(videos)} videos with fallback '{fb_query}'.")
                            break
                except Exception as ex:
                    print(f"[!] Fallback query '{fb_query}' error: {ex}")

        if not videos:
            print(f"[!] Warning: No Pexels videos found for '{search_query}' or fallbacks. Skipping trigger {trigger_id}.")
            continue

        # Select best MP4 file closest to target aspect ratio / resolution
        video_files = videos[0].get("video_files", [])
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

        try:
            print(f"[*] Downloading Pexels B-roll ({best_file.get('width')}x{best_file.get('height')}) from: {download_url[:60]}...")
            vid_res = requests.get(download_url, stream=True, timeout=30)
            vid_res.raise_for_status()

            with open(dest_path, "wb") as f:
                for chunk in vid_res.iter_content(chunk_size=16384):
                    f.write(chunk)
            print(f"[OK] Downloaded B-roll asset to: {dest_path}")
            broll_map[trigger_id] = dest_path
        except Exception as e:
            print(f"[!] Failed to download B-roll file from {download_url[:60]}: {e}")

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




