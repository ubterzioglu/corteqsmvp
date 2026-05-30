# File Candidates

Bu liste, otomatik silinmeyen veya sadece dusuk riskte arşivlenen dosya adaylarini kaydeder.

| ID | Dosya | Kategori | Durum | Onerilen islem | Gerekce | Referans kontrolu | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FC-001 | `check-existing.ts` | obsolete-script | confirmed | archive | Root'ta duran tek amacli sayim scripti; package script veya dokuman referansi yok | Repo aramasinda aktif referans bulunmadi | Low |
| FC-002 | `truncate-and-import.ts` | obsolete-script | confirmed | archive | Root'ta duran yikici import yardimcisi; `scripts/replace-resource-entries-from-csv.mjs` tarafindan fiilen superseded | Repo aramasinda aktif referans bulunmadi | Low |
| FC-003 | `import-resources.ts` | script | uncertain | manual-review | Root seviyede kalmis manuel import scripti; package scripti yok ama Supabase import akisiyla iliskili olabilir | Yalniz lint ve kendi console cikislari goruldu | Medium |
| FC-004 | `src/test/example.test.ts` | old-test | uncertain | manual-review | Ornek test dosyasi; zararsiz ama gercek davranis kapsamiyor | Teknik dokumanda referanslandi, uygulama kodundan cagrilmiyor | Low |
| FC-005 | `docu/info-influencer-partner.html/**` | legacy-doc-bundle | uncertain | manual-review | HTML, PNG ve DOCX paketi bir arada; yayin/distribution akisi net degil | Aktif runtime referansi tespit edilmedi | Medium |
| FC-006 | `docu/info-strategic-partner.html/**` | legacy-doc-bundle | uncertain | manual-review | HTML, PNG ve DOCX paketi bir arada; yayin/distribution akisi net degil | Aktif runtime referansi tespit edilmedi | Medium |
| FC-007 | `docu/reference/images/**` | reference-assets | uncertain | manual-review | Gorsellerin docs mi yoksa yayin materyali mi oldugu net degil | Dogrudan uygulama importu gorulmedi | Medium |
| FC-008 | `.playwright-mcp/*.log`, `.playwright-mcp/*.yml` | tool-artifact | uncertain | manual-review | Tool artifakti gibi gorunuyor ama mevcut `.gitignore` ve takip durumu repo disiplini konusu | Repo aramasinda yalniz kendi artifact iceriginde gorunuyor | Medium |
