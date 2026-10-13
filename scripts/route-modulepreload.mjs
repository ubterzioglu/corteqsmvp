// scripts/route-modulepreload.mjs
// Ana sayfa parçasını (LandingTrialPage) index.html'de `modulepreload` ile önceden yükler
// (vite.config.ts → transformIndexHtml).
//
// Neden (Lighthouse mobil 2026-10-13): `/` rotası tembel yüklenir; parça ancak `main`
// indirilip çalıştıktan sonra isteniyordu (ikinci dalga, ~276 ms). Simülasyonda LCP'yi
// bu zincir tutuyordu. Parça adı hash'li olduğu için elle yazılamaz; adı build üretir.
//
// Bedel: index.html TÜM rotaların kabuğudur — başka sayfaya gelen ziyaretçi de bu
// parçaları önceden indirir (~20–25 KB gzip). Trafiğin çoğu `/`'a geldiği için bilinçli.
//
// Parça bulunamazsa build DÜŞER: sessizce preload'suz çıkmak, kazancın fark edilmeden
// kaybolması demektir.

/**
 * @param {Record<string, any>} bundle Rollup/Rolldown çıktı paketi
 * @param {string} moduleSuffix Kaynak dosyanın yol soneki (ör. "src/pages/LandingTrialPage.tsx")
 * @returns {string[]} parça + statik bağımlılıklarının dosya adları (tekrarsız, sırayla)
 */
export function findRouteChunkFiles(bundle, moduleSuffix) {
  const suffix = moduleSuffix.replace(/\\/g, "/");
  const entry = Object.values(bundle).find(
    (output) =>
      output?.type === "chunk" &&
      typeof output.facadeModuleId === "string" &&
      output.facadeModuleId.replace(/\\/g, "/").endsWith(suffix),
  );
  if (!entry) return [];

  // Statik import'lar ÖZYİNELEMELİ toplanır: yalnız doğrudan import'ları önceden yüklemek,
  // derindeki parçaları (geo, accordion, marquee …) üçüncü bir dalgaya bırakır. Dinamik
  // import'lar (`dynamicImports`) bilerek dışarıda — onlar ilk çizim için gerekmez.
  // Çoğu zaten main ile birlikte index.html'de yüklenir; tekrarları çağıran eler.
  const files = new Set();
  const visit = (fileName) => {
    if (files.has(fileName)) return;
    files.add(fileName);
    for (const dependency of bundle[fileName]?.imports ?? []) visit(dependency);
  };
  visit(entry.fileName);
  return [...files];
}

/**
 * @param {{ moduleSuffix: string, htmlPath?: string }} options
 * @returns {import("vite").Plugin}
 */
export function routeModulePreloadPlugin({ moduleSuffix, htmlPath = "/index.html" }) {
  return {
    name: "route-modulepreload",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (ctx.path !== htmlPath || !ctx.bundle) return html;

        const files = findRouteChunkFiles(ctx.bundle, moduleSuffix);
        if (files.length === 0) {
          throw new Error(`[route-modulepreload] "${moduleSuffix}" parçası pakette bulunamadı.`);
        }

        const missing = files.filter((file) => !html.includes(`/${file}"`));
        return missing.map((file) => ({
          tag: "link",
          attrs: { rel: "modulepreload", crossorigin: true, href: `/${file}` },
          injectTo: "head",
        }));
      },
    },
  };
}
