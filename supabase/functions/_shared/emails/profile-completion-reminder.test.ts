import { describe, expect, it } from "vitest";

import { buildProfileCompletionReminderEmail } from "./profile-completion-reminder.ts";

describe("buildProfileCompletionReminderEmail", () => {
  it("yüzdeyi konuda ve gövdede gösterir; ilk isimle hitap eder", () => {
    const email = buildProfileCompletionReminderEmail({ full_name: "Ayşe Yılmaz", percentage: 40 });

    // Konunun TAMAMI: Türkçe harf kaybı (tamamlandi/birkac/adim) verify:text'e takılmaz (md.6).
    expect(email.subject).toBe("CorteQS profilin %40 tamamlandı, birkaç adım kaldı");
    expect(email.html).toContain("Merhaba Ayşe,");
    expect(email.html).toContain("%40 tamamlanmış");
    expect(email.text).toContain("%40 tamamlanmış");
  });

  it("isim yoksa nötr hitap kullanır", () => {
    const email = buildProfileCompletionReminderEmail({ percentage: 10 });

    expect(email.html).toContain("Merhaba,");
    expect(email.html).not.toContain("Merhaba undefined");
  });

  it("geçersiz yüzdede yüzde göstermez, saçma değer üretmez", () => {
    for (const percentage of [undefined, null, "yarım", Number.NaN]) {
      const email = buildProfileCompletionReminderEmail({ percentage });
      expect(email.subject).toBe("CorteQS profilini tamamla");
      expect(email.html).not.toContain("%NaN");
    }
  });

  it("yüzdeyi 0-100 aralığına sıkıştırır", () => {
    expect(buildProfileCompletionReminderEmail({ percentage: 250 }).subject).toContain("%100");
    expect(buildProfileCompletionReminderEmail({ percentage: -5 }).subject).toContain("%0");
  });

  it("YALNIZ eksik zorunlu alanları (payload.missing_labels) HTML ve metinde listeler", () => {
    const email = buildProfileCompletionReminderEmail({
      percentage: 40,
      missing_labels: ["Ülke", "İlgi alanları", "", 7, "Telefon"],
    });

    for (const item of ["Ülke", "İlgi alanları", "Telefon"]) {
      expect(email.html).toContain(`>${item}</li>`);
      expect(email.text).toContain(`- ${item}`);
    }
    expect(email.html.match(/<li /g)?.length).toBe(3);
    expect(email.text).toContain("Profilinde eksik kalan alanlar:");
    // Yüzdeyi oynatmayan eski statik öneriler geri gelmesin.
    for (const stale of ["Profil fotoğrafı", "Meslek", "Kısa bir tanıtım yazısı"]) {
      expect(email.html).not.toContain(stale);
      expect(email.text).not.toContain(stale);
    }
  });

  it("missing_labels yoksa/bozuksa liste çizmez, profil sayfasına yönlendirir", () => {
    for (const missing_labels of [undefined, null, "Ülke", [], [""]]) {
      const email = buildProfileCompletionReminderEmail({ percentage: 40, missing_labels });
      expect(email.html).not.toContain("<ul");
      expect(email.text).toContain("Eksik alanları profil sayfanda görebilirsin.");
      expect(email.text).not.toContain("Profilinde eksik kalan alanlar:");
    }
  });

  it("altbilgi gerçek durma koşulunu söyler: eşik varsa %<eşik>, yoksa genel cümle", () => {
    expect(buildProfileCompletionReminderEmail({ percentage: 40, threshold: 60 }).text).toContain(
      "Bu hatırlatmayı CorteQS üyesi olduğun için aldın; profilin %60 doluluğa ulaşınca gelmez.",
    );
    for (const threshold of [undefined, 0, 101, 59.5, "60"]) {
      const email = buildProfileCompletionReminderEmail({ percentage: 40, threshold });
      expect(email.text).toContain("profilin yeterince dolunca gelmez.");
      expect(email.html).toContain("profilin yeterince dolunca gelmez.");
    }
    expect(buildProfileCompletionReminderEmail({}).text).not.toContain("tamamlanınca gelmeyi bırakır");
  });

  it("eksik alan etiketini HTML olarak çalıştırmaz", () => {
    const email = buildProfileCompletionReminderEmail({ missing_labels: ["<img src=x onerror=alert(1)>"] });

    expect(email.html).not.toContain("<img");
    expect(email.html).toContain("&lt;img");
  });

  it("/profile bağlantısı hem buton hem düz adres; siteUrl sondaki eğik çizgiyi atar", () => {
    const email = buildProfileCompletionReminderEmail({ percentage: 30 }, "http://localhost:8080/");

    expect(email.html.match(/http:\/\/localhost:8080\/profile/g)?.length).toBeGreaterThanOrEqual(2);
    expect(email.html).not.toContain("localhost:8080//profile");
    expect(email.text).toContain("http://localhost:8080/profile");
    // Mailde abonelikten çıkma bağlantısı YOK; gizlilik bağlantısı her iki sürümde de durmalı.
    expect(email.text).toContain("Gizlilik politikası: http://localhost:8080/legal/privacy");
    expect(email.html).toContain('href="http://localhost:8080/legal/privacy"');
    expect(buildProfileCompletionReminderEmail({}).text).toContain("https://corteqs.net/profile");
  });

  it("serbest metni HTML olarak çalıştırmaz", () => {
    const email = buildProfileCompletionReminderEmail({ full_name: "<script>alert(1)</script>" });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("e-posta iskeleti: 600px table, flex/grid yok, düz metin dolu ve etiketsiz", () => {
    const email = buildProfileCompletionReminderEmail({ percentage: 20 });

    expect(email.html).toContain('<meta charset="utf-8">');
    expect(email.html).toContain('width="600"');
    expect(email.html).not.toMatch(/display:\s*(flex|grid)/);
    expect(email.text.length).toBeGreaterThan(100);
    expect(email.text).not.toMatch(/<[a-z/]/i);
  });
});
