import os
import shutil
import boto3
import requests
import time
from botocore.exceptions import ClientError
from typing import Any, Dict, Optional
from config import get_worker_settings

settings = get_worker_settings()
MEDIA_TEMP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "media_temp"))

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


def get_s3_client():
    """Returns configured boto3 S3 client if full credentials and bucket are configured."""
    if not (settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY and settings.R2_BUCKET_NAME):
        return None

    endpoint_url = settings.R2_ENDPOINT_URL
    if not endpoint_url and settings.R2_ACCOUNT_ID:
        endpoint_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
    )


@_wait_for_internet_retry
def upload_rendered_video_to_storage(
    local_mp4_path: str,
    job_id: str,
    user_id: str = "default_user",
) -> str:
    """
    Uploads the final rendered video to Cloudflare R2 / AWS S3 or persists locally for FastAPI dev streaming.
    """
    if not os.path.exists(local_mp4_path):
        raise FileNotFoundError(f"Rendered file not found: {local_mp4_path}")

    s3_client = get_s3_client()
    bucket_name = settings.R2_BUCKET_NAME or "ai-video-manager-uploads"
    file_key = f"rendered-exports/{user_id}/{job_id}_final.mp4"

    if s3_client:
        print(f"[*] Uploading rendered video to R2/S3: s3://{bucket_name}/{file_key}...")
        s3_client.upload_file(
            local_mp4_path,
            bucket_name,
            file_key,
            ExtraArgs={"ContentType": "video/mp4"},
        )
        
        if settings.R2_ENDPOINT_URL:
            public_url = f"{settings.R2_ENDPOINT_URL.rstrip('/')}/{bucket_name}/{file_key}"
        else:
            public_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
        print(f"[OK] Video uploaded successfully: {public_url}")
        return public_url

    # Local development storage: Persist copy to media_temp for streaming via localhost:8000
    persistent_local_dest = os.path.join(MEDIA_TEMP_DIR, file_key.replace("/", os.sep))
    os.makedirs(os.path.dirname(persistent_local_dest), exist_ok=True)
    shutil.copyfile(local_mp4_path, persistent_local_dest)
    print(f"[OK] Persisted rendered video for local streaming at: {persistent_local_dest}")

    return f"http://localhost:8000/api/v1/storage/download?key={file_key}"


@_wait_for_internet_retry
def publish_to_youtube_shorts(
    video_path: str,
    title: str,
    description: str = "#Shorts #AI",
    access_token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Publishes the rendered video to YouTube Shorts via YouTube Data API v3.
    """
    print(f"[*] Publishing to YouTube Shorts: '{title}'...")
    if not access_token:
        print("[*] No YouTube OAuth token provided. Simulated YouTube Shorts publish.")
        return {
            "platform": "youtube",
            "status": "simulated",
            "video_id": f"yt_sim_{os.urandom(4).hex()}",
            "title": title,
        }

    init_url = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=UTF-8",
    }
    metadata = {
        "snippet": {
            "title": f"{title[:90]} #Shorts",
            "description": description,
            "categoryId": "22",
            "tags": ["shorts", "ai", "viral", "video"],
        },
        "status": {
            "privacyStatus": "public",
            "selfDeclaredMadeForKids": False,
        },
    }
    init_res = requests.post(init_url, json=metadata, headers=headers, timeout=15)
    init_res.raise_for_status()
    if init_res.status_code == 200:
        upload_url = init_res.headers.get("Location")
        if upload_url and os.path.exists(video_path):
            with open(video_path, "rb") as f:
                upload_res = requests.put(upload_url, data=f, headers={"Content-Type": "video/mp4"}, timeout=120)
                upload_res.raise_for_status()
                if upload_res.status_code in [200, 201]:
                    yt_data = upload_res.json()
                    return {
                        "platform": "youtube",
                        "status": "published",
                        "video_id": yt_data.get("id"),
                        "url": f"https://youtube.com/shorts/{yt_data.get('id')}",
                    }

    raise RuntimeError(f"YouTube Shorts upload failed. {init_res.text}")


@_wait_for_internet_retry
def publish_to_instagram_reels(
    video_url: str,
    caption: str,
    access_token: Optional[str] = None,
    instagram_account_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Publishes video to Instagram Reels via Instagram Graph API.
    """
    print(f"[*] Publishing to Instagram Reels...")
    if not access_token or not instagram_account_id:
        print("[*] No Instagram OAuth token provided. Simulated Instagram Reels publish.")
        return {
            "platform": "instagram",
            "status": "simulated",
            "media_id": f"ig_sim_{os.urandom(4).hex()}",
        }

    container_url = f"https://graph.facebook.com/v19.0/{instagram_account_id}/media"
    params = {
        "media_type": "REELS",
        "video_url": video_url,
        "caption": caption,
        "access_token": access_token,
    }
    res1 = requests.post(container_url, data=params, timeout=20)
    res1.raise_for_status()
    if res1.status_code != 200:
        raise RuntimeError(f"Instagram container creation failed: {res1.text}")

    container_id = res1.json().get("id")

    publish_url = f"https://graph.facebook.com/v19.0/{instagram_account_id}/media_publish"
    res2 = requests.post(publish_url, data={"creation_id": container_id, "access_token": access_token}, timeout=20)
    res2.raise_for_status()
    if res2.status_code == 200:
        return {
            "platform": "instagram",
            "status": "published",
            "media_id": res2.json().get("id"),
        }

    raise RuntimeError(f"Instagram publish failed: {res2.text}")
