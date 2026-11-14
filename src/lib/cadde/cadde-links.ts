// Cadde içeriklerindeki hedef adreslerin (billboard cta_url, tanıtım linkleri)
// site içi mi dış bağlantı mı olduğunu ayırt eder.
//
// Site içi olanlar react-router <Link> ile gezinir (tam sayfa yenilenmez); dış
// olanlar yeni sekmede rel="noreferrer noopener" ile açılır. Protokol-göreli
// "//host" adresleri BİLİNÇLİ olarak dış sayılır — "/" ile başladığı için iç
// bağlantı sanılırsa açık yönlendirme yüzeyi oluşur.

export const isInternalCaddeLink = (url: string): boolean => url.startsWith("/") && !url.startsWith("//");
