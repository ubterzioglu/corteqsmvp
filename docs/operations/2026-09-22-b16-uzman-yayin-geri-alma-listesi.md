# B16/B17 — 61 uzman kaydının yayın ve geri alma listesi

**Oluşturuldu:** 22 Eylül 2026 · **Kaynak ölçüm:** canlı `catalog_items`
(`item_type='advisor'`, `status='pending_review'`, `deleted_at is null`)

Bu dosya yol haritasının (`docs/kalanlar/2026-09-21-KALANLAR.md`) B15 kararının
şartıdır: **yayından önce geri alma kimlikleri yazılır.** Yayın toplu `UPDATE`
ile değil, aşamalı yapılır (B16 pilot → gözle QA → B17 kalan).

## Kayıtların künyesi — ölçülen gerçek

| import_source | Kayıt |
|---|---|
| `vancouver-toronto-deep-research-20260617` | 40 |
| `melbourne-deep-research-20260617` | 20 |
| `influencers-30k-deep-research-20260617` | 1 |

⚠️ Bunlar **17 Haziran 2026 tarihli araştırma derlemeleridir**, resmî bir kayıt ya da
meslek odası listesi değildir. 61/61 `verification_status='unverified'`,
61/61 `created_by is null` — **hiçbiri kendi kaydını açmadı.** Kayıt bazında kaynak
URL'i saklanmamıştır; künye yalnız derleme adını ve tarihi söyleyebilir.

## Geri alma

```sql
update public.catalog_items
set status = 'pending_review', visibility = 'private'
where id in ( /* aşağıdaki kimlikler */ );
```

`catalog_search_documents` trigger'ı (`trg_catalog_search_document_items`) tazelenmeyi
kendi yapar. Embedding kuyruğu için gerekirse `npm run catalog:embed`.

## Kimlikler (61)

| # | id | slug | şehir | rol | kaynak |
|---|---|---|---|---|---|
| 1 | `327c9c33-ef2e-41f8-a5cf-19344c5fe51f` | `import-berlin-asya-umut-926ab4d5` | Berlin | Consultant_VisaImmigration | influencers-30k-deep-research-20260617 |
| 2 | `9a7ea9b0-b16a-4971-a19a-0cc8f175231c` | `import-burlington-dr-chiler-ataner-3c5a743c` | Burlington | Healthcare_Doctor | vancouver-toronto-deep-research-20260617 |
| 3 | `0096efa8-ba7b-427e-8f69-6fde268e1ffb` | `import-melbourne-burcu-d9f5ec1d` | Melbourne | Consultant_LawTax | melbourne-deep-research-20260617 |
| 4 | `3a04584c-94ef-42a5-9b27-3d777e100cd6` | `import-melbourne-c-burak-binatli-d0397d6c` | Melbourne | Consultant_RealEstate | melbourne-deep-research-20260617 |
| 5 | `73163757-66ae-4ea5-a20e-8121f5cc1712` | `import-melbourne-david-c3f87c9d` | Melbourne | Consultant_RealEstate | melbourne-deep-research-20260617 |
| 6 | `f2df568b-32fc-478d-9372-601431f29be2` | `import-melbourne-dilek-coskun-8eeab3a3` | Melbourne | Consultant_PracticalLife | melbourne-deep-research-20260617 |
| 7 | `3c01ff19-e662-4cf6-b6c4-f2c24c73fabc` | `import-melbourne-dr-cihad-atlihan-8cb1775a` | Melbourne | Healthcare_Dentist | melbourne-deep-research-20260617 |
| 8 | `3489292f-28f6-49e4-8dd1-101514613b05` | `import-melbourne-dr-ibrahim-t-w-izzettin-713f13a1` | Melbourne | Healthcare_Doctor | melbourne-deep-research-20260617 |
| 9 | `7b382428-417e-4fbf-a8c8-4cb160d2c5ea` | `import-melbourne-dr-mesut-komser-48e9e7d5` | Melbourne | Healthcare_Dentist | melbourne-deep-research-20260617 |
| 10 | `15974c10-7723-46df-be7b-29311e2a3064` | `import-melbourne-dr-sunbula-shaheen-ade34770` | Melbourne | Healthcare_Doctor | melbourne-deep-research-20260617 |
| 11 | `f03b651f-208a-4aed-a9ce-ba0bbada10d9` | `import-melbourne-dr-tevfik-kahraman-ffa52571` | Melbourne | Healthcare_Doctor | melbourne-deep-research-20260617 |
| 12 | `d81e207d-ecf0-4dca-91f1-871ed54a55b0` | `import-melbourne-ece-karauc-d711e35b` | Melbourne | Consultant_LawTax | melbourne-deep-research-20260617 |
| 13 | `0d444668-6005-436b-a121-e3ab85c1fe4e` | `import-melbourne-eduaid-immigration-services-d9878ddd` | Melbourne | Consultant_VisaImmigration | melbourne-deep-research-20260617 |
| 14 | `4e645c9d-591f-4b09-9da2-1e2a7f5471f0` | `import-melbourne-esra-aydinli-7adeddc8` | Melbourne | Consultant_LawTax | melbourne-deep-research-20260617 |
| 15 | `726708af-8d03-4421-a7a0-d3e6eb3c203d` | `import-melbourne-jade-eren-5de72d55` | Melbourne | Consultant_LawTax | melbourne-deep-research-20260617 |
| 16 | `3cc97c29-2e07-45e7-9566-17e0222017d8` | `import-melbourne-mehmet-d05dcf4e` | Melbourne | Consultant_PsychologistCoach | melbourne-deep-research-20260617 |
| 17 | `f1f2131f-cf65-4be8-a8f5-8192a3e04db3` | `import-melbourne-melbourne-accounting-solutions-2e89d3c5` | Melbourne | Consultant_LawTax | melbourne-deep-research-20260617 |
| 18 | `76e4c571-aed6-47dc-94f7-0d13acb24fcb` | `import-melbourne-meryem-apak-e40d9238` | Melbourne | Consultant_LawTax | melbourne-deep-research-20260617 |
| 19 | `b1deb8a2-d439-4dd7-b6d1-788e35e749a9` | `import-melbourne-visa-plan-migration-lawyers-789d8021` | Melbourne | Consultant_LawTax | melbourne-deep-research-20260617 |
| 20 | `be972d1a-3e08-4251-83c3-74752059d944` | `import-mississauga-arzu-ferguson-b999dd4c` | Mississauga | Healthcare_Doctor | vancouver-toronto-deep-research-20260617 |
| 21 | `a376818c-d1a8-4c6a-8311-1aba56f1588b` | `import-mississauga-b-n-immigration-consultancy-30fbf6ae` | Mississauga | Consultant_VisaImmigration | vancouver-toronto-deep-research-20260617 |
| 22 | `176e1e44-a10e-41ae-bcf4-03756485e3e5` | `import-montreal-ali-t-argun-e78b4d54` | Montreal | Consultant_LawTax | vancouver-toronto-deep-research-20260617 |
| 23 | `5cc9d61e-fbe7-4abd-ba44-e0b3ba5147d1` | `import-montreal-duygu-barbaros-9af65e09` | Montreal | Consultant_LawTax | vancouver-toronto-deep-research-20260617 |
| 24 | `1231844d-4c44-424c-93c4-ae94768af285` | `import-sydney-cetin-tugberk-gurcan-3fd282a9` | Sydney | Consultant_LawTax | melbourne-deep-research-20260617 |
| 25 | `d06bd29f-e96e-4e93-8ec0-18331603bed8` | `import-toronto-alp-debreli-dcb9de9d` | Toronto | Consultant_LawTax | vancouver-toronto-deep-research-20260617 |
| 26 | `89098408-06f9-4d44-8c3e-aa63b90dd5bb` | `import-toronto-ayla-cintosun-1367c2c4` | Toronto | Healthcare_Doctor | vancouver-toronto-deep-research-20260617 |
| 27 | `34d9be82-6dfd-4b81-8c1b-206e6a7bcf61` | `import-toronto-ayse-figen-kartunay-ee6b83cc` | Toronto | Consultant_PsychologistCoach | vancouver-toronto-deep-research-20260617 |
| 28 | `c8b78e03-cc38-4351-a716-53710b9831aa` | `import-toronto-cemal-acikgoz-7d29ceaf` | Toronto | Consultant_LawTax | vancouver-toronto-deep-research-20260617 |
| 29 | `5a25181b-5eb2-4c67-ae2b-9f3d000718b3` | `import-toronto-cenk-bilgen-2c50b562` | Toronto | Consultant_LawTax | vancouver-toronto-deep-research-20260617 |
| 30 | `ee7b559a-df37-41be-a3f9-c694c79acd6b` | `import-toronto-dr-allison-h-turk-7fd19fe1` | Toronto | Healthcare_Doctor | vancouver-toronto-deep-research-20260617 |
| 31 | `4709fd62-8fe4-463b-a39b-03da709f951b` | `import-toronto-dr-asim-hoca-70f18512` | Toronto | Healthcare_Doctor | vancouver-toronto-deep-research-20260617 |
| 32 | `9e19450c-3212-4d5d-a2f7-d13de2dbe39f` | `import-toronto-dr-emel-arat-0f7d16a4` | Toronto | Healthcare_Doctor | vancouver-toronto-deep-research-20260617 |
| 33 | `30945129-b12a-446d-a429-4bb51506aa3b` | `import-toronto-dr-engin-aras-f39da124` | Toronto | Healthcare_Dentist | vancouver-toronto-deep-research-20260617 |
| 34 | `b389e5d9-adee-4df9-ab8c-b2d49c63825b` | `import-toronto-dr-filiz-dogan-b534d3b0` | Toronto | Healthcare_Doctor | vancouver-toronto-deep-research-20260617 |
| 35 | `59d2c5a4-68d9-4670-9448-36d60cf6c40b` | `import-toronto-dr-gurkan-altuna-6e1eab42` | Toronto | Healthcare_Doctor | vancouver-toronto-deep-research-20260617 |
| 36 | `921d7645-ed40-47b6-a737-6f6b1a6da83f` | `import-toronto-dr-hasan-alkumru-e983be1e` | Toronto | Healthcare_Doctor | vancouver-toronto-deep-research-20260617 |
| 37 | `2e663db9-dead-43bf-b32c-fa5c6887648b` | `import-toronto-dr-kerametlian-d6e8fdf3` | Toronto | Healthcare_Doctor | vancouver-toronto-deep-research-20260617 |
| 38 | `543fb47c-2b62-47f4-9031-275456c706d7` | `import-toronto-dr-nejat-sezer-05f92981` | Toronto | Healthcare_Dentist | vancouver-toronto-deep-research-20260617 |
| 39 | `8f7b9384-d2af-4577-b654-cc644fe872fd` | `import-toronto-edvise-immigration-2c976362` | Toronto | Consultant_VisaImmigration | vancouver-toronto-deep-research-20260617 |
| 40 | `2e1a9221-bfb7-4417-88e1-e31ec30007d6` | `import-toronto-face-accounting-ba0d0fc4` | Toronto | Consultant_LawTax | vancouver-toronto-deep-research-20260617 |
| 41 | `b21fb537-c6aa-4e78-bb0a-b0b2d68d8d65` | `import-toronto-gta-accounting-549887e9` | Toronto | Consultant_LawTax | vancouver-toronto-deep-research-20260617 |
| 42 | `280de654-fb85-4cda-bd79-3464da9da18e` | `import-toronto-maxilla-dental-clinic-3a2d7685` | Toronto | Healthcare_Dentist | vancouver-toronto-deep-research-20260617 |
| 43 | `b8fbd5e7-2510-4953-b189-aef74363f9b3` | `import-toronto-mesut-kumasci-bcc1f38b` | Toronto | Healthcare_Doctor | vancouver-toronto-deep-research-20260617 |
| 44 | `05d84ae8-263d-4d15-af7b-c9d3ebaf390c` | `import-toronto-mesut-yagci-83c200fe` | Toronto | Healthcare_Dentist | vancouver-toronto-deep-research-20260617 |
| 45 | `99ccbdf3-4427-4184-82fc-f59c74aea966` | `import-toronto-murat-kandemir-10efbb2f` | Toronto | Consultant_VisaImmigration | vancouver-toronto-deep-research-20260617 |
| 46 | `ef7d2cf9-09df-4676-978c-28cc37b94a6f` | `import-toronto-nilgun-uzunhasanoglu-cpa-cma-af587778` | Toronto | Consultant_LawTax | vancouver-toronto-deep-research-20260617 |
| 47 | `0546740f-8249-4bdb-b2ba-dd5477a3f897` | `import-toronto-omulique-immigration-lawyers-6dafd13c` | Toronto | Consultant_LawTax | vancouver-toronto-deep-research-20260617 |
| 48 | `4b3dd13d-8d0e-4337-87d4-9ff68de17411` | `import-toronto-sema-gurbuz-d37366d6` | Toronto | Consultant_PsychologistCoach | vancouver-toronto-deep-research-20260617 |
| 49 | `40dbe8ba-ef4e-45bd-b1e6-99257c1029c5` | `import-toronto-soraya-jafari-6199b0ef` | Toronto | Healthcare_Doctor | vancouver-toronto-deep-research-20260617 |
| 50 | `a25792fd-4d03-47c7-9c41-f32d7f802241` | `import-toronto-turan-legal-services-717b4f9d` | Toronto | Consultant_LawTax | vancouver-toronto-deep-research-20260617 |
| 51 | `70fcca4e-de38-4b7b-b6c7-89518f2266a5` | `import-toronto-umit-terzioglu-d47f8e88` | Toronto | Healthcare_Doctor | vancouver-toronto-deep-research-20260617 |
| 52 | `f637058a-a23c-4085-8406-89fd6ad36649` | `import-turkey-crowe-troy-d14239b1` | Turkey | Consultant_BusinessSetupWork | melbourne-deep-research-20260617 |
| 53 | `84693e54-7429-4acb-9c87-851b83fcecf6` | `import-turkey-gsl-law-consulting-6f8bcc08` | Turkey | Consultant_BusinessSetupWork | melbourne-deep-research-20260617 |
| 54 | `2f39b9f4-b271-4e7a-97be-80fd871d8122` | `import-turkey-zahra-consulting-3287e802` | Turkey | Consultant_BusinessSetupWork | vancouver-toronto-deep-research-20260617 |
| 55 | `7d65ab70-e0fe-4add-b321-bc9fee179971` | `import-turkey-toronto-rightway-canada-051323b8` | Turkey-Toronto | Consultant_VisaImmigration | vancouver-toronto-deep-research-20260617 |
| 56 | `ab5b7c5a-dde2-4d37-ae8b-7f11361b4e47` | `import-vancouver-accountant-vancouver-by-wealth-knight-29b98347` | Vancouver | Consultant_LawTax | vancouver-toronto-deep-research-20260617 |
| 57 | `1c92e353-74d8-48d3-aa82-ecb1da96a18d` | `import-vancouver-amir-noien-213377c9` | Vancouver | Consultant_RealEstate | vancouver-toronto-deep-research-20260617 |
| 58 | `b6eff5ad-3273-4abb-a13e-18f2187a72a8` | `import-vancouver-anna-kurt-15903302` | Vancouver | Consultant_LawTax | vancouver-toronto-deep-research-20260617 |
| 59 | `3160f0e3-ddd8-4eff-a77c-bcca0d6c0009` | `import-vancouver-dr-mensurian-f193db4c` | Vancouver | Healthcare_Dentist | vancouver-toronto-deep-research-20260617 |
| 60 | `c21538c0-3b91-4d4e-af5f-0f88d1a5810f` | `import-vancouver-eylem-evelyn-sonmez-466bd2fc` | Vancouver | Consultant_RealEstate | vancouver-toronto-deep-research-20260617 |
| 61 | `7adb98a5-6837-4999-9048-93dcce3ae5be` | `import-vancouver-my-visa-partner-89e12f15` | Vancouver | Consultant_VisaImmigration | vancouver-toronto-deep-research-20260617 |
