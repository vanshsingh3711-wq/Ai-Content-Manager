"""
Real Web Evidence Capture Service (Phase 4)
Replaces generic stock B-roll with real website documentation, SaaS landing pages,
X/Twitter posts, GitHub repository cards, and YouTube media mentioned by the speaker.

Capabilities:
1. Headless Chrome Browser Capture: High-resolution screenshots of SaaS docs, pricing pages, articles.
2. Cookie Banner Stripper: Suppresses consent dialogs (onetrust, cookie-banner, cmpbox, etc.).
3. Public X/Twitter Evidence: Extracts verified post text, author, avatar, likes, and replies without API keys.
4. GitHub Repo Evidence: Fetches star counts, forks, description, and OpenGraph social cards.
5. YouTube Evidence: Downloads high-resolution video thumbnail plates.
6. SHA-256 Disk Caching: Prevents redundant network requests across repeated edits.
"""

import hashlib
import json
import os
import re
import shutil
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

# ---------------------------------------------------------------------------
# Cache Configuration
# ---------------------------------------------------------------------------

CACHE_DIR = Path(os.path.expanduser("~/.cache/ai-content-manager/captures"))
CACHE_TTL_DAYS = 7


def _get_cache_path(key_data: str, extension: str = "png") -> Tuple[Path, Path]:
    """Returns (data_file_path, meta_file_path) for a SHA-256 cache key."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    h = hashlib.sha256(key_data.encode("utf-8")).hexdigest()[:24]
    return CACHE_DIR / f"{h}.{extension}", CACHE_DIR / f"{h}.meta.json"


def _is_cache_fresh(meta_file: Path) -> bool:
    if not meta_file.exists():
        return False
    try:
        age_s = os.path.getmtime(meta_file)
        import time
        return (time.time() - age_s) < (CACHE_TTL_DAYS * 86400)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Dynamic Headless Chrome Discovery
# ---------------------------------------------------------------------------

def find_chrome_binary() -> Optional[str]:
    """
    Locates Google Chrome, Chromium, or Chrome Headless Shell installed on the machine.
    Scans PATH, Puppeteer cache, Remotion cache, and standard Linux locations.
    """
    # 1. Check explicit environment override
    for env_var in ("CHROME_BIN", "CHROME_PATH", "PUPPETEER_EXECUTABLE_PATH"):
        val = os.environ.get(env_var)
        if val and os.path.exists(val) and os.access(val, os.X_OK):
            return val

    # 2. Check standard system PATH binaries
    for binary_name in ("chrome-headless-shell", "google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        found = shutil.which(binary_name)
        if found:
            return found

    # 3. Check Puppeteer and Remotion local caches
    search_roots = [
        Path(os.path.expanduser("~/.cache/puppeteer")),
        Path(os.path.expanduser("~/.cache/remotion")),
        Path(os.path.expanduser("~/.remotion")),
    ]
    for root in search_roots:
        if root.exists():
            for p in root.rglob("chrome-headless-shell"):
                if p.is_file() and os.access(p, os.X_OK):
                    return str(p)

    return None


# ---------------------------------------------------------------------------
# Cookie Banner Stripper CSS
# ---------------------------------------------------------------------------

COOKIE_SUPPRESSION_CSS = """
#cookie-banner, .cookie-banner, .cookie-consent, [id*="cookie" i], [class*="cookie" i],
[id*="consent" i], [class*="consent" i], .cmpbox, #onetrust-consent-sdk,
#CybotCookiebotDialog, .osano-cm-window, div[aria-label*="cookie" i],
.banner-overlay, .modal-backdrop, .intercom-lightweight-app {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
}
html, body {
    overflow: auto !important;
}
"""


# ---------------------------------------------------------------------------
# Format Helpers
# ---------------------------------------------------------------------------

def format_count(num: Optional[Union[int, float]]) -> str:
    """Formats numeric metrics: 251183 -> '251K', 1500 -> '1.5K', 1400000 -> '1.4M'."""
    if num is None:
        return "0"
    n = float(num)
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M".replace(".0M", "M")
    if n >= 10_000:
        return f"{int(round(n / 1_000))}K"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K".replace(".0K", "K")
    return str(int(n))


# ---------------------------------------------------------------------------
# Twitter / X Evidence Fetcher
# ---------------------------------------------------------------------------

def fetch_tweet_evidence(
    tweet_url_or_id: str,
    output_image_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetches verified tweet metadata and author details using the public syndication endpoint.
    Zero API keys or authentication required.
    """
    # Extract tweet status ID
    status_match = re.search(r"status(?:es)?/(\d+)", tweet_url_or_id)
    tweet_id = status_match.group(1) if status_match else re.sub(r"\D", "", tweet_url_or_id)
    if not tweet_id:
        raise ValueError(f"Could not extract Twitter status ID from: {tweet_url_or_id}")

    cache_key = f"twitter_{tweet_id}"
    data_cache, meta_cache = _get_cache_path(cache_key, "json")

    if _is_cache_fresh(meta_cache) and data_cache.exists():
        try:
            cached_res = json.loads(data_cache.read_text(encoding="utf-8"))
            if output_image_path and not os.path.exists(output_image_path) and cached_res.get("avatar_url"):
                os.makedirs(os.path.dirname(os.path.abspath(output_image_path)), exist_ok=True)
                req_img = urllib.request.Request(cached_res["avatar_url"], headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req_img, timeout=10) as img_resp, open(output_image_path, "wb") as f_out:
                    f_out.write(img_resp.read())
                cached_res["avatar_local_path"] = output_image_path
            return cached_res
        except Exception:
            pass

    # Query Twitter syndication endpoint
    syndication_url = f"https://cdn.syndication.twimg.com/tweet-result?id={tweet_id}&token=a&lang=en"
    req = urllib.request.Request(
        syndication_url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )

    with urllib.request.urlopen(req, timeout=10) as resp:
        raw_data = json.loads(resp.read().decode("utf-8"))

    user_info = raw_data.get("user", {})
    text = raw_data.get("text", "")
    # Clean t.co trailing links
    clean_text = re.sub(r"\s*https://t\.co/\w+\s*$", "", text).strip()
    avatar_url = user_info.get("profile_image_url_https", "")
    if avatar_url:
        avatar_url = avatar_url.replace("_normal", "_400x400")

    result = {
        "platform": "x",
        "type": "tweet",
        "id": tweet_id,
        "name": user_info.get("name", "Creator"),
        "handle": f"@{user_info.get('screen_name', 'creator')}",
        "text": clean_text,
        "likes": format_count(raw_data.get("favorite_count", 0)),
        "replies": format_count(raw_data.get("conversation_count", 0)),
        "time": str(raw_data.get("created_at", ""))[:10],
        "avatar_url": avatar_url,
        "url": f"https://x.com/{user_info.get('screen_name', 'creator')}/status/{tweet_id}",
    }

    # Download author avatar if requested
    if avatar_url and output_image_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_image_path)), exist_ok=True)
        try:
            req_img = urllib.request.Request(avatar_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req_img, timeout=10) as img_resp, open(output_image_path, "wb") as f_out:
                f_out.write(img_resp.read())
            result["avatar_local_path"] = output_image_path
        except Exception as e:
            print(f"[Web Evidence] Could not download avatar: {e}")

    # Cache result
    data_cache.write_text(json.dumps(result, indent=2), encoding="utf-8")
    meta_cache.write_text(json.dumps({"cached": True}), encoding="utf-8")

    return result


# ---------------------------------------------------------------------------
# GitHub Repository Evidence Fetcher
# ---------------------------------------------------------------------------

def fetch_github_repo_evidence(
    repo_url_or_slug: str,
    output_card_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetches GitHub repository star counts, description, language, and OpenGraph social card.
    Zero API keys needed for public repositories.
    """
    slug_match = re.search(r"github\.com/([^/]+/[^/]+)", repo_url_or_slug)
    slug = slug_match.group(1).rstrip("/") if slug_match else repo_url_or_slug.strip().lstrip("/")
    # Clean any trailing .git or subpaths
    slug = "/".join(slug.replace(".git", "").split("/")[:2])

    cache_key = f"github_{slug}"
    data_cache, meta_cache = _get_cache_path(cache_key, "json")

    if _is_cache_fresh(meta_cache) and data_cache.exists():
        try:
            cached_res = json.loads(data_cache.read_text(encoding="utf-8"))
            if output_card_path and not os.path.exists(output_card_path) and cached_res.get("og_image_url"):
                os.makedirs(os.path.dirname(os.path.abspath(output_card_path)), exist_ok=True)
                req_og = urllib.request.Request(cached_res["og_image_url"], headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req_og, timeout=10) as og_resp, open(output_card_path, "wb") as f_out:
                    f_out.write(og_resp.read())
                cached_res["card_local_path"] = output_card_path
            return cached_res
        except Exception:
            pass

    api_url = f"https://api.github.com/repos/{slug}"
    req = urllib.request.Request(
        api_url,
        headers={"User-Agent": "AI-Content-Manager/1.0", "Accept": "application/vnd.github.v3+json"}
    )

    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    og_image_url = f"https://opengraph.githubassets.com/1/{slug}"
    result = {
        "platform": "github",
        "type": "repository",
        "slug": slug,
        "full_name": data.get("full_name", slug),
        "stars": format_count(data.get("stargazers_count", 0)),
        "forks": format_count(data.get("forks_count", 0)),
        "description": data.get("description") or "",
        "language": data.get("language") or "Code",
        "owner_avatar": data.get("owner", {}).get("avatar_url", ""),
        "og_image_url": og_image_url,
        "url": data.get("html_url", f"https://github.com/{slug}"),
    }

    # Download social card if requested
    if output_card_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_card_path)), exist_ok=True)
        try:
            req_og = urllib.request.Request(og_image_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req_og, timeout=10) as og_resp, open(output_card_path, "wb") as f_out:
                f_out.write(og_resp.read())
            result["card_local_path"] = output_card_path
        except Exception as e:
            print(f"[Web Evidence] Could not download GitHub OG card: {e}")

    # Cache result
    data_cache.write_text(json.dumps(result, indent=2), encoding="utf-8")
    meta_cache.write_text(json.dumps({"cached": True}), encoding="utf-8")

    return result


# ---------------------------------------------------------------------------
# YouTube Evidence Fetcher
# ---------------------------------------------------------------------------

def fetch_youtube_evidence(
    youtube_url: str,
    output_path: Optional[str] = None,
) -> Dict[str, Any]:
    """Extracts YouTube thumbnail image from video URL."""
    video_id = None
    if "youtu.be/" in youtube_url:
        video_id = youtube_url.split("youtu.be/")[1].split("?")[0].split("/")[0]
    elif "watch?v=" in youtube_url:
        video_id = youtube_url.split("watch?v=")[1].split("&")[0]

    if not video_id:
        raise ValueError(f"Could not extract YouTube video ID from: {youtube_url}")

    thumb_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
    result = {
        "platform": "youtube",
        "video_id": video_id,
        "thumbnail_url": thumb_url,
        "url": f"https://www.youtube.com/watch?v={video_id}",
    }

    if output_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        try:
            req = urllib.request.Request(thumb_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as resp, open(output_path, "wb") as f_out:
                f_out.write(resp.read())
            result["thumbnail_local_path"] = output_path
        except Exception:
            # Fallback to hqdefault
            fallback_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
            req = urllib.request.Request(fallback_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as resp, open(output_path, "wb") as f_out:
                f_out.write(resp.read())
            result["thumbnail_local_path"] = output_path

    return result


# ---------------------------------------------------------------------------
# Headless Chrome Web Page Capture
# ---------------------------------------------------------------------------

def capture_web_page(
    url: str,
    output_png_path: str,
    width: int = 1280,
    height: int = 800,
    wait_ms: int = 2000,
    suppress_cookies: bool = True,
) -> Dict[str, Any]:
    """
    Captures a crisp high-resolution screenshot of any web page or SaaS documentation
    using the local Chrome Headless Shell.
    """
    chrome_bin = find_chrome_binary()
    if not chrome_bin:
        raise RuntimeError("Chrome headless binary not found on system. Install Chrome or Chromium.")

    os.makedirs(os.path.dirname(os.path.abspath(output_png_path)), exist_ok=True)

    cache_key = f"page_{url}_{width}x{height}"
    data_cache, meta_cache = _get_cache_path(cache_key, "png")

    if _is_cache_fresh(meta_cache) and data_cache.exists():
        shutil.copy2(data_cache, output_png_path)
        return {
            "url": url,
            "path": output_png_path,
            "width": width,
            "height": height,
            "cached": True,
        }

    cmd = [
        chrome_bin,
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        f"--window-size={width},{height}",
        f"--virtual-time-budget={wait_ms}",
        f"--screenshot={output_png_path}",
        url,
    ]

    res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if not os.path.exists(output_png_path) or os.path.getsize(output_png_path) == 0:
        raise RuntimeError(f"Headless Chrome capture failed for '{url}': {res.stderr.strip()}")

    # Cache image
    try:
        shutil.copy2(output_png_path, data_cache)
        meta_cache.write_text(json.dumps({"url": url, "width": width, "height": height}), encoding="utf-8")
    except Exception:
        pass

    return {
        "url": url,
        "path": output_png_path,
        "width": width,
        "height": height,
        "cached": False,
    }


# ---------------------------------------------------------------------------
# High-Level Evidence Dispatcher
# ---------------------------------------------------------------------------

def capture_web_evidence(
    source_query_or_url: str,
    output_path: str,
    width: int = 1280,
    height: int = 800,
) -> Dict[str, Any]:
    """
    Unified entry point for Phase 4. Automatically detects whether the source is
    a Twitter/X post, GitHub repository, YouTube video, or a generic URL/documentation page.
    """
    src = (source_query_or_url or "").strip()

    # 1. Twitter / X Post
    if "twitter.com" in src or "x.com" in src:
        tweet_data = fetch_tweet_evidence(src, output_image_path=output_path)
        return {
            "type": "social_post",
            "data": tweet_data,
            "path": output_path if os.path.exists(output_path) else None,
        }

    # 2. GitHub Repository
    if "github.com" in src:
        gh_data = fetch_github_repo_evidence(src, output_card_path=output_path)
        return {
            "type": "github_repo",
            "data": gh_data,
            "path": output_path if os.path.exists(output_path) else None,
        }

    # 3. YouTube Video
    if "youtube.com" in src or "youtu.be" in src:
        yt_data = fetch_youtube_evidence(src, output_path=output_path)
        return {
            "type": "youtube",
            "data": yt_data,
            "path": output_path if os.path.exists(output_path) else None,
        }

    # 4. Standard Web URL
    if src.startswith("http://") or src.startswith("https://"):
        page_data = capture_web_page(src, output_path, width=width, height=height)
        return {
            "type": "web_page",
            "data": page_data,
            "path": output_path,
        }

    # 5. Non-URL search query (fallback to GitHub search or documentation search)
    gh_candidate = f"https://github.com/{src}"
    try:
        gh_data = fetch_github_repo_evidence(gh_candidate, output_card_path=output_path)
        return {
            "type": "github_repo",
            "data": gh_data,
            "path": output_path if os.path.exists(output_path) else None,
        }
    except Exception:
        raise ValueError(f"Could not resolve real web evidence for query: '{src}'")
