# Cadde Kabul Durumu — m76 / m92 / m134 / m135

**Tarih:** 2026-08-30

## Hazır kabul senaryoları

- Kullanıcı A görselli gönderi paylaşır; kullanıcı B yorumlar; A yorumu görür.
- A onaylı giriş kullanan bir cafe açar; B katılım talebi gönderir.
- Cafe sahibi B'nin açık profil bağlantısını açar ve talebi onaylar.
- İkinci bir cafe üzerinde ret akışı doğrulanır.
- Testin oluşturduğu QA cafeleri `finally` aşamasında arşivlenir.

## Mevcut kanıt

- İlgili 49 unit/component testi geçti.
- Playwright sözleşmesi Chromium'da yüklendi; staging hesabı değişkenleri olmadığı için
  iki gerçek kullanıcı testi beklendiği gibi skip edildi.
- `public/newlogo.png` görsel olarak incelendi: dosya geçerli, okunabilir ve
  `CaddePage` üzerindeki `CorteQS Cadde` erişilebilir adıyla kullanılıyor.

## Kapatma kapısı

`CADDE_E2E_ENV=staging`, `PLAYWRIGHT_BASE_URL` ve iki QA hesabı tanımlanarak aşağıdaki
komut gerçekten geçmeden workshop işaretleme SQL'i çalıştırılmaz:

```bash
npx playwright test e2e/cadde-staging-multiuser.spec.ts --project=chromium
```

Bu nedenle m76/m92/m134 henüz canlı kabul edilmiş sayılmaz. m135 için görsel dosya
kontrolü tamamlandı; toplu SQL diğer üç maddeyle birlikte bekletiliyor.

