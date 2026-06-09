#!/usr/bin/env bash
# Sequential prod push via Management API — FILE-BASED body (avoids arg-list-too-long
# for large migrations like 010c). Resumable: skips versions already recorded.
# STOPS on first error. Never prints the token.
set -euo pipefail

REF="injprdrsklkxgnaiixzh"
TOKEN="$(head -1 .secretdb | tr -d '[:space:]')"
API="https://api.supabase.com/v1/projects/$REF/database/query"
TMPBODY="$(mktemp)"
trap 'rm -f "$TMPBODY"' EXIT

# versions already on remote (skip these)
DONE_VERSIONS="$1"   # comma-separated list passed in

is_done() { echo "$DONE_VERSIONS" | grep -q "$1"; }

for f in $(ls supabase/migrations/2026060910*.sql | sort); do
  base=$(basename "$f" .sql)
  version="${base%%_*}"
  name="${base#*_}"
  if is_done "$version"; then echo "--- skip $version (already applied)"; continue; fi
  echo ">>> applying $version ($name)"
  # write JSON body to file (no shell arg-length limit)
  python3 -c 'import json,sys; open(sys.argv[2],"w",encoding="utf-8").write(json.dumps({"query": open(sys.argv[1],encoding="utf-8").read()}))' "$f" "$TMPBODY"
  resp=$(curl -s -X POST "$API" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data-binary "@$TMPBODY")
  if echo "$resp" | grep -qiE '"message".*([Ee]rror|does not exist|already exists|violates|FATAL)|ERROR:'; then
    echo "!!! FAILED at $version"
    echo "$resp" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("message", d) if isinstance(d,dict) else d)' 2>/dev/null || echo "$resp"
    exit 1
  fi
  # record
  rec="insert into supabase_migrations.schema_migrations(version,name) values('$version','$name') on conflict (version) do nothing;"
  python3 -c 'import json,sys; open(sys.argv[2],"w",encoding="utf-8").write(json.dumps({"query": sys.argv[1]}))' "$rec" "$TMPBODY"
  curl -s -X POST "$API" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data-binary "@$TMPBODY" >/dev/null
  echo "    ok"
done
echo "=== REMAINING REBUILD MIGRATIONS APPLIED ==="
