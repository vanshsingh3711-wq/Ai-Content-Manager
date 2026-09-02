import sys
import os
sys.path.append(os.getcwd())
from services.transcriber import get_whisper_model

audio_path = 'temp_test_audio.wav'
initial_prompt = "This is a video featuring Hindi and English mixed language. नमस्ते, hello, kaise ho, how are you."
model = get_whisper_model(model_size="small")

print(f"[*] Loading audio {audio_path}")
segments, info = model.transcribe(
    audio_path,
    word_timestamps=True,
    beam_size=5,
    vad_filter=True,
    initial_prompt=initial_prompt,
)

for segment in segments:
    if segment.words:
        for word in segment.words:
            duration = word.end - word.start
            if 20.0 <= word.start <= 25.0 and duration > 4.0:
                print("FOUND SUSPICIOUS WORD:")
                # Handle possible unicode printing issues by encoding to ascii with ignore
                print(f"Word text: {word.word.encode('ascii', 'ignore').decode('ascii')}")
                print(f"Start: {word.start:.2f}")
                print(f"End: {word.end:.2f}")
                print(f"Duration: {duration:.2f}")
                print(f"Probability: {word.probability:.2f}")
                print(f"Parent segment start: {segment.start:.2f}")
                print(f"Parent segment end: {segment.end:.2f}")
                print(f"Parent segment text: {segment.text.encode('ascii', 'ignore').decode('ascii')}")
                print("---")
