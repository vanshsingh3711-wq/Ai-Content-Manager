"""
Diagnostic script: Trace job 51d5cd6c-a2f0-409d-a62a-02ec5b9558b5 ('retest')
"""
import os, sys, json, subprocess
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))

from database import get_session
from models import VideoJob
from services.compositor import get_ffmpeg_binary_path, _get_ffprobe_bin, _probe_duration

JOB_ID = "51d5cd6c-a2f0-409d-a62a-02ec5b9558b5"

def probe_streams(filepath):
    ffmpeg_bin = get_ffmpeg_binary_path()
    ffprobe_bin = _get_ffprobe_bin(ffmpeg_bin)
    res = subprocess.run(
        [ffprobe_bin, "-v", "error",
         "-show_entries", "stream=codec_type,duration,nb_frames,r_frame_rate",
         "-show_entries", "format=duration,size",
         "-of", "json", filepath],
        capture_output=True, text=True
    )
    return json.loads(res.stdout)

def main():
    session = next(get_session())
    job = session.query(VideoJob).filter(VideoJob.id == JOB_ID).first()
    if not job:
        print(f"ERROR: Job {JOB_ID} not found in database")
        return

    print("=" * 70)
    print("SECTION 1: DATABASE STATE")
    print("=" * 70)
    print(f"Job ID:          {job.id}")
    print(f"Title:           {job.title}")
    print(f"Status:          {job.status}")
    print(f"User ID:         {job.user_id}")
    print(f"Source URL:      {job.source_url}")
    print(f"Rendered URL:    {job.rendered_url}")
    print(f"Video Type:      {job.video_type}")

    edl_raw = job.edit_decision_list
    print(f"\nedit_decision_list is None: {edl_raw is None}")
    
    if edl_raw is None:
        print("*** EDL IS NULL ***")
        return

    edl = json.loads(edl_raw) if isinstance(edl_raw, str) else edl_raw
    print(f"EDL top-level keys: {list(edl.keys())}")

    # ---- CRITICAL: Check ALL possible edit fields ----
    for key in ['edits', 'raw_edits', 'validated_edits']:
        items = edl.get(key, [])
        if items is None:
            items = []
        print(f"\n--- EDL['{key}']: {len(items)} items ---")
        for i, e in enumerate(items):
            print(f"  [{i}] action={e.get('action')}, trigger_id={e.get('trigger_id')}, "
                  f"start={e.get('start')}, end={e.get('end')}")
            if e.get('action') in ('b_roll', 'cut'):
                for k, v in e.items():
                    if k not in ('action', 'trigger_id', 'start', 'end'):
                        val_str = str(v)[:100]
                        print(f"       {k}={val_str}")

    # Validation report
    val_report = edl.get("validation_report")
    if val_report:
        print(f"\n--- Validation Report ---")
        if isinstance(val_report, dict):
            for k, v in val_report.items():
                print(f"  {k}: {v}")
        else:
            print(f"  {str(val_report)[:500]}")

    # Cuts analysis
    for key in ['edits', 'raw_edits', 'validated_edits']:
        items = edl.get(key, []) or []
        cuts = [e for e in items if e.get("action") == "cut"]
        total_cut = sum(e.get("end", 0) - e.get("start", 0) for e in cuts)
        if cuts:
            print(f"\nCUTS in '{key}': {len(cuts)}, total removed: {total_cut:.3f}s")
            for c in cuts:
                print(f"  [{c.get('start'):.3f}s - {c.get('end'):.3f}s]")

    # Timestamp map
    tmap = edl.get("timestamp_map", {})
    print(f"\ntimestamp_map chunks: {len(tmap)}")
    all_words = []
    for cid, cdata in tmap.items():
        chunk_s = cdata.get("start", 0)
        chunk_e = cdata.get("end", 0)
        n_words = len(cdata.get("words", []))
        print(f"  {cid}: [{chunk_s:.2f}s - {chunk_e:.2f}s] ({n_words} words)")
        for w in cdata.get("words", []):
            if w.get("word", "").strip():
                all_words.append(w)
    if all_words:
        print(f"  Total words: {len(all_words)}")
        print(f"  First: '{all_words[0]['word']}' @ {all_words[0]['start']}s")
        print(f"  Last:  '{all_words[-1]['word']}' @ {all_words[-1]['end']}s")

    # Source media
    print("\n" + "=" * 70)
    print("SECTION 2: SOURCE MEDIA")
    print("=" * 70)
    
    base_dir = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager"
    source_url = job.source_url or ""
    source_path = None
    if "key=" in source_url:
        key = source_url.split("key=")[1]
        source_path = os.path.join(base_dir, "media_temp", key)
    
    if source_path and os.path.exists(source_path):
        print(f"Source file: {source_path}")
        print(f"Size: {os.path.getsize(source_path):,} bytes")
        probe_data = probe_streams(source_path)
        fmt = probe_data.get("format", {})
        print(f"Container duration: {fmt.get('duration')}s")
        for s in probe_data.get("streams", []):
            ct = s.get("codec_type", "unknown")
            print(f"  {ct}: duration={s.get('duration')}s, frames={s.get('nb_frames')}, fps={s.get('r_frame_rate')}")
    else:
        print(f"Source NOT FOUND: {source_path}")

    # Rendered output
    print("\n" + "=" * 70)
    print("SECTION 3: RENDERED OUTPUT")
    print("=" * 70)
    
    rendered_url = job.rendered_url or ""
    render_path = None
    if "key=" in rendered_url:
        render_key = rendered_url.split("key=")[1]
        render_path = os.path.join(base_dir, "media_temp", render_key)

    if render_path and os.path.exists(render_path):
        print(f"Rendered file: {render_path}")
        print(f"Size: {os.path.getsize(render_path):,} bytes")
        probe_data = probe_streams(render_path)
        fmt = probe_data.get("format", {})
        print(f"Container duration: {fmt.get('duration')}s")
        for s in probe_data.get("streams", []):
            ct = s.get("codec_type", "unknown")
            print(f"  {ct}: duration={s.get('duration')}s, frames={s.get('nb_frames')}, fps={s.get('r_frame_rate')}")
    else:
        print(f"Rendered NOT FOUND: {render_path}")

    # Comparison
    print("\n" + "=" * 70)
    print("SECTION 4: COMPARISON")
    print("=" * 70)
    
    src_dur = _probe_duration(get_ffmpeg_binary_path(), source_path) if source_path and os.path.exists(source_path) else None
    rend_dur = _probe_duration(get_ffmpeg_binary_path(), render_path) if render_path and os.path.exists(render_path) else None
    
    # Get total cuts from validated_edits (what compositor actually used)
    validated = edl.get("validated_edits", []) or []
    raw = edl.get("raw_edits", []) or []
    db_edits = edl.get("edits", []) or []
    
    val_cuts = sum(e.get("end",0)-e.get("start",0) for e in validated if e.get("action")=="cut")
    raw_cuts = sum(e.get("end",0)-e.get("start",0) for e in raw if e.get("action")=="cut")
    db_cuts = sum(e.get("end",0)-e.get("start",0) for e in db_edits if e.get("action")=="cut")
    
    print(f"Source duration:          {src_dur:.3f}s" if src_dur else "Source duration: N/A")
    print(f"Rendered duration:        {rend_dur:.3f}s" if rend_dur else "Rendered duration: N/A")
    print(f"Cuts in 'edits':          {db_cuts:.3f}s")
    print(f"Cuts in 'raw_edits':      {raw_cuts:.3f}s")
    print(f"Cuts in 'validated_edits': {val_cuts:.3f}s")
    
    if src_dur and rend_dur:
        missing = src_dur - rend_dur
        print(f"\nMissing from output:     {missing:.3f}s")
        print(f"Expected (src - val_cuts): {src_dur - val_cuts:.3f}s")
        print(f"Expected (src - raw_cuts): {src_dur - raw_cuts:.3f}s")
        print(f"Expected (src - db_cuts):  {src_dur - db_cuts:.3f}s")

    # Now let's check: what does video_pipeline.py actually pass to the compositor?
    print("\n" + "=" * 70)
    print("SECTION 5: PIPELINE TRACE - What compositor received")
    print("=" * 70)
    print("The pipeline reads EDL from DB, then calls:")
    print("  validated_edits, report = validate_blueprint(edits, timestamp_map, duration)")
    print("  render_video_pipeline(..., edits=validated_edits, ...)")
    print()
    print("Question: Which 'edits' field does video_pipeline.py read from the EDL?")
    print("Let's check the pipeline code to see what key it uses...")

if __name__ == "__main__":
    main()
