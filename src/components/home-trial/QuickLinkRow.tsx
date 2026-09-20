/**
 * Ana sayfanın kısayol buton satırı — hero'da ve final CTA kartında AYNI bileşen.
 *
 * NEDEN TEK BİLEŞEN: aynı dört buton iki bölümde görünüyor. İki yere kopyalansaydı
 * renk, boyut ve açıklama metinleri kaçınılmaz olarak ayrışırdı (bu depoda tam olarak
 * bu sınıftan üç ayrı kusur belgelenmiş durumda — bkz. CLAUDE.md "Değişmez sözleşmeler").
 *
 * BOYUT: butonlar GRID ile çizilir, genişlik `w-full`dür. Sabit bir `w-[13rem]` yerine
 * grid kullanmanın sebebi "tek boy tek en" isteğinin metin uzunluğundan BAĞIMSIZ
 * garanti edilmesi: "Radar" ile "Dijital Gruplar" aynı hücre genişliğini alır.
 * `min-h` de sabittir, böylece satır sarması olsa bile yükseklik oynamaz.
 *
 * RENK: üstteki üç birincil buton teal / turuncu / yeşil kullanıyor. Buradaki dördü
 * logonun KALAN kollarından seçildi (mavi · menekşe · pembe · kırmızı) — hepsi beyaz
 * metinle AA üstünde. Böylece yedi butonun hiçbiri bir diğeriyle karışmaz.
 *
 * İPUCU KUTULARI: shadcn Tooltip. Bileşen KENDİ `TooltipProvider`'ını sarar — App.tsx
 * kökünde zaten bir tane var ve Radix iç içe provider'a izin verir, ama bağımlılığı
 * içeride tutmak bileşeni tek başına render edilebilir kılar (aksi halde sağlayıcısız
 * bir ağaçta "must be used within TooltipProvider" ile patlıyordu — testte yaşandı).
 * Radix ipucu fare üzerine gelince VE klavye odağında açılır, yani yalnız fareyle
 * erişilebilir bir bilgi kalmaz. Dokunmatik cihazda ipucu açılmaz; bu yüzden ipuçları
 * tamamlayıcı bilgidir, butonun ne yaptığı etiketin kendisinden anlaşılır.
 */

import { Link } from "react-router-dom";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuickLink {
  to: string;
  label: string;
  /** Fare/odak ipucunda görünen açıklama. */
  hint: string;
  /** Dolu gradyan — `from`/`to` çifti. */
  gradient: string;
  /** Gölge rengi; gradyanın koyu ucuyla aynı aileden. */
  shadow: string;
  /** Geldiği sayfayı `state.from` ile taşı (SiteHeader'daki desen). */
  carryOrigin?: boolean;
}

const QUICK_LINKS: QuickLink[] = [
  {
    to: "/radar",
    label: "Radar",
    hint: "Diaspora gündeminden derlenen haberler ve rehberler. Kaynaklar her gün taranır, ülke ve dile göre süzülür.",
    gradient: "from-[#2B7FD4] to-[#1B63B0]",
    shadow: "rgba(27,99,176,0.55)",
  },
  {
    to: "/addcom",
    label: "Dijital Gruplar",
    hint: "Şehrine ve ilgi alanına göre WhatsApp, Telegram, LinkedIn ve Discord toplulukları. Kendi grubunu da ücretsiz ekleyebilirsin.",
    gradient: "from-[#6D5BD0] to-[#5442B6]",
    shadow: "rgba(84,66,182,0.55)",
  },
  {
    to: "/events",
    label: "Etkinlikler",
    hint: "Yurt dışındaki buluşmalar, atölyeler ve networking akşamları. Kendi etkinliğini duyurmak da ücretsiz.",
    gradient: "from-[#E0559B] to-[#C33C82]",
    shadow: "rgba(195,60,130,0.55)",
  },
  {
    to: "/feedback",
    label: "Geri Bildirim",
    hint: "Eksik bulduğun, takıldığın ya da eklenmesini istediğin ne varsa yaz. Her mesaj okunur ve yanıtlanır.",
    gradient: "from-[#E4574A] to-[#C63A2D]",
    shadow: "rgba(198,58,45,0.55)",
    carryOrigin: true,
  },
];

interface QuickLinkRowProps {
  /** Sarmalayıcıya eklenecek yerleşim sınıfları (hizalama, üst boşluk). */
  className?: string;
  /** `state.from` değeri — Geri Bildirim kaydının `page_path` alanını doldurur. */
  originPath?: string;
}

export function QuickLinkRow({ className, originPath = "/" }: QuickLinkRowProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <nav
        aria-label="Hızlı erişim"
        className={`grid grid-cols-2 gap-2.5 sm:grid-cols-4 ${className ?? ""}`}
      >
      {QUICK_LINKS.map((link) => (
        <Tooltip key={link.to}>
          <TooltipTrigger asChild>
            <Link
              to={link.to}
              state={link.carryOrigin ? { from: originPath } : undefined}
              className={`inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-gradient-to-r ${link.gradient} px-3 text-center text-sm font-semibold leading-tight text-white transition-all duration-300 hover:-translate-y-0.5`}
              style={{ boxShadow: `0 16px 34px -12px ${link.shadow}` }}
            >
              {link.label}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[17rem] text-left leading-snug">
            {link.hint}
          </TooltipContent>
        </Tooltip>
      ))}
      </nav>
    </TooltipProvider>
  );
}

export default QuickLinkRow;
