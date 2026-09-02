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
    return wrapper

@_wait_for_internet_retry
def fetch_broll_assets(
    edits: List[Dict[str, Any]],
    assets_dir: str = "",
    output_dir: Optional[str] = None,
) -> Dict[str, str]:
    """
    Downloads portrait B-roll video clips from Pexels Video API for all 'b_roll' actions.
    """
    target_dir = output_dir or assets_dir or os.path.abspath("./media_temp/assets")
    os.makedirs(target_dir, exist_ok=True)
    broll_map: Dict[str, str] = {}
    api_key = settings.PEXELS_API_KEY or os.getenv("PEXELS_API_KEY")

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

        download_success = False

        if api_key:
            print(f"[*] Querying Pexels for B-roll: '{search_query}' (Trigger: {trigger_id})...")
            url = "https://api.pexels.com/videos/search"
            headers = {"Authorization": api_key}
            params = {
                "query": search_query,
                "orientation": "portrait",
                "per_page": 3,
                "size": "medium",
            }
            res = requests.get(url, headers=headers, params=params, timeout=15)
            res.raise_for_status()
            
            data = res.json()
            videos = data.get("videos", [])
            if not videos:
                raise RuntimeError(f"No videos found on Pexels for query: {search_query}")
                
            video_files = videos[0].get("video_files", [])
            # Select best portrait MP4 file
            best_file = None
            for vf in video_files:
                if vf.get("file_type") == "video/mp4":
                    if not best_file or (vf.get("width", 0) > best_file.get("width", 0)):
                        best_file = vf

            download_url = best_file.get("link") if best_file else None
            if not download_url:
                raise RuntimeError(f"No valid MP4 file found in Pexels result for query: {search_query}")
                
            print(f"[*] Downloading Pexels B-roll from: {download_url[:60]}...")
            vid_res = requests.get(download_url, stream=True, timeout=30)
            vid_res.raise_for_status()
            
            with open(dest_path, "wb") as f:
                for chunk in vid_res.iter_content(chunk_size=16384):
                    f.write(chunk)
            print(f"[OK] Downloaded B-roll asset to: {dest_path}")
        else:
            raise ValueError("PEXELS_API_KEY is not set.")

        broll_map[trigger_id] = dest_path

    return broll_map



