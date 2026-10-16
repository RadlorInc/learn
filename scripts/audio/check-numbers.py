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
    """Every number in `s`, words or digits, as one digit string per number: 'one hundred eighty-four, 5s' -> '184|5'.
    Punctuation and any other word end a number; 'too' and 'every one' are read as the words they are, not numbers."""
    s = s.lower()
    s = re.sub(r'(?<=\d),(?=\d{3})', '', s).replace('-', ' ')
    # Words whisper cannot tell from a number by ear: read both sides the same way.
    s = re.sub(r'\btoo\b', 'two', s)
    s = re.sub(r'\bate\b', 'eight', s)
    s = re.sub(r'\bevery one\b(?! (hundred|thousand))', 'everyone', s)
    s = re.sub(r'(\d+)(st|nd|rd|th)s?\b', r'\1', s)
    out, total, cur, seen, prev, frac = [], 0, 0, False, '', None
    def flush():
        nonlocal total, cur, seen, frac
        if seen: out.append(str(total + cur) + ('.' + frac if frac else ''))
        total, cur, seen, frac = 0, 0, False, None
    def word(t):
        t = PLURAL.get(t, t[:-1] if t.endswith('s') and t[:-1] in WORDS else t)
        t = ORDINAL.get(t, ORDINAL.get(t[:-1], t) if t.endswith('s') else t)
        for end, put in (('ieths', 'y'), ('ieth', 'y'), ('ies', 'y'), ('ths', ''), ('th', '')):
            if t.endswith(end) and t[:-len(end)] + put in WORDS: return t[:-len(end)] + put
        return t
    for t in re.findall(r"[a-z']+|\d+\.\d+|\d+|[.,;?!]", s):
        base = word(t)
        if frac is not None and (base in WORDS and WORDS[base] < 10 or t.isdigit()):
            frac += str(WORDS[base]) if base in WORDS else t   # digits after a point, one by one
        elif base == 'point' and seen:
            frac = ''                                          # "three point two"
        elif re.fullmatch(r'\d+\.\d+', t):
            flush(); w, f = t.split('.'); cur, seen, frac = int(w), True, f
        elif base in WORDS:
            v = WORDS[base]
            ok = seen and frac is None and (total + cur) > 0 and (cur % 100 == 0 or (v < 10 and cur % 10 == 0 and cur % 100 >= 20))
            if seen and not ok: flush()
            cur += v; seen = True
        elif base in ('hundred', 'hundreds') and frac is None:
            if not seen and base == 'hundreds': flush(); prev = base; continue   # "hundredths" is often heard as "hundreds"
            if not seen: cur, seen = 1, True                   # "to the nearest hundred" = 100
            cur = (cur or 1) * 100
        elif base in ('thousand', 'thousands', 'million', 'millions') and frac is None:
            if not seen and base.endswith('s'): flush(); prev = base; continue    # "thousandths" heard as "thousands"
            if not seen: cur, seen = 1, True
            total += (cur or 1) * (1000 if base.startswith('thousand') else 1000000); cur = 0
        elif t == 'and' and seen and prev in ('hundred', 'hundreds', 'thousand', 'thousands'): pass
        elif t.isdigit():
            flush(); cur, seen = int(t), True
        else:
            flush()
        prev = base
    flush()
    return '|'.join(out)


def same(line: str, heard: str) -> bool:
    """The clip says the line's numbers. A clock time said as two numbers ("three twenty") and written by whisper as one
    ("320") is the same digits in the same order, so the separators may differ."""
    a, b = digits(line), digits(heard)
    return a == b or a.replace('|', '') == b.replace('|', '')


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
        if not same(lines[k], heard):
            bad.append((k, lines[k], heard))
    for k, said, heard in bad:
        print(f'WRONG NUMBERS {k}\n  line : {said}\n  heard: {heard}')
    print(f'{len(files)} clips heard, {len(bad)} with different numbers')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
