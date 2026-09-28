// Hizmet talebi eki güvenlik sözleşmesi (G01) — gevşetme, çağrı yerini düzelt.
//
// `accept=` niteliği yalnız DOSYA SEÇİCİYE VERİLEN BİR TAVSİYEDİR: kullanıcı
// "Tüm dosyalar"ı seçerek, sürükle-bırakla ya da DOM'u düzenleyerek atlar. Formda
// gerçek denetim yoktu; her tür ve her boyut yüklenebiliyordu.
//
// ⚠️ Bu istemci tarafı denetimidir ve TEK BAŞINA GÜVENLİK DEĞİLDİR. Kararlı bir
// saldırgan istemciyi tamamen atlayıp doğrudan depolama API'sine gider. Sunucu
// tarafı kapısı (bucket boyut + MIME kısıtı) ayrı bir iştir ve canlı migration
// gerektirdiği için ONAYA TABİDİR (G03/P01). Buradaki denetim kazayla yanlış dosya
// yükleyen kullanıcıyı ve "sessizce kabul edilmiş gibi görünen" akışı kapatır.

import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { safeStorageFileName, validateServiceAttachment } from "@/lib/security";

const makeFile = (name: string, size: number): File => {
  const file = new File(["x"], name, { type: "application/octet-stream" });
  // `File` boyutu salt okunurdur; testte gerçek içerik üretmek yerine tanımlanır.
  Object.defineProperty(file, "size", { value: size });
  return file;
};

describe("validateServiceAttachment", () => {
  it("izin verilen uzantıları kabul eder", () => {
    for (const name of ["rapor.pdf", "cv.docx", "foto.JPG", "gorsel.webp"]) {
      expect(validateServiceAttachment(makeFile(name, 1024)), name).toBeNull();
    }
  });

  it("çalıştırılabilir ve betik uzantılarını REDDEDER", () => {
    // accept= listesinde olmayan her şey reddedilmeli; bunlar en tehlikelileri.
    for (const name of ["virus.exe", "script.js", "kabuk.sh", "makro.docm", "web.html"]) {
      expect(validateServiceAttachment(makeFile(name, 1024)), name).not.toBeNull();
    }
  });

  it("çift uzantılı adı GERÇEK uzantısına göre değerlendirir", () => {
    // "rapor.pdf.exe" bir exe'dir; ilk uzantıya bakan bir denetim kandırılırdı.
    expect(validateServiceAttachment(makeFile("rapor.pdf.exe", 1024))).not.toBeNull();
  });

  it("15 MB üstünü reddeder, altını kabul eder", () => {
    expect(validateServiceAttachment(makeFile("a.pdf", 15 * 1024 * 1024 + 1))).not.toBeNull();
    expect(validateServiceAttachment(makeFile("a.pdf", 15 * 1024 * 1024 - 1))).toBeNull();
  });

  it("uzantısız dosyayı reddeder", () => {
    expect(validateServiceAttachment(makeFile("dosya", 1024))).not.toBeNull();
  });
});

describe("safeStorageFileName", () => {
  it("dizin dışına çıkma denemesini etkisizleştirir", () => {
    const unsafe = "../../../etc/passwd";
    const safe = safeStorageFileName(unsafe);

    expect(safe).not.toContain("..");
    expect(safe).not.toContain("/");
    expect(safe).not.toContain("\\");
  });

  it("ters bölü ile verilen yolu da temizler (Windows istemcisi)", () => {
    expect(safeStorageFileName("..\\..\\gizli.pdf")).not.toContain("\\");
  });

  it("AYRAÇSIZ addaki nokta dizisini de sadeleştirir", () => {
    // ⚠️ Bu test mutasyon sınamasıyla EKLENDİ. Yalnız `../../../etc/passwd` sınanırken
    // nokta sadeleştirmesi kaldırıldığında test YEŞİL kalıyordu: yol ayracı bölmesi
    // zaten `passwd` bırakıyor, yani o örnek bu korumaya hiç DOKUNMUYORDU.
    // Ayraçsız ad, korumanın tek gerçek sınavıdır (kimi depolama arkayüzleri anahtarı
    // ayrıca normalleştirir ve `..` dizisi orada anlam kazanabilir).
    expect(safeStorageFileName("rapor..taslak.pdf")).not.toContain("..");
  });

  it("boşluk ve Türkçe karakteri güvenli karşılığa çevirir, uzantıyı korur", () => {
    const safe = safeStorageFileName("proje özeti şubat.pdf");

    expect(safe.endsWith(".pdf")).toBe(true);
    expect(safe).toMatch(/^[A-Za-z0-9._-]+$/);
  });

  it("boşa düşen adda sabit bir karşılık döner", () => {
    // Tamamen temizlenen bir ad boş anahtar üretirse yükleme sessizce bozulurdu.
    expect(safeStorageFileName("///")).not.toBe("");
    expect(safeStorageFileName("")).not.toBe("");
  });

  it("aşırı uzun adı kısaltır", () => {
    expect(safeStorageFileName(`${"a".repeat(500)}.pdf`).length).toBeLessThanOrEqual(120);
  });
});

// G03-h — hazırlanan bucket migration'ı istemciyle AYNI hizada kalmalı.
//
// ✅ Migration 2026-09-28'de CANLIYA UYGULANDI (P1) ve dosya `applied/` altına taşındı.
// ⚠️ Test yine de yalnız SQL METNİNİ denetler, canlı durumu değil — testin yeşil olması
// bucket'ın gerçekten sıkılaştırıldığını KANITLAMAZ. Amacı, dosya ile bugünkü istemci
// denetiminin ayrışmamasıdır.
//
// Ayrışmanın bedeli ölçülmüştür: Cadde videosunda (m94) istemci sınırı ile bucket
// tavanı ayrı ayrı değiştirildiğinde kullanıcı 50 MB yükleyip sunucudan anlamsız
// hata alıyordu. Aynı tuzağa düşülmesin.
describe("bucket migration'ı istemci denetimiyle hizada (G03-h)", () => {
  const sql = readFileSync(
    "supabase/migrations/applied/20260928120000_service_attachments_hardening.sql",
    "utf8",
  );

  it("boyut tavanı istemcideki 15 MB ile AYNI", () => {
    expect(sql).toContain("file_size_limit = 15728640");
    expect(15728640).toBe(15 * 1024 * 1024);
  });

  it("izin verilen MIME türleri istemcideki uzantı setini karşılar", () => {
    // pdf · doc · docx · jpg/jpeg · png · webp
    for (const mime of [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]) {
      expect(sql, mime).toContain(mime);
    }
  });

  it("yükleme kuralı SAHİPLİK denetler, yalnız bucket adına bakmaz", () => {
    // Eski kural yalnız `bucket_id`ye bakıyordu: kullanıcı A, B'nin klasörüne
    // yazabiliyordu. Kod anahtarı `<user_id>/...` kuruyor ama bu yalnız istemcinin
    // nezaketiydi.
    expect(sql).toContain("(storage.foldername(name))[1] = auth.uid()::text");
    expect(sql).toContain('drop policy if exists "Authenticated users can upload attachments"');
  });

  it("geri alma bloğu var (canlı migration geri alınabilir olmalı)", () => {
    expect(sql).toContain("GERİ ALMA");
  });

  it("uygulandığı için `applied/` altında ve parent dizinde DEĞİL", () => {
    // Bu iddia 28.09'da TERSİNE DÖNDÜ ve dönmesi doğrudur: dosya o gün canlıya
    // uygulandı, `docs/operations/`ten `applied/` altına taşındı ve schema_migrations
    // kaydı atıldı. Eskiden burada `expect(sql).toContain("HENÜZ UYGULANMADI")` vardı.
    //
    // CLAUDE.md kuralı: parent `supabase/migrations/` içinde başıboş dosya =
    // check:migrations exit 1; `applied/` ise "canlıda kayıtlı" demektir.
    expect(existsSync("supabase/migrations/applied/20260928120000_service_attachments_hardening.sql")).toBe(true);
    expect(existsSync("supabase/migrations/20260928120000_service_attachments_hardening.sql")).toBe(false);
    expect(existsSync("docs/operations/2026-09-28-service-attachments-bucket-hardening.sql")).toBe(false);
  });
});

describe("form ile doğrulama sözleşmesi aynı hizada", () => {
  const form = readFileSync("src/components/ServiceRequestForm.tsx", "utf8");

  it("accept= niteliğindeki her uzantı doğrulamadan da geçer", () => {
    // İkisi ayrışırsa kullanıcı seçicide görünen bir dosyayı ekleyemez (ya da tersi,
    // denetim seçicinin izin verdiğinden geniş olur).
    const match = form.match(/accept="([^"]+)"/);
    expect(match, "accept= niteliği bulunamadı").not.toBeNull();

    const extensions = (match as RegExpMatchArray)[1].split(",").map((part) => part.trim());
    expect(extensions.length).toBeGreaterThan(3);

    for (const extension of extensions) {
      const probe = makeFile(`dosya${extension}`, 1024);
      expect(validateServiceAttachment(probe), extension).toBeNull();
    }
  });

  it("yükleme yolunda ham dosya adı KULLANILMAZ", () => {
    expect(form).toContain("safeStorageFileName(file.name)");
    expect(form).not.toContain("${Date.now()}-${file.name}");
  });

  it("yükleme hatası sessizce yutulmaz", () => {
    // Eskiden `if (!uploadError)` ile atlanıyordu: dosya gitmese de talep
    // gönderiliyor, kullanıcı ekini iletmiş sanıyordu.
    expect(form).toContain("failedUploads");
  });
});

// B3/Y6 (28.09) — bucket PRIVATE'a geçti: SQL ile kod AYNI hizada kalmalı.
//
// Özelik: SQL dosyası uygulanana kadar `docs/operations/` altında, uygulandıktan
// sonra `applied/` altında durur (repo kuralı). Test iki yolu da kabul eder;
// ikisi de yoksa kırmızı olur (migration hiç yazılmamış demektir).
describe("private bucket geçişi (B3/Y6) SQL-kod sözleşmesi", () => {
  const appliedPath =
    "supabase/migrations/applied/20260928210000_service_attachments_private.sql";
  const operationsPath = "docs/operations/2026-09-28-service-attachments-private.sql";
  const sqlPath = existsSync(appliedPath) ? appliedPath : operationsPath;
  const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";

  it("migration dosyası mevcut (operations veya applied)", () => {
    expect(sql, `${sqlPath} bulunamadı`).not.toBe("");
  });

  it("bucket'ı private yapar ve herkese SELECT policy'sini DÜŞÜRÜR", () => {
    expect(sql).toContain("public = false");
    expect(sql).toContain('drop policy if exists "Anyone can view attachments"');
  });

  it("okuma kuralı own-or-admin: giriş yapan herkes TÜM ekleri okuyamaz", () => {
    expect(sql).toContain("service_attachments_select_own_or_admin");
    expect(sql).toContain("(storage.foldername(name))[1] = auth.uid()::text");
    expect(sql).toContain("public.is_admin(auth.uid())");
  });

  it("geri alma bloğu var", () => {
    expect(sql).toContain("GERİ ALMA");
  });

  it("form public URL ÜRETMİYOR — DB'ye path yazıyor", () => {
    const form = readFileSync("src/components/ServiceRequestForm.tsx", "utf8");
    // Gerçek API ÇAĞRISI yasak (yorumda kelimenin geçmesi serbest — bu test
    // ilk halinde yorumdaki "getPublicUrl ölü doğar" notuna takıldı).
    expect(form).not.toContain(".getPublicUrl(");
    expect(form).toContain("attachmentRefs.push(filePath)");
  });

  it("görüntüleme imzalı linkle: ServiceAttachmentLink + createSignedUrl", () => {
    const list = readFileSync("src/components/ServiceRequestsList.tsx", "utf8");
    expect(list).toContain("ServiceAttachmentLink");
    expect(list).not.toContain("href={url}");

    const link = readFileSync("src/components/ServiceAttachmentLink.tsx", "utf8");
    expect(link).toContain("createServiceAttachmentUrl");
  });
});
