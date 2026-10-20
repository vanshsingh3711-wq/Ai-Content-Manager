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
import time
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
    width: Optional[int] = None,
    height: Optional[int] = None,
    format_type: str = "desktop",
    wait_ms: int = 2000,
    suppress_cookies: bool = True,
) -> Dict[str, Any]:
    """
    Captures a crisp high-resolution screenshot of any web page or SaaS documentation
    using Chrome Headless Shell or Fast CDP.
    """
    chrome_bin = find_chrome_binary()
    if not chrome_bin:
        raise RuntimeError("Chrome headless binary not found on system. Install Chrome or Chromium.")

    # Determine default resolution based on requested format
    if format_type in ("9:16", "mobile"):
        effective_width = width if width is not None else 390
        effective_height = height if height is not None else 1800
    elif format_type in ("1:1", "square"):
        effective_width = width if width is not None else 800
        effective_height = height if height is not None else 1600
    else:
        effective_width = width if width is not None else 1440
        effective_height = height if height is not None else 1800

    os.makedirs(os.path.dirname(os.path.abspath(output_png_path)), exist_ok=True)

    cache_key = f"page_{url}_{effective_width}x{effective_height}_{format_type}"
    data_cache, meta_cache = _get_cache_path(cache_key, "png")

    if _is_cache_fresh(meta_cache) and data_cache.exists():
        shutil.copy2(data_cache, output_png_path)
        return {
            "url": url,
            "path": output_png_path,
            "width": effective_width,
            "height": effective_height,
            "format": format_type,
            "cached": True,
        }

    fast_capture_js = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fast_web_capture.mjs")
    captured_ok = False

    if os.path.exists(fast_capture_js) and shutil.which("node"):
        try:
            cmd_node = [
                "node",
                fast_capture_js,
                url,
                output_png_path,
                str(effective_width),
                str(effective_height),
                format_type,
            ]
            res_node = subprocess.run(cmd_node, capture_output=True, text=True, timeout=14)
            if os.path.exists(output_png_path) and os.path.getsize(output_png_path) > 1000:
                captured_ok = True
        except Exception as e:
            print(f"[capture_web_page] Fast node capture error: {e}")

    if not captured_ok:
        cmd = [
            chrome_bin,
            "--headless",
            "--disable-gpu",
            "--no-sandbox",
            "--hide-scrollbars",
            f"--window-size={effective_width},{effective_height}",
            f"--screenshot={output_png_path}",
            url,
        ]

        res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        if not os.path.exists(output_png_path) or os.path.getsize(output_png_path) == 0:
            raise RuntimeError(f"Headless Chrome capture failed for '{url}': {res.stderr.strip()}")

    # Cache image
    try:
        shutil.copy2(output_png_path, data_cache)
        meta_cache.write_text(
            json.dumps({"url": url, "width": effective_width, "height": effective_height, "format": format_type}),
            encoding="utf-8",
        )
    except Exception:
        pass

    return {
        "url": url,
        "path": output_png_path,
        "width": effective_width,
        "height": effective_height,
        "format": format_type,
        "cached": False,
    }


def generate_web_scroll_video(
    screenshot_path: str,
    output_mp4_path: str,
    duration: float = 4.0,
    aspect_ratio: str = "9:16",
    fps: int = 30,
) -> str:
    """
    Renders a natural, high-definition scrolling screen recording MP4 video
    from a tall screenshot using FFmpeg.
    """
    if not os.path.exists(screenshot_path):
        raise FileNotFoundError(f"Screenshot file not found: {screenshot_path}")

    from PIL import Image

    im = Image.open(screenshot_path)
    img_w, img_h = im.size

    if aspect_ratio in ("9:16", "mobile"):
        cw = img_w
        ch = int(img_w * 16 / 9)
        out_w, out_h = 720, 1280
    elif aspect_ratio in ("1:1", "square"):
        cw = min(img_w, img_h)
        ch = cw
        out_w, out_h = 720, 720
    else:
        cw = img_w
        ch = int(img_w * 9 / 16)
        out_w, out_h = 1280, 720

    out_w = out_w if out_w % 2 == 0 else out_w - 1
    out_h = out_h if out_h % 2 == 0 else out_h - 1

    if img_h <= ch:
        vf = f"scale={out_w}:{out_h},format=yuv420p"
    else:
        max_y = img_h - ch
        t_pause_start = min(0.6, max(0.2, duration * 0.12))
        t_pause_end = min(0.5, max(0.2, duration * 0.10))
        t_active = max(0.1, duration - t_pause_start - t_pause_end)
        progress_expr = f"0.5 - 0.5 * cos(PI * min(1, max(0, (t - {t_pause_start:.2f}) / {t_active:.2f})))"
        vf = f"crop={cw}:{ch}:0:'min({max_y}, {max_y} * ({progress_expr}))',scale={out_w}:{out_h},format=yuv420p"

    os.makedirs(os.path.dirname(os.path.abspath(output_mp4_path)), exist_ok=True)
    cmd = [
        "ffmpeg",
        "-y",
        "-loop",
        "1",
        "-i",
        screenshot_path,
        "-vf",
        vf,
        "-t",
        str(duration),
        "-r",
        str(fps),
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-preset",
        "veryfast",
        "-crf",
        "20",
        "-movflags",
        "+faststart",
        output_mp4_path,
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if not os.path.exists(output_mp4_path) or os.path.getsize(output_mp4_path) == 0:
        raise RuntimeError(f"FFmpeg web video generation failed: {res.stderr.strip()}")

    return output_mp4_path


# ---------------------------------------------------------------------------
# High-Level Evidence Dispatcher
# ---------------------------------------------------------------------------

def capture_web_evidence(
    source_query_or_url: str,
    output_path: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    format_type: str = "desktop",
) -> Dict[str, Any]:
    """
    Unified entry point for Phase 4. Automatically detects whether the source is
    a Twitter/X post, GitHub repository, YouTube video, or a generic URL/documentation page.
    """
    src = (source_query_or_url or "").strip()

    # 1. Twitter / X Post (only if tweet ID is present)
    if ("twitter.com" in src or "x.com" in src) and re.search(r"/status/(\d+)", src):
        try:
            tweet_data = fetch_tweet_evidence(src, output_image_path=output_path)
            return {
                "type": "social_post",
                "data": tweet_data,
                "path": output_path if os.path.exists(output_path) else None,
            }
        except Exception as e:
            print(f"[capture_web_evidence] Tweet fetch failed: {e}. Falling back to live web capture.")

    # 2. GitHub Repository (only if it has an owner and repo, and not a reserved non-repo route)
    reserved_gh = {
        "trending", "explore", "topics", "collections", "events", "features", "pricing",
        "enterprise", "about", "marketplace", "login", "join", "search", "settings", "pulls", "issues"
    }
    gh_match = re.search(r"github\.com/([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)", src)
    if "github.com" in src and gh_match and gh_match.group(1).lower() not in reserved_gh:
        try:
            gh_data = fetch_github_repo_evidence(src, output_card_path=output_path)
            return {
                "type": "github_repo",
                "data": gh_data,
                "path": output_path if os.path.exists(output_path) else None,
            }
        except Exception as e:
            print(f"[capture_web_evidence] GitHub API fetch failed for {src}: {e}. Falling back to live web capture.")

    # 3. YouTube Video (only if specific video watch route)
    if ("youtube.com" in src and ("watch?v=" in src or "/v/" in src or "/embed/" in src)) or "youtu.be" in src:
        try:
            yt_data = fetch_youtube_evidence(src, output_path=output_path)
            return {
                "type": "youtube",
                "data": yt_data,
                "path": output_path if os.path.exists(output_path) else None,
            }
        except Exception as e:
            print(f"[capture_web_evidence] YouTube evidence fetch failed: {e}. Falling back to live web capture.")

    # 4. Standard Web URL (GitHub Trending, articles, documentation, SaaS homepages)
    if src.startswith("http://") or src.startswith("https://"):
        page_data = capture_web_page(src, output_path, width=width, height=height, format_type=format_type)
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


def record_interactive_web_action(
    url: str,
    action_prompt: str,
    output_mp4_path: str,
    output_png_path: Optional[str] = None,
    duration: float = 4.0,
    aspect_ratio: str = "16:9",
) -> Dict[str, Any]:
    """
    Launches Playwright headless Chromium to record an authentic interactive web session
    executing user-specified actions (clicks, filters, typing, dropdowns, and scrolling) into an MP4 video.
    """
    import tempfile
    import shutil
    from playwright.sync_api import sync_playwright

    os.makedirs(os.path.dirname(os.path.abspath(output_mp4_path)), exist_ok=True)
    if output_png_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_png_path)), exist_ok=True)

    temp_rec_dir = tempfile.mkdtemp(prefix="ai_pw_rec_")

    if aspect_ratio in ("9:16", "mobile"):
        vp_width, vp_height = 720, 1280
        is_mobile = True
    elif aspect_ratio in ("1:1", "square"):
        vp_width, vp_height = 720, 720
        is_mobile = False
    else:
        vp_width, vp_height = 1280, 720
        is_mobile = False

    prompt_lower = (action_prompt or "").lower()
    captured_title = None

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--hide-scrollbars",
                ]
            )
            ctx = browser.new_context(
                record_video_dir=temp_rec_dir,
                record_video_size={"width": vp_width, "height": vp_height},
                viewport={"width": vp_width, "height": vp_height},
                is_mobile=is_mobile,
                has_touch=is_mobile,
            )
            page = ctx.new_page()

            # Navigate to URL
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=12000)
            except Exception:
                try:
                    page.goto(url, timeout=10000)
                except Exception as nav_e:
                    print(f"[record_interactive_web_action] Navigation notice: {nav_e}")

            time.sleep(0.8)
            captured_title = page.title() or url.replace("https://", "").replace("http://", "").split("/")[0]

            # Suppress cookie overlays
            try:
                page.evaluate("""() => {
                    const css = document.createElement('style');
                    css.textContent = '#onetrust-consent-sdk, .cookie-banner, [id*="cookie" i] { display: none !important; }';
                    document.head && document.head.appendChild(css);
                }""")
            except Exception:
                pass

            # 1. Specialized GitHub Trending / Filter detection
            if "github.com/trending" in url:
                if any(w in prompt_lower for w in ["python", "javascript", "typescript", "rust", "go", "c++", "ruby", "java"]):
                    lang_match = re.search(r"\b(python|javascript|typescript|rust|go|c\+\+|ruby|java)\b", prompt_lower)
                    target_lang = lang_match.group(1).title() if lang_match else "Python"
                    lang_summary = page.locator("details summary").filter(has_text=re.compile(r"^\s*Language:", re.I)).first
                    if lang_summary.count() > 0 and lang_summary.is_visible():
                        lang_summary.click()
                        time.sleep(0.6)
                        filter_input = page.locator("details[open] input[type='text']").first
                        if filter_input.count() > 0 and filter_input.is_visible():
                            filter_input.fill(target_lang)
                            time.sleep(0.5)
                        py_item = page.locator("details[open] a").filter(has_text=re.compile(rf"^\s*{target_lang}\s*$", re.I)).first
                        if py_item.count() > 0 and py_item.is_visible():
                            py_item.click()
                            try:
                                page.wait_for_load_state("domcontentloaded", timeout=6000)
                            except Exception:
                                time.sleep(1.2)
                        elif page.locator(f"text={target_lang}").first.is_visible():
                            page.locator(f"text={target_lang}").first.click()
                            time.sleep(1.0)

            # 2. General Clicks: "click on X" / "click X"
            click_match = re.search(r"click\s+(?:on\s+)?(?:the\s+)?[\"']?([^,\"'\n]+?)[\"']?(?:\s+(?:filter|tab|button|link|menu|dropdown))?(?:,|and|\.|$|for)", prompt_lower)
            if click_match and "github.com/trending" not in url:
                target_text = click_match.group(1).strip()
                if target_text and target_text not in ["record", "trending", "video", "screen"]:
                    try:
                        elem = page.locator(f"text={target_text}").first
                        if elem.count() > 0 and elem.is_visible():
                            elem.click()
                            time.sleep(0.8)
                    except Exception as clk_err:
                        print(f"[record_interactive_web_action] Click '{target_text}' ignored: {clk_err}")

            # 3. Typing: "type X into Y"
            type_match = re.search(r"type\s+[\"']?([^\"']+)[\"']?\s*(?:into|in)?\s*[\"']?([^,\"'\n]*)[\"']?", prompt_lower)
            if type_match:
                text_to_type = type_match.group(1).strip()
                target_field = type_match.group(2).strip()
                try:
                    input_elem = None
                    if target_field:
                        input_elem = page.locator(f"input[placeholder*='{target_field}' i], input[name*='{target_field}' i]").first
                    if not input_elem or input_elem.count() == 0:
                        input_elem = page.locator("input[type='search'], input[type='text'], input:not([type='hidden'])").first
                    if input_elem.count() > 0 and input_elem.is_visible():
                        input_elem.click()
                        time.sleep(0.3)
                        page.keyboard.type(text_to_type, delay=80)
                        time.sleep(0.5)
                        if "press enter" in prompt_lower or "submit" in prompt_lower:
                            page.keyboard.press("Enter")
                            time.sleep(1.0)
                except Exception as type_err:
                    print(f"[record_interactive_web_action] Type '{text_to_type}' ignored: {type_err}")

            # 4. Natural Scrolling
            scroll_steps = 4
            if "scroll" in prompt_lower or duration >= 3.0:
                for _ in range(scroll_steps):
                    page.mouse.wheel(0, 260)
                    time.sleep(0.5)

            time.sleep(0.5)

            # Capture screenshot of final state for thumbnail
            if output_png_path:
                page.screenshot(path=output_png_path)

            ctx.close()
            browser.close()

        # Find produced webm and convert to faststart MP4
        webms = [f for f in os.listdir(temp_rec_dir) if f.endswith(".webm")]
        if not webms:
            raise RuntimeError("Playwright interactive recording produced no webm video files.")

        src_webm = os.path.join(temp_rec_dir, webms[0])
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            src_webm,
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-preset",
            "veryfast",
            "-crf",
            "20",
            "-movflags",
            "+faststart",
            output_mp4_path,
        ]
        res_ff = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if not os.path.exists(output_mp4_path) or os.path.getsize(output_mp4_path) == 0:
            raise RuntimeError(f"FFmpeg conversion of Playwright recording failed: {res_ff.stderr.strip()}")

        return {
            "status": "success",
            "video_path": output_mp4_path,
            "screenshot_path": output_png_path if (output_png_path and os.path.exists(output_png_path)) else None,
            "title": captured_title,
            "duration": duration,
        }
    finally:
        try:
            shutil.rmtree(temp_rec_dir, ignore_errors=True)
        except Exception:
            pass

