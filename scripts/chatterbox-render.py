"""Render corpus lines with Chatterbox Turbo, cloning a voice from a reference wav.

  .venv/bin/python scripts/chatterbox-render.py --voice <id> --corpus scripts/.voice-corpus-3-5.json \
      --out <dir> [--limit N] [--only k1,k2]

Same contract as voice-generate.mts: <out>/<key>.mp3 (22050 Hz mono 32 kbps), manifest.json is the
list of keys ON DISK, rewritten every 10 lines and at exit — so a crash loses nothing and a clip on
disk is never unlisted. Reference: scripts/chatterbox-ref/<voice>.wav (ElevenLabs clips, concatenated).
"""
import argparse, json, pathlib, subprocess, sys, tempfile, time
import torch, torchaudio
import imageio_ffmpeg
from chatterbox.tts_turbo import ChatterboxTurboTTS

ap = argparse.ArgumentParser()
ap.add_argument('--voice', required=True); ap.add_argument('--corpus', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--limit', type=int, default=10**9); ap.add_argument('--only', default='')
a = ap.parse_args()

root = pathlib.Path(__file__).resolve().parent.parent
ref = root / 'scripts/chatterbox-ref' / f'{a.voice}.wav'
assert ref.exists(), f'no reference wav for {a.voice}'
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
ff = imageio_ffmpeg.get_ffmpeg_exe()
# Chatterbox renders ~12 dB under ElevenLabs (measured -26..-30 LUFS against -14); level to match.
LOUDNORM = 'acompressor=threshold=-20dB:ratio=3:attack=5:release=60:makeup=2,loudnorm=I=-14:TP=-1:LRA=11'  # compressor first: short exclamations are peak-bound and loudnorm alone leaves them 4 dB under

seen, corpus = set(), []
for l in json.load(open(a.corpus)):
    if l['key'] in seen: continue
    seen.add(l['key']); corpus.append(l)
only = set(a.only.split(',')) if a.only else None
todo = [l for l in corpus if (only is None or l['key'] in only) and not (out / f"{l['key']}.mp3").exists()][:a.limit]
print(f'{len(corpus)} lines · {len(todo)} to render → {out}', flush=True)

def write_manifest():
    keys = sorted(p.stem for p in out.glob('*.mp3'))
    (out / 'manifest.json').write_text(json.dumps(keys))
    return len(keys)

dev = 'mps' if torch.backends.mps.is_available() else 'cpu'
t = time.perf_counter()
model = ChatterboxTurboTTS.from_pretrained(device=dev)
print(f'model loaded {time.perf_counter()-t:.0f}s on {dev}', flush=True)
model.generate('Warming up.', audio_prompt_path=str(ref))   # off-corpus: first call pays kernel setup

try:
    for i, l in enumerate(todo, 1):
        t = time.perf_counter()
        wav = model.generate(l['text'], audio_prompt_path=str(ref))
        if dev == 'mps': torch.mps.synchronize()
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            torchaudio.save(tmp.name, wav.detach().cpu(), model.sr)
        subprocess.run([ff, '-y', '-loglevel', 'error', '-i', tmp.name, '-af', LOUDNORM, '-ar', '22050', '-ac', '1', '-b:a', '32k', str(out / f"{l['key']}.mp3")], check=True)
        pathlib.Path(tmp.name).unlink()
        wall, audio = time.perf_counter() - t, wav.shape[-1] / model.sr
        print(f'{i:5}/{len(todo)} {wall:6.1f}s  {audio:5.1f}s audio  RTF {wall/audio:5.1f}  {l["key"]}  {l["text"][:50]!r}', flush=True)
        if dev == 'mps': torch.mps.empty_cache()   # 8 GB laptop: unbounded MPS cache is what drove swap to 20 GB
        if i % 10 == 0: write_manifest()
finally:
    print(f'manifest: {write_manifest()} clips on disk', flush=True)
