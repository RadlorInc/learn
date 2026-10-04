"""Word start/end times for every lesson clip (g3-g8), faster-whisper small.en, local only.
Writes one <module>.json per module into <out_dir> (default ../_chalk-motion-timings, outside the repo like the audio):
{clip: {dur, words: [[word, start, end], ...]}}. Resumable: re-run and it skips clips already done. Then
`npx tsx scripts/audio/build-word-times.mts <out_dir>` turns it into src/features/lessons/word-times/.
run from the repo root: <venv with faster-whisper>/bin/python scripts/audio/whisper-word-times.py [out_dir]
(the whole Josh set, 6,831 clips, took about 2.5 hours on an 8-core Mac on 2026-10-04)
"""
import json, glob, os, sys
from multiprocessing import Pool
IDX = 'src/features/lessons/voice-index'
SRC = 'audio-src/nzFihrBIvB34imQBuxub'   # Josh, the only voice; fill with scripts/audio/fetch-src.mjs
OUT = sys.argv[1] if len(sys.argv) > 1 else '../_chalk-motion-timings'
m = None

def init():
    global m
    from faster_whisper import WhisperModel
    m = WhisperModel('small.en', device='cpu', compute_type='int8', cpu_threads=2)

def one(k):
    segs, info = m.transcribe(f'{SRC}/{k}.mp3', word_timestamps=True, language='en')
    return k, {'dur': round(info.duration, 3), 'words': [(w.word.strip(), round(w.start, 3), round(w.end, 3)) for s in segs for w in s.words]}

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    with Pool(4, init) as p:
        for f in sorted(glob.glob(f'{IDX}/g*.json')):
            mod = os.path.basename(f); out = f'{OUT}/{mod}'
            done = json.load(open(out)) if os.path.exists(out) else {}
            todo = [k for k in json.load(open(f)) if k not in done]
            for i, (k, v) in enumerate(p.imap_unordered(one, todo), 1):
                done[k] = v
                if i % 25 == 0 or i == len(todo):  # save often so a stop loses little
                    json.dump(done, open(out + '.tmp', 'w')); os.replace(out + '.tmp', out)
            print(mod, len(done), flush=True)
