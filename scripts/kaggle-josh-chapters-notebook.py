"""Write the Kaggle notebooks that render the KG–2 story chapters' lines in Josh — one per grade.

    VOICE_CORPUS=1 npx vitest run src/__tests__/_voiceCorpusChapters.test.ts    # rebuild the corpus first
    python3 scripts/kaggle-josh-chapters-notebook.py   ->  scripts/kaggle/josh-chapters-<kg|g1|g2>-<part>.ipynb

At most PART lines per notebook, so each fits one Kaggle session; rows are already in priority order (the lines every
scored round says first), so part 1 of a grade is the one that matters most.

Founder, 2026-09-25: the chapters speak in Josh like the lessons. Unlike scripts/kaggle-josh-notebook.py, the lines are
WRITTEN INTO the notebook, so it does not depend on which branch is on GitHub: it clones `main` only for the renderer
(scripts/chatterbox-render.py) and Josh's reference wav, skips any line main already has a clip for (a line shared with
a lesson), renders the rest and zips them as radlic-voice-josh-chapters-<grade>.zip. It asserts the count first, so an
empty queue stops at cell 1 instead of spending GPU time.
"""
import json, pathlib, re

PART = 1500
# The renderer READS `text`: `speakable` lets an ellipsis and a few emoji through (voice.md forbids both in a line), and
# Chatterbox would pause oddly or say nothing sensible for them. The key stays the runtime string's, so clips still match.
clean = lambda t: re.sub(r'\s+', ' ', re.sub(r'[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F\u200D]', '', t.replace('…', '.'))).strip()

root = pathlib.Path(__file__).resolve().parent
corpus = json.load(open(root / '.voice-corpus-chapters-josh.json'))
clips = root.parent / 'public/audio/nzFihrBIvB34imQBuxub'
NAMES = {0: 'kg', 1: 'g1', 2: 'g2'}

cell = lambda kind, src: {'cell_type': kind, 'metadata': {}, 'source': src, **({'outputs': [], 'execution_count': None} if kind == 'code' else {})}

jobs = []
for grade, gname in NAMES.items():
    rows = [{'key': r['key'], 'text': clean(r['text']), 'style': r['style']} for r in corpus if r['grade'] == grade and not (clips / f"{r['key']}.mp3").exists()]
    assert rows, f'nothing queued for {gname}'
    parts = [rows[i:i + PART] for i in range(0, len(rows), PART)]
    for i, part in enumerate(parts, 1):
        jobs.append((grade, f'{gname}-{i}', f"{'KG' if grade == 0 else f'Grade {grade}'} (part {i} of {len(parts)})", part))

for grade, name, label, todo in jobs:
    n = len(todo)
    chars = sum(len(r['text']) for r in todo)

    md = f"""# Radlic voice — {label} story chapters in Josh

Renders every line the {label} story chapters can say that has no clip yet — **{n} lines, {chars:,} characters** (the lines are
written into this notebook). Style A (Chatterbox Turbo) for all of them. Rules: `docs/new-flow/voice.md`.

**Before Run All:** Settings → Accelerator → **GPU T4 x2** (or P100), Internet **On**. At the end, download
`radlic-voice-josh-chapters-{name}.zip` from the Output panel and hand it back. If the session stops early, Run All
again in the same session: lines already rendered are skipped."""

    setup = f"""import os, sys, subprocess, pathlib, shutil, json
VOICE = 'nzFihrBIvB34imQBuxub'   # Josh
WORK = pathlib.Path('/kaggle/working' if os.path.isdir('/kaggle/working') else '/content')
REPO = WORK / 'learn-main'
if not REPO.exists():
    subprocess.run(['git', 'clone', '--depth', '1', '--branch', 'main', 'https://github.com/RadlorInc/learn.git', str(REPO)], check=True)
LINES = {json.dumps(todo, ensure_ascii=False)}
todo = [r for r in LINES if not (REPO / 'public/audio' / VOICE / f"{{r['key']}}.mp3").exists()]
json.dump(todo, open(WORK / 'todo.json', 'w'))
print(len(todo), 'lines to render')
assert 0 < len(todo) <= {n}, 'nothing to render — every line already has a clip on main'"""

    venv = """# Chatterbox pins torch 2.6, which breaks Kaggle's own torchvision — so it gets its own venv (uv: Kaggle's python has no ensurepip).
VENV = WORK / 'venv'; PY = VENV / 'bin' / 'python'; READY = VENV / '.ready'
if not READY.exists():
    shutil.rmtree(VENV, ignore_errors=True)
    subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'uv'], check=True)
    subprocess.run([sys.executable, '-m', 'uv', 'venv', str(VENV), '--python', sys.executable], check=True)
    subprocess.run([sys.executable, '-m', 'uv', 'pip', 'install', '--python', str(PY), 'setuptools<81', 'chatterbox-tts', 'imageio-ffmpeg'], check=True)
    READY.touch()
print(subprocess.run([str(PY), '-c', "import torch; print('cuda:', torch.cuda.is_available(), torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'NONE — set the accelerator')"], capture_output=True, text=True).stdout)"""

    render = """OUT = WORK / 'out' / VOICE
cmd = [str(PY), str(REPO / 'scripts/chatterbox-render.py'), '--voice', VOICE, '--corpus', str(WORK / 'todo.json'), '--out', str(OUT)]
proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
for line in proc.stdout:
    if 'it/s]' in line or not line.strip(): continue   # drop the progress bars
    print(line.rstrip()[:160], flush=True)
print('exit code', proc.wait())"""

    zipc = f"""keys = {{r['key'] for r in todo}}
clips = sorted(c for c in OUT.glob('*.mp3') if c.stem in keys)
missing = [k for k in keys if not (OUT / f'{{k}}.mp3').exists()]
stage = WORK / 'stage'; shutil.rmtree(stage, ignore_errors=True); (stage / VOICE).mkdir(parents=True)
for c in clips: shutil.copy2(c, stage / VOICE / c.name)
shutil.make_archive(str(WORK / 'radlic-voice-josh-chapters-{name}'), 'zip', stage)
print(f'{{len(clips)}} of {{len(todo)}} clips in radlic-voice-josh-chapters-{name}.zip' + (f' — MISSING {{len(missing)}}: {{missing}}' if missing else ' — complete'))"""

    nb = {'cells': [cell('markdown', md), cell('code', setup), cell('code', venv), cell('code', render), cell('code', zipc)],
          'metadata': {'kernelspec': {'display_name': 'Python 3', 'language': 'python', 'name': 'python3'}, 'language_info': {'name': 'python'}},
          'nbformat': 4, 'nbformat_minor': 5}
    out = root / 'kaggle' / f'josh-chapters-{name}.ipynb'
    json.dump(nb, open(out, 'w'), indent=1, ensure_ascii=False)
    print(f'{label}: {n} lines, {chars:,} chars -> {out}')
