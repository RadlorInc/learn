#!/bin/bash
# scripts/explain-merge.sh <module> <branch>...  (run in the repo root)  — merge each writer branch of one module, resolving the known conflicts, one commit each.
S="$(cd "$(dirname "$0")" && pwd)"
m=$1; shift
for b in "$@"; do
  git merge --no-edit -q "$b" >/dev/null 2>&1
  python3 - "$m" <<'PY'
import re,sys
m=sys.argv[1]; p='src/infra/storage/voicePref.ts'; s=open(p).read()
if '<<<<<<<' in s:
    mods=[]
    for block in re.findall(r'<<<<<<< [^\n]*\n(.*?)>>>>>>> [^\n]*\n', s, flags=re.S):
        for x in re.findall(r"'(g\dm\d)'", block):
            if x not in mods: mods.append(x)
    s=re.sub(r'<<<<<<< [^\n]*\n.*?>>>>>>> [^\n]*\n', "export const JOSH_MODULES = new Set([" + ", ".join(f"'{x}'" for x in mods) + "])\n", s, flags=re.S)
    open(p,'w').write(s)
PY
  [ -d src/features/lessons/content/chalk/$m ] && python3 $S/explain-resolve.py $m >/dev/null
  left=$(grep -rl "<<<<<<<" src docs 2>/dev/null)
  if [ -n "$left" ]; then echo "UNRESOLVED in $b: $left"; exit 1; fi
  git add -A src docs && git commit -q --no-edit 2>/dev/null
  echo "merged $b"
done
grep -n "JOSH_MODULES = " src/infra/storage/voicePref.ts
