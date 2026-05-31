# CorteQS Documentation Index

Bu klasor, aktif teknik dokumani, modul belgelerini, operasyon notlarini ve gecmis raporlari tek yerde toplar.

## Klasor Sozlugu

- `architecture/`: guncel sistem mimarisi, teknik genel bakis ve runtime davranislari.
- `modules/`: belirli urun/modul belgeleri.
- `operations/`: deploy, database, security ve release odakli operasyon rehberleri.
- `guides/`: gunluk kullanim ve admin/developer rehberleri.
- `decisions/`: bu passta henuz ADR cikarilmayan ama ileride ayrilacak teknik kararlar icin ayrilmis alan.
- `cleanup/2026-05-30/`: bu cleanup calismasinin baseline, envanter, manifest ve validation ciktisi.
- `history/`: tamamlanmis planlar, durum raporlari ve onceki cleanup ciktisi.
- `inbox-review/`: guncelligi veya siniflandirmasi kesinlestirilemeyen dosyalar.

## Aktif Mimari Belgeler

- `architecture/PROJECT_TECHNICAL_OVERVIEW.md`
- `architecture/CORTEQS_LANDING_TEKNIK_DOKUMANTASYON.md`

## Modul Belgeleri

- `modules/surveys/anket.md`
- `modules/surveys/survey.md`
- `modules/cadde/cadde.md`
- `modules/profiles/profil.md`
- `modules/rolesgo/rolesgo.md`
- `modules/new-member/new-member-system-login-roller-featurelar.md`
- `modules/new-member/new-member-system-son-durum-cok-basit.md`
- `modules/new-member/v2.md`
- `modules/commercial/commercial-contributor-structure.md`
- `modules/marquee/marquee-haber-akisi.md`

## Operasyon ve Kullanim Rehberleri

- `operations/database/dosyalardatabase.md`
- `guides/anket-user-guide.md`
- `guides/rolesgo-mvp-kullanim-klavuzu.md`
- `guides/topluluk-yonetimi-kullanma-klavuzu.md`
- `guides/workspace-resources-admin-kullanim-rehberi.md`

## History

`history/` altinda tarihsel degeri olan ama aktif referans noktasi olmayan planlar, cleanup raporlari ve durum notlari tutulur. Bu klasordeki dosyalar silinmez; yalnizca baglam saglamak icin saklanir.

## Inbox Review

`inbox-review/` altina tasinan dosyalar, teknik olarak tasinmasi guvenli ama guncellik veya sahiplik bilgisi net olmayan belgelerdir. Bu passta bu dosyalar yeniden yazilmaz.

## Yeni Dokuman Ekleme Kurallari

- Root yerine uygun `docs/` alt klasorunu kullanin.
- Isimlendirmede mevcut domain dilini koruyun.
- Tarihsel bir rapor yaziyorsaniz `history/` altina gidin.
- Operasyonel bir adim veya runbook ekliyorsaniz `operations/` ya da `guides/` altina koyun.
- Belgenin guncelliginden emin degilseniz once `inbox-review/` veya ilgili cleanup raporuna not dusun.
