#!/usr/bin/env bash
# Verify a backup.yml artifact FROM ITS CONTENTS — not from the job being green (it was green thirty
# times while skipping the dump). Decrypts, extracts, and prints what a person can compare against
# production: file sizes, the table count in schema.sql, the row count of every COPY block in
# data.sql, and one row you recognise.
#
#   BACKUP_PASSPHRASE=… scripts/verify-backup.sh milo-backup.tar.gz.enc
#
# Exits non-zero if the file is not encrypted, will not decrypt, or holds no COPY blocks at all.
set -euo pipefail
enc="${1:?usage: BACKUP_PASSPHRASE=… $0 <milo-backup.tar.gz.enc>}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is not set}"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT

echo "artifact: $enc ($(wc -c < "$enc") bytes)"
if tar tzf "$enc" >/dev/null 2>&1; then echo "✗ artifact is a readable tarball — it is NOT encrypted"; exit 1; fi
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE -in "$enc" | tar xz -C "$work"
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
