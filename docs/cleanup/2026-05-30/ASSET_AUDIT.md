# Asset Audit

Bu passta sadece acik referansi veya yuksek runtime anlami olan dosyalar guvenli `keep` kategorisine alindi. Referansi bulunamayan ama runtime/operasyon niyeti olabilecek dosyalar tasinmadi.

| ID | Dosya | Referans / gozlem | Karar | Gerekce | Risk |
| --- | --- | --- | --- | --- | --- |
| AST-001 | `public/env-config.js` | `index.html`, `server.mjs`, `nginx.conf.template`, `docker-entrypoint-env.sh` | keep | Runtime config injection'in parcası | High |
| AST-002 | `public/favicon.svg` | `index.html`, `lansman/index.html` | keep | Public icon giris noktasi | Low |
| AST-003 | `public/favicon.ico` | Tarayici fallback dosyasi | keep | Standard web asset | Low |
| AST-004 | `public/og-image.png` | `index.html`, `src/lib/marquee.ts`, `src/components/MarqueeItemCard.tsx`, migrations | keep | OG ve fallback image olarak aktif | Low |
| AST-005 | `public/logocorteqsbig.png` | `index.html`, `src/lib/marquee.ts`, migrations | keep | Marka/structured data varligi | Low |
| AST-006 | `public/robots.txt` | `public/llms.txt`, site yayini | keep | SEO standardi | Low |
| AST-007 | `public/sitemap.xml` | `public/robots.txt`, `public/llms.txt` | keep | SEO standardi | Low |
| AST-008 | `public/.well-known/security.txt` | Well-known path; direkt kod referansi yok | keep | Guvenlik bildirim standardi | Low |
| AST-009 | `public/og/lansman.jpg` | `lansman/index.html` | keep | Lansman OG gorseli | Low |
| AST-010 | `public/videos/footer-community.mp4` | `src/components/FooterSection.tsx` | keep | Aktif video kaynak referansi var | Low |
| AST-011 | `src/assets/may19-globe-pins.png` | `src/pages/May19CampaignPage.tsx` | keep | Aktif import var | Low |
| AST-012 | `src/assets/may19-ideas.jpg` | `src/pages/May19CampaignPage.tsx` | keep | Aktif import var | Low |
| AST-013 | `src/assets/may19-moments.jpg` | `src/pages/May19CampaignPage.tsx` | keep | Aktif import var | Low |
| AST-014 | `public/sharedx/maillogo.png` | Aktif kod referansi bulunmadi; onceki cleanup raporunda korunmus public kopya olarak geciyor | manual-review | Mail/harici template kullanim ihtimali var | Medium |
| AST-015 | `public/placeholder.svg` | Mevcut ana uygulamada referans bulunmadi; yalniz referans subtree'de benzeri kullanim var | manual-review | Public fallback asset olma ihtimali nedeniyle tasinmadi | Medium |
| AST-016 | `public/fav.png` | Aktif kod referansi bulunmadi | manual-review | Eski favicon/social asset olma ihtimali var | Medium |
| AST-017 | `src/assets/ataturk-marker.png` | Mevcut ana uygulamada referans bulunmadi | manual-review | May19 veya ilerideki map akislari icin ayrilmis olabilir | Medium |
