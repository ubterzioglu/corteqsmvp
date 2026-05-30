# Script Audit

| ID | Script | Cagrildigi yer | Durum | Karar | Gerekce | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| SCR-001 | `scripts/verify-release.mjs` | `package.json`, `README.md`, teknik dokumanlar | active | keep | Build sonrasi release tutarliligini dogruluyor | Low |
| SCR-002 | `scripts/import-command-center-may13.mjs` | `package.json` | active-manual | keep | Komut merkezi veri importu icin adlandirilmis script | Medium |
| SCR-003 | `scripts/replace-resource-entries-from-csv.mjs` | `package.json`, workspace rehberi | active-manual | keep | Resource entries toplu guncelleme icin aktif operasyon scripti | Medium |
| SCR-004 | `check-existing.ts` | Aktif package/dokuman referansi yok | obsolete | archive | Sayim icin tek amacli root script; klasor duzensizligi olusturuyordu | Low |
| SCR-005 | `truncate-and-import.ts` | Aktif package/dokuman referansi yok | obsolete | archive | Destructive helper; daha yeni import akislari varken root'ta kalmamali | Low |
| SCR-006 | `import-resources.ts` | Aktif package script referansi yok | uncertain | manual-review | Kapsamli eski import araci gibi duruyor; bugun neyin kanonik oldugu net degil | Medium |
