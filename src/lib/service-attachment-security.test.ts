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

import { readFileSync } from "node:fs";

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
// ⚠️ Bu migration HENÜZ UYGULANMADI (onaya tabi, P01). Test SQL metnini denetler,
// canlı durumu değil. Amaç: onay geldiğinde uygulanacak dosya ile bugünkü istemci
// denetimi ayrışmış olmasın.
//
// Ayrışmanın bedeli ölçülmüştür: Cadde videosunda (m94) istemci sınırı ile bucket
// tavanı ayrı ayrı değiştirildiğinde kullanıcı 50 MB yükleyip sunucudan anlamsız
// hata alıyordu. Aynı tuzağa düşülmesin.
describe("bucket migration'ı istemci denetimiyle hizada (G03-h)", () => {
  const sql = readFileSync(
    "docs/operations/2026-09-28-service-attachments-bucket-hardening.sql",
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

  it("dosya migration dizinlerinde DEĞİL (uygulanmadan oraya konmaz)", () => {
    // CLAUDE.md: parent `supabase/migrations/` başıboş dosya = check:migrations exit 1;
    // `applied/` ise "canlıda var" demektir ve sapma raporlanır.
    expect(sql).toContain("HENÜZ UYGULANMADI");
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
