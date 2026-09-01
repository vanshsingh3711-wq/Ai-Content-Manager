import sys, os
import json
sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))

from database import get_session
from models import VideoJob

session = next(get_session())
job = session.query(VideoJob).order_by(VideoJob.created_at.desc()).first()

print(f"Job ID: {job.id}")
print(f"Status: {job.status}")

if job.edit_decision_list:
    try:
        data = json.loads(job.edit_decision_list)
        print("Raw EDL:")
        print(json.dumps(data, indent=2))
        edits = data.get("edits", [])
        cuts = [e for e in edits if e.get("action") == "cut"]
        print(f"\nTotal CUTs issued by AI: {len(cuts)}")
        for c in cuts:
            print(f"  - Cut trigger_id: {c.get('trigger_id')}")
    except Exception as e:
        print(f"Could not parse EDL: {e}")
