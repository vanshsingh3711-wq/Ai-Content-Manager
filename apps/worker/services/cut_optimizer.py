"""
cut_optimizer.py - Audio-aware cut optimization with RMS waveform boundary snapping.

Adapted from claude-youtube-editor / cutlib.py to ensure speech cuts never clip trailing
consonants or syllable releases.
"""

import array
import math
import wave
from pathlib import Path
from typing import List, Dict, Any, Optional


class AudioProbe:
    """RMS envelope calculator over 16kHz mono WAVs for noise floor + snap-to-audio tails."""

    def __init__(self, audio_path: str):
        self.audio_path = Path(audio_path)
        self._samples: Optional[tuple[array.array, int]] = None
        self._floor: Optional[float] = None

    def _load(self) -> tuple[array.array, int]:
        if self._samples is None:
            w = wave.open(str(self.audio_path), "rb")
            sr = w.getframerate()
            data = array.array("h")
            data.frombytes(w.readframes(w.getnframes()))
            w.close()
            self._samples = (data, sr)
        return self._samples

    def rms_db(self, t: float, win: float = 0.05) -> float:
        """Calculate RMS amplitude in dB at time t over a window."""
        data, sr = self._load()
        a = max(0, int(t * sr))
        b = min(len(data), int((t + win) * sr))
        if b <= a:
            return -120.0
        acc = 0.0
        for i in range(a, b):
            acc += data[i] * data[i]
        r = math.sqrt(acc / (b - a)) + 1e-9
        return 20 * math.log10(r / 32768)

    def floor_db(self) -> float:
        """Find baseline noise floor (10th percentile RMS dB)."""
        if self._floor is None:
            data, sr = self._load()
            step = int(0.05 * sr)
            vals = []
            for i in range(0, len(data) - step, step):
                acc = 0.0
                for j in range(i, i + step, 8):  # Subsample for speed
                    acc += data[j] * data[j]
                r = math.sqrt(acc / (step / 8)) + 1e-9
                vals.append(20 * math.log10(r / 32768))
            vals.sort()
            self._floor = vals[len(vals) // 10] if vals else -60.0
        return self._floor

    def snap_tail(
        self,
        word_end: float,
        min_tail: float = 0.06,
        max_tail: float = 0.25,
        margin: float = 5.0,
    ) -> float:
        """
        Calculates seconds to extend after word_end so the consonant release decays
        cleanly to the room noise floor.
        """
        floor = self.floor_db()
        o = min_tail
        while o <= max_tail:
            if self.rms_db(word_end + o) <= floor + margin:
                return round(o, 3)
            o += 0.02
        return max_tail

    def snap_head(
        self,
        word_start: float,
        pre_roll: float = 0.08,
    ) -> float:
        """Snaps cut start back slightly to capture plosive burst without clipping."""
        return max(0.0, round(word_start - pre_roll, 3))


def optimize_cut_boundaries(
    segments: List[Dict[str, Any]],
    audio_wav_path: str,
    min_tail: float = 0.06,
    max_tail: float = 0.25,
) -> List[Dict[str, Any]]:
    """
    Optimizes a list of cut segments [{'start': 1.0, 'end': 4.2}, ...] by snapping
    their tails to the speech release envelope.
    """
    probe = AudioProbe(audio_wav_path)
    optimized = []
    
    for seg in segments:
        s = seg.get("start", 0.0)
        e = seg.get("end", 0.0)
        tail = probe.snap_tail(e, min_tail=min_tail, max_tail=max_tail)
        snapped_end = round(e + tail, 3)
        snapped_start = probe.snap_head(s)
        
        opt_seg = dict(seg)
        opt_seg["start"] = snapped_start
        opt_seg["end"] = snapped_end
        opt_seg["_original_end"] = e
        opt_seg["_tail_added"] = tail
        optimized.append(opt_seg)
        
    return optimized
