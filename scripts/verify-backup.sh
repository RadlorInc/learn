#!/usr/bin/env bash
# Verify a backup.yml artifact FROM ITS CONTENTS — not from the job being green (it was green thirty
# times while skipping the dump). Decrypts, extracts, and prints what a person can compare against
# production: file sizes, the table count in schema.sql, the row count of every COPY block in
# data.sql, and one row you recognise.
#
#   BACKUP_AGE_KEY=~/radlic-backup.key scripts/verify-backup.sh milo-backup.tar.gz.age   # since 2026-10-16
#   BACKUP_PASSPHRASE=… scripts/verify-backup.sh milo-backup.tar.gz.enc                  # older dumps (openssl)
#
# Which one is decided by the file's own first bytes, not its name. Exits non-zero if the file is not
# encrypted, will not decrypt, or holds no COPY blocks at all.
set -euo pipefail
enc="${1:?usage: BACKUP_AGE_KEY=<key file> $0 <milo-backup.tar.gz.age>  (or BACKUP_PASSPHRASE=… for an older .enc)}"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT

echo "artifact: $enc ($(wc -c < "$enc") bytes)"
if tar tzf "$enc" >/dev/null 2>&1; then echo "✗ artifact is a readable tarball — it is NOT encrypted"; exit 1; fi
if [ "$(head -c 21 "$enc")" = "age-encryption.org/v1" ]; then
  : "${BACKUP_AGE_KEY:?this is an age dump: set BACKUP_AGE_KEY to the path of the founder age key file}"
  command -v age >/dev/null || { echo "✗ age is not installed (brew install age)"; exit 2; }
  age -d -i "$BACKUP_AGE_KEY" "$enc" | tar xz -C "$work"
elif [ "$(head -c 8 "$enc")" = "Salted__" ]; then
  : "${BACKUP_PASSPHRASE:?this is an older openssl dump: set BACKUP_PASSPHRASE to the passphrase it was made with}"
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE -in "$enc" | tar xz -C "$work"
else
  echo "✗ neither an age file nor an openssl-salted file — not a backup.yml artifact"; exit 1
fi
echo "decrypted: $(ls "$work" | tr '\n' ' ')"
for f in schema.sql data.sql; do test -s "$work/$f" || { echo "✗ $f missing or empty"; exit 1; }; echo "$f: $(wc -c < "$work/$f") bytes"; done

echo
echo "schema.sql: $(grep -ciE '^create table' "$work/schema.sql") CREATE TABLE · $(grep -ciE '^create (or replace )?function' "$work/schema.sql") functions · $(grep -ciE '^create policy' "$work/schema.sql") policies"
echo
echo "data.sql COPY blocks (rows = lines between COPY … FROM stdin and \\.):"
awk '
  /^COPY .* FROM stdin;/ { tbl=$2; n=0; inblk=1; next }
  inblk && /^\\\.$/      { printf "  %-40s %6d\n", tbl, n; total+=n; blocks++; inblk=0; next }
  inblk                  { n++ }
  END { printf "  %-40s %6d  (%d blocks)\n", "TOTAL", total, blocks; if (blocks==0) exit 2 }
' "$work/data.sql" || { echo "✗ no COPY blocks — this is not a data dump"; exit 1; }

echo
echo "a row you recognise — the free counting chapter, straight out of data.sql:"
grep -m1 -E '^counting\b' "$work/data.sql" | sed 's/^/  /' || echo "  ✗ 'counting' chapter row not found"
