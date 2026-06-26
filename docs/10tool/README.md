# CorteQS — 10 Araç İçin Claude Code'a Verilecek E2E Doküman Paketi

Bu klasör, ekteki 10 araç fikrini `ubterzioglu/corteqsmvp` reposunun mevcut mimarisine göre ayrı ayrı implementasyon dokümanlarına böler.

## Okuma sırası

1. `00-ortak-mimari-ve-agent-talimatlari.md`
2. Uygulamak istediğin aracın ilgili E2E dosyası.

## Dosyalar

- `00-ortak-mimari-ve-agent-talimatlari.md`
- `01-ulke-secimi-e2e.md`
- `02-meslek-maas-karsilastirma-e2e.md`
- `03-tasinma-hazirlik-skoru-e2e.md`
- `04-sehir-eslestirme-e2e.md`
- `05-diaspora-ag-eslestirme-e2e.md`
- `06-yurtdisi-kariyer-yolu-e2e.md`
- `07-expat-yasam-tarzi-persona-e2e.md`
- `08-ilk-90-gun-planlayici-e2e.md`
- `09-oncelikli-tasinma-sorunu-e2e.md`
- `10-is-bulma-olasiligi-e2e.md`
## Önerilen uygulama sırası

1. Ortak engine.
2. `07-expat-yasam-tarzi-persona-e2e.md`
3. `09-oncelikli-tasinma-sorunu-e2e.md`
4. `03-tasinma-hazirlik-skoru-e2e.md`
5. `04-sehir-eslestirme-e2e.md`
6. `08-ilk-90-gun-planlayici-e2e.md`
7. `01-ulke-secimi-e2e.md`
8. `02-meslek-maas-karsilastirma-e2e.md`
9. `06-yurtdisi-kariyer-yolu-e2e.md`
10. `10-is-bulma-olasiligi-e2e.md`
11. `05-diaspora-ag-eslestirme-e2e.md` — privacy ve mutual-consent daha hassas olduğu için en sona bırakıldı.

## Claude Code için kısa ana prompt

```text
Bu repo için önce AGENT_CONTEXT.md, ARCHITECTURE.md ve CLAUDE.md kurallarını oku. Sonra bu paketteki 00 ortak mimari dokümanını ve uygulayacağın araç E2E dokümanını uygula. Yeni kodda lib/*-api.ts + React Query + Zod + security-definer RPC desenini kullan. Legacy profiles/user_profiles/admin_users tablolarına referans verme. Mutasyonları RPC üzerinden yürüt. Test: npm run verify:text && npm run test && npm run build.
```
