// G02 sözleşmesi — grup ekleme GİRİŞ İSTER, hem arayüzde hem RLS'te.
//
// 2026-10-01'de canlıda ölçüldü: `Anyone can insert whatsapp landings` politikası
// `{anon, authenticated}` için açıktı ve `WITH CHECK`'i `true` idi — yani oturumu
// olmayan herkes, sınırsız sayıda, İSTEDİĞİ `user_id` ile grup kaydı
// ekleyebiliyordu. Migration `20261001100000_whatsapp_landings_rls_cleanup.sql`
// o politikayı kaldırdı (canlı kanıt: anon INSERT → `42501`).
//
// ⚠️ Arayüz zaten girişi zorunlu kılıyordu (`ensureSignedInForGroupSubmit`);
// açık olan yol formu atlayıp doğrudan PostgREST'e POST atmaktı. Bu test İKİ
// yakayı birden kilitler, çünkü ikisi birbirini gizler:
//   • Arayüz kapısı kaldırılırsa form canlıda `42501` ile düşer ve kullanıcı
//     neden olduğunu anlamaz.
//   • Migration geri alınırsa arayüz çalışmaya devam eder ve delik SESSİZCE
//     yeniden açılır — hiçbir test kırılmaz.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { sliceBetween, sliceFrom } from "@/test/source-slice";

const repoRoot = resolve(__dirname, "../..");
const read = (relative: string) => readFileSync(resolve(repoRoot, relative), "utf8");

const MIGRATION = "supabase/migrations/applied/20261001100000_whatsapp_landings_rls_cleanup.sql";
const PAGE = "src/pages/AddWhatsAppPage.tsx";

describe("G02 · grup ekleme giriş ister (RLS yakası)", () => {
  it("migration anonim INSERT politikasını kaldırır", () => {
    const sql = read(MIGRATION);
    expect(sql).toContain('drop policy if exists "Anyone can insert whatsapp landings"');
  });

  it("migration iki mükerrer SELECT politikasını kaldırır", () => {
    const sql = read(MIGRATION);
    expect(sql).toContain('drop policy if exists "Public approved whatsapp landings select"');
    expect(sql).toContain('drop policy if exists "Owners can select own whatsapp landings"');
  });

  it("migration YERİNE anon'a açık yeni bir INSERT politikası KOYMAZ", () => {
    const sql = read(MIGRATION).toLowerCase();
    // `create policy ... to anon` deseni bu dosyada hiç geçmemeli.
    expect(sql).not.toMatch(/create\s+policy[\s\S]*\bto\b[^;]*\banon\b/);
  });

  it("migration kendi doğrulamasını taşır — anon INSERT politikası kalırsa patlar", () => {
    const guard = sliceFrom(read(MIGRATION), "anon_insert_policies <> 0", "G02 guard");
    expect(guard).toContain("raise exception");
  });

  it("⚠️ davet linkini kapattığını İDDİA ETMEZ (K1 G03'ün işi)", () => {
    // Bu migration `Anyone can view approved landings` politikasına DOKUNMAZ;
    // anon hâlâ `whatsapp_link` okuyabilir. Birisi buraya o politikayı da
    // eklerse dizin sessizce boşalır — o iş ayrı batch'te, ayrı kanıtla yapılır.
    expect(read(MIGRATION)).not.toContain('drop policy if exists "Anyone can view approved landings"');
  });
});

describe("G02 · grup ekleme giriş ister (arayüz yakası)", () => {
  it("submit handler önce oturum kapısından geçer", () => {
    const handler = sliceBetween(
      read(PAGE),
      "const handleGroupSubmit",
      "setSubmittingGroup(true)",
      "handleGroupSubmit gövdesi",
    );
    expect(handler).toContain("ensureSignedInForGroupSubmit()");
  });

  it("oturum kapısı girişsiz kullanıcıyı açıkça uyarır", () => {
    // G03b'de kapı `ensureSignedIn(intent)` olarak genelleştirildi ve
    // `ensureSignedInForGroupSubmit` ince bir sarmalayıcıya döndü. Bu testi ilk
    // yazıldığı hâlde bırakmak onu VAKUM yapardı: sarmalayıcının gövdesinde
    // ne `if (user)` ne de uyarı metni var, iddia boş dilimde çalışırdı.
    // Bu yüzden çıpa GERÇEK kapıya taşındı — gevşetme değil, hedef düzeltme.
    const gate = sliceBetween(
      read(PAGE),
      "const ensureSignedIn = async (",
      "signInWithOAuth",
      "ensureSignedIn gövdesi",
    );
    expect(gate).toContain("if (user) return true;");
    // Kullanıcıya Türkçe bir açıklama gösterilmeli — sessizce yönlendirme değil.
    expect(gate).toContain("Üye olmalısınız");
    // Grup ekleme ve davet linki akışları AYRI metin göstermeli; tek metin
    // kullanıcıyı yanlış beklentiye sokar.
    expect(gate).toContain("Grup eklemek için");
    expect(gate).toContain("Davet linkini görmek için");
  });

  it("grup ekleme sarmalayıcısı gerçekten o kapıya bağlıdır", () => {
    expect(read(PAGE)).toContain(
      'const ensureSignedInForGroupSubmit = () => ensureSignedIn("submit_group");',
    );
  });

  it("gönderim hatası kullanıcıya gösterilir, yutulmaz", () => {
    const catchBlock = sliceBetween(
      read(PAGE),
      "await submitLanding({",
      "setSubmittingGroup(false)",
      "handleGroupSubmit catch bloğu",
    );
    expect(catchBlock).toContain("Gönderilemedi");
    expect(catchBlock).toContain('variant: "destructive"');
  });
});
