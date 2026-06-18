/**
 * "Diasporada Ara" — aksiyon-odaklı arama hero'su (eski WorldAtlasMap'in yerine).
 *
 * Google sadeliğinde: büyük başlık + kocaman arama çubuğu + dönen örnek aramalar +
 * CANLI istatistik şeridi (catalog_items kayıt sayısı + geo ülke sayısı, gerçek veriden).
 * Arama gönderildiğinde /directory?q=... adresine gider; oradaki sayfa giriş kapısını
 * (login gate) zaten kendi yönetir, bu yüzden giriş yapmamış kullanıcı da güvenle yönlenir.
 *
 * Sayaçlar gerçek veriden gelir ama yüklenene kadar (veya hata) sade düşer — yanıltıcı
 * "0" göstermek yerine etiket gizlenir.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";

import { getTotalDirectoryCount } from "@/lib/catalog-directory";
import { useGeoCountries } from "@/hooks/useGeo";

// Arama çubuğunda sırayla beliren örnek aramalar (placeholder döngüsü).
const EXAMPLE_QUERIES: readonly string[] = [
  "Berlin'de yazılımcı",
  "Londra'da avukat",
  "Dubai'de doktor",
  "Toronto'da girişimci",
  "Paris'te tasarımcı",
  "Münih'te mühendis",
];

// Tıklanabilir hızlı örnekler — placeholder'dan bağımsız, kullanıcıyı aksiyona iter.
const QUICK_CHIPS: readonly string[] = [
  "yazılımcı",
  "avukat",
  "doktor",
  "girişimci",
  "akademisyen",
];

const PLACEHOLDER_INTERVAL_MS = 2600;

const DiasporaSearchSection = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const countriesQuery = useGeoCountries();
  const countryCount = countriesQuery.data?.length ?? null;

  // Gerçek kayıt sayısını çek — hata/0 durumunda etiket gizlenir.
  useEffect(() => {
    let isMounted = true;
    void getTotalDirectoryCount().then((count) => {
      if (isMounted) setTotalCount(count);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Placeholder örneklerini döndür — kullanıcı yazmaya başlayınca döngü durur.
  useEffect(() => {
    if (query.trim()) return;
    const timer = window.setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % EXAMPLE_QUERIES.length);
    }, PLACEHOLDER_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [query]);

  const goToDirectory = (text: string) => {
    const trimmed = text.trim();
    const target = trimmed
      ? `/directory?q=${encodeURIComponent(trimmed)}`
      : "/directory";
    navigate(target);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    goToDirectory(query);
  };

  return (
    <section
      id="landingtrial-atlas"
      className="relative mx-auto max-w-5xl px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/70 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-glow-teal"
            aria-hidden="true"
          />
          Diasporada ara
        </span>

        <h2 className="mt-6 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
          Aradığın Türk profesyoneli
          <br />
          <span className="text-gradient-logo">tek aramada</span> bul
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Şehir, meslek ya da isim — 80+ kategoride dünyaya yayılmış diaspora
          ağında ara, bağlan, keşfet.
        </p>
      </div>

      {/* Dev arama çubuğu — formu submit edince /directory'ye gider. */}
      <form
        onSubmit={handleSubmit}
        role="search"
        className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-full border border-slate-900/10 bg-white/80 p-2 pl-5 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur transition-shadow focus-within:shadow-[0_28px_70px_-28px_hsl(var(--glow-teal)/0.5)]"
      >
        <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Örn. ${EXAMPLE_QUERIES[exampleIndex]}…`}
          aria-label="Diasporada ara"
          className="min-w-0 flex-1 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          className="group inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00ACC1] to-[#0097A7] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_-12px_hsl(var(--glow-teal)/0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-teal sm:px-6"
        >
          <span className="hidden sm:inline">Ara</span>
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </form>

      {/* Tıklanabilir hızlı örnekler. */}
      <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Popüler:
        </span>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => goToDirectory(chip)}
            className="rounded-full border border-slate-900/10 bg-white/60 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur transition-colors hover:border-glow-teal/40 hover:text-slate-900"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Canlı istatistik şeridi — gerçek veriden. */}
      <ul className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-12 gap-y-6">
        {totalCount && totalCount > 0 ? (
          <li className="text-center">
            <div className="font-display text-3xl font-bold text-glow-teal sm:text-4xl">
              {totalCount.toLocaleString("tr-TR")}+
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              kayıtlı profil
            </div>
          </li>
        ) : null}
        {countryCount && countryCount > 0 ? (
          <li className="text-center">
            <div className="font-display text-3xl font-bold text-glow-teal sm:text-4xl">
              {countryCount.toLocaleString("tr-TR")}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">ülke</div>
          </li>
        ) : null}
        <li className="text-center">
          <div className="font-display text-3xl font-bold text-glow-teal sm:text-4xl">
            80+
          </div>
          <div className="mt-1 text-sm text-muted-foreground">kategori</div>
        </li>
        <li className="text-center">
          <div className="font-display text-3xl font-bold text-glow-teal sm:text-4xl">
            7/24
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            yaşayan ağ
          </div>
        </li>
      </ul>
    </section>
  );
};

export default DiasporaSearchSection;
