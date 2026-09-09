// 13 Mayıs "WhatsApp grubu ekleme" todo paketinin TOP 10 HOT FIX'e taşınmasını
// kilitler — mig 20260910010000.
//
// NEDEN SÖZLEŞME TESTİ: bu seed'in iki tarafı var ve ikisi de sessizce bozulabilir.
//   1) LİSTE TAVANI — pano en fazla 10 AÇIK madde tutar (trigger `>= 10`'da patlar).
//      Seed 5 madde ekliyor ve o an 4 açık madde vardı: 4+5 = 9. Biri buraya altıncı
//      bir madde eklerse tavan dolar ve panoya bir daha hiçbir şey eklenemez.
//   2) SORU ARALIĞI — anlaşma "acil konu başına en az 5, en fazla 10 soru".
//      Soru sayısı test edilmezse bir maddenin soruları eksilebilir ve cevaplayacak
//      kişi eksik soruyla karşılaşır; kimse fark etmez çünkü hiçbir şey patlamaz.
//
// Sorular BİLİNÇLİ olarak teknik değildir: cevaplayacak kişi geliştirici değil.
// Bu yüzden testler "SORULAR:" başlığını ve numaralı `N)` kalıbını arar — biçim
// bozulursa panoda okunmaz bir metin blokuna döner.
//
// ⚠️ Ölçüm bu seed'in gerekçesini DEĞİŞTİRDİ: beş madde "yapılacak iş" gibi
// yazılmıştı ama grup ekleme özelliği canlıda çalışıyor (/addcom açık, moderasyon
// ekranı admin menüsünde, gönderen rolü ayrımı formda var). DURUM paragrafları bu
// yüzden zorunlu — onları silmek maddeleri yeniden "sıfırdan yapılacak iş" gibi
// gösterir ve yanlış işe girişilir.

import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/** Uygulanınca `applied/` altına taşınır; her iki konumu da kabul et. */
function readMigration(fileName: string): string {
  const candidates = [
    `supabase/migrations/${fileName}`,
    `supabase/migrations/applied/${fileName}`,
  ];
  const found = candidates.find((path) => existsSync(path));
  if (!found) {
    throw new Error(`Migration bulunamadı: ${fileName}`);
  }
  return readFileSync(found, "utf8");
}

const seedSql = () => readMigration("20260910010000_hot_fix_whatsapp_grup_ekleme.sql");

/** Beş maddenin başlıkları — panoda görünen adlar. */
const EXPECTED_TITLES = [
  "GRUP EKLEME POLİTİKASI",
  "GRUP ONAY AKIŞI",
  "GRUP FORMU ALANLARI",
  "ŞEHİR GRUPLARINI TOPLAMA",
  "GRUP EKLEME ÇAĞRISI",
];

const QUESTION_MIN = 5;
const QUESTION_MAX = 10;

/** `$q$ ... $q$` ile alıntılanmış yorum gövdelerini çıkarır. */
function commentBodies(sql: string): string[] {
  return [...sql.matchAll(/\$q\$([\s\S]*?)\$q\$/g)].map((match) => match[1]);
}

describe("TOP 10 HOT FIX — WhatsApp grup ekleme seed'i", () => {
  it("beş maddeyi de ekler", () => {
    const sql = seedSql();
    for (const title of EXPECTED_TITLES) {
      expect(sql).toContain(`'${title}'`);
    }
  });

  it("liste tavanını aşmaz: seed beş madde ekler ve SQL tavanı kendi doğrular", () => {
    const sql = seedSql();

    // Beş `(<ord>, '<başlık>',` girdisi — altıncısı tavanı riske atar.
    const entries = sql.match(/^\s+\d+,\n\s+'[^']+',$/gm) ?? [];
    expect(entries).toHaveLength(EXPECTED_TITLES.length);

    // Tavan kontrolü SQL'in İÇİNDE olmalı: test yalnız metni görür, canlıyı görmez.
    expect(sql).toContain("HOT_FIX_TAVAN");
    expect(sql).toMatch(/v_open_count\s*>\s*10/);
  });

  it("her maddenin altına 5-10 arası numaralı soru yazar", () => {
    const bodies = commentBodies(seedSql());
    expect(bodies).toHaveLength(EXPECTED_TITLES.length);

    for (const body of bodies) {
      const questions = body.match(/(^|\n)\s*\d+\)/g) ?? [];
      expect(questions.length).toBeGreaterThanOrEqual(QUESTION_MIN);
      expect(questions.length).toBeLessThanOrEqual(QUESTION_MAX);
    }
  });

  it("her yorum DURUM paragrafıyla açılır ve SORULAR başlığı taşır", () => {
    for (const body of commentBodies(seedSql())) {
      // DURUM önce gelmeli: soruların bağlamı o paragraftan geliyor.
      expect(body.trimStart().startsWith("DURUM (")).toBe(true);
      expect(body).toContain("SORULAR:");
      expect(body.indexOf("DURUM (")).toBeLessThan(body.indexOf("SORULAR:"));
    }
  });

  it("soru sayısı aralığını SQL de doğrular — sessiz eksilmeyi engeller", () => {
    const sql = seedSql();
    expect(sql).toContain("SORU SAYISI ARALIK DISI");
    expect(sql).toMatch(/v_soru\s*<\s*5\s+or\s+v_soru\s*>\s*10/);
    // Yorumsuz madde de sessizce geçmemeli.
    expect(sql).toContain("YORUMSUZ ACIL MADDE");
  });

  it("seed idempotenttir: aynı başlık ve aynı yorum iki kez eklenmez", () => {
    const sql = seedSql();
    // Madde: başlık zaten varsa v_id dolu gelir ve insert atlanır.
    expect(sql).toMatch(/if v_id is null then/);
    // Yorum: maddenin altında yorum varsa tekrar eklenmez.
    expect(sql).toMatch(/if not exists \(\s*\n\s*select 1 from public\.command_center_hot_fix_comments/);
  });

  it("ölçülen gerçek durumu koruyor — maddeler 'sıfırdan yapılacak iş' sanılmasın", () => {
    const sql = seedSql();

    // Özelliğin canlı olduğu bilgisi düşerse yanlış işe girişilir.
    expect(sql).toContain("/addcom");
    expect(sql).toContain("/admin/whatsapp-landings");

    // Sorular bu üç ölçüme dayanıyor; ölçüm metni silinirse sorular dayanaksız kalır.
    expect(sql).toContain("city = 'Genel'");
    expect(sql).toContain("member_approved = false");
    expect(sql).toContain("whatsapp_join_requests 0 satır");
  });

  it("kaynak todo'ları silmez — iki yüzeyde birlikte durmaları yerleşik desen", () => {
    const sql = seedSql();
    expect(sql).not.toMatch(/update public\.command_center_items[\s\S]*?deleted_at\s*=/);
    expect(sql).not.toMatch(/delete from public\.command_center_items/);
    expect(sql).not.toMatch(/update public\.command_center_items[\s\S]*?archived_at\s*=/);
  });
});
