// "Cafeler" paneli — workshop m66/m67/m68/m69 + m49 + m84 + revizyon 2b9a8d04.
//
// 2b9a8d04 (toplantı kararı): başlık "Aktif Cafe Özeti" / "Aktif Cafeler" değil,
// SEÇİLEN FİLTREYİ söyleyen biçim olacak — "Cafeler · Berlin (2)". Liste zaten
// akışla aynı "Konum" kartının seçimini izliyordu (m70) ama bunu yalnız kart
// açıklaması söylüyordu; başlık "aktif" diyerek yanlış bir ikinci boyut ("aktif
// olmayan cafeler de var mı?") ima ediyordu. Seçim yokken kapsam "tüm konumlar".
//
// m84 (04.08.2026 kullanıcı kararı): panel orta kolondan SOL kolona taşındı; orta
// kolon artık yalnız paylaşım kutusu + akış (m85). Taşınırken CaddePage'den kendi
// dosyasına çıkarıldı — sayfa 1100 satırı aşmıştı.
//
// m68 akordeon (varsayılan AÇIK: madde kapanabilirlik istiyor, gizlenme değil) ile
// m69 önizleme sınırı FARKLI iki sorunu çözer: biri bölümü tamamen kapatmayı, diğeri
// açıkken yüksekliği tutmayı. İkisini birleştirme.
//
// cadde-cafes-empty-state / cadde-cafes-toggle / cadde-cafes-show-all testid'leri
// sözleşmedir (CaddePage.test.tsx bunlara bağlı) — yeniden adlandırma.

import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import CaddeCafeIcon from "@/components/cadde/CaddeCafeIcon";
import CaddeInfoPopover from "@/components/cadde/CaddeInfoPopover";
import CreateCafeForm from "@/components/cadde/CreateCafeForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { CaddeCafe } from "@/lib/cadde-types";

// CaddePage'deki yerel biçimlendiricinin aynısı — panel taşınırken birlikte geldi.
const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

/** m69: akordeon açıkken ilk anda çizilen kafe satırı sayısı; gerisi tek tıkla açılır. */
const CAFE_PREVIEW_COUNT = 3;

/** Konum filtresi boşken başlıkta kapsamı adlandıran ifade (2b9a8d04). */
export const CAFES_ALL_LOCATIONS_LABEL = "tüm konumlar";

export interface CaddeCafesPanelProps {
  cafes: readonly CaddeCafe[];
  /** themeKey ham anahtar taşır — Türkçe etiket dışarıdan gelir (m4). */
  themeLabelByKey: Map<string, string>;
  /** Oturum yoksa "Cafe Aç" tetikleri çizilmez. */
  hasSession: boolean;
  /** Boş durumda adıyla anılacak seçili şehir/ülke (m52); yoksa null. */
  locationLabel: string | null;
  /** Filtre durumuna göre değişen "içerik azsa" cümlesi. */
  sparseContentHint: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showAll: boolean;
  onShowAll: () => void;
}

const CaddeCafesPanel = ({
  cafes,
  themeLabelByKey,
  hasSession,
  locationLabel,
  sparseContentHint,
  open,
  onOpenChange,
  showAll,
  onShowAll,
}: CaddeCafesPanelProps) => {
  const visibleCafes = showAll ? cafes : cafes.slice(0, CAFE_PREVIEW_COUNT);
  const hiddenCount = cafes.length - visibleCafes.length;
  // Başlık ve aria-label TEK kaynaktan üretilir; ikisi ayrı yazılırsa biri
  // güncellenip diğeri unutuluyordu (eski hâlde ikisi de "Aktif Cafeler" idi).
  const scopeLabel = locationLabel ?? CAFES_ALL_LOCATIONS_LABEL;
  const headingText = `Cafeler · ${scopeLabel}`;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card className="cadde-panel">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {/* m49: "Cafe nedir?" tek satırdan anlaşılmıyordu — balon anlatıyor. */}
              <CardTitle className="flex items-center gap-1.5 font-display text-lg">
                <CollapsibleTrigger
                  data-testid="cadde-cafes-toggle"
                  aria-label={`${headingText} bölümünü ${open ? "kapat" : "aç"}`}
                  className="inline-flex items-center gap-1.5 rounded-md transition hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <span data-testid="cadde-cafes-heading">{headingText}</span>
                  {cafes.length > 0 ? (
                    <span className="text-sm font-normal text-slate-500">({cafes.length})</span>
                  ) : null}
                  <ChevronDown
                    aria-hidden
                    className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CaddeInfoPopover
                  label="Cafe nedir?"
                  triggerTestId="cadde-cafe-info-trigger"
                  contentTestId="cadde-cafe-info-content"
                  triggerClassName="text-orange-600 hover:bg-orange-100 hover:text-orange-800 focus-visible:ring-orange-500"
                >
                  <p className="text-xs font-semibold text-slate-900">Cafe nedir?</p>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Kendi teması olan, istersen davetli ve kapalı bir sohbet uygulamasıdır.
                    Süreli bir WhatsApp grubu gibi düşünebilirsin.
                  </p>
                </CaddeInfoPopover>
              </CardTitle>
              {/* m70: kafelerin AYRI bir ülke/şehir filtresi YOK — liste, akışla aynı
                  "Konum" kartındaki seçimi izler. Ayrı bir kafe filtresi bilinçli olarak
                  EKLENMEDİ: ikinci bir konum durumu + URL parametresi demek ve bugünkü
                  yerleşimde filtre kartı zaten kafe panelinin hemen üstünde duruyor.
                  2b9a8d04: seçim adı artık BAŞLIKTA duruyor; buradaki cümle onu tekrar
                  etmez, yalnız seçimin NEREDEN geldiğini söyler. */}
              <CardDescription>
                {locationLabel
                  ? "Konum kartındaki seçimi izler."
                  : "Kısa süreli topluluk odaları ve tema bazlı buluşmalar"}
              </CardDescription>
            </div>
            {hasSession ? (
              <CreateCafeForm trigger={<Button size="sm" variant="outline" className="rounded-2xl">+ Cafe Aç</Button>} />
            ) : null}
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {cafes.length > 0 ? (
              <div className="flex flex-col gap-2">
                {/* m3: çay bardağı ikonu = kafe satırının imzası. m4: ad bold + tema normal.
                    m67: yükseklik iki satıra indi — özet meta satırına taşındı (truncate),
                    ayrı footer bloğu kalktı. */}
                {visibleCafes.map((cafe) => (
                  <div key={cafe.id} className="cadde-card flex items-center gap-2.5 rounded-2xl px-3 py-2.5">
                    <CaddeCafeIcon className="h-5 w-5 shrink-0 text-orange-600" />
                    <div className="min-w-0 flex-1">
                      <p className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate font-semibold text-slate-900">{cafe.title}</span>
                        {cafe.themeKey && themeLabelByKey.get(cafe.themeKey) ? (
                          <span className="shrink-0 text-xs font-normal text-slate-500">
                            {themeLabelByKey.get(cafe.themeKey)}
                          </span>
                        ) : null}
                        {cafe.isBridge ? (
                          <Badge className="shrink-0 bg-emerald-100 px-1.5 py-0 text-[10px] text-emerald-900 hover:bg-emerald-100">
                            Köprü
                          </Badge>
                        ) : null}
                        {cafe.entryMode !== "open" ? (
                          <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">
                            {cafe.entryMode === "approval" ? "Onaylı" : "Davetli"}
                          </Badge>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {cafe.city ?? "Global"} • {formatDateTime(cafe.startsAt)} • {cafe.memberCount} üye
                        {cafe.summary ? ` • ${cafe.summary}` : ""}
                      </p>
                    </div>
                    <Button size="sm" variant={cafe.joinedByViewer ? "secondary" : "outline"} asChild className="h-8 shrink-0">
                      <Link to={`/cadde/cafe/${cafe.id}`}>
                        {cafe.joinedByViewer ? "Odaya Gir" : cafe.viewerMemberStatus === "pending" ? "Onay Bekliyor" : "Katıl"}
                      </Link>
                    </Button>
                  </div>
                ))}
                {hiddenCount > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    data-testid="cadde-cafes-show-all"
                    className="self-start text-xs text-orange-700 hover:text-orange-900"
                    onClick={onShowAll}
                  >
                    {hiddenCount} cafe daha göster
                  </Button>
                ) : null}
              </div>
            ) : (
              <div
                data-testid="cadde-cafes-empty-state"
                className="cadde-empty rounded-[24px] border border-dashed p-4"
              >
                {/* m52: mesaj seçili konumu adıyla söyler; Türkçe bulunma eki bilinçli
                    üretilmiyor (yabancı adlarda ünlü uyumu güvenilir değil). */}
                <p className="text-sm font-semibold text-slate-900">
                  {locationLabel
                    ? `${locationLabel} için henüz aktif bir cafe açılmadı.`
                    : "Henüz aktif bir cafe açılmadı."}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Şehir sohbetleri, tema bazlı odalar ve kısa buluşmalar burada görünür. {sparseContentHint}
                </p>
                {hasSession ? (
                  <div className="mt-4">
                    <CreateCafeForm
                      trigger={<Button size="sm" variant="outline" className="rounded-2xl">İlk Cafe'yi Aç</Button>}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default CaddeCafesPanel;
