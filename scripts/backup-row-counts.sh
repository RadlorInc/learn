#!/usr/bin/env bash
#
# Row counts PER SCHEMA in a `supabase db dump --data-only --use-copy` file — COUNTS ONLY, never a value from a row.
# Run by .github/actions/prod-backup right after the dump, so a change in backup size is explained in the job log
# instead of guessed (founder, 2026-09-28: the backup went from ~64 KB to 1.8 MB overnight and nobody could say why
# without decrypting it).
#
#   scripts/backup-row-counts.sh data.sql
#
# Prints, per schema: the rows and the bytes of row text in the dump. Appends the same table to $GITHUB_STEP_SUMMARY
# when it is set.
#
# ⚠️ PER SCHEMA, NOT PER TABLE, ON PURPOSE: this repo is public, so its Actions logs are too. A per-table count would
# publish how many children and accounts exist; a schema total does not, and still names where a size change came from.
#
# Exit 0 = counted. Exit 2 = could NOT count — the file is empty, or has text but no COPY block this reads (a dump
# format change). "0 rows" and "could not see" must never print the same (CLAUDE.md), and the backup's caller
# turns 2 into a warning: the dump itself is still good.
set -euo pipefail
f="${1:?usage: scripts/backup-row-counts.sh <data.sql>}"
if [ ! -s "$f" ]; then echo "::warning::backup row counts: '$f' is empty or missing — nothing counted"; exit 2; fi

out=$(awk '
  # A data block, as pg_dump writes it with quoted identifiers: COPY "schema"."table" ("col", ...) FROM stdin;
  /^COPY "/ && / FROM stdin;$/ {
    name = $2; gsub(/"/, "", name); split(name, p, ".")
    s = p[1]; blocks++; in_copy = 1
    if (!(s in rows)) { rows[s] = 0; bytes[s] = 0 }
    next
  }
  in_copy && $0 == "\\." { in_copy = 0; next }        # end of the block ("\." alone; a row can never be that)
  in_copy { rows[s]++; bytes[s] += length($0) + 1 }
  END {
    if (blocks == 0) exit 2
    for (s in rows) printf "%s %d %d\n", s, rows[s], bytes[s]
  }
' "$f") || { echo "::warning::backup row counts: '$f' has $(wc -c < "$f" | tr -d ' ') bytes but no COPY block this script reads — rows NOT counted (dump format changed?)"; exit 2; }

table=$(printf '%s\n' "$out" | sort)
total_rows=$(printf '%s\n' "$table" | awk '{ r += $2 } END { print r }')
total_bytes=$(printf '%s\n' "$table" | awk '{ b += $3 } END { print b }')

echo "Backup row counts per schema (counts only — no data):"
printf '%s\n' "$table" | awk '{ printf "  %-22s %10d rows %14d bytes\n", $1, $2, $3 }'
printf '  %-22s %10d rows %14d bytes\n' "TOTAL" "$total_rows" "$total_bytes"

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "### Backup row counts per schema (counts only)"
    echo "| schema | rows | bytes |"
    echo "|---|---:|---:|"
    printf '%s\n' "$table" | awk '{ printf "| %s | %d | %d |\n", $1, $2, $3 }'
    echo "| **total** | **$total_rows** | **$total_bytes** |"
  } >> "$GITHUB_STEP_SUMMARY"
fi
