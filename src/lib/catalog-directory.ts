import { supabase } from "@/integrations/supabase/client";

type SupabaseError = { message: string };

type DirectorySearchRpcRow = {
  item_id: string;
  item_type: string;
  slug: string;
  title: string;
  role_key: string;
  role_label: string;
  description: string | null;
  city: string | null;
  country: string | null;
  image_url: string | null;
  special_label: string | null;
  special_value: string | null;
  is_featured: boolean;
  is_verified: boolean;
  is_claimable: boolean;
  /**
   * Eşleşme bandı: 0 = tam başlık, 1 = başlık öneki, 2 = tüm kelimeler,
   * 3 = kısmi eşleşme. Sıralama SQL tarafında yapılır; burada yalnız
   * hata ayıklama/ileride "kısmi sonuç" rozeti için taşınır.
   */
  match_rank: number;
  /** Filtrelenmiş kümenin TAM sayısı — sayfalanan `rows.length` ile karıştırma. */
  total_count: number;
};

type DirectoryRpcArgs = {
  p_search_text: string | null;
  p_role_key: string | null;
  p_country_code: string | null;
  p_city: string | null;
  p_featured_only: boolean;
  p_limit: number;
  p_offset: number;
};

type DirectoryRpcClient = {
  rpc: (
    functionName: "search_directory_catalog",
    args: DirectoryRpcArgs,
  ) => Promise<{ data: DirectorySearchRpcRow[] | null; error: SupabaseError | null }>;
};

type DirectoryFunctionsClient = {
  functions: {
    invoke: (
      functionName: "directory-search",
      options: { body: DirectoryRpcArgs },
    ) => Promise<{
      data: { rows?: DirectorySearchRpcRow[]; semantic?: boolean } | null;
      error: SupabaseError | null;
    }>;
  };
};

/** Bir sayfada çekilen kayıt sayısı. */
export const DIRECTORY_PAGE_SIZE = 24;

/**
 * SQL tarafındaki `v_limit` tavanıyla BİREBİR aynı olmalıdır
 * (`20260921090000_directory_search_anon_normalized.sql`). Buradan büyük bir
 * değer göndermek sessizce 100'e kırpılır; kod "50 istedim, 50 geldi" sanır
 * ama sayfa hesabı kayar.
 */
export const DIRECTORY_MAX_PAGE_SIZE = 100;

const directoryRpcClient = supabase as unknown as DirectoryRpcClient;
const directoryFunctionsClient = supabase as unknown as DirectoryFunctionsClient;

type RolesQueryClient = {
  from: (
    tableName: "roles",
  ) => {
    select: (
      columns: string,
    ) => {
      eq: (
        column: string,
        value: unknown,
      ) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => Promise<{
          data: Array<{ key: string; label: string; is_directory_visible?: boolean | null }> | null;
          error: SupabaseError | null;
        }>;
      };
    };
  };
};

const rolesQueryClient = supabase as unknown as RolesQueryClient;

export type DirectoryRoleOption = {
  key: string;
  label: string;
};

/**
 * Rol anahtarları teknik ASCII değerlerdir (`Admin_SuperAdmin`, `Moderator_Cadde`) —
 * kullanıcıya gösterilen Türkçe metin DEĞİLDİR. Yine de bare `toLowerCase()` yerine
 * yalnızca A–Z aralığını eşleyen açık bir katlama kullanıyoruz: anahtar içine bir gün
 * Türkçe karakter sızsa bile (`İ` → `i̇` gibi noktalı-i tuzağı) karşılaştırma bozulmaz
 * ve davranış SQL tarafındaki `ilike` ile birebir aynı kalır.
 */
const foldRoleKey = (key: string): string =>
  key.trim().replace(/[A-Z]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 32));

/**
 * Yönetici/moderatör rolleri ÖNEK ile tanınır — is_admin() (`r.key ilike 'Admin_%'`)
 * ve is_moderator() (`... or r.key = 'moderator'`) ile AYNI mantık; dizin RPC'sindeki
 * B20 koşulu da (applied/20260730220000_directory_exclude_admin_accounts.sql)
 * `Admin_%` + `Moderator_%` kullanır.
 *
 * Neden önek: aşağıdaki tam-eşleşmeli Set tek başına yetersizdi — canlıdaki gerçek
 * anahtar `Admin_SuperAdmin` listede yoktu, bu yüzden süper admin hesabı /directory
 * aramasında görünüyordu (revizyon 7dd35147).
 *
 * SQL `ilike 'Admin_%'` içinde `_` joker karakterdir; buradaki kontrol literal alt
 * çizgi arar (daha dar, bilinçli). Gerçek rol anahtarlarının tamamı zaten `Admin_`
 * / `Moderator_` biçimindedir.
 */
const HIDDEN_DIRECTORY_ROLE_KEY_PREFIXES = ["admin_", "moderator_"];

// İç / sistem / deneysel roller public dizinde görünmemeli. is_directory_visible
// bayrağı (DB tarafı) birincil savunma; bu guard, bayrak yanlış kalsa bile (ör.
// Experimental rolleri kaynak rolden is_directory_visible=true miras almıştı)
// dropdown ve sonuç listesini kesin temizler.
// Önek kontrolünün yakalayamadığı tekil/eski anahtarlar burada kalır — silme.
const HIDDEN_DIRECTORY_ROLE_KEYS = new Set(
  [
    "Experimental_1",
    "Experimental_2",
    "Admin",
    "Super_Admin",
    "SUPER_ADMIN",
    "Platform_Admin",
    "Owner",
    // is_moderator() bu anahtarı da yükseltilmiş sayar (`r.key = 'moderator'`).
    "moderator",
  ].map(foldRoleKey),
);

const HIDDEN_DIRECTORY_ROLE_LABEL_PATTERNS = [
  /admin/i,
  /super\s*admin/i,
  /yönetici/i,
  /yonetici/i,
  /experimental/i,
  /deneysel/i,
];

export function isPublicDirectoryRole(
  key: string | null | undefined,
  label: string | null | undefined,
): boolean {
  if (key) {
    const foldedKey = foldRoleKey(key);
    if (HIDDEN_DIRECTORY_ROLE_KEY_PREFIXES.some((prefix) => foldedKey.startsWith(prefix))) {
      return false;
    }
    if (HIDDEN_DIRECTORY_ROLE_KEYS.has(foldedKey)) return false;
  }
  if (label && HIDDEN_DIRECTORY_ROLE_LABEL_PATTERNS.some((pattern) => pattern.test(label))) {
    return false;
  }
  return true;
}

export type UnifiedDirectoryRow = {
  recordType: "catalog_item" | "member";
  id: string;
  href: string;
  title: string;
  roleKey: string;
  roleLabel: string;
  description: string | null;
  country: string | null;
  city: string | null;
  imageUrl: string | null;
  specialLabel: string | null;
  specialValue: string | null;
  isFeatured: boolean;
  isVerified: boolean;
  isClaimable: boolean;
  itemType: string;
};

const legacyCountryToCode: Record<string, string> = {
  Almanya: "DE",
  Germany: "DE",
  İngiltere: "GB",
  Ingiltere: "GB",
  "Birleşik Krallık": "GB",
  ABD: "US",
  Amerika: "US",
  Fransa: "FR",
  Katar: "QA",
  BAE: "AE",
};

export const toCountryCode = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^[a-z]{2}$/i.test(trimmed)) return trimmed.toUpperCase();
  return legacyCountryToCode[trimmed] ?? trimmed.toUpperCase();
};

/**
 * Bir katalog kaydının detay adresi. TEK KAYNAK — hem bu dosyadaki RPC eşlemesi
 * hem `public-catalog-api.ts` (anonim tablo okuması) bunu kullanır. İki yerde
 * ayrı ayrı yazılırsa biri değişip öbürü kalır ve kartlar sessizce 404'e gider.
 */
export const directoryHrefFor = (itemType: string | null | undefined, slug: string): string =>
  itemType === "member" ? `/directory/profile/${slug}` : `/directory/catalog/${slug}`;

const mapDirectorySearchRow = (row: DirectorySearchRpcRow): UnifiedDirectoryRow => {
  const isMember = row.item_type === "member";
  return {
    recordType: isMember ? "member" : "catalog_item",
    id: row.item_id,
    href: directoryHrefFor(row.item_type, row.slug),
    title: row.title,
    roleKey: row.role_key,
    roleLabel: row.role_label,
    description: row.description,
    country: row.country,
    city: row.city,
    imageUrl: row.image_url,
    specialLabel: row.special_label,
    specialValue: row.special_value,
    isFeatured: row.is_featured,
    isVerified: row.is_verified,
    isClaimable: row.is_claimable,
    itemType: row.item_type,
  };
};

export async function listDirectoryRoleOptions(): Promise<DirectoryRoleOption[]> {
  const { data, error } = await rolesQueryClient
    .from("roles")
    .select("key, label, is_directory_visible")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as Array<{ key: string; label: string; is_directory_visible?: boolean | null }>)
    .filter((role) => role.is_directory_visible !== false)
    .filter((role) => isPublicDirectoryRole(role.key, role.label))
    .map((role) => ({
      key: role.key,
      label: role.label,
    }));
}

export type DirectorySearchFilters = {
  searchText: string;
  roleFilter: string;
  countryFilter: string;
  cityFilter: string;
  featuredOnly: boolean;
  /** Kaçıncı kayıttan itibaren — sayfalama. Varsayılan 0. */
  offset?: number;
  /** Sayfa boyutu. Varsayılan `DIRECTORY_PAGE_SIZE`, tavan `DIRECTORY_MAX_PAGE_SIZE`. */
  limit?: number;
};

export type DirectorySearchResult = {
  /** Bu sayfadaki satırlar. */
  rows: UnifiedDirectoryRow[];
  /**
   * Filtreye uyan TOPLAM kayıt sayısı (sayfalanmamış). RPC bunu pencere
   * fonksiyonuyla sonuç kümesinin kendisinden üretir — yani sayaç ile liste
   * aynı filtreyi paylaşır. Ayrı bir sayım sorgusu YAZMA; tam olarak o ayrışma
   * ana sayfada "645 kayıt" yazarken dizinde 237 kayıt gösterilmesine yol açtı.
   */
  totalCount: number;
};

export async function listUnifiedDirectoryRows(
  filters: DirectorySearchFilters,
): Promise<DirectorySearchResult> {
  const limit = Math.min(
    Math.max(filters.limit ?? DIRECTORY_PAGE_SIZE, 1),
    DIRECTORY_MAX_PAGE_SIZE,
  );
  const offset = Math.max(filters.offset ?? 0, 0);

  const rpcArgs: DirectoryRpcArgs = {
    p_search_text: filters.searchText.trim() || null,
    p_role_key: filters.roleFilter === "all" ? null : filters.roleFilter,
    p_country_code: toCountryCode(filters.countryFilter),
    p_city: filters.cityFilter.trim() || null,
    p_featured_only: filters.featuredOnly,
    p_limit: limit,
    p_offset: offset,
  };

  let rpcRows: DirectorySearchRpcRow[] | null = null;

  // Sorgu embedding'i sunucuda üretilir; Gemini anahtarı tarayıcıya ASLA girmez.
  // Sağlayıcı/Edge Function kullanılamazsa lexical RPC aynı filtrelerle çalışmayı
  // sürdürür. Boş sorguda gereksiz model çağrısı yapılmaz.
  if (rpcArgs.p_search_text) {
    try {
      const { data, error } = await directoryFunctionsClient.functions.invoke("directory-search", {
        body: rpcArgs,
      });
      if (!error && Array.isArray(data?.rows)) rpcRows = data.rows;
    } catch {
      // Aşağıdaki lexical fallback kullanıcıya arama sonucu vermeye devam eder.
    }
  }

  if (rpcRows === null) {
    const { data, error } = await directoryRpcClient.rpc("search_directory_catalog", rpcArgs);
    if (error) throw error;
    rpcRows = (data ?? []) as DirectorySearchRpcRow[];
  }

  return {
    // Yönetici elemesi artık SQL'de de var (B20, iki dalda). Buradaki süzgeç
    // İKİNCİ savunma hattı olarak KALIR: RPC gövdesi ileride yeniden yazılırsa
    // (canlıda pg_get_functiondef ile yamandığı için bu gerçekten oluyor)
    // sızıntı kullanıcıya ulaşmasın.
    rows: rpcRows
      .filter((row) => isPublicDirectoryRole(row.role_key, row.role_label))
      .map(mapDirectorySearchRow),
    // Sunucunun saydığı değer esas alınır; boş sayfada 0.
    totalCount: rpcRows[0]?.total_count ?? 0,
  };
}

/**
 * Dizinde GERÇEKTEN görünebilecek kayıt sayısı.
 *
 * ⚠️ Bu fonksiyon İKİ KEZ yalan söyledi ve her ikisi de aynı kök nedendendi:
 * sayacın kendi filtresi vardı. Önce `catalog_items`'ı FİLTRESİZ sayıyordu
 * (ana sayfa "645+ kayıt" derken dizinde 248 görünüyordu); sonra iki koşul
 * eklendi ama `roles.is_directory_visible`, yönetici elemesi ve bireysel profil
 * dalı yine dışarıda kaldı.
 *
 * Kalıcı çözüm: AYRI SAYIM SORGUSU YOK. Sayı, sonuç listesini üreten RPC'nin
 * kendisinden (`total_count`, pencere fonksiyonu) gelir. Tek satır çekilir;
 * amaç veri değil, sayıdır. Böylece sayacın liste filtresinden ayrışması
 * yapısal olarak imkânsız hale gelir.
 */
export async function getTotalDirectoryCount(): Promise<number> {
  try {
    const { totalCount } = await listUnifiedDirectoryRows({
      searchText: "",
      roleFilter: "all",
      countryFilter: "",
      cityFilter: "",
      featuredOnly: false,
      limit: 1,
      offset: 0,
    });
    return totalCount;
  } catch {
    // Sayaç yardımcı bir bilgidir; alınamazsa etiket gizlenir (çağıran taraf
    // 0'ı "gösterme" olarak yorumlar). Sayfayı düşürmesine izin verme.
    return 0;
  }
}
