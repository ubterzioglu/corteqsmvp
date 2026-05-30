Admin Üye Takibi Sayı Rozetleri ve WhatsApp Kayıt Görünürlüğü
Summary
Admin girişinden sonra /admin/members ekranındaki Üye Takibi başlık satırına iki kompakt sayaç eklenecek:
Üye Sayısı Form: X
Üye Sayısı WA: Y
WA, karar verdiğimiz şekilde submissions.referral_source = "whatsapp" olan kayıtlar olarak sayılacak.
WhatsApp kaynaklı kayıtlar listede görünmeye devam edecek; ayrıca daha okunur ayırt edilebilmeleri için kaynak alanı net badge olarak gösterilecek.
Key Changes
AdminMembersPage içinde filtrelerden bağımsız iki yeni count state’i eklenecek: formMemberCount, waMemberCount.
Sayılar Supabase’den paralel count: "exact" sorgularıyla çekilecek:
WA: submissions where referral_source = "whatsapp"
Form: submissions where referral_source is null OR referral_source != "whatsapp"
Başlık satırı responsive yapılacak:
Desktop: Üye Takibi ile sayaçlar aynı satırda, sağ/yan tarafta şık küçük kart/badge görünümünde.
Mobile: başlık üstte, sayaçlar altında iki kolon veya tek kolon.
Referral Kaynağı hücresi whatsapp için daha belirgin WhatsApp/WA badge gösterecek; diğer kaynaklar mevcut label davranışını koruyacak.
Mevcut filtre, sayfalama, URL state, detay paneli, edit/import/export/toplu işlem davranışları değişmeyecek.
Interfaces / Data
Yeni tablo, migration veya API endpoint eklenmeyecek.
Kullanılacak mevcut alan: submissions.referral_source.
Üye Sayısı Form ve Üye Sayısı WA global toplam olacak; aktif filtrelerden etkilenmeyecek.
Liste sorgusu mevcut submissions.select("*", { count: "exact" }) yapısını koruyacak, WhatsApp kayıtlarını dışlamayacak.
Test Plan
Hedefli lint:
npx eslint src/pages/admin/AdminMembersPage.tsx
Build:
npm run build
Manuel/admin UI kontrol:
/admin/members açıldığında sayaçlar başlık alanında görünüyor.
referral_source = "whatsapp" kayıtları tabloda görünüyor.
Referral Kaynağı sütununda WhatsApp kayıtları belirgin badge ile okunuyor.
Var olan filtreler, sayfalama ve detay paneli çalışmaya devam ediyor.
Supabase sorgu hatası durumunda sayaçlar 0 veya yükleniyor state’iyle güvenli kalacak; tablo yüklemesi bozulmayacak.
Assumptions
“WA” kayıtları referral_source = "whatsapp" olarak tanımlanacak.
“Form” sayısı, WhatsApp dışındaki tüm submissions kayıtlarıdır.
Arşivlenen kayıtlar da toplam sayılara dahil edilecek; çünkü mevcut üye takibi listesi de varsayılan olarak tüm statüleri gösteriyor.