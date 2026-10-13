// scripts/env-config-order.mjs
// `/env-config.js` (window.__APP_CONFIG__) TÜM modül script'lerinden ÖNCE çalışmalıdır:
// src/integrations/supabase/client.ts onu modül değerlendirmesinde okur. Geç kalırsa
// istemci `placeholder.supabase.co` ile kurulur ve canlıda giriş + tüm veri çağrıları düşer.
//
// Tuzak (Lighthouse turu 2026-10-13, inceleme ajanı yakaladı): Vite modül script'lerini
// derlenen HTML'de <head>'in SONUNA taşır. Kaynakta <body>'de `main.tsx`'ten önce duran
// `defer`'li env-config, çıktıda bütün modüllerden SONRA kalıyordu — kaynak dosyaya bakan
// her göz bunu doğru sanar. Bu yüzden denetim DERLENMİŞ HTML üzerinde yapılır.
//
// Kural: env-config etiketi ilk modül script'inden önce gelmeli. `async` YASAK (sıra
// garantisi yok). `defer` ancak bu sırayla güvenlidir (defer + module belge sırasıyla çalışır).

const ENV_CONFIG_TAG = /<script\b[^>]*\bsrc="\/env-config\.js"[^>]*>/i;
const MODULE_SCRIPT_TAG = /<script\b[^>]*\btype="module"[^>]*>/i;

/**
 * @param {string} html derlenmiş index.html
 * @returns {string | null} sorun varsa açıklama, yoksa null
 */
export function findEnvConfigOrderProblem(html) {
  const envMatch = ENV_CONFIG_TAG.exec(html);
  if (!envMatch) return "index.html içinde /env-config.js script etiketi yok.";
  if (/\basync\b/i.test(envMatch[0])) return "/env-config.js `async` yüklenemez: modüllerden önce çalışma garantisi kalkar.";

  const moduleMatch = MODULE_SCRIPT_TAG.exec(html);
  if (moduleMatch && moduleMatch.index < envMatch.index) {
    return "/env-config.js ilk modül script'inden SONRA geliyor; window.__APP_CONFIG__ supabase istemcisi kurulurken boş olur.";
  }
  return null;
}

/** Build anında denetler; sorun varsa build DÜŞER. @returns {import("vite").Plugin} */
export function envConfigOrderPlugin({ htmlPath = "/index.html" } = {}) {
  return {
    name: "env-config-order",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (ctx.path !== htmlPath) return html;
        const problem = findEnvConfigOrderProblem(html);
        if (problem) throw new Error(`[env-config-order] ${problem}`);
        return html;
      },
    },
  };
}
