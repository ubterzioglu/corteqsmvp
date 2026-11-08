// Kaynak metni okuyan sözleşme testleri için yorum ayıklayıcı.
//
// Düz metin araması yorumlanmış satırı da "var" sayar: `// <Route path="/x" ...>`
// hâlâ `path="/x"` içerir, test rota silindiği hâlde yeşil kalır. Bu yardımcı
// önce JSX yorumlarını (`{/* … */}`), sonra blok yorumlarını, en son satır
// başındaki `//` yorumlarını siler. Satır içi `//` (ör. "https://") dokunulmaz.

export function stripSourceComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");
}
