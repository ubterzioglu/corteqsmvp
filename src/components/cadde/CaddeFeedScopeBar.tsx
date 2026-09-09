// Feed kapsam çip barı + aktif hashtag çipi.
//
// Workshop m15 (30 Tem): "Takip Ettiklerim yakında" ve "İş Fırsatları yakında" çipleri
// İPTAL — kaldırıldı (RPC scope parametresi tip olarak durur, UI'dan seçilemez).
// Workshop m14: kalan çiplere ne işe yaradığını anlatan kısa açıklama — title/tooltip +
// aktif kapsamın açıklaması barın altında satır olarak.
// Workshop m88 (4 Ağu): disabled "Yakınımda" çipi bu şeritten KALKTI — çalışmayan
// fonksiyonlar artık tek ortak alanda toplanıyor (CaddeComingSoon). Kapsam anahtarı
// 'nearby' tipte ve RPC parametresinde DURUR (m15 deseni), yalnız UI'dan seçilemez.
// Buraya bir daha disabled/"Yakında" çip EKLEME; yeni satır CaddeComingSoon'a gider.
//
// 2026-08-04 (kullanıcı kararı): "Etkinlikler" çipi KALDIRILDI — m14'ün koru listesinde
// olmasına rağmen. Gerekçe: composer'daki Etkinlik çipi m6'da kalkınca kullanıcı artık
// etkinlik tipi post ÜRETEMİYOR; üretilemeyen bir tipi süzen filtre, hemen üstündeki sade
// paylaşım kutusuyla çelişip gereksiz karmaşa yaratıyordu. m15 deseni izlendi: 'events'
// CaddeFeedScope tipinde ve RPC parametresinde DURUR, yalnız UI'dan seçilemez.
// Faz 2'de cafe etkinlikleri gelirse çip tek satırla geri açılır.

import type { ReactNode } from "react";

import { X } from "lucide-react";

import CaddeLocalClock from "@/components/cadde/CaddeLocalClock";
import { Badge } from "@/components/ui/badge";
import type { CaddeClockTarget } from "@/lib/cadde-local-clock";
import type { CaddeFeedScope } from "@/lib/cadde-types";

type ScopeOption = {
  key: CaddeFeedScope;
  label: string;
  /** m14: çipin ne yaptığını söyleyen tek cümle (tooltip + aktifken bar altı satırı). */
  description: string;
  /** Faz 2'ye bırakılanlar: RPC 'all' gibi davranır, bu yüzden tıklanamaz. */
  comingSoon?: boolean;
};

const SCOPES: readonly ScopeOption[] = [
  { key: "all", label: "Tümü", description: "Filtrene uyan bütün paylaşımlar." },
  { key: "city", label: "Şehrim", description: "Yalnız senin şehrinden paylaşımlar." },
  { key: "country", label: "Ülkem", description: "Yalnız yaşadığın ülkeden paylaşımlar." },
  { key: "cafes", label: "Cafelerim", description: "Üyesi olduğun cafe'lerin paylaşımları." },
];

export interface CaddeFeedScopeBarProps {
  scope: CaddeFeedScope;
  hashtag: string;
  onScopeChange: (scope: CaddeFeedScope) => void;
  onClearHashtag: () => void;
  /**
   * Workshop m133: kapsam çiplerinin sağ ucundaki yerel saat. Çözülemezse `null` gelir
   * ve rozet hiç çizilmez — "yakında" tarzı boş bir yer tutucu BIRAKMA (m88 kuralı).
   */
  clockTarget?: CaddeClockTarget | null;
  /**
   * Y1 (m151): kimlik şeridi kaldırılınca bildirim zili buraya taşındı.
   * İSTEĞE BAĞLI ve varsayılanı yok — prop verilmezse DOM birebir eskisi gibi kalır,
   * yani /cadde/cafe ve /cadde/carsi bu değişiklikten hiç etkilenmez.
   */
  notificationsSlot?: ReactNode;
}

const CaddeFeedScopeBar = ({
  scope,
  hashtag,
  onScopeChange,
  onClearHashtag,
  clockTarget = null,
  notificationsSlot,
}: CaddeFeedScopeBarProps) => (
  <div className="space-y-2" data-testid="cadde-feed-scope-bar">
    <div className="flex flex-wrap items-center gap-1.5">
      {SCOPES.map((option) => {
        const active = option.key === scope;
        return (
          <button
            key={option.key}
            type="button"
            disabled={option.comingSoon}
            aria-pressed={active}
            onClick={() => onScopeChange(option.key)}
            title={option.description}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "cadde-filter-active"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            } ${option.comingSoon ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {option.label}
            {option.comingSoon ? <span className="text-[10px] font-normal">Yakında</span> : null}
          </button>
        );
      })}

      {/* m133: saat çiplerin SAĞ ucuna yaslanır (ml-auto). Şerit dar ekranda zaten
          flex-wrap ile sarıyor; saat de o zaman alt satıra düşer, taşma yapmaz.
          Y1 (m151): zil de aynı sağ uca katıldı. İkisi TEK bir ml-auto kabında durur —
          ayrı ayrı ml-auto verilseydi araya boşluk girip saat ortada kalırdı. Biri
          yoksa diğeri kabı tek başına doldurur. */}
      {clockTarget || notificationsSlot ? (
        <span className="ml-auto flex items-center gap-2">
          {clockTarget ? <CaddeLocalClock target={clockTarget} /> : null}
          {notificationsSlot}
        </span>
      ) : null}
    </div>

    {/* m14: aktif kapsamın ne yaptığı her zaman görünür — tooltip'i keşfetmeyen de görsün. */}
    <p className="text-xs text-slate-500" data-testid="cadde-scope-description">
      {SCOPES.find((option) => option.key === scope)?.description ?? ""}
    </p>

    {hashtag ? (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-sm">
          #{hashtag}
          <button
            type="button"
            onClick={onClearHashtag}
            aria-label="Etiket filtresini kaldır"
            className="rounded-full p-0.5 transition hover:bg-slate-300/60"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
        <span className="text-xs text-slate-500">etiketli paylaşımlar gösteriliyor</span>
      </div>
    ) : null}
  </div>
);

export default CaddeFeedScopeBar;
