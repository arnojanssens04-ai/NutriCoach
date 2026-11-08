"""Transcrit la voix (Whisper) avec les horaires de chaque mot, SANS script de départ.
Usage : python3 transcribe.py in/video.mp4 [modele=medium]  ->  out/transcription.json + texte affiché
(sans initial_prompt : un long texte indice fait dérailler Whisper)"""
import json, subprocess, sys, wave, os
import numpy as np
from faster_whisper import WhisperModel
os.makedirs('out', exist_ok=True)
src = sys.argv[1]; size = sys.argv[2] if len(sys.argv) > 2 else 'medium'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-vn', '-ac', '1', '-ar', '16000', 'out/voix16.wav'], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-vn', '-ac', '2', '-ar', '44100', 'out/voix.wav'], check=True)
with wave.open('out/voix16.wav') as wf: pcm = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
m = WhisperModel(size, device='cpu', compute_type='int8')
segs, info = m.transcribe(pcm, language='fr', word_timestamps=True, beam_size=5, condition_on_previous_text=False, temperature=0.0)
words = []; lines = []
for s in segs:
    lines.append((round(s.start, 2), round(s.end, 2), s.text.strip()))
    for w in s.words: words.append({'w': w.word.strip(), 't0': round(w.start, 2), 't1': round(w.end, 2)})
json.dump({'words': words, 'segments': lines}, open('out/transcription.json', 'w'), ensure_ascii=False)
print('DURÉE', info.duration, 's |', len(words), 'mots')
for a, b, t in lines: print(f'[{a:6.2f} → {b:6.2f}] {t}')
