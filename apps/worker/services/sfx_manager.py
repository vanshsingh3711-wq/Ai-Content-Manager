import os
import shutil
import requests
import random

SFX_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "sfx", "clips"))
FREESOUND_API_KEY = os.environ.get("FREESOUND_API_KEY")

LOCAL_SFX_MAP = {
    "whoosh": "whoosh-soft.mp3",
    "swoosh": "whoosh-soft.mp3",
    "transition": "whoosh-soft.mp3",
    "wind": "whoosh-wind.mp3",
    "pop": "pop-reveal.mp3",
    "reveal": "pop-reveal.mp3",
    "ding": "chime-reward.mp3",
    "chime": "chime-reward.mp3",
    "reward": "chime-reward.mp3",
    "click": "ui-click-soft.mp3",
    "tap": "ui-click-soft.mp3",
    "toggle": "ui-toggle-on.mp3",
    "send": "ui-send.mp3",
    "typing": "keys-typing-soft.mp3",
    "riser": "riser-soft.mp3",
    "zoom": "riser-soft.mp3",
    "impact": "impact-soft.mp3",
    "thump": "launch-thump.mp3",
    "glitch": "glitch-zap.mp3",
    "sparkle": "sparkle-soft.mp3",
    "shimmer": "warm-shimmer.mp3",
    "camera": "camera-shutter.mp3",
}


def fetch_sfx(keyword: str, output_path: str) -> bool:
    """
    Retrieves sound effects for video transitions and motion graphics.
    First checks the local curated library (apps/worker/data/sfx/clips).
    Falls back to Freesound API with high-rating filters if needed.
    """
    kw_clean = (keyword or "pop").lower().strip()

    # 1. Check local curated library
    matched_clip = None
    for token, clip_name in LOCAL_SFX_MAP.items():
        if token in kw_clean:
            candidate = os.path.join(SFX_DIR, clip_name)
            if os.path.exists(candidate):
                matched_clip = candidate
                break

    if not matched_clip and os.path.isdir(SFX_DIR):
        direct_candidate = os.path.join(SFX_DIR, f"{kw_clean}.mp3")
        if os.path.exists(direct_candidate):
            matched_clip = direct_candidate

    if matched_clip:
        try:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            shutil.copyfile(matched_clip, output_path)
            print(f"  [SFX_MANAGER] Used curated local SFX '{os.path.basename(matched_clip)}' for '{keyword}'")
            return True
        except Exception as e:
            print(f"  [SFX_MANAGER] Local copy failed: {e}")

    # 2. Fallback to Freesound API if key is set
    if not FREESOUND_API_KEY:
        print(f"  [SFX_MANAGER] No local SFX match and FREESOUND_API_KEY not set for '{keyword}'.")
        return False

    search_url = "https://freesound.org/apiv2/search/text/"
    params = {
        "query": f"{keyword} sound effect",
        "token": FREESOUND_API_KEY,
        "filter": "duration:[0.2 TO 2.0]",
        "sort": "rating_desc",
        "fields": "id,name,previews",
        "page_size": 5,
    }

    try:
        response = requests.get(search_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        results = data.get("results", [])
        if not results:
            print(f"  [SFX_MANAGER] No SFX found for '{keyword}' on Freesound.")
            return False

        result = results[0]  # Take highest-rated
        preview_url = result.get("previews", {}).get("preview-hq-mp3") or result.get("previews", {}).get("preview-lq-mp3")
        if not preview_url:
            return False

        print(f"  [SFX_MANAGER] Downloading SFX '{result['name']}' from Freesound...")
        audio_resp = requests.get(preview_url, timeout=10)
        audio_resp.raise_for_status()

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(audio_resp.content)

        return True

    except Exception as e:
        print(f"  [SFX_MANAGER] Failed to fetch SFX '{keyword}': {e}")
        return False
