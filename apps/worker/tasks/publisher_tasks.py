"""
Social Publishing Asynchronous Celery Tasks.

Dispatches rendered master videos to connected social media platforms
(YouTube Shorts, TikTok, Instagram Reels) and records publication receipts.
"""

import os
import uuid
from typing import Any, Dict, List, Optional

from celery_app import celery_app
from config import get_worker_db
from models import SocialAccount, VideoJob, VideoJobStatus
from services.publisher import publish_from_social_account


@celery_app.task(bind=True, name="tasks.publish_rendered_video_to_socials")
def publish_rendered_video_to_socials(
    self,
    video_job_id: str,
    social_account_ids: List[str],
    title: Optional[str] = None,
    description: Optional[str] = None,
    is_shorts: bool = True,
) -> Dict[str, Any]:
    """
    Celery task that retrieves the rendered master MP4 and publishes
    it to all selected social accounts.
    """
    print(f"[*] Starting social publishing for job {video_job_id} to {len(social_account_ids)} accounts...")

    with get_worker_db() as session:
        job = session.get(VideoJob, uuid.UUID(video_job_id))
        if not job:
            raise ValueError(f"VideoJob '{video_job_id}' not found.")

        final_title = title or job.title or "New Short"
        final_desc = description or "Generated with AI Content Manager"

        job.status = VideoJobStatus.PUBLISHING
        session.commit()

        # Find local rendered file in media_temp
        media_temp = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "media_temp"))
        file_key = f"rendered-exports/{job.user_id}/{job.id}_final.mp4".replace("/", os.sep)
        local_mp4 = os.path.join(media_temp, file_key)

        if not os.path.exists(local_mp4):
            # Fallback to rendered_url check or direct search
            cand = os.path.join(media_temp, f"{job.id}_final.mp4")
            if os.path.exists(cand):
                local_mp4 = cand

        results: List[Dict[str, Any]] = []

        for acc_id_str in social_account_ids:
            try:
                acc_uuid = uuid.UUID(acc_id_str)
                account = session.get(SocialAccount, acc_uuid)
                if not account:
                    results.append({"account_id": acc_id_str, "status": "error", "error": "Account not found"})
                    continue

                res = publish_from_social_account(
                    local_mp4_path=local_mp4,
                    account=account,
                    title=final_title,
                    description=final_desc,
                    is_shorts=is_shorts,
                    public_video_url=job.rendered_url,
                )
                results.append({"account_id": acc_id_str, "status": "success", "result": res})

            except Exception as e:
                print(f"[!] Error publishing to account {acc_id_str}: {e}")
                results.append({"account_id": acc_id_str, "status": "failed", "error": str(e)})

        job.status = VideoJobStatus.COMPLETED
        session.commit()

    return {
        "job_id": video_job_id,
        "title": final_title,
        "publications": results,
    }
