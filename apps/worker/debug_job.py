"""Debug script to inspect a specific job's data and trace the pipeline failure."""
import sys, os, json
sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))

from database import get_session
from models import VideoJob

session = next(get_session())
job = session.query(VideoJob).filter(VideoJob.title == 'Testing video for editor').first()

if not job:
    print("Job not found!")
    sys.exit(1)

print(f"=== JOB: {job.id} ===")
print(f"  Title: {job.title}")
print(f"  Status: {job.status}")
print(f"  Source URL: {job.source_url}")
print(f"  Rendered URL: {job.rendered_url}")
print()

# Check source file
source_key = job.source_url.split("key=")[-1] if "key=" in job.source_url else ""
MEDIA_TEMP = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "media_temp"))
local_source = os.path.join(MEDIA_TEMP, source_key.replace("/", os.sep))
print(f"=== SOURCE FILE CHECK ===")
print(f"  Expected path: {local_source}")
print(f"  Exists: {os.path.exists(local_source)}")
if os.path.exists(local_source):
    size = os.path.getsize(local_source)
    print(f"  Size: {size} bytes ({size / 1024 / 1024:.2f} MB)")
else:
    print("  FILE MISSING!")

# Check rendered file
rendered_key = job.rendered_url.split("key=")[-1] if job.rendered_url and "key=" in job.rendered_url else ""
local_rendered = os.path.join(MEDIA_TEMP, rendered_key.replace("/", os.sep))
print(f"\n=== RENDERED FILE CHECK ===")
print(f"  Expected path: {local_rendered}")
print(f"  Exists: {os.path.exists(local_rendered)}")
if os.path.exists(local_rendered):
    size = os.path.getsize(local_rendered)
    print(f"  Size: {size} bytes ({size / 1024 / 1024:.2f} MB)")

# Check temp job dir (should be cleaned up)
temp_dir = os.path.join(MEDIA_TEMP, str(job.id))
print(f"\n=== TEMP JOB DIR ===")
print(f"  Path: {temp_dir}")
print(f"  Exists: {os.path.exists(temp_dir)}")

# Check EDL
if job.edit_decision_list:
    edl = json.loads(job.edit_decision_list)
    print(f"\n=== AI EDIT DECISION LIST ===")
    print(f"  Transcript (first 300 chars): {edl.get('bracketed_transcript', '')[:300]}")
    print(f"\n  Edits ({len(edl.get('edits', []))} total):")
    for e in edl.get('edits', []):
        print(f"    {e.get('trigger_id')}: action={e.get('action')} search_query={e.get('search_query', '')}")
    
    ts_map = edl.get('timestamp_map', {})
    print(f"\n  Timestamp map chunks: {len(ts_map.get('chunks', []))}")
    for chunk in ts_map.get('chunks', [])[:3]:
        print(f"    {chunk.get('id')}: {chunk.get('start_sec', 0):.2f}s - {chunk.get('end_sec', 0):.2f}s | '{chunk.get('text', '')[:80]}'")
else:
    print("\n  No EDL stored!")

# Now test FFmpeg on the actual source file to see if it works
print("\n=== FFMPEG PROBE TEST ===")
import subprocess, shutil
ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"
if os.path.exists(local_source):
    probe = subprocess.run([ffmpeg_bin, "-i", local_source, "-f", "null", "-"], capture_output=True, text=True, timeout=10)
    # FFmpeg prints info to stderr
    for line in probe.stderr.split("\n"):
        if "Duration" in line or "Stream" in line or "Input" in line:
            print(f"  {line.strip()}")

session.close()
