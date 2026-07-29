// Feed kapsam çip barı + aktif hashtag çipi.
//
// Kapsamların bir kısmı Faz 2'de gerçek veriye bağlanacak (Yakınımda şehir koordinatı,
// Takip Ettiklerim takip tablosu, İş Fırsatları sınıflandırma bekliyor). Bunları gizlemek
// yerine "Yakında" rozetiyle ve devre dışı gösteriyoruz — kullanıcı yol haritasını görsün,
// ama tıklayıp boş akışla karşılaşmasın.

import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CaddeFeedScope } from "@/lib/cadde-types";

type ScopeOption = {
  key: CaddeFeedScope;
  label: string;
  /** Faz 2'ye bırakılanlar: RPC 'all' gibi davranır, bu yüzden tıklanamaz. */
  comingSoon?: boolean;
};

const SCOPES: readonly ScopeOption[] = [
  { key: "all", label: "Tümü" },
  { key: "city", label: "Şehrim" },
  { key: "country", label: "Ülkem" },
  { key: "events", label: "Etkinlikler" },
  { key: "cafes", label: "Cafelerim" },
  { key: "nearby", label: "Yakınımda", comingSoon: true },
  { key: "following", label: "Takip Ettiklerim", comingSoon: true },
  { key: "jobs", label: "İş Fırsatları", comingSoon: true },
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
            title={option.comingSoon ? "Yakında" : undefined}
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
