"""
Diagnostic: Investigate the 25.29s-31.71s cut from the 'retest' job.
Extract transcript, audio analysis, visual analysis, and AI reasoning.
"""
import os, sys, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))

from database import get_session
from models import VideoJob

JOB_ID = "51d5cd6c-a2f0-409d-a62a-02ec5b9558b5"
CUT_START = 25.29
CUT_END = 31.71
CONTEXT_START = 24.0
CONTEXT_END = 33.0

def main():
    session = next(get_session())
    job = session.query(VideoJob).filter(VideoJob.id == JOB_ID).first()
    if not job:
        print("Job not found"); return

    edl = json.loads(job.edit_decision_list)

    # ================================================================
    # 1. TRANSCRIPT WORDS in context window (24s-33s)
    # ================================================================
    print("=" * 70)
    print(f"1. TRANSCRIPT WORDS ({CONTEXT_START}s - {CONTEXT_END}s)")
    print("=" * 70)

    tmap = edl.get("timestamp_map", {})
    context_words = []
    cut_words = []

    for chunk_id, chunk_data in sorted(tmap.items(), key=lambda x: x[1].get("start", 0)):
        chunk_s = chunk_data.get("start", 0)
        chunk_e = chunk_data.get("end", 0)

        # Show chunk if it overlaps context window
        if chunk_e >= CONTEXT_START and chunk_s <= CONTEXT_END:
            print(f"\n  Chunk {chunk_id}: [{chunk_s:.2f}s - {chunk_e:.2f}s]")
            print(f"  Full text: \"{chunk_data.get('text', '')}\"")

            for w in chunk_data.get("words", []):
                ws = w.get("start", 0)
                we = w.get("end", 0)
                word = w.get("word", "")

                if we >= CONTEXT_START and ws <= CONTEXT_END:
                    in_cut = CUT_START <= ws and we <= CUT_END
                    marker = " <<< INSIDE CUT" if in_cut else ""
                    print(f"    [{ws:6.2f}s - {we:6.2f}s] \"{word}\"{marker}")
                    context_words.append({"word": word, "start": ws, "end": we, "in_cut": in_cut})
                    if in_cut:
                        cut_words.append(w)

    print(f"\n  Words in context window: {len(context_words)}")
    print(f"  Words INSIDE the cut: {len(cut_words)}")
    if cut_words:
        cut_text = " ".join(w.get("word", "") for w in cut_words)
        print(f"  Cut speech content: \"{cut_text}\"")

    # ================================================================
    # 2. AUDIO ANALYSIS REGIONS covering 24s-33s
    # ================================================================
    print("\n" + "=" * 70)
    print(f"2. AUDIO ANALYSIS REGIONS ({CONTEXT_START}s - {CONTEXT_END}s)")
    print("=" * 70)

    unified = edl.get("unified_analysis", {})
    audio_analysis = unified.get("audio_analysis", {})
    regions = audio_analysis.get("regions", [])

    print(f"  Total audio regions in analysis: {len(regions)}")
    for r in regions:
        rs = r.get("start", 0)
        re_ = r.get("end", 0)
        if re_ >= CONTEXT_START and rs <= CONTEXT_END:
            label = r.get("label", "unknown")
            conf = r.get("confidence", 0)
            in_cut = (rs >= CUT_START - 0.5 and re_ <= CUT_END + 0.5)
            marker = " <<< OVERLAPS CUT" if in_cut else ""
            print(f"    [{rs:6.2f}s - {re_:6.2f}s] {label:20s} (confidence={conf:.2f}){marker}")

    # Also check: are there SILENCE or NON_SPEECH regions inside 25.29-31.71?
    cut_region_labels = []
    for r in regions:
        rs = r.get("start", 0)
        re_ = r.get("end", 0)
        # Region overlaps the cut interval
        if rs < CUT_END and re_ > CUT_START:
            overlap_s = max(rs, CUT_START)
            overlap_e = min(re_, CUT_END)
            overlap_dur = overlap_e - overlap_s
            cut_region_labels.append({
                "label": r.get("label"),
                "region": f"[{rs:.2f}-{re_:.2f}]",
                "overlap": f"[{overlap_s:.2f}-{overlap_e:.2f}]",
                "overlap_dur": overlap_dur,
            })

    print(f"\n  Audio regions overlapping the cut [{CUT_START}-{CUT_END}]:")
    for cr in cut_region_labels:
            print(f"    {str(cr['label'] or 'None'):20s} region={cr['region']} overlap={cr['overlap']} ({cr['overlap_dur']:.2f}s)")

    # ================================================================
    # 3. VISUAL ANALYSIS for the interval
    # ================================================================
    print("\n" + "=" * 70)
    print(f"3. VISUAL ANALYSIS ({CONTEXT_START}s - {CONTEXT_END}s)")
    print("=" * 70)

    visual = unified.get("visual_analysis", {})
    if isinstance(visual, dict):
        print(f"  Visual analysis keys: {list(visual.keys())}")
        for key in visual.keys():
            items = visual.get(key, [])
            if isinstance(items, list) and items:
                print(f"\n  --- visual_analysis['{key}'] ({len(items)} items) ---")
                for v in items:
                    if isinstance(v, dict):
                        vs = v.get("start", v.get("timestamp", v.get("start_time")))
                        ve = v.get("end", v.get("end_time"))
                        if vs is not None and ve is not None:
                            vs, ve = float(vs), float(ve)
                            if ve >= CONTEXT_START and vs <= CONTEXT_END:
                                print(f"    [{vs:.2f}s - {ve:.2f}s] {json.dumps(v, ensure_ascii=False)[:300]}")
                        elif vs is not None:
                            vs = float(vs)
                            if CONTEXT_START <= vs <= CONTEXT_END:
                                print(f"    [{vs:.2f}s] {json.dumps(v, ensure_ascii=False)[:300]}")
                    else:
                        print(f"    (non-dict item): {str(v)[:200]}")
            elif not isinstance(items, list):
                if key in ("video_id",):
                    continue
                print(f"\n  --- visual_analysis['{key}'] = {str(items)[:200]}")
    else:
        print(f"  Visual analysis type: {type(visual)}, content: {str(visual)[:500]}")

    # ================================================================
    # 4. RAW AI DIRECTOR DECISIONS — find the exact cut reason
    # ================================================================
    print("\n" + "=" * 70)
    print("4. AI DIRECTOR RAW DECISIONS (all 3)")
    print("=" * 70)

    raw_edits = edl.get("raw_edits", [])
    for i, e in enumerate(raw_edits):
        print(f"\n  Edit [{i}]:")
        for k, v in e.items():
            val_str = str(v)
            if len(val_str) > 200:
                val_str = val_str[:200] + "..."
            print(f"    {k}: {val_str}")

    # Focus on the 25.29-31.71 cut specifically
    print("\n" + "=" * 70)
    print("5. FOCUS: THE 25.29-31.71 CUT DECISION")
    print("=" * 70)

    target_cut = None
    for e in raw_edits:
        if e.get("action") == "cut" and abs(e.get("start", 0) - CUT_START) < 0.1:
            target_cut = e
            break

    if target_cut:
        print(f"  Action:     {target_cut.get('action')}")
        print(f"  Start:      {target_cut.get('start')}")
        print(f"  End:        {target_cut.get('end')}")
        print(f"  Trigger ID: {target_cut.get('trigger_id')}")
        print(f"  Reason:     {target_cut.get('reason')}")
        print(f"  All fields: {json.dumps(target_cut, indent=4, ensure_ascii=False)}")
    else:
        print("  CUT NOT FOUND in raw_edits!")

    # ================================================================
    # 6. CONTENT ANALYSIS: What's actually in the 25.29-31.71 interval?
    # ================================================================
    print("\n" + "=" * 70)
    print("6. CONTENT ANALYSIS: What's inside 25.29-31.71?")
    print("=" * 70)

    # Speech content
    if cut_words:
        print(f"\n  SPEECH: YES — {len(cut_words)} words")
        print(f"  Words: \"{' '.join(w['word'] for w in cut_words)}\"")
        print(f"  First word: '{cut_words[0]['word']}' @ {cut_words[0]['start']}s")
        print(f"  Last word:  '{cut_words[-1]['word']}' @ {cut_words[-1]['end']}s")
        speech_span = cut_words[-1]['end'] - cut_words[0]['start']
        print(f"  Speech span: {speech_span:.2f}s out of {CUT_END - CUT_START:.2f}s cut interval")
    else:
        print(f"\n  SPEECH: NO — zero words inside the cut interval")

    # Gap before ID_05 (the chunk that starts at 31.71)
    # Check timestamp_map for gap between last word of ID_04 and first word of ID_05
    id04 = tmap.get("ID_04", {})
    id05 = tmap.get("ID_05", {})
    if id04 and id05:
        id04_end = id04.get("end", 0)
        id05_start = id05.get("start", 0)
        print(f"\n  Chunk ID_04 ends at:   {id04_end:.2f}s")
        print(f"  Chunk ID_05 starts at: {id05_start:.2f}s")
        print(f"  Gap between chunks:    {id05_start - id04_end:.2f}s")
        print(f"  Cut interval:          [{CUT_START:.2f}s - {CUT_END:.2f}s] = {CUT_END - CUT_START:.2f}s")
        print(f"  Cut == gap?            {abs((CUT_END - CUT_START) - (id05_start - id04_end)) < 0.01}")

    # Audio regions summary for the cut
    speech_in_cut = any(cr["label"] in ("SPEECH", "speech") for cr in cut_region_labels)
    silence_in_cut = any(cr["label"] in ("SILENCE", "silence") for cr in cut_region_labels)
    noise_in_cut = any(cr["label"] in ("NON_SPEECH_AUDIO", "non_speech_audio", "music", "noise") for cr in cut_region_labels)

    print(f"\n  Audio contains SPEECH:    {speech_in_cut}")
    print(f"  Audio contains SILENCE:   {silence_in_cut}")
    print(f"  Audio contains NOISE:     {noise_in_cut}")

    # ================================================================
    # 7. VERDICT PREPARATION
    # ================================================================
    print("\n" + "=" * 70)
    print("7. ASSESSMENT DATA")
    print("=" * 70)
    print(f"  Cut interval: {CUT_START}s - {CUT_END}s ({CUT_END - CUT_START:.2f}s)")
    print(f"  Words removed: {len(cut_words)}")
    if cut_words:
        print(f"  Removed text: \"{' '.join(w['word'] for w in cut_words)}\"")
    print(f"  Transcript gap (ID_04.end to ID_05.start): [{id04.get('end', '?')} - {id05.get('start', '?')}]")
    print(f"  Audio labels in interval: {[cr['label'] for cr in cut_region_labels]}")

if __name__ == "__main__":
    main()
