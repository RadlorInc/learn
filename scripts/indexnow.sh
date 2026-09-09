#!/usr/bin/env bash
# Tell IndexNow (Bing, and everyone else in the consortium) that some URLs changed.
#
#   scripts/indexnow.sh radlor.com                      # every URL in that host's sitemap
#   scripts/indexnow.sh radlor.com /writing/new-post    # just these paths
#
# ⚠️ RUN THIS *AFTER* THE DEPLOY IS LIVE, NOT ON PUSH. IndexNow's whole value is that the crawler
# comes almost immediately — which is worthless, and actively harmful, if it arrives before the new
# build is serving and re-indexes the OLD page. That is why this is a script you run rather than a
# workflow on push: the one thing that has to be true is the one a push cannot guarantee.
#
# It refuses to submit a URL that is not already serving 200, so running it too early fails loudly
# instead of quietly telling Bing to re-read stale content.
#
# ⚠️ The key is PUBLIC by design — IndexNow verifies ownership by fetching it from the host itself.
# It lives at public/<key>.txt in BOTH repos, because verification is per-host: radlor.com's file
# does not vouch for adaptivelearn.radlor.com.
set -euo pipefail

KEY=0368a934f2ef49baadff2a85a949d937
HOST="${1:?usage: indexnow.sh <host> [path...]}"
shift || true

# ⚠️ No `mapfile` — macOS ships bash 3.2 and it is a bash 4 builtin, so the script would die on
# the maintainer's own machine. while-read is portable.
URLS=()
if [ $# -gt 0 ]; then
  for p in "$@"; do URLS+=("https://$HOST$p"); done
else
  while IFS= read -r u; do [ -n "$u" ] && URLS+=("$u"); done < <(
    curl -fsS "https://$HOST/sitemap.xml" | grep -o '<loc>[^<]*' | sed 's|<loc>||')
fi
[ ${#URLS[@]} -gt 0 ] || { echo "no URLs found"; exit 1; }

# The key file must be live, or IndexNow rejects the whole batch with 403.
curl -fsS "https://$HOST/$KEY.txt" | grep -qx "$KEY" \
  || { echo "❌ https://$HOST/$KEY.txt is not serving the key — deploy first"; exit 1; }

# And every URL must be live, for the reason in the header.
for u in "${URLS[@]}"; do
  code=$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$u")
  [ "$code" = "200" ] || { echo "❌ $u → $code (not live; refusing to submit)"; exit 1; }
  echo "  ok  $u"
done

BODY=$(printf '%s\n' "${URLS[@]}" | python3 -c "
import json,sys
u=[l.strip() for l in sys.stdin if l.strip()]
print(json.dumps({'host':'$HOST','key':'$KEY',
                  'keyLocation':'https://$HOST/$KEY.txt','urlList':u}))")

echo "submitting ${#URLS[@]} URLs for $HOST…"
code=$(curl -s -o /tmp/indexnow.out -w '%{http_code}' -X POST 'https://api.indexnow.org/IndexNow' \
  -H 'Content-Type: application/json; charset=utf-8' -d "$BODY")
# 200 = accepted, 202 = accepted but key still being validated. Anything else is a real failure.
case "$code" in
  200|202) echo "✅ IndexNow accepted ($code)" ;;
  *)       echo "❌ IndexNow returned $code"; cat /tmp/indexnow.out; exit 1 ;;
esac
