# Arşiv

Dondurulmuş içerik. Buradaki dosyalar **düzenlenmez, silinmez**; yalnız yeni arşiv eklenir.
Canlı doküman buraya değil, ilgili aktif `docs/` klasörüne yazılır.

| Klasör | İçerik |
|--------|--------|
| `architecture/` | Eski mimari dokümanlar (bakım `docs/ARCHITECTURE.md`'de) |
| `backups/` | Supabase DB dump'ları |
| `root-2026-06-11/`, `root-2026-08-03/`, `root-cleanup-2026-07-14/`, `root-2026-10-06/` | Kök dizin temizliklerinde taşınan dosyalar (klasör adı = temizlik tarihi) |
| `cleanup-2026-05-15/`, `cleanup-2026-05-30/` | Mayıs 2026 temizlik denetimi çıktıları |
| `2026-09-20-guncelligini-yitirenler/` | İşi bitmiş / aşılmış planlar |
| `2026-09-21-retired-edge-functions/` | Emekli edge function kaynakları |
| `2026-09-30-kapanan-is-dokumanlari/` | Kapanan devir notları, durum raporları (taşıma ölçütü kendi `README.md`'sinde) |
| `2026-10-02-kariyer-kaynak-paketi/` | Kariyer sayfası yenilemesinin ham kaynak paketi |
| `kaynak-gorseller/` | Özgün kaynak görseller |
| `taxonomy/`, `turkish_missions_import_builder/` | Eski veri/import çalışmaları |
| `artifacts/`, `assets/`, `private/` | Eski çıktılar, görseller, özel notlar |

## Yeni arşiv eklerken

1. `docs/archive/<YYYY-AA-GG-konu>/` klasörü aç, `git mv` ile taşı (geçmiş korunur).
2. Taşıdığın dosyalara verilen linkleri `grep` ile ara ve güncelle.
3. Bu tabloya bir satır ekle.
