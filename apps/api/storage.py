import os
import uuid
import re
from typing import Dict, Optional
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from config import get_settings

settings = get_settings()


def get_s3_client():
    """Initializes and returns a boto3 S3/R2 client if credentials and bucket exist."""
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
        config=Config(signature_version="s3v4", region_name="auto"),
    )


def sanitize_filename(filename: str) -> str:
    """Removes special characters and whitespace from filename."""
    name, ext = os.path.splitext(filename)
    clean_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", name)
    return f"{clean_name[:40]}{ext.lower()}"


def generate_presigned_upload_url(
    filename: str,
    content_type: str,
    user_id: str = "guest_user",
    expires_in: int = 900,
) -> Dict[str, str]:
    """
    Generates a presigned PUT URL for direct client-to-R2/S3 upload.
    If R2 credentials are not configured, returns a local mock/dev upload URL.
    """
    clean_name = sanitize_filename(filename)
    file_id = str(uuid.uuid4())
    file_key = f"raw-uploads/{user_id}/{file_id}-{clean_name}"
    
    s3_client = get_s3_client()
    bucket_name = settings.R2_BUCKET_NAME or "ai-video-manager-uploads"

    if s3_client:
        try:
            upload_url = s3_client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": bucket_name,
                    "Key": file_key,
                    "ContentType": content_type,
                },
                ExpiresIn=expires_in,
            )
            
            # Construct public / storage source URL
            endpoint = settings.R2_ENDPOINT_URL or f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
            source_url = f"{endpoint}/{bucket_name}/{file_key}"
            
            return {
                "upload_url": upload_url,
                "file_key": file_key,
                "source_url": source_url,
                "expires_in": expires_in,
                "mode": "r2_s3",
            }
        except ClientError:
            pass

    # Development URL served directly by FastAPI
    mock_upload_url = f"http://localhost:{settings.PORT}/api/v1/storage/dev-upload?key={file_key}"
    mock_source_url = f"http://localhost:{settings.PORT}/api/v1/storage/download?key={file_key}"

    return {
        "upload_url": mock_upload_url,
        "file_key": file_key,
        "source_url": mock_source_url,
        "expires_in": expires_in,
        "mode": "development_mock",
    }


def generate_presigned_download_url(file_key: str, expires_in: int = 3600) -> Optional[str]:
    """Generates a presigned GET URL to download/stream a media file."""
    s3_client = get_s3_client()
    bucket_name = settings.R2_BUCKET_NAME or "ai-video-manager-uploads"
    
    if s3_client:
        try:
            return s3_client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": bucket_name, "Key": file_key},
                ExpiresIn=expires_in,
            )
        except Exception:
            return None
            
    return f"http://localhost:{settings.PORT}/api/v1/storage/download?key={file_key}"
