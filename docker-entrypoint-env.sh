#!/bin/sh
set -eu

escaped_rag_api_secret=$(
  printf '%s' "${RAG_API_SECRET:-}" | sed -e 's/[|&\\]/\\&/g' -e 's/[$]/$$/g'
)

sed -i "s|__RAG_API_SECRET__|$escaped_rag_api_secret|g" /etc/nginx/conf.d/default.conf

cat <<EOF >/usr/share/nginx/html/env-config.js
window.__APP_CONFIG__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL:-}",
  VITE_SUPABASE_PUBLISHABLE_KEY: "${VITE_SUPABASE_PUBLISHABLE_KEY:-}",
  VITE_SUPABASE_PROJECT_ID: "${VITE_SUPABASE_PROJECT_ID:-}"
};
EOF
