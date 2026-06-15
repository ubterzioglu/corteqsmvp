#!/bin/sh
set -eu

escaped_rag_api_secret=$(
  printf '%s' "${RAG_API_SECRET:-}" | sed -e 's/[|&\\]/\\&/g' -e 's/[$]/$$/g'
)

sed -i "s|__RAG_API_SECRET__|$escaped_rag_api_secret|g" /etc/nginx/conf.d/default.conf

# Prerender (SEO/GEO): PRERENDER_URL boşsa map değeri "0" kalır → prerender no-op
# (bot istekleri normal SPA kabuğu alır). Doluysa o URL'e proxy yapılır.
prerender_url="${PRERENDER_URL:-}"
if [ -z "$prerender_url" ]; then
  prerender_url="0"
fi
escaped_prerender_url=$(printf '%s' "$prerender_url" | sed -e 's/[|&\\]/\\&/g')
escaped_prerender_host=$(printf '%s' "${PRERENDER_CANONICAL_HOST:-corteqs.net}" | sed -e 's/[|&\\]/\\&/g')

sed -i "s|__PRERENDER_URL__|$escaped_prerender_url|g" /etc/nginx/conf.d/default.conf
sed -i "s|__PRERENDER_CANONICAL_HOST__|$escaped_prerender_host|g" /etc/nginx/conf.d/default.conf

cat <<EOF >/usr/share/nginx/html/env-config.js
window.__APP_CONFIG__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL:-}",
  VITE_SUPABASE_PUBLISHABLE_KEY: "${VITE_SUPABASE_PUBLISHABLE_KEY:-}",
  VITE_SUPABASE_PROJECT_ID: "${VITE_SUPABASE_PROJECT_ID:-}"
};
EOF
