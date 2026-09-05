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

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
  isSupabaseConfigured: true,
}));

const { isPublicDirectoryRole, listUnifiedDirectoryRows, toCountryCode } = await import(
  "@/lib/catalog-directory"
);

type DirectoryRowSeed = {
  item_id: string;
  role_key: string;
  role_label: string;
};

const rpcRow = ({ item_id, role_key, role_label }: DirectoryRowSeed) => ({
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
        rpcRow({ item_id: "uye", role_key: "User_DiasporaMember", role_label: "Diaspora Üyesi" }),
        rpcRow({ item_id: "superadmin", role_key: "Admin_SuperAdmin", role_label: "Diaspora Üyesi" }),
        rpcRow({ item_id: "moderator", role_key: "Moderator_Cadde", role_label: "Moderatör" }),
      ],
      error: null,
    });

    const rows = await listUnifiedDirectoryRows(defaultFilters);

    expect(rows.map((row) => row.id)).toEqual(["uye"]);
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
