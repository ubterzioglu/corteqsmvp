/**
 * KR02 güvenlik sözleşmesi — `career_applications` migration metni.
 *
 * Bu testler **canlı davranışı** değil, migration'ın METNİNİ denetler: canlı
 * ölçüm batch kapanışında yapıldı (anon INSERT 42501 · anon SELECT 42501 · RPC
 * 200 · hız sınırı 6. çağrıda 53400). Metin testinin işi, birinin yarın bu
 * kararları sessizce geri almasını engellemek.
 *
 * Gelen paket SQL'i bu üç kusuru taşıyordu; üçü de burada kilitli.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const MIGRATION = "20261001130000_career_applications.sql";
const paths = [`supabase/migrations/applied/${MIGRATION}`, `supabase/migrations/${MIGRATION}`];

const sql = () => {
  const path = paths.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

/**
 * Yorumları atılmış gövde. ⚠️ Gerekli: bu migration'ın başlığı gelen paketin
 * hatalarını ANLATIYOR ve içinde `has_role`, `octet-stream` gibi terimler geçiyor.
 * Ham metne bakan bir iddia, yasakladığı şeyi kendi açıklamasında bulup düşer —
 * ilk yazımda tam olarak bu oldu.
 */
const code = () =>
  sql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

describe("career_applications migration sözleşmesi", () => {
  it("`has_role` KULLANMAZ — bu projede o fonksiyon yok", () => {
    // Gelen SQL has_role(auth.uid(),'admin') çağırıyordu; olduğu gibi
    // çalıştırılsaydı "function has_role does not exist" ile düşerdi.
    expect(code()).not.toContain("has_role");
  });

  it("yönetici kapısı argümanlı `is_admin(auth.uid())`", () => {
    const body = code();

    expect(body).toContain("public.is_admin(auth.uid())");
    // Argümansız çağrı sessizce yanlış kişiyi yetkilendirmez, ama derlenmez de:
    // imza uyuşmazlığı migration'ı düşürür. Yine de deseni kilitliyoruz.
    expect(body).not.toMatch(/is_admin\(\s*\)/);
  });

  it("anon'a tabloya yazma yetkisi VERİLMEZ, tek yol RPC'dir", () => {
    const body = code();

    expect(body).toContain("revoke all on table public.career_applications from anon, authenticated");
    // Paketin "anon can apply" INSERT politikası bilerek alınmadı: tabloda hiç
    // INSERT politikası YOK. (Kovadaki yükleme politikası ayrıdır, o anon'a açık.)
    expect(body).not.toMatch(/on public\.career_applications\s+for insert/i);
    expect(body).toContain("grant execute on function public.submit_career_application");
  });

  it("RPC `status` ve `notes` değerlerini gövdede zorlar", () => {
    const body = code();

    // İstemci bu ikisini parametre olarak GÖNDEREMEZ: imzada yer almıyor.
    expect(body).not.toContain("p_status");
    expect(body).not.toContain("p_notes");
    expect(body).toMatch(/'yeni',\s*\n\s*null/);
  });

  it("dosya anahtarı başvurunun kendi klasörüne bağlanır", () => {
    const body = code();

    expect(body).toContain("career_invalid_cv_path");
    // Depolama politikası anahtar desenini de denetler (paket hiç denetlemiyordu).
    expect(body).toContain("and name ~ '^[0-9a-fA-F]{8}-");
    expect(body).toContain("(cv|cover-letter|presentation)-");
  });

  it("kova private ve `application/octet-stream` kabul etmez", () => {
    const body = code();

    expect(body).toMatch(/insert into storage\.buckets[\s\S]{0,300}?'career-applications',[\s\S]{0,120}?false,/);
    // octet-stream her şeyi kabul eden değerdir; MIME sınırını fiilen kaldırır.
    expect(body).not.toContain("application/octet-stream");
  });

  it("hız sınırı iki katmanlı ve e-posta anahtarlı", () => {
    const body = code();

    expect(body).toContain("career_email_daily_limit");
    expect(body).toContain("career_intake_rate_limited");
    expect(body).toContain("53400");
  });
  it("fırlatılan her hata `career_` önekli snake_case koddur", () => {
    // ⚠️ İngilizce cümle fırlatmak KR03'ün çift yönlü hata haritasını kırılgan
    // yapardı: mesaj metni değişince eşleme sessizce düşer ve kullanıcı ham
    // İngilizce görür (`service-finder-format.ts` deseni). Kod sabit kalır.
    const raised = [...code().matchAll(/raise exception '([^']+)'/g)].map((match) => match[1]);

    expect(raised.length).toBeGreaterThanOrEqual(12);
    for (const value of raised) expect(value).toMatch(/^career_[a-z_]+$/);
  });
});