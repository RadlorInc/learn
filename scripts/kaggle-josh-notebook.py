"""Write the Kaggle notebook that renders ONE module's lines in Josh.

    python3 scripts/kaggle-josh-notebook.py g5m1 <branch>   ->  scripts/kaggle/josh-g5m1.ipynb

The notebook clones <branch>, reads scripts/.voice-corpus-lessons-josh.json, keeps the rows said by that module that have no
clip yet, renders them with scripts/chatterbox-render.py and zips them as milo-voice-josh-<module>.zip. It asserts the
count first, so a stale branch or an empty queue stops at cell 1 instead of spending GPU time.
"""
import json, sys, pathlib

module, branch = sys.argv[1], sys.argv[2]
root = pathlib.Path(__file__).resolve().parent
corpus = json.load(open(root / '.voice-corpus-lessons-josh.json'))
clips = root.parent / 'public/audio/nzFihrBIvB34imQBuxub'
todo = [r for r in corpus if any(s.startswith(module + '-') for s in r['sources']) and not (clips / f"{r['key']}.mp3").exists()]
n = len(todo)
assert n > 0, f'nothing queued for {module}'

md = f"""# Milo voice — {module} in Josh

Clones branch `{branch}` and renders every Josh line of **{module}** that has no clip yet — **{n} lines** (a few fewer if lines shared with another module were rendered first).
Styles: B (0.5/0.5) and B+ (0.7/0.3) with the original Chatterbox, A with Turbo. Rules: `docs/new-flow/voice.md`.

**Before Run All:** Settings → Accelerator → **GPU T4 x2** (or P100), Internet **On**. At the end, download
`milo-voice-josh-{module}.zip` from the Output panel and hand it back."""

setup = f"""import os, sys, subprocess, pathlib, shutil, json
BRANCH = {branch!r}
MODULE = {module!r}
VOICE = 'nzFihrBIvB34imQBuxub'   # Josh
WORK = pathlib.Path('/kaggle/working' if os.path.isdir('/kaggle/working') else '/content')
REPO = WORK / 'learn'
if not REPO.exists():
    subprocess.run(['git', 'clone', '--depth', '1', '--branch', BRANCH, 'https://github.com/RadlorInc/learn.git', str(REPO)], check=True)
rows = json.load(open(REPO / 'scripts/.voice-corpus-lessons-josh.json'))
todo = [r for r in rows if any(s.startswith(MODULE + '-') for s in r['sources'])
        and not (REPO / 'public/audio' / VOICE / f"{{r['key']}}.mp3").exists()]
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
cmd = [str(PY), str(REPO / 'scripts/chatterbox-render.py'), '--voice', VOICE, '--corpus', str(WORK / 'todo.json'), '--out', str(OUT)]
proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
for line in proc.stdout:
    if 'it/s]' in line or not line.strip(): continue   # drop the progress bars
    print(line.rstrip()[:160], flush=True)
print('exit code', proc.wait())"""

zipc = f"""clips = sorted(OUT.glob('*.mp3'))
missing = [r['key'] for r in todo if not (OUT / f"{{r['key']}}.mp3").exists()]
stage = WORK / 'stage'; shutil.rmtree(stage, ignore_errors=True); (stage / VOICE).mkdir(parents=True)
for c in clips: shutil.copy2(c, stage / VOICE / c.name)
shutil.make_archive(str(WORK / 'milo-voice-josh-{module}'), 'zip', stage)
print(f'{{len(clips)}} of {{len(todo)}} clips in milo-voice-josh-{module}.zip' + (f' — MISSING {{len(missing)}}: {{missing}}' if missing else ' — complete'))"""

cell = lambda kind, src: {'cell_type': kind, 'metadata': {}, 'source': src, **({'outputs': [], 'execution_count': None} if kind == 'code' else {})}
nb = {'cells': [cell('markdown', md), cell('code', setup), cell('code', venv), cell('code', render), cell('code', zipc)],
      'metadata': {'kernelspec': {'display_name': 'Python 3', 'language': 'python', 'name': 'python3'}, 'language_info': {'name': 'python'}},
      'nbformat': 4, 'nbformat_minor': 5}
out = root / 'kaggle' / f'josh-{module}.ipynb'
out.parent.mkdir(exist_ok=True)
json.dump(nb, open(out, 'w'), indent=1)
print(f'{n} lines -> {out}')
