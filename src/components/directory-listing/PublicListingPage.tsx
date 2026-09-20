/**
 * Public liste sayfalarının ORTAK kabuğu — İşletmeler / Uzmanlar / Şehir Elçileri.
 *
 * Üç sayfa da aynı iskeleti taşır: başlık + filtre çubuğu + kart ızgarası + boş
 * durum. Farklılıkları props ile gelir; böylece üç sayfada üç ayrı "kart ızgarası"
 * kopyası oluşmaz (bu depoda "aynı bilginin iki yere kopyalanması" tekrarlayan
 * sessiz kusur sınıfı).
 *
 * Veri okuma ve filtreleme burada yapılır; sayfaya özgü alt bölümler (`children`)
 * ızgaranın ALTINA düşer.
 */

import { useMemo, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import ListingCard from "@/components/directory-listing/ListingCard";
import ListingFilterBar from "@/components/directory-listing/ListingFilterBar";
import { usePublicListing } from "@/hooks/usePublicListing";
import { roleKeysOf, roleLabelOf, type RoleGroup } from "@/lib/directory-role-groups";
import type { PublicCatalogRow } from "@/lib/public-catalog-api";
import {
  deriveCityOptions,
  deriveCountryOptions,
  deriveGroupCounts,
  filterListingRows,
  EMPTY_LISTING_FILTER,
  type ListingFilterState,
} from "@/lib/public-listing-filter";

interface PublicListingPageProps {
  /** Sayfa başlığı (`h1`). */
  title: string;
  /** Başlığın altındaki tek cümlelik tanım. */
  intro: string;
  /** Başlığın üstündeki küçük etiket — verilmezse çizilmez. */
  eyebrow?: ReactNode;
  groups: readonly RoleGroup[];
  searchPlaceholder: string;
  /** "3 uzman listeleniyor" cümlesindeki ad — tekil yazılır. */
  countNoun: string;
  /** Hiç KAYIT yokken gösterilen davet metni. */
  emptyDataMessage: string;
  /** Kayıt var ama filtre hiçbir şey döndürmediğinde gösterilir. */
  emptyFilterMessage: string;
  /**
   * Gerçek kayıtların ARDINA eklenen demo kartlar. Her biri DEMO rozetiyle
   * çizilir. Boş bırakılırsa sayfa yalnız gerçek veriyi gösterir.
   */
  demoRows?: readonly PublicCatalogRow[];
  /**
   * Grup sekmeleri çizilsin mi? Varsayılan: taksonomi doluysa evet. Tek rollü
   * sayfalar (Şehir Elçileri) taksonomiyi yalnız ROL ETİKETİ için taşır ve
   * sekme çubuğunu gizlemek üzere `false` geçer.
   */
  showGroups?: boolean;
  /** Izgaranın altına düşen sayfaya özgü bölümler. */
  children?: ReactNode;
}

const PublicListingPage = ({
  title,
  intro,
  eyebrow,
  groups,
  searchPlaceholder,
  countNoun,
  emptyDataMessage,
  emptyFilterMessage,
  demoRows,
  showGroups,
  children,
}: PublicListingPageProps) => {
  const roleKeys = useMemo(() => roleKeysOf(groups), [groups]);
  const { data, isLoading } = usePublicListing(roleKeys);

  // `data ?? []` doğrudan yazılırsa her render'da yeni dizi üretir ve aşağıdaki
  // memo'ların tamamı boşa çıkar (ESLint react-hooks/exhaustive-deps bunu bildirir).
  const realRows = useMemo(() => data ?? [], [data]);

  /**
   * Demo kartlar gerçek kayıtların ARDINA eklenir — sıralama bilinçlidir:
   * gerçek içerik önce görünür, demo vitrini doldurur.
   */
  const rows = useMemo(
    () => (demoRows && demoRows.length > 0 ? [...realRows, ...demoRows] : realRows),
    [realRows, demoRows],
  );

  const demoIds = useMemo(
    () => new Set((demoRows ?? []).map((row) => row.id)),
    [demoRows],
  );

  const [filter, setFilter] = useState<ListingFilterState>(EMPTY_LISTING_FILTER);

  const countryOptions = useMemo(() => deriveCountryOptions(rows), [rows]);
  const cityOptions = useMemo(
    () => deriveCityOptions(rows, filter.country),
    [rows, filter.country],
  );
  const groupCounts = useMemo(() => deriveGroupCounts(rows, filter, groups), [rows, filter, groups]);
  const filtered = useMemo(() => filterListingRows(rows, filter, groups), [rows, filter, groups]);

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16 pt-24">
        <div className="container mx-auto px-4">
          <header className="mb-6">
            {eyebrow}
            <h1 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
            <p className="mt-1 max-w-2xl font-body text-muted-foreground">{intro}</p>
          </header>

          <ListingFilterBar
            groups={groups}
            filter={filter}
            onFilterChange={setFilter}
            countryOptions={countryOptions}
            cityOptions={cityOptions}
            groupCounts={groupCounts}
            searchPlaceholder={searchPlaceholder}
            showGroups={showGroups ?? groups.length > 0}
          />

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 font-body text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Liste yükleniyor…
            </div>
          ) : (
            <>
              <p className="mb-4 font-body text-sm text-muted-foreground">
                {filtered.length} {countNoun} listeleniyor
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((row) => (
                  <ListingCard
                    key={row.id}
                    row={row}
                    roleLabel={roleLabelOf(groups, row.roleKey)}
                    isDemo={demoIds.has(row.id)}
                  />
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-12 text-center font-body text-muted-foreground">
                  {rows.length === 0 ? emptyDataMessage : emptyFilterMessage}
                </div>
              ) : null}
            </>
          )}

          {children}
        </div>
      </main>
    </div>
  );
};

export default PublicListingPage;
