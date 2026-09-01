import sys, os
sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))

from database import get_session
from models import VideoJob

session = next(get_session())
jobs = session.query(VideoJob).order_by(VideoJob.created_at.desc()).limit(5).all()

for job in jobs:
    print(f"[{job.id}] Status: {job.status} | Created: {job.created_at} | Updated: {job.updated_at}")
    if job.error_log:
        print(f"   Error: {job.error_log[:100]}")
