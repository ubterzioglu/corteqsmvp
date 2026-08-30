import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { SOCIAL_LINKS, buildMemberWelcomeEmail } from "./member-welcome.ts";

const BASE = { email: "uye@example.com", fullName: null as string | null };

describe("buildMemberWelcomeEmail", () => {
  it("isim varsa ilk ismiyle hitap eder", () => {
    const email = buildMemberWelcomeEmail({ ...BASE, fullName: "Ahmet Mehmet Yılmaz" });

    expect(email.subject).toBe("CorteQS'e hoş geldin Ahmet");
    expect(email.html).toContain("Merhaba Ahmet,");
    expect(email.text).toContain("Merhaba Ahmet,");
  });

  it("isim yoksa nötr hitap kullanır ve e-postadan isim türetmez", () => {
    for (const fullName of [null, "", "   "]) {
      const email = buildMemberWelcomeEmail({ email: "u.terzioglu@example.com", fullName });

      expect(email.subject).toBe("CorteQS'e hoş geldin");
      expect(email.html).toContain("Merhaba,");
      // E-postanın @ öncesi hitap olarak KULLANILMAMALI.
      expect(email.html).not.toContain("Merhaba u.terzioglu");
    }
  });

  it("ad ve e-postadaki HTML'i kaçırır", () => {
    const email = buildMemberWelcomeEmail({
      email: "hacker\"@example.com",
      fullName: "<script>alert(1)</script>",
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain('hacker"@example.com');
    expect(email.html).toContain("hacker&quot;@example.com");
  });

  it("profil CTA'sını hem buton hem düz bağlantı olarak verir", () => {
    const email = buildMemberWelcomeEmail(BASE);

    // Görseller/butonlar engellenirse diye adres metin olarak da bulunmalı.
    expect(email.html.match(/https:\/\/corteqs\.net\/profile/g)?.length).toBeGreaterThanOrEqual(2);
    expect(email.text).toContain("https://corteqs.net/profile");
  });

  it("siteUrl'in sonundaki eğik çizgiyi temizler", () => {
    const email = buildMemberWelcomeEmail({ ...BASE, siteUrl: "http://localhost:8080/" });

    expect(email.html).toContain("http://localhost:8080/profile");
    expect(email.html).not.toContain("localhost:8080//profile");
  });

  it("yanıt adresi verilirse destek metninde onu gösterir", () => {
    const withReply = buildMemberWelcomeEmail({ ...BASE, replyTo: "destek@corteqs.net" });
    expect(withReply.html).toContain("mailto:destek@corteqs.net");

    const withoutReply = buildMemberWelcomeEmail(BASE);
    expect(withoutReply.html).not.toContain("mailto:");
    expect(withoutReply.html).toContain("https://corteqs.net/iletisim");
  });

  it("düz metin sürümü dolu ve HTML etiketi içermiyor", () => {
    const email = buildMemberWelcomeEmail({ ...BASE, fullName: "Ada" });

    expect(email.text.length).toBeGreaterThan(200);
    expect(email.text).not.toMatch(/<[a-z/]/i);
    expect(email.text).toContain("uye@example.com");
  });

  it("gelen kutusu önizlemesi için gizli preheader içerir", () => {
    const { html } = buildMemberWelcomeEmail(BASE);

    expect(html).toContain("Profilini tamamlayarak başlayabilirsin.");
    expect(html).toContain("display: none");
  });

  it("mobil ve Outlook için gereken iskeleti korur", () => {
    const { html } = buildMemberWelcomeEmail(BASE);

    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('name="viewport"');
    // 600px table tabanlı yerleşim — flexbox/grid'e kayarsa Outlook'ta dağılır.
    expect(html).toContain('width="600"');
    expect(html).not.toMatch(/display:\s*(flex|grid)/);
    // Görsel engellenince bilgi kaybolmasın: logonun alt metni olmalı.
    expect(html).toContain('alt="CorteQS"');
  });

  it("görsel, hoş geldin mesajı ve kısa başlangıç yol haritasını birlikte içerir", () => {
    const email = buildMemberWelcomeEmail(BASE);

    expect(email.html).toContain("/sharedx/maillogo.png");
    expect(email.subject).toContain("hoş geldin");
    expect(email.html).toContain("Nereden başlasan?");
    expect(email.html).toContain("Profilini tamamla");
    expect(email.html).toContain("Cadde");
    expect(email.html).toContain("Rehber");
    expect(email.html).toContain("Kaynaklar");
  });

  it("tüm sosyal bağlantıları hem HTML hem metin sürümüne koyar", () => {
    const email = buildMemberWelcomeEmail(BASE);

    for (const link of SOCIAL_LINKS) {
      expect(email.html).toContain(link.href);
      expect(email.text).toContain(link.href);
    }
  });
});

// Edge Function deploy'u yalnız supabase/functions/ klasörünü yüklediği için şablon src/
// altından import edemez ve sosyal adresleri tekrarlar. Bu test o kopyanın kaynağından
// sapmasını yakalar: Footer'daki bir adres değişip şablon güncellenmezse burası kırılır.
describe("sosyal bağlantı ayna sözleşmesi", () => {
  it("SOCIAL_LINKS, Footer.tsx + contact-links.ts ile aynı adresleri kullanır", () => {
    const root = process.cwd();
    const sources = ["src/components/Footer.tsx", "src/lib/contact-links.ts"]
      .map((relativePath) => readFileSync(path.join(root, relativePath), "utf8"))
      .join("\n");

    for (const link of SOCIAL_LINKS) {
      expect(sources, `${link.label} adresi kaynakla eşleşmiyor: ${link.href}`).toContain(link.href);
    }
  });
});
