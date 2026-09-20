/**
 * 7. Final CTA — tek, yüksek-niyetli çağrı. Footer (PublicLayout) hemen altında gelir.
 */

import { ActionButtons } from "./ActionButtons";
import { PRIMARY_ACTIONS, QUICK_ACTIONS } from "./action-buttons-data";

const FinalCtaSection = () => {
  return (
    <section className="relative mx-auto max-w-4xl px-6 pb-28 pt-12 text-center">
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
          {/* Birincil eylemler + paylaşılan kısayollar — hero ile AYNI ölçüde,
              ortalı hizalı (hero'da sola dayalıdır). */}
          <ActionButtons buttons={[PRIMARY_ACTIONS.signup, PRIMARY_ACTIONS.tools, PRIMARY_ACTIONS.explore, PRIMARY_ACTIONS.founders]} className="mt-9" align="center" ariaLabel="Kayıt eylemleri" />
          <ActionButtons buttons={QUICK_ACTIONS} className="mt-2.5" align="center" originPath="/" ariaLabel="Hızlı erişim (kapanış)" />
        </div>
      </div>
    </section>
  );
};

export default FinalCtaSection;
