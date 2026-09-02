import sys, os
sys.path.append(os.getcwd())
from services.transcriber import transcribe_and_compress
_, timestamp_map = transcribe_and_compress('temp_test_audio.wav')
for key, chunk in timestamp_map.items():
    if key == 'ID_02' or key == 'ID_04' or key == 'ID_05' or key == 'ID_01':
        print(f"{key} ({chunk['start']} - {chunk['end']}):")
        for w in chunk['words']:
            print(f"  Word: ({w['start']} - {w['end']})")
