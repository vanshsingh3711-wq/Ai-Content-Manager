import os
import requests
from typing import Dict, List, Any, Optional
from config import get_worker_settings

settings = get_worker_settings()


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
            try:
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
                if res.status_code == 200:
                    data = res.json()
                    videos = data.get("videos", [])
                    if videos:
                        video_files = videos[0].get("video_files", [])
                        # Select best portrait MP4 file
                        best_file = None
                        for vf in video_files:
                            if vf.get("file_type") == "video/mp4":
                                if not best_file or (vf.get("width", 0) > best_file.get("width", 0)):
                                    best_file = vf

                        download_url = best_file.get("link") if best_file else None
                        if download_url:
                            print(f"[*] Downloading Pexels B-roll from: {download_url[:60]}...")
                            vid_res = requests.get(download_url, stream=True, timeout=30)
                            if vid_res.status_code == 200:
                                with open(dest_path, "wb") as f:
                                    for chunk in vid_res.iter_content(chunk_size=16384):
                                        f.write(chunk)
                                download_success = True
                                print(f"[OK] Downloaded B-roll asset to: {dest_path}")
            except Exception as e:
                print(f"[!] Pexels fetch failed for '{search_query}': {e}")

        if not download_success:
            # Generate or stage a fallback portrait placeholder clip
            create_fallback_broll_clip(dest_path)
            print(f"[*] Staged fallback B-roll for {trigger_id}")

        broll_map[trigger_id] = dest_path

    return broll_map


def create_fallback_broll_clip(output_path: str):
    """
    Creates a lightweight synthetic 3-second 1080x1920 MP4 canvas for offline / fallback rendering.
    """
    try:
        import ffmpeg
        from services.media_extractor import get_ffmpeg_binary_path
        ffmpeg_bin = get_ffmpeg_binary_path()

        # Generate 3-second 1080x1920 color gradient video clip
        stream = (
            ffmpeg.input(
                "color=c=0x1E1B4B:s=1080x1920:d=4:r=30",
                f="lavfi"
            )
            .output(
                output_path,
                vcodec="libx264",
                pix_fmt="yuv420p",
                loglevel="error"
            )
            .overwrite_output()
        )
        ffmpeg.run(stream, cmd=ffmpeg_bin, capture_stdout=True, capture_stderr=True)
    except Exception as e:
        # Minimal byte stub fallback if ffmpeg is somehow unreachable
        with open(output_path, "wb") as f:
            f.write(b"FALLBACK_BROLL_MP4_STUB")
