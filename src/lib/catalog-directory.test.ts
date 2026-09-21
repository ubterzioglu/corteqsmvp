// Dizin (search) görünürlük sözleşmesi — revizyon 7dd35147
// "Search'de super admin yönetici vs çıkıyor".
//
// Kök neden (kapatıldı): `HIDDEN_DIRECTORY_ROLE_KEYS` TAM ESLESMELI bir Set'ti ve canlıdaki
// gerçek rol anahtarı `Admin_SuperAdmin` bu Set'te YOKTU ("Admin", "Super_Admin", "SUPER_ADMIN"
// vardı — hiçbiri eşleşmiyor). Set artık ÖNEK kontrolü ile birlikte çalışıyor:
// `Admin_` / `Moderator_` önekleri, SQL tarafındaki is_admin() (`r.key ilike 'Admin_%'`),
// is_moderator() ve dizin RPC'sindeki B20 koşulu ile AYNI mantık.
//
// Bu testler eski (tam-eşleşmeli) davranışı değil, DOĞRU davranışı kilitler.

import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.fn();
const DIRECTORY_SEARCH_MIGRATION_CANDIDATES = [
  "supabase/migrations/applied/20260921090000_directory_search_anon_normalized.sql",
  "supabase/migrations/20260921090000_directory_search_anon_normalized.sql",
  "supabase/migrations/archive/20260921090000_directory_search_anon_normalized.sql",
] as const;

function readMigrationSource(
  candidates: readonly string[],
  readSource: (path: string) => string = (path) => readFileSync(path, "utf8"),
): string {
  for (const candidate of candidates) {
    try {
      return readSource(candidate);
    } catch {
      // Migration bir sonraki aday konumunda olabilir.
    }
  }

  throw new Error(`Migration bulunamadı: ${candidates.join(" | ")}`);
}

describe("migration aday yolu çözümü", () => {
  it("migration taşındığında sonraki mevcut adaydan okumaya devam eder", () => {
    const canonicalPath = "supabase/migrations/applied/example.sql";
    const legacyPath = "supabase/migrations/example.sql";
    const readSource = vi.fn((path: string) => {
      if (path === canonicalPath) throw new Error("ENOENT");
      return "migration sql";
    });

    expect(readMigrationSource([canonicalPath, legacyPath], readSource)).toBe("migration sql");
    expect(readSource).toHaveBeenCalledTimes(2);
  });
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
  isSupabaseConfigured: true,
}));

const {
  DIRECTORY_MAX_PAGE_SIZE,
  DIRECTORY_PAGE_SIZE,
  getTotalDirectoryCount,
  isPublicDirectoryRole,
  listUnifiedDirectoryRows,
  toCountryCode,
} = await import("@/lib/catalog-directory");

type DirectoryRowSeed = {
  item_id: string;
  role_key: string;
  role_label: string;
};

const rpcRow = (
  { item_id, role_key, role_label }: DirectoryRowSeed,
  total_count = 1,
) => ({
  item_id,
  item_type: "member",
  slug: item_id,
  title: item_id,
  role_key,
  role_label,
  description: null,
  city: null,
  country: null,
  image_url: null,
  special_label: null,
  special_value: null,
  is_featured: false,
  is_verified: false,
  is_claimable: false,
  match_rank: 2,
  total_count,
});

const defaultFilters = {
  searchText: "",
  roleFilter: "all",
  countryFilter: "",
  cityFilter: "",
  featuredOnly: false,
};

describe("catalog-directory", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("maps known country labels and codes to catalog country filters", () => {
    expect(toCountryCode("Almanya")).toBe("DE");
    expect(toCountryCode("de")).toBe("DE");
    expect(toCountryCode("Fransa")).toBe("FR");
  });

  describe("isPublicDirectoryRole", () => {
    it("Admin_ ve Moderator_ önekli TÜM rol anahtarlarını gizler (is_admin/is_moderator mantığı)", () => {
      // Regresyon: bu anahtar canlıda gerçekten var (20260903130000 SuperAdmin grant'i)
      // ve tam-eşleşmeli Set onu KAÇIRIYORDU.
      expect(isPublicDirectoryRole("Admin_SuperAdmin", "Süper Yönetici")).toBe(false);
      // Etiket boş/masum olsa bile yalnız anahtar yeterli olmalı — etiket desenine güvenme.
      expect(isPublicDirectoryRole("Admin_SuperAdmin", null)).toBe(false);
      expect(isPublicDirectoryRole("Admin_SuperAdmin", "Diaspora Üyesi")).toBe(false);
      expect(isPublicDirectoryRole("Admin_Manager", null)).toBe(false);
      expect(isPublicDirectoryRole("Moderator_Cadde", null)).toBe(false);
    });

    it("önek karşılaştırması büyük/küçük harf duyarsızdır (SQL ilike ile aynı)", () => {
      expect(isPublicDirectoryRole("ADMIN_SUPERADMIN", null)).toBe(false);
      expect(isPublicDirectoryRole("admin_superadmin", null)).toBe(false);
      expect(isPublicDirectoryRole("  Admin_SuperAdmin  ", null)).toBe(false);
    });

    it("eski tam-eşleşmeli anahtarları KAYBETMEZ", () => {
      expect(isPublicDirectoryRole("Experimental_1", null)).toBe(false);
      expect(isPublicDirectoryRole("Experimental_2", null)).toBe(false);
      expect(isPublicDirectoryRole("Super_Admin", null)).toBe(false);
      expect(isPublicDirectoryRole("SUPER_ADMIN", null)).toBe(false);
      expect(isPublicDirectoryRole("Platform_Admin", null)).toBe(false);
      expect(isPublicDirectoryRole("Owner", null)).toBe(false);
      // is_moderator() `r.key = 'moderator'` anahtarını da yükseltilmiş sayar.
      expect(isPublicDirectoryRole("moderator", null)).toBe(false);
    });

    it("normal üye/işletme rollerini gizlemez", () => {
      expect(isPublicDirectoryRole("User_DiasporaMember", "Diaspora Üyesi")).toBe(true);
      expect(isPublicDirectoryRole("Business_Company", "Şirket")).toBe(true);
      // "admin" alt dize olarak geçse bile önek değilse elenmez; etiketi de temiz.
      expect(isPublicDirectoryRole("User_Adminstrasyon_Danismani", "Danışman")).toBe(true);
    });
  });

  it("Admin_SuperAdmin kaydını dizin sonuçlarından eler", async () => {
    rpcMock.mockResolvedValue({
      data: [
        rpcRow({ item_id: "uye", role_key: "User_DiasporaMember", role_label: "Diaspora Üyesi" }, 3),
        rpcRow({ item_id: "superadmin", role_key: "Admin_SuperAdmin", role_label: "Diaspora Üyesi" }, 3),
        rpcRow({ item_id: "moderator", role_key: "Moderator_Cadde", role_label: "Moderatör" }, 3),
      ],
      error: null,
    });

    const { rows } = await listUnifiedDirectoryRows(defaultFilters);

    expect(rows.map((row) => row.id)).toEqual(["uye"]);
  });

  describe("sayfalama (Batch 0)", () => {
    it("varsayılan sayfa boyutu ve offset'i RPC'ye geçirir", async () => {
      rpcMock.mockResolvedValue({ data: [], error: null });

      await listUnifiedDirectoryRows(defaultFilters);

      expect(rpcMock).toHaveBeenCalledWith(
        "search_directory_catalog",
        expect.objectContaining({ p_limit: DIRECTORY_PAGE_SIZE, p_offset: 0 }),
      );
    });

    it("istenen sayfa boyutunu SQL tavanına kırpar (tavan ile aynı sayı olmalı)", async () => {
      rpcMock.mockResolvedValue({ data: [], error: null });

      await listUnifiedDirectoryRows({ ...defaultFilters, limit: 5000, offset: 48 });

      expect(rpcMock).toHaveBeenCalledWith(
        "search_directory_catalog",
        expect.objectContaining({ p_limit: DIRECTORY_MAX_PAGE_SIZE, p_offset: 48 }),
      );
    });

    it("negatif offset'i 0'a çeker", async () => {
      rpcMock.mockResolvedValue({ data: [], error: null });

      await listUnifiedDirectoryRows({ ...defaultFilters, offset: -10 });

      expect(rpcMock).toHaveBeenCalledWith(
        "search_directory_catalog",
        expect.objectContaining({ p_offset: 0 }),
      );
    });

    it("toplam sayıyı RPC'nin total_count'undan alır, satır sayısından DEĞİL", async () => {
      rpcMock.mockResolvedValue({
        data: [
          rpcRow({ item_id: "a", role_key: "User_DiasporaMember", role_label: "Üye" }, 237),
          rpcRow({ item_id: "b", role_key: "User_DiasporaMember", role_label: "Üye" }, 237),
        ],
        error: null,
      });

      const result = await listUnifiedDirectoryRows(defaultFilters);

      expect(result.rows).toHaveLength(2);
      expect(result.totalCount).toBe(237);
    });

    it("boş sonuçta toplam 0 döner", async () => {
      rpcMock.mockResolvedValue({ data: [], error: null });

      expect((await listUnifiedDirectoryRows(defaultFilters)).totalCount).toBe(0);
    });
  });

  describe("sayaç ↔ sonuç filtresi eşitliği (Batch 3)", () => {
    it("getTotalDirectoryCount AYRI bir sayım sorgusu değil, AYNI RPC'yi kullanır", async () => {
      rpcMock.mockResolvedValue({
        data: [rpcRow({ item_id: "a", role_key: "User_DiasporaMember", role_label: "Üye" }, 237)],
        error: null,
      });

      const total = await getTotalDirectoryCount();

      expect(total).toBe(237);
      // Kritik nokta: sayaç `catalog_items` tablosunu kendi filtresiyle saymaz.
      // Saysaydı dizin filtreleri (is_directory_visible, B20, bireysel dal)
      // dışarıda kalır ve sayı yine listeden ayrışırdı.
      expect(rpcMock).toHaveBeenCalledWith(
        "search_directory_catalog",
        expect.objectContaining({ p_limit: 1, p_offset: 0, p_search_text: null }),
      );
    });

    it("RPC hata verirse sayaç sayfayı düşürmez, 0 döner", async () => {
      rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });

      await expect(getTotalDirectoryCount()).resolves.toBe(0);
    });
  });

  describe("dizin RPC'si — anonim erişim ve PII sözleşmesi (Batch 0 + 3)", () => {
    const migration = readMigrationSource(DIRECTORY_SEARCH_MIGRATION_CANDIDATES);

    it("anonim çağrıyı engelleyen 42501 koşulu gövdede KALMAMALI", () => {
      expect(migration).not.toContain("authentication required");
      expect(migration).toContain("grant execute on function");
      expect(migration).toMatch(/to anon, authenticated, service_role/);
    });

    it("B20 yönetici elemesi HER İKİ dalda uygulanır", () => {
      // Branch 1 (katalog) — canlıda eksikti, Admin_ContentModerator sızıyordu.
      expect(migration).toContain("not ilike 'Admin_%'");
      expect(migration).toContain("not ilike 'Moderator_%'");
      // Branch 2 (bireysel) — mevcut koşul korunmalı.
      expect(migration).toContain("r_x.key ilike 'Admin_%'");
      expect(migration).toContain("r_x.key ilike 'Moderator_%'");
    });

    it("iletişim bilgisi taşıyan search_text aranan metne KARIŞTIRILMAZ", () => {
      // `catalog_search_documents.search_text` public contact değerlerini içerir
      // (canlıda 336 açık iletişim kaydı). Anonime açık aramada onu taramak
      // e-posta/telefon doğrulama (enumeration) yüzeyi açardı.
      //
      // ⚠️ Denetim YORUMLARI dışarıda bırakır: bu kararın GEREKÇESİ migration'ın
      // başlığında yazılıdır ve orada "catalog_item_contacts" kelimesi geçer.
      // Ham metinde arayan bir test, kararı belgeleyen yorumu kusur sayardı.
      const sqlOnly = migration
        .replace(/--[^\n]*/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");

      expect(sqlOnly).not.toMatch(/d\.search_text/);
      expect(sqlOnly).not.toMatch(/catalog_item_contacts/);
      // Buna karşılık csd'den yalnız PII'siz türetilmiş kolon alınır.
      expect(sqlOnly).toContain("d.category_slugs");
    });

    it("kullanıcı girdisi LIKE jokeri olarak yorumlanmaz", () => {
      // `'%' || word || '%'` kalıbı geri gelirse "%" araması tüm dizini döker.
      expect(migration).not.toMatch(/'%'\s*\|\|\s*word/);
      expect(migration).toContain("position(w in c.row_haystack)");
    });

    it("sayfalama tavanı TS sabitiyle aynı sayıdır", () => {
      expect(migration).toContain(`, ${DIRECTORY_MAX_PAGE_SIZE})`);
    });

    it("Türkçe katlama SQL tarafında da uygulanır", () => {
      expect(migration).toContain("catalog_search_normalize");
    });
  });

  it("TS önekleri, dizin RPC'sindeki SQL koşuluyla aynı kalır (SQL↔TS ayna sözleşmesi)", () => {
    const migration = readFileSync(
      "supabase/migrations/applied/20260730220000_directory_exclude_admin_accounts.sql",
      "utf8",
    );

    // Migration yönetici hesaplarını bu iki desenle eler; TS guard'ı da aynısını yapmalı.
    expect(migration).toContain("r_x.key ilike 'Admin_%'");
    expect(migration).toContain("r_x.key ilike 'Moderator_%'");
    expect(isPublicDirectoryRole("Admin_Herhangi", null)).toBe(false);
    expect(isPublicDirectoryRole("Moderator_Herhangi", null)).toBe(false);
  });
});
