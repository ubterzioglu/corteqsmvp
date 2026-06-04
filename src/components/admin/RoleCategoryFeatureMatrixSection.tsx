import { Badge } from "@/components/ui/badge";

type MatrixLevel = "Temel" | "Secimli" | "Operasyonel" | "Yok";

type MatrixRow = {
  category: string;
  featureFamily: string;
  cells: {
    bireysel: MatrixLevel;
    danisman: MatrixLevel;
    isletme: MatrixLevel;
    kurulus: MatrixLevel;
    icerik: MatrixLevel;
    sehir: MatrixLevel;
  };
  note: string;
};

const MATRIX_BADGE_CLASSNAME: Record<MatrixLevel, string> = {
  Temel: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Secimli: "border-amber-200 bg-amber-50 text-amber-700",
  Operasyonel: "border-sky-200 bg-sky-50 text-sky-700",
  Yok: "border-slate-200 bg-slate-100 text-slate-500",
};

const MATRIX_LABEL: Record<MatrixLevel, string> = {
  Temel: "Temel",
  Secimli: "Secimli",
  Operasyonel: "Operasyonel",
  Yok: "Yok",
};

const matrixRows: MatrixRow[] = [
  {
    category: "Legacy bireysel profili",
    featureFamily: "individual.*",
    cells: {
      bireysel: "Temel",
      danisman: "Yok",
      isletme: "Yok",
      kurulus: "Yok",
      icerik: "Yok",
      sehir: "Yok",
    },
    note: "Bu aile teknik olarak bireysel role scope'ludur; diger rollerde acik gorunse bile anlamli calismaz.",
  },
  {
    category: "Profil yonetimi",
    featureFamily: "profile.*",
    cells: {
      bireysel: "Temel",
      danisman: "Temel",
      isletme: "Temel",
      kurulus: "Temel",
      icerik: "Temel",
      sehir: "Temel",
    },
    note: "Kendi profiline bakma, duzenleme ve kart alanlari neredeyse tum rollerde temel ihtiyactir.",
  },
  {
    category: "Directory gorunurlugu",
    featureFamily: "directory.*",
    cells: {
      bireysel: "Secimli",
      danisman: "Temel",
      isletme: "Temel",
      kurulus: "Temel",
      icerik: "Temel",
      sehir: "Temel",
    },
    note: "Bireyselde daha kontrollu acilir; uzmanlik veya temsil gucu olan rollerde daha sik kullanilir.",
  },
  {
    category: "Iletisim ve erisim",
    featureFamily: "contact.*",
    cells: {
      bireysel: "Secimli",
      danisman: "Temel",
      isletme: "Temel",
      kurulus: "Temel",
      icerik: "Secimli",
      sehir: "Temel",
    },
    note: "Iletisim talebi alma ve WhatsApp gosterme kararinda mahremiyet etkisi oldugu icin rol kadar kullanici niyeti de onemlidir.",
  },
  {
    category: "Icerik uretimi",
    featureFamily: "content.*",
    cells: {
      bireysel: "Secimli",
      danisman: "Secimli",
      isletme: "Secimli",
      kurulus: "Secimli",
      icerik: "Temel",
      sehir: "Operasyonel",
    },
    note: "Icerik ureticilerinde temel, diger rollerde ise topluluk stratejisine gore acilan bir alandir.",
  },
  {
    category: "Uretim aksiyonlari",
    featureFamily: "events.create / offers.create / referral.create",
    cells: {
      bireysel: "Secimli",
      danisman: "Secimli",
      isletme: "Secimli",
      kurulus: "Secimli",
      icerik: "Temel",
      sehir: "Temel",
    },
    note: "Bu satirlar olusturma yetkisi verdigi icin operasyon yukunu da birlikte getirir; varsayimla degil ihtiyaca gore acilmalidir.",
  },
  {
    category: "Platform erisimi",
    featureFamily: "cadde.access",
    cells: {
      bireysel: "Temel",
      danisman: "Temel",
      isletme: "Temel",
      kurulus: "Temel",
      icerik: "Temel",
      sehir: "Temel",
    },
    note: "Cadde erisimi bugun genis kullanima uygun dusunulur; yine de canli durum icin matrix ekranindaki global toggle kontrol edilmelidir.",
  },
  {
    category: "Yerel operasyon",
    featureFamily: "city.manage / whatsapp_landing.edit_assigned",
    cells: {
      bireysel: "Yok",
      danisman: "Operasyonel",
      isletme: "Operasyonel",
      kurulus: "Operasyonel",
      icerik: "Operasyonel",
      sehir: "Temel",
    },
    note: "Bu alanlar sorumluluk bazlidir; rolden cok gorev alan kisiye acilmasi gerekir.",
  },
  {
    category: "Sistem guvenligi",
    featureFamily: "admin.requires_approval",
    cells: {
      bireysel: "Secimli",
      danisman: "Secimli",
      isletme: "Secimli",
      kurulus: "Secimli",
      icerik: "Secimli",
      sehir: "Secimli",
    },
    note: "Bu feature bir avantaj degil, kontrollu akis anlamina gelir; riskli veya manuel denetim isteyen durumlarda devreye alinir.",
  },
];

const decisionRows = [
  {
    need: "Bir roldeki herkes ayni sekilde etkilenecek",
    screen: "/admin/new-member/roles-features",
    detail: "Rol sutunundaki switch'i degistir.",
  },
  {
    need: "Tek bir kullaniciya istisna verilecek",
    screen: "/admin/new-member/overrides",
    detail: "Matrixi bozma; user override kullan.",
  },
  {
    need: "Feature herkeste calismasin",
    screen: "/admin/new-member/roles-features",
    detail: "Once global toggle'i kapat.",
  },
  {
    need: "Sorun rol degil profil parcasi veya alan gorunurlugu",
    screen: "/admin/new-member/profile-sections veya ilgili ayar ekrani",
    detail: "Feature matrix yerine dogru modulu ac.",
  },
];

const RoleCategoryFeatureMatrixSection = () => {
  return (
    <div data-section="matris" className="scroll-mt-4 mb-10">
      <h2 className="mb-4 text-xl font-bold text-blue-600">🧭 Rol · Kategori · Feature Matrisi</h2>
      <p className="mb-4">
        Bu tablo canli veritabaninin bire bir dump'i degil; adminin rol, kategori ve feature iliskisini hizli okumasini
        saglayan karar matrisi. Canli acik-kapali durum icin her zaman <span className="rounded bg-gray-100 px-2 py-1">/admin/new-member/roles-features</span> ekranindaki
        switch'lere bak.
      </p>

      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="mb-1 text-sm font-semibold text-emerald-800">Temel</p>
          <p className="text-xs text-emerald-700">Rolun cogu senaryoda bu aileye ihtiyaci vardir.</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="mb-1 text-sm font-semibold text-amber-800">Secimli</p>
          <p className="text-xs text-amber-700">Urun stratejisine, operasyon kararina veya kullanici istegine gore acilir.</p>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
          <p className="mb-1 text-sm font-semibold text-sky-800">Operasyonel</p>
          <p className="text-xs text-sky-700">Ancak gorevli veya sorumluluk tasiyan hesaplarda anlamlidir.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-100 p-3">
          <p className="mb-1 text-sm font-semibold text-slate-700">Yok</p>
          <p className="text-xs text-slate-600">Teknik scope veya urun mantigi geregi bu role uygulanmaz.</p>
        </div>
      </div>

      <div className="mb-5 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[1120px] border-collapse text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="p-3 text-left">Kategori</th>
              <th className="p-3 text-left">Feature ailesi</th>
              <th className="p-3 text-left">Bireysel</th>
              <th className="p-3 text-left">Danisman</th>
              <th className="p-3 text-left">Isletme</th>
              <th className="p-3 text-left">Kurulus / Dernek</th>
              <th className="p-3 text-left">Icerik Ureticisi</th>
              <th className="p-3 text-left">Sehir Elcisi</th>
              <th className="p-3 text-left">Admin notu</th>
            </tr>
          </thead>
          <tbody>
            {matrixRows.map((row, index) => (
              <tr key={row.featureFamily} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="p-3 align-top font-medium text-slate-900">{row.category}</td>
                <td className="p-3 align-top font-mono text-xs text-slate-700">{row.featureFamily}</td>
                <td className="p-3 align-top"><Badge variant="outline" className={MATRIX_BADGE_CLASSNAME[row.cells.bireysel]}>{MATRIX_LABEL[row.cells.bireysel]}</Badge></td>
                <td className="p-3 align-top"><Badge variant="outline" className={MATRIX_BADGE_CLASSNAME[row.cells.danisman]}>{MATRIX_LABEL[row.cells.danisman]}</Badge></td>
                <td className="p-3 align-top"><Badge variant="outline" className={MATRIX_BADGE_CLASSNAME[row.cells.isletme]}>{MATRIX_LABEL[row.cells.isletme]}</Badge></td>
                <td className="p-3 align-top"><Badge variant="outline" className={MATRIX_BADGE_CLASSNAME[row.cells.kurulus]}>{MATRIX_LABEL[row.cells.kurulus]}</Badge></td>
                <td className="p-3 align-top"><Badge variant="outline" className={MATRIX_BADGE_CLASSNAME[row.cells.icerik]}>{MATRIX_LABEL[row.cells.icerik]}</Badge></td>
                <td className="p-3 align-top"><Badge variant="outline" className={MATRIX_BADGE_CLASSNAME[row.cells.sehir]}>{MATRIX_LABEL[row.cells.sehir]}</Badge></td>
                <td className="p-3 align-top text-xs leading-5 text-slate-600">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="mb-2 text-sm font-semibold text-blue-800">Matrisi nasil okumalisin?</p>
        <ul className="mb-0 list-disc space-y-1 pl-5 text-sm text-blue-900">
          <li><strong>Temel</strong> goruyorsan o rol icin feature ailesi genelde beklenen davranistir.</li>
          <li><strong>Secimli</strong> goruyorsan karar urun stratejisi, gizlilik ve operasyon dengesiyle verilmelidir.</li>
          <li><strong>Operasyonel</strong> goruyorsan feature'i rolden cok gorev alan kisiye acmayi dusun.</li>
          <li><strong>Yok</strong> goruyorsan teknik scope veya urun mantigi nedeniyle baska ekranda cozum aramalisin.</li>
        </ul>
      </div>

      <h3 className="mb-3 text-lg font-semibold text-purple-600">Hangi degisiklik hangi ekranda yapilir?</h3>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Ihtiyac</th>
              <th className="p-3 text-left">Gidilecek ekran</th>
              <th className="p-3 text-left">Ne yapilacak</th>
            </tr>
          </thead>
          <tbody>
            {decisionRows.map((row, index) => (
              <tr key={row.need} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="p-3 align-top text-slate-800">{row.need}</td>
                <td className="p-3 align-top font-mono text-xs text-slate-700">{row.screen}</td>
                <td className="p-3 align-top text-slate-600">{row.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleCategoryFeatureMatrixSection;
