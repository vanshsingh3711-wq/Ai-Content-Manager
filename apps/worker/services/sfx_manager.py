import os
import requests
import random

FREESOUND_API_KEY = os.environ.get("FREESOUND_API_KEY")

def fetch_sfx(keyword: str, output_path: str) -> bool:
    """
    Searches Freesound API for a sound effect matching the keyword and downloads it.
    If FREESOUND_API_KEY is not set or the request fails, falls back to a placeholder.
    """
    if not FREESOUND_API_KEY:
        print(f"  [SFX_MANAGER] FREESOUND_API_KEY not set. Cannot fetch '{keyword}'. Using placeholder if available.")
        return False

    # Search for a short sound effect
    search_url = "https://freesound.org/apiv2/search/text/"
    params = {
        "query": keyword,
        "token": FREESOUND_API_KEY,
        "filter": "duration:[0.1 TO 3.0]",  # Keep it short
        "fields": "id,name,previews",
        "page_size": 5
    }

    try:
        response = requests.get(search_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if not data.get("results"):
            print(f"  [SFX_MANAGER] No SFX found for '{keyword}' on Freesound.")
            return False
            
        # Pick a random result from the top 5 to add variety
        result = random.choice(data["results"])
        preview_url = result.get("previews", {}).get("preview-hq-mp3") or result.get("previews", {}).get("preview-lq-mp3")
        
        if not preview_url:
            print(f"  [SFX_MANAGER] Found result for '{keyword}' but no preview URL available.")
            return False
            
        print(f"  [SFX_MANAGER] Downloading SFX '{result['name']}' from Freesound...")
        
        # Download the preview mp3
        # Note: We save it as the requested output_path (which might be .wav in compositor, but ffmpeg handles .mp3 seamlessly)
        audio_resp = requests.get(preview_url, timeout=10)
        audio_resp.raise_for_status()
        
        with open(output_path, "wb") as f:
            f.write(audio_resp.content)
            
        return True
        
    except Exception as e:
        print(f"  [SFX_MANAGER] Failed to fetch SFX '{keyword}': {e}")
        return False
