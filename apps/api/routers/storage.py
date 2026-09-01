import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field
from storage import generate_presigned_upload_url

router = APIRouter(prefix="/api/v1/storage", tags=["Storage"])

ALLOWED_CONTENT_TYPES = {
    "video/mp4",
    "video/quicktime",  # .mov
    "video/webm",
    "video/x-matroska", # .mkv
    "video/x-msvideo",  # .avi
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
}

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm", ".mkv", ".avi", ".wav", ".mp3"}

# Local media storage directory for development mode (root/media_temp)
MEDIA_TEMP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "media_temp"))


class PresignedUrlRequest(BaseModel):
    filename: str = Field(..., description="Name of the file to upload")
    content_type: str = Field(..., description="MIME content type of the file")
    file_size_bytes: Optional[int] = Field(None, description="Optional size in bytes")
    user_id: Optional[str] = Field("default_user", description="Owner user identifier")


class PresignedUrlResponse(BaseModel):
    upload_url: str
    file_key: str
    source_url: str
    expires_in: int
    mode: str


@router.post("/presigned-url", response_model=PresignedUrlResponse)
def get_presigned_url(payload: PresignedUrlRequest):
    """
    Generate an S3/R2 presigned upload URL for direct browser-to-cloud upload.
    """
    _, ext = os.path.splitext(payload.filename)
    if ext.lower() not in ALLOWED_EXTENSIONS and payload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{payload.filename}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    result = generate_presigned_upload_url(
        filename=payload.filename,
        content_type=payload.content_type,
        user_id=payload.user_id or "default_user",
    )
    return result


@router.put("/dev-upload")
async def dev_upload_endpoint(request: Request, key: str = Query(..., description="File storage key")):
    """
    Local mock upload endpoint. Stores the uploaded file in media_temp so it can be streamed locally.
    """
    body = await request.body()
    local_file_path = os.path.join(MEDIA_TEMP_DIR, key.replace("/", os.sep))
    os.makedirs(os.path.dirname(local_file_path), exist_ok=True)

    with open(local_file_path, "wb") as f:
        f.write(body)

    return {
        "status": "success",
        "message": "Dev upload stored successfully",
        "file_key": key,
    }


@router.get("/download")
def dev_download_endpoint(key: str = Query(..., description="File storage key")):
    """
    Streams and downloads the local media file directly in the browser.
    """
    local_file_path = os.path.join(MEDIA_TEMP_DIR, key.replace("/", os.sep))
    
    if os.path.exists(local_file_path) and os.path.getsize(local_file_path) > 0:
        return FileResponse(
            local_file_path,
            media_type="video/mp4",
            headers={"Accept-Ranges": "bytes"},
        )

    # Return placeholder video bytes if file is a simulation
    return Response(
        content=b"LOCAL_DEV_VIDEO_STUB",
        media_type="video/mp4",
        status_code=status.HTTP_200_OK,
    )
