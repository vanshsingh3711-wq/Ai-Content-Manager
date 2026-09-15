"""Quick check: what exactly is in the stored audio_analysis regions"""
import os, sys, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))
from database import get_session
from models import VideoJob

JOB_ID = "51d5cd6c-a2f0-409d-a62a-02ec5b9558b5"
session = next(get_session())
job = session.query(VideoJob).filter(VideoJob.id == JOB_ID).first()
edl = json.loads(job.edit_decision_list)

# Full audio analysis dump
audio = edl.get("unified_analysis", {}).get("audio_analysis", {})
print("=== FULL AUDIO ANALYSIS ===")
print(json.dumps(audio, indent=2, ensure_ascii=False))

# Also check: what transcript does the AI Director actually receive?
transcript = edl.get("unified_analysis", {}).get("transcript", "")
# Find the part around 25s-32s
lines = transcript.split("\n")
for line in lines:
    if any(f"[{t}" in line for t in ["24.", "25.", "26.", "27.", "28.", "29.", "30.", "31.", "32."]):
        print(f"\nTRANSCRIPT LINE: {line}")
    elif "ID_04" in line or "ID_05" in line:
        print(f"\nTRANSCRIPT LINE: {line[:300]}")
