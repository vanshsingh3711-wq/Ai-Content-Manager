from typing import List, Dict, Any, Tuple

def classify_audio_regions(
    total_duration: float,
    speech_intervals: List[Tuple[float, float]],
    silence_intervals: List[Tuple[float, float]]
) -> List[Dict[str, Any]]:
    """
    Combines speech and silence intervals to classify the entire audio timeline 
    into contiguous regions of SPEECH, SILENCE, or NON_SPEECH_AUDIO.
    
    Priority:
    1. SPEECH (overrides anything else in that time range)
    2. SILENCE (takes precedence over general non-speech audio)
    3. NON_SPEECH_AUDIO (default if neither speech nor silence is present)
    """
    if total_duration <= 0:
        return []

    # Gather all unique boundaries within the valid duration
    boundaries = {0.0, total_duration}
    for s, e in speech_intervals + silence_intervals:
        if 0 <= s <= total_duration:
            boundaries.add(s)
        if 0 <= e <= total_duration:
            boundaries.add(e)
            
    boundaries_list = sorted(list(boundaries))
    regions = []
    
    for i in range(len(boundaries_list) - 1):
        start = boundaries_list[i]
        end = boundaries_list[i+1]
        
        # Skip zero-length boundaries that might occur due to float precision
        if end - start < 0.001:
            continue
            
        midpoint = (start + end) / 2.0
        
        # Check type based on midpoint overlap
        is_speech = any(s <= midpoint <= e for s, e in speech_intervals)
        is_silence = any(s <= midpoint <= e for s, e in silence_intervals)
        
        if is_speech:
            rtype = "SPEECH"
        elif is_silence:
            rtype = "SILENCE"
        else:
            rtype = "NON_SPEECH_AUDIO"
            
        # Merge with previous region if the type is exactly the same
        if regions and regions[-1]["type"] == rtype:
            regions[-1]["end"] = end
        else:
            regions.append({
                "start": start,
                "end": end,
                "type": rtype
            })
            
    # Round timestamps for clean output
    for r in regions:
        r["start"] = round(r["start"], 3)
        r["end"] = round(r["end"], 3)
        
    return regions
