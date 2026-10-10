"""Write the Kaggle notebook that renders one GRADE's (or one module's) lines in Josh.

    python3 scripts/kaggle-josh-notebook.py g3 <branch>     ->  scripts/kaggle/josh-g3.ipynb    (every g3m* module)
    python3 scripts/kaggle-josh-notebook.py g5m1 <branch>   ->  scripts/kaggle/josh-g5m1.ipynb  (one module)

Founder, 2026-09-22: one notebook per full grade.

    python3 scripts/kaggle-josh-notebook.py redo <branch> <keys.txt>  ->  scripts/kaggle/josh-redo.ipynb
re-renders exactly the listed keys, clip or not (9 Oct 2026: clips whose numbers the voice model misread). The keys
are written into the notebook, so nothing extra is committed.

The notebook clones <branch>, reads scripts/.voice-corpus-lessons-josh.json, keeps the rows said by that module that have no
clip yet (a row "has a clip" when its key is in scripts/audio/manifest.json — since 2026-09-26 the clips live in the
lesson-audio bucket, not in public/audio, so the files are no longer there to look at), renders them with scripts/chatterbox-render.py and zips them as milo-voice-josh-<module>.zip. It asserts the
count first, so a stale branch or an empty queue stops at cell 1 instead of spending GPU time.
"""
import json, sys, pathlib

module, branch = sys.argv[1], sys.argv[2]
REDO = sorted(set(open(sys.argv[3]).read().split())) if module == 'redo' else []
# Optional: modules whose lines were already given their own notebook (g5 minus g5m1: `... g5 <branch> g5m1`).
skip = [] if REDO else sys.argv[3:]
root = pathlib.Path(__file__).resolve().parent
corpus = json.load(open(root / '.voice-corpus-lessons-josh.json'))
have = set(json.load(open(root / 'audio/manifest.json'))['keys'])   # rendered = in the bucket's manifest
PREFIX = module + ('m' if 'm' not in module else '-')   # 'g3' -> 'g3m', 'g5m1' -> 'g5m1-'
own = lambda srcs: any(s.startswith(PREFIX) and not any(s.startswith(k + '-') for k in skip) for s in srcs)
todo = [r for r in corpus if r['key'] in REDO] if REDO else [r for r in corpus if own(r['sources']) and r['key'] not in have]
n = len(todo)
assert n > 0, f'nothing queued for {module}'

md = f"""# Milo voice — {module} in Josh

Clones branch `{branch}` and renders every Josh line of **{module}** that has no clip yet — **{n} lines** (a few fewer if lines shared with another module were rendered first).
Styles: B (0.5/0.5) and B+ (0.7/0.3) with the original Chatterbox, A with Turbo. Rules: `docs/product/voice.md`.

**Before Run All:** Settings → Accelerator → **GPU T4 x2** (or P100), Internet **On**. At the end, download
`milo-voice-josh-{module}.zip` from the Output panel and hand it back."""

setup = f"""import os, sys, subprocess, pathlib, shutil, json
BRANCH = {branch!r}
MODULE = {module!r}
PREFIX = {module!r} + ('m' if 'm' not in {module!r} else '-')
SKIP = {skip!r}
REDO = set({REDO!r})
VOICE = 'nzFihrBIvB34imQBuxub'   # Josh
WORK = pathlib.Path('/kaggle/working' if os.path.isdir('/kaggle/working') else '/content')
REPO = WORK / 'learn'
# A Kaggle session outlives a notebook: a copy cloned by ANOTHER grade's notebook would be read as this one's (0 lines).
if REPO.exists() and subprocess.run(['git', '-C', str(REPO), 'rev-parse', '--abbrev-ref', 'HEAD'], capture_output=True, text=True).stdout.strip() != BRANCH:
    shutil.rmtree(REPO)
if not REPO.exists():
    subprocess.run(['git', 'clone', '--depth', '1', '--branch', BRANCH, 'https://github.com/RadlorInc/learn.git', str(REPO)], check=True)
rows = json.load(open(REPO / 'scripts/.voice-corpus-lessons-josh.json'))
HAVE = set(json.load(open(REPO / 'scripts/audio/manifest.json'))['keys'])   # rendered = in the bucket's manifest (not on disk)
todo = [r for r in rows if r['key'] in REDO] if REDO else [r for r in rows if any(s.startswith(PREFIX) and not any(s.startswith(k + '-') for k in SKIP) for s in r['sources'])
        and r['key'] not in HAVE]
json.dump(todo, open(WORK / 'todo.json', 'w'))
print(len(todo), 'lines to render ·', {{s: sum(r['style'] == s for r in todo) for s in ['A', 'B', 'B+']}})
# At most {n}: lines shared with another module ("Okay. Your turn.") may already be rendered by the time this runs.
assert 0 < len(todo) <= {n}, f'expected up to {n} lines for {module} — is the branch right?'"""

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
# The renderer skips a key whose mp3 is already in OUT, and a Kaggle session keeps OUT between notebooks: a re-render
# (redo) found last run's clips and rendered nothing (9 Oct 2026). This run's keys start from no file.
for r in todo: (OUT / f"{r['key']}.mp3").unlink(missing_ok=True)
cmd = [str(PY), str(REPO / 'scripts/chatterbox-render.py'), '--voice', VOICE, '--corpus', str(WORK / 'todo.json'), '--out', str(OUT)]
proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
for line in proc.stdout:
    if 'it/s]' in line or not line.strip(): continue   # drop the progress bars
    print(line.rstrip()[:160], flush=True)
print('exit code', proc.wait())"""

zipc = f"""clips = sorted(p for p in (OUT / f"{{r['key']}}.mp3" for r in todo) if p.exists())   # this run's keys only
missing = [r['key'] for r in todo if not (OUT / f"{{r['key']}}.mp3").exists()]
stage = WORK / 'stage'; shutil.rmtree(stage, ignore_errors=True); (stage / VOICE).mkdir(parents=True)
for c in clips: shutil.copy2(c, stage / VOICE / c.name)
shutil.make_archive(str(WORK / 'milo-voice-josh-{module}'), 'zip', stage)
print(f'{{len(clips)}} of {{len(todo)}} clips in milo-voice-josh-{module}.zip' + (f' — MISSING {{len(missing)}}: {{missing}}' if missing else ' — complete'))"""

cell = lambda kind, src: {'cell_type': kind, 'metadata': {}, 'source': src, **({'outputs': [], 'execution_count': None} if kind == 'code' else {})}
nb = {'cells': [cell('markdown', md), cell('code', setup), cell('code', venv), cell('code', render), cell('code', zipc)],
      'metadata': {'kernelspec': {'display_name': 'Python 3', 'language': 'python', 'name': 'python3'}, 'language_info': {'name': 'python'}},
      'nbformat': 4, 'nbformat_minor': 5}
out = root / 'kaggle' / (f'josh-{module}' + ''.join(f'-no-{k}' for k in skip) + '.ipynb')
out.parent.mkdir(exist_ok=True)
json.dump(nb, open(out, 'w'), indent=1)
print(f'{n} lines -> {out}')
