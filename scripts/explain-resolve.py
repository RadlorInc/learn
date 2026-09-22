"""Resolve the two conflicts every split module produces. usage: resolve.py <module>   (run in the repo root)
- content/chalk/<module>/index.ts: rebuilt from the t<n>.ts files present (every topic board, in order);
- content/voice/<module>.ts: both sides kept (each writer added rows for its own topics)."""
import re, sys, os
m = sys.argv[1]; U = m.upper()
d = f'src/features/lessons/content/chalk/{m}'
ns = sorted(int(f[1:-3]) for f in os.listdir(d) if re.fullmatch(r't\d+\.ts', f))
open(f'{d}/index.ts', 'w').write(
  f"/** {m}'s chalkboards, one file per topic (see ../../../chalk.ts). */\nimport type {{ ChalkMark }} from '../../../chalk'\n"
  + ''.join(f"import {{ T{n} }} from './t{n}'\n" for n in ns)
  + f"\nexport const {U}_CHALK: Record<string, (ChalkMark[] | undefined)[]> = {{\n"
  + ''.join(f"  '{m}-t{n}': T{n},\n" for n in ns) + "}\n")
p = f'src/features/lessons/content/voice/{m}.ts'
if os.path.exists(p):
    s = open(p).read()
    s = re.sub(r'<<<<<<< [^\n]*\n(.*?)=======\n(.*?)>>>>>>> [^\n]*\n', lambda x: x.group(1) + x.group(2), s, flags=re.S)
    open(p, 'w').write(s)
print(m, 'chalk topics', ns)
