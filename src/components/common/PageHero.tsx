/**
 * Sayfa hero'su — Etkinlikler, Radar ve Araçlar sayfalarının PAYLAŞTIĞI kabuk.
 *
 * Biçim 2026-09-19'da `EventsHero` için yazıldı; 20 Eylül'de kullanıcı aynı düzenin
 * Radar ve Araçlar'da da olmasını istedi. Üç kopya yerine tek bileşen: bu depoda
 * "aynı şeyin iki yere kopyalanması" sınıfı defalarca sessiz kusur üretti
 * (bkz. CLAUDE.md "Değişmez sözleşmeler" ve events-vocabulary notu).
 *
 * DÜZEN — üç katman, sırası önemli:
 *   1. Görsel: tam genişlik, `object-cover`.
 *   2. Okunabilirlik örtüsü: SOLDAN beyaz → sağa şeffaf. Metin görselin üstünde
 *      durduğu için bu örtü olmadan kontrast garanti edilemez; görseli değiştirirken
 *      örtüyü ZAYIFLATMA.
 *   3. İçerik: sol yarıda konumlanır (`contentWidthClassName`), dikeyde ortalanır.
 *
 * Görselin kendisi DEKORATİFTİR ama boş `alt` verilmez: hero görseli sayfanın ne
 * hakkında olduğunu anlatır, ekran okuyucu kullanıcıdan saklanmamalı.
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface PageHeroTitleLine {
  text: string;
  /** Satıra uygulanacak `bg-[linear-gradient(...)]` sınıfı. */
  gradientClassName: string;
}

export interface PageHeroBadge {
  label: string;
  /** Rozetin kenar + metin rengi. */
  className: string;
}

export interface PageHeroProps {
  icon: LucideIcon;
  /** İkonun vurgu rengi, ör. `text-violet-600`. */
  iconClassName: string;
  /** Başlık satırları — her biri kendi gradyanını taşır. */
  titleLines: PageHeroTitleLine[];
  badges?: PageHeroBadge[];
  /** Başlığın altındaki kalın ifade satırları. */
  lines?: string[];
  /**
   * Satırların tek satırda kalması (md+). Varsayılan `true` — kısa ifade satırları
   * için doğru. UZUN bir cümlede KAPAT: nowrap, metni okunabilirlik örtüsünün
   * bittiği yerin ötesine, görselin kalabalık kısmına taşırır (Araçlar'da yaşandı).
   */
  nowrapLines?: boolean;
  image: { src: string; alt: string };
  /** Kabuğun kenarlığı + zemin gradyanı. */
  shellClassName: string;
  /** Görselin üzerindeki renk tonu (135deg). */
  tintClassName: string;
  /** Görsel yüksekliği — varsayılan Etkinlikler ölçüsü. */
  heightClassName?: string;
  /** Sol içerik kolonunun genişliği. */
  contentWidthClassName?: string;
  /** Satırların altına eklenen serbest içerik (ör. arama kutusu). */
  children?: ReactNode;
}

export function PageHero({
  icon: Icon,
  iconClassName,
  titleLines,
  badges,
  lines,
  image,
  shellClassName,
  tintClassName,
  nowrapLines = true,
  heightClassName = "h-[24rem] md:h-[30rem]",
  contentWidthClassName = "md:w-[52%]",
  children,
}: PageHeroProps) {
  return (
    <section className={`relative overflow-hidden rounded-[1.75rem] shadow-[0_24px_80px_rgba(15,23,42,0.08)] ${shellClassName}`}>
      <div className={`absolute inset-0 ${tintClassName}`} aria-hidden="true" />
      <div className="relative">
        <img src={image.src} alt={image.alt} className={`w-full object-cover ${heightClassName}`} />
        {/* Okunabilirlik örtüsü — metnin durduğu sol taraf süt beyaza yaklaşır. */}
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.92)_22%,rgba(255,255,255,0.72)_40%,rgba(255,255,255,0.34)_58%,rgba(255,255,255,0.08)_72%,rgba(255,255,255,0)_82%)]"
          aria-hidden="true"
        />
        <div className={`absolute inset-y-0 left-0 flex w-full items-center p-6 md:p-10 ${contentWidthClassName}`}>
          <div className="w-full max-w-full text-slate-950">
            <h1 className="flex items-start gap-3 text-[1.9rem] font-black tracking-tight md:text-[3rem]">
              <Icon className={`mt-1 h-7 w-7 shrink-0 md:h-9 md:w-9 ${iconClassName}`} aria-hidden="true" />
              <span className="flex flex-col leading-[0.95]">
                {titleLines.map((line) => (
                  <span
                    key={line.text}
                    className={`bg-clip-text text-transparent drop-shadow-[0_3px_14px_rgba(255,255,255,0.52)] ${line.gradientClassName}`}
                  >
                    {line.text}
                  </span>
                ))}
              </span>
            </h1>

            {badges && badges.length > 0 && (
              <div className="mt-4 flex max-w-[28rem] flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge.label}
                    className={`inline-flex h-9 items-center justify-center rounded-full border bg-white/88 px-4 text-center text-sm font-semibold shadow-sm backdrop-blur-sm ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            )}

            {lines && lines.length > 0 && (
              <div className="mt-5 space-y-2">
                {lines.map((line, index) => (
                  <p
                    key={line}
                    className={`text-[1.05rem] md:text-[1.22rem] ${
                      nowrapLines ? "md:whitespace-nowrap" : ""
                    } ${index === 0 ? "font-semibold text-slate-900" : "font-bold text-slate-950"}`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}

            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default PageHero;
