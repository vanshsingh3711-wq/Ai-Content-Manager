import os
import time
import requests
from typing import Dict, List, Any, Optional
from config import get_worker_settings

settings = get_worker_settings()

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



