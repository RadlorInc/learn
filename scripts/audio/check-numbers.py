"""Hear every given clip back and check it says the numbers its line says — run BEFORE an upload.

    <venv with faster-whisper>/bin/python scripts/audio/check-numbers.py <dir of new mp3s> [more dirs…]

Why (9 Oct 2026): given digits, the voice model dropped a word inside a number (184 → "one hundred four", 180 → "one
hundred"); about 180 lesson clips said a number their line does not. A paid tester heard the first. Lines now reach the
model as words (styles.ts `numbersAsWords`), and this is the check that it worked: whisper (medium.en) hears each clip,
and the numbers it hears are compared with the numbers of the corpus line, both reduced to one digit string.

Exit 0: every clip heard and its numbers match. 1: a clip says different numbers (listed). 2: could not look (no clips,
a key no corpus names, whisper missing) — never read as clean.
"""
import json, os, re, sys, glob

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
WORDS = {'zero': 0, 'oh': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
         'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
         'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
         'eighty': 80, 'ninety': 90}
PLURAL = {'ones': 'one', 'twos': 'two', 'threes': 'three', 'fours': 'four', 'fives': 'five', 'sixes': 'six', 'sevens': 'seven',
          'eights': 'eight', 'nines': 'nine', 'tens': 'ten', 'twenties': 'twenty'}
ORDINAL = {'first': 'one', 'second': 'two', 'third': 'three', 'fourth': 'four', 'fifth': 'five', 'sixth': 'six', 'seventh': 'seven',
           'eighth': 'eight', 'ninth': 'nine', 'tenth': 'ten', 'eleventh': 'eleven', 'twelfth': 'twelve', 'twentieth': 'twenty',
           'thirtieth': 'thirty'}


def digits(s: str) -> str:
    """Every number in `s`, words or digits, as one digit string: 'one hundred eighty-four and 5s' -> '1845'."""
    s = s.lower().replace('-', ' ').replace(',', '')
    s = re.sub(r'(\d+)(st|nd|rd|th)s?\b', r'\1', s)
    toks = re.findall(r"[a-z']+|\d+", s)
    out, cur = [], None
    for t in toks:
        t = PLURAL.get(t, ORDINAL.get(t.rstrip('s'), t) if t.rstrip('s') in ORDINAL else t)
        if t in WORDS:
            v = WORDS[t]
            if cur is not None and not (cur % 10 == 0 and cur % 100 >= 20 and v < 10) and not (cur >= 100 and cur % 100 == 0):
                out.append(str(cur)); cur = None
            cur = (cur or 0) + v
            continue
        if t in ('hundred', 'hundreds'): cur = (cur or 1) * 100; continue
        if t in ('thousand', 'thousands'): cur = (cur or 1) * 1000; continue
        if t in ('million', 'millions'): cur = (cur or 1) * 1000000; continue
        if t == 'point' and cur is not None: out.append(str(cur)); cur = None; continue
        if cur is not None: out.append(str(cur)); cur = None
        m = re.match(r'(\d+)s?$', t)
        if m: out.append(m.group(1))
    if cur is not None: out.append(str(cur))
    return ''.join(out)


def main() -> int:
    files = [f for d in sys.argv[1:] for f in sorted(glob.glob(os.path.join(d, '*.mp3')))]
    if not files:
        print('could not look: no mp3 in', sys.argv[1:]); return 2
    lines = {}
    for name in ('.voice-corpus-lessons-josh.json', '.voice-corpus-chapters-josh.json'):
        c = json.load(open(os.path.join(ROOT, name)))
        for r in (c if isinstance(c, list) else next(v for v in c.values() if isinstance(v, list))):
            lines[r['key']] = r['text']
    unknown = [os.path.basename(f)[:-4] for f in files if os.path.basename(f)[:-4] not in lines]
    if unknown:
        print('could not look: no corpus line for', unknown[:10]); return 2
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print('could not look: faster_whisper is not installed in this python'); return 2
    model = WhisperModel('medium.en', device='cpu', compute_type='int8')
    bad = []
    for f in files:
        k = os.path.basename(f)[:-4]
        heard = ' '.join(s.text.strip() for s in model.transcribe(f, beam_size=5)[0])
        if digits(lines[k]) != digits(heard):
            bad.append((k, lines[k], heard))
    for k, said, heard in bad:
        print(f'WRONG NUMBERS {k}\n  line : {said}\n  heard: {heard}')
    print(f'{len(files)} clips heard, {len(bad)} with different numbers')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
