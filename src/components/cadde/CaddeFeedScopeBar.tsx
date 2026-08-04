// Feed kapsam çip barı + aktif hashtag çipi.
//
// Workshop m15 (30 Tem): "Takip Ettiklerim yakında" ve "İş Fırsatları yakında" çipleri
// İPTAL — kaldırıldı (RPC scope parametresi tip olarak durur, UI'dan seçilemez).
// Workshop m14: kalan çiplere ne işe yaradığını anlatan kısa açıklama — title/tooltip +
// aktif kapsamın açıklaması barın altında satır olarak.
// "Yakınımda" Faz 2'ye kadar "Yakında" rozetiyle devre dışı (geo koordinat bekliyor).
//
// 2026-08-04 (kullanıcı kararı): "Etkinlikler" çipi KALDIRILDI — m14'ün koru listesinde
// olmasına rağmen. Gerekçe: composer'daki Etkinlik çipi m6'da kalkınca kullanıcı artık
// etkinlik tipi post ÜRETEMİYOR; üretilemeyen bir tipi süzen filtre, hemen üstündeki sade
// paylaşım kutusuyla çelişip gereksiz karmaşa yaratıyordu. m15 deseni izlendi: 'events'
// CaddeFeedScope tipinde ve RPC parametresinde DURUR, yalnız UI'dan seçilemez.
// Faz 2'de cafe etkinlikleri gelirse çip tek satırla geri açılır.

import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  {
    key: "nearby",
    label: "Yakınımda",
    description: "Konumuna en yakın paylaşımlar — yakında.",
    comingSoon: true,
  },
];

export interface CaddeFeedScopeBarProps {
  scope: CaddeFeedScope;
  hashtag: string;
  onScopeChange: (scope: CaddeFeedScope) => void;
  onClearHashtag: () => void;
}

const CaddeFeedScopeBar = ({ scope, hashtag, onScopeChange, onClearHashtag }: CaddeFeedScopeBarProps) => (
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
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            } ${option.comingSoon ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {option.label}
            {option.comingSoon ? <span className="text-[10px] font-normal">Yakında</span> : null}
          </button>
        );
      })}
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
