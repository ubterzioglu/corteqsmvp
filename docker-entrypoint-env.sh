#!/bin/sh
set -eu

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

# Yatırımcı sayfası parola doğrulayıcısı (pbkdf2:<iter>:<tuz>:<özet>). Değer bir JS
# dizgesine gömüldüğü için YALNIZ izinli karakterler geçer; tırnak/yeni satır/</script>
# taşıyan hatalı bir değer env-config.js'i (ve tüm sitenin Supabase ayarını) bozamaz.
# Biçim dışı değer boşaltılır → sayfa "yapılandırılmamış" der (kapalı kalır).
investor_hash=$(printf '%s' "${INVESTOR_PASS_HASH:-}" | tr 'A-F' 'a-f')
case "$investor_hash" in
  pbkdf2:*) ;;
  *) investor_hash="" ;;
esac
case "$investor_hash" in
  *[!0-9a-f:pbkd]*) investor_hash="" ;;
esac

cat <<EOF >/usr/share/nginx/html/env-config.js
window.__APP_CONFIG__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL:-}",
  VITE_SUPABASE_PUBLISHABLE_KEY: "${VITE_SUPABASE_PUBLISHABLE_KEY:-}",
  VITE_SUPABASE_PROJECT_ID: "${VITE_SUPABASE_PROJECT_ID:-}",
  INVESTOR_PASS_HASH: "${investor_hash}"
};
EOF
