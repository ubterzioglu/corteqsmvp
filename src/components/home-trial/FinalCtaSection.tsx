/**
 * 7. Final CTA — tek, yüksek-niyetli çağrı. Footer (PublicLayout) hemen altında gelir.
 */

import { HomeActionStack } from "./HomeActionStack";
import { ACTION_ROW_ONE, ACTION_ROW_TWO } from "./action-buttons-data";

// Kapanış kartı da hero gibi TAM İKİ SATIR, 5 + 5 (kullanıcı kararı, 2026-09-20).
// Eskiden birinci satırın ilk düğmesi ayrışıyordu (hero "Ağa Katıl", burada
// "Ücretsiz Kayıt Ol"); 20 Eylül'de etiketler eşitlendi ve iki satır da artık
// action-buttons-data.ts'ten PAYLAŞILIYOR — tek fark hizalama (burada ortalı).

const FinalCtaSection = () => {
  return (
    // max-w-4xl → max-w-5xl: beş düğmelik satır 840px ister, eski genişlikte
    // kart içi yalnız ~752px kalıyordu ve şerit 4/4/2 diye üç satıra bölünüyordu.
    <section className="relative mx-auto max-w-5xl px-6 pb-28 pt-12 text-center">
      <div className="glass-tech relative overflow-hidden rounded-3xl px-6 py-16 sm:px-12 sm:py-20">
        {/* İnce çok renkli logo şeridi — kartın üst kenarında (kapanışta marka imzası). */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--glow-teal)), hsl(var(--brand-blue)), hsl(var(--brand-indigo)), hsl(var(--brand-pink)), hsl(var(--glow-orange)), hsl(var(--brand-yellow)))",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(50% 80% at 50% 0%, hsl(var(--glow-orange) / 0.12), transparent 70%)",
          }}
        />
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-4xl">
            Yurt dışındaki hayatı
            <br className="hidden sm:block" /> şekillendiren sisteme katıl
          </h2>
          {/* Tek satır: md+ ekranda sarma kapatılır (kart 4xl, cümle ~620px — rahat sığar).
              Dar ekranda nowrap yatay taşma yapardı, bu yüzden yalnız md'den itibaren. */}
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg md:whitespace-nowrap">
            Ücretsiz kayıt ol, kendi şehrindeki ağını keşfet ve büyümenin parçası ol.
          </p>
          {/* İki satır, her biri 5 düğme — hero ile AYNI ölçüde, ortalı hizalı
              (hero'da sola dayalıdır). İkinci satır hero ile PAYLAŞILIR.
              Mobilde ilk üçü açık, kalanlar aç/kapa arkasında (HomeActionStack). */}
          <HomeActionStack
            rowOne={ACTION_ROW_ONE}
            rowTwo={ACTION_ROW_TWO}
            rowOneLabel="Kayıt eylemleri"
            rowTwoLabel="Hızlı erişim (kapanış)"
            align="center"
            topSpacingClassName="mt-9"
          />
        </div>
      </div>
    </section>
  );
};

export default FinalCtaSection;
