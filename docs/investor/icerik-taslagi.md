# `/yatirimci` — İçerik Taslağı (gözden geçirme için)

**Okuyucu:** Atınç Akçayöz — Chief Technology Advisor adayı. Kurumsal teknoloji, CIO/CTO
geçmişi; yapay zekâ, fintech ve dijital platformlar odağı. Metin bu gözle yazıldı: pazarlama
dili yerine mimari kararlar, uyum, yönetişim ve dürüst bir "olgunlaşacak alanlar" listesi.

**Kaynak:** sayfadaki her metin `src/lib/investor/investor-content.ts` içindedir. Bu dosya o
metnin okunabilir kopyasıdır — düzeltmeyi kararlaştırdığımızda içerik dosyası değişir, bu
taslak da güncellenir. Sayılar 2026-10-09 ölçümüdür.

> 🟡 işaretli satırlar karar / teyit bekliyor (en altta toplu liste).

---

## Parola ekranı

- **Yatırımcı Alanı**
- Bu sayfa davetlilere özeldir. Size iletilen parolayı girin.
- Hata: "Parola doğrulanamadı." · 3 hatada: "Çok fazla deneme. Lütfen biraz bekleyin." (30 sn)
- Alt satır: CORTEQS · GİZLİ

## Kapak

- Üst etiket: *Yatırımcı Bilgi Dosyası · Teknik Görünüm* 🟡
- **Dünyadaki Türk diasporası için kurulmuş dijital altyapı**
- CorteQS, dünyadaki Türkleri şehir bazlı bağlantılar, topluluklar ve fırsatlar etrafında
  buluşturur. Bu sayfa ürünün arkasındaki teknolojiyi, veriyi ve mühendislik disiplinini özetler.

| Rakam | Etiket | Alt not |
|---|---|---|
| 11 | ürün modülü | 8'i canlıda |
| 292 | veritabanı tablosu | 525 güvenlik politikası |
| 490 | otomatik test dosyası | 11 uçtan uca senaryo |
| 19 | sunucu fonksiyonu | olay ve yapay zekâ işleri |

## 01 · Featurlar — Platformun yaptığı işler

Tek bir uygulamada sosyal akış, dizin, yapay zekâ asistanı, taşınma rehberi, kariyer ve yönetim
araçları. Her modül canlı veritabanı üzerinde, rol bazlı yetkiyle çalışır.

| Modül | Durum | Özet | Öne çıkanlar |
|---|---|---|---|
| Cadde — Diaspora Sosyal Akışı | Canlı | Aynı şehir, aynı ülke ve etkileşim bantlarıyla sıralanan topluluk akışı | Cafe sohbet odaları · Çarşı pazar yeri · Tanıtım kampanyaları · Şikâyet ve moderasyon |
| Dizin ve Akıllı Arama | Canlı | Uzman, işletme ve kurum dizini; ziyaretçiye de açık arama | Aksan duyarsız Türkçe arama · Vektör tabanlı anlamsal arama · Profil sahiplenme ve doğrulama |
| Yapay Zekâ Site Asistanı | Canlı | Platformun kendi içeriğinden beslenen soru-cevap asistanı | Erişime göre süzülen bilgi tabanı · Alaka eşiğiyle uydurma cevap önleme · Her sayfada erişilebilir |
| Profil ve Rol Sistemi | Canlı | 78 aktif rol; her rolün göreceği alan ve özellik veritabanından yönetilir | Kod değişmeden rol/özellik açma · Alan bazlı gizlilik · Çoklu profil |
| Etkinlik ve Topluluk Araçları | Canlı | Etkinlik yayınlama, tavsiye isteme, davet ve liderlik tablosu | Onay kuyruğu · Saat dilimi farkında etkinlikler · Davetle büyüme mekaniği |
| Kariyer | Canlı | İlan yayını ve uçtan uca başvuru yönetimi | Süreli imzalı belge bağlantısı · Yöneticilere otomatik bildirim · Tek yazma yolu |
| Bildirim ve E-posta Hattı | Canlı | Olay tabanlı e-posta kuyruğu ve günlük yönetici özetleri | Kuyruk + zamanlanmış gönderim · Abonelik tercihleri · Hata kayıtlarının merkezi takibi |
| Yönetim Paneli ve Muhasebe | Canlı | 70'i aşkın yönetici ekranı: komuta merkezi, içerik, üyeler, gelir-gider, nakit akışı | Rol tabanlı erişim · Muhasebe modülü · Toplu içe aktarma ve onay |
| Taşınma (Relocation) Motoru | Pilot | Ülke bazlı bürokrasi adımları, hizmet rehberi, değerlendirme araçları | 10 değerlendirme aracı · YZ destekli taşınma asistanı · Motor hazır, içerik genişletiliyor |
| Radar — Haber Tarama | Pilot | Diasporayı ilgilendiren haberleri tarayan ve sınıflayan hat | Zamanlanmış tarama · Dil ve kalite süzgeci · Yönetici onayı |
| Dijital Gruplar | Geliştiriliyor | "Linkini saklama, kapını paylaş": doğrulamalı grup katılımı | Kimlik doğrulamalı katılım · Yönetici onayı · Spam'i kapıda durdurma |

**Teknik ayrıntı:** modüler alan tasarımı (her modül kendi veri/şema/biçim katmanı; ürün
kararları ayar tablolarında, rol bazlı özellik bayrakları) · Türkçe öncelikli arama/sıralama.

## 02 · Teknolojiler — Modern, yaygın ve bakımı kolay bir yığın

Ekosistemi en geniş araçlar seçildi: işe alım kolay, topluluk desteği güçlü, satıcıya
bağımlılık düşük. Yapay zekâ katmanı sağlayıcıdan bağımsız tasarlandı.

- **Ön yüz:** React 18 · TypeScript 5 · Vite 8 · Tailwind 3 + shadcn/ui · React Router 7 · TanStack Query 5 · React Hook Form + Zod
- **Arka uç ve veri:** PostgreSQL (yönetilen) · Supabase (kimlik, API, dosya, gerçek zamanlı) · Deno Edge Functions · pg_cron + pg_net · PostGIS · pg_trgm · unaccent
- **Yapay zekâ:** Google Gemini (sohbet, eşleştirme) · Gemini Embedding 1536 boyut · pgvector HNSW · sağlayıcı soyutlaması
- **Kalite ve test:** Vitest 4 + Testing Library · Playwright 1 · ESLint + tsc
- **Dağıtım:** Docker (çok aşamalı) · nginx · kendi barındırılan PaaS · Node.js 22 _(sürümler bilerek yalnız ana sürüm)_

**Teknik ayrıntı — Yapay zekâ yönetişimi:** erişim düzeyine göre süzme veritabanı içinde ·
ölçülmüş alaka eşiği (bağlam yoksa uydurmaz) · vektörler kendi veritabanımızda · yer tutucu
ve yönetici/test kayıtları bilgi tabanından elenir.
**Neden bu seçimler:** geniş işe alım havuzu · açık kaynak çekirdek, taşınabilir · model
değişimi ayar işi.

## 03 · Serverlar — Konteyner tabanlı, yönetilen veri katmanlı altyapı

Ön yüz Docker konteynerinde nginx ile sunulur; veri, kimlik doğrulama, dosya ve sunucu
fonksiyonları yönetilen PostgreSQL platformunda çalışır. Güvenlik başlıkları ve içerik güvenlik
politikası her yanıtta zorunludur.

Diyagram: Kullanıcı → CDN·TLS → nginx konteyneri (Docker · Coolify) / Kullanıcı → Yönetilen API
(kimlik, REST, dosya; oturum jetonu + RLS) → PostgreSQL ← Sunucu fonksiyonları → Dış servisler
(YZ modeli, e-posta).

| 8 güvenlik başlığı | 0 satır içi betik izni | 14 zamanlanmış iş | 19 sunucu fonksiyonu |
|---|---|---|---|

**Teknik ayrıntı:** istek akışı (anahtarlar yalnız sunucu fonksiyonlarında) · CSP, HSTS,
clickjacking/MIME koruması, COOP/CORP · eski adresler testle kilitli 301'lerle korunur.

## 04 · Database — Güvenliği veritabanının içinde olan bir veri modeli

Yetki kontrolü uygulama kodunda değil, PostgreSQL satır düzeyi güvenliğinde (RLS) yaşar.
Kritik yazma işlemleri yalnız denetlenmiş sunucu fonksiyonlarından geçer.

| 292 tablo (uygulama tablolarının tamamında RLS) | 525 erişim politikası | 400+ denetlenmiş sunucu fonksiyonu |
|---|---|---|
| **836 indeks** | **529 sürümlü şema değişikliği** | **78 aktif rol** (59 alan · 64 özellik) |

**Teknik ayrıntı:** tasarım ilkeleri (RLS, RPC-only yazma, SQL↔TS ayna testleri, sayfalı
okuma) · **KVKK / GDPR** (hesap silme hakkı uçtan uca · telefon herkese açık profil ve\nsayfalarda gösterilmez · ziyaretçi aramasında iletişim bilgisi kullanılmaz · hata kayıtlarına kullanıcı
içeriği gitmez, sınırlı saklama) · değişiklik disiplini (geri alınamaz migration, otomatik
sapma kontrolü, şema anlık görüntüsü).

## 05 · Kodlar — Ölçülen, test edilen, kendini denetleyen bir kod tabanı

Kalite rakamları elle yazılmaz, araçlarla ölçülür. Her değişiklik otomatik kalite hattından
geçer; sessizce bozulabilecek her kritik kural bir sözleşme testiyle kilitlidir.

| 1.039 kaynak dosya | 152 bin satır üretim kodu | 490 test dosyası | 67 ayrı yüklenen sayfa paketi |
|---|---|---|---|

Kalite kapıları: CI her değişiklikte · CI aksiyonları özete sabitli (tedarik zinciri) ·
lint ve tip denetimi · ölü kod taraması · Türkçe karakter bozulma denetimi · şema ↔ canlı sapma ·
fonksiyon repo ↔ canlı sapma · paket boyutu bütçesi.

## 06 · Teknik Danışmanlık — Masadaki tablo

Teknoloji danışmanlığı için dürüst bir başlangıç noktası. Temeller sağlam; büyüme evresinde
stratejik yön ve deneyimin en çok değer katacağı alanlar da açıkça bellidir.

**Güçlü temeller:** veritabanında güvenlik (yetki kararı istemcide değil, politikalarda) · satıcıdan bağımsızlık (açık kaynak çekirdek,
kendi sunucuya taşınma yolu değerlendirildi) · ölçüm kültürü · kurallar testte yaşar ·
yapay zekâ hazır veri katmanı.

**Olgunlaşacak alanlar:** uçtan uca test kapsamı · sunucu fonksiyonu dağıtımı hatta alınmalı ·
tip katılığı kademeli açılmalı · gözlemlenebilirlik (APM + uyarı) · ölçek, önbellek ve maliyet\nplanı. (Sunucu fonksiyonları için: "ön yüz otomatik yayınlanır; fonksiyonların da aynı CI/CD\nhattına bağlanması sıradaki adımdır.")

**Teknik ayrıntı — Mühendislik çalışma modeli:** yapay zekâ destekli geliştirme, yazan ve
inceleyen ajanlar ayrı · önce ölç sonra yaz · kurumsal hafıza repoda.
**Önerilen danışmanlık gündemi:** platform ölçek stratejisi · YZ stratejisi ve yönetişimi ·
güvenlik ve uyum yol haritası · ödeme ve kurumsal entegrasyonlar · mühendislik organizasyonu.

## Kapanış

**Ürün yol haritası:** Dijital Gruplar (telefon + kurumsal doğrulama) · Topluluk motorunun
ücretsiz katmanı · taşınma rehberinde gerçek içerik · uçtan uca test kapsamı.

**Teknik danışmanlık görüşmesi** — Mimariyi, kod tabanını ve büyüme yol haritasını canlı bir
oturumda birlikte değerlendirelim. [Görüşme planlayalım] → info@corteqs.net

Alt not: Rakamlar ölçümdür: kod tabanı 2026-10-09 · canlı veritabanı 2026-10-09. Bu sayfa
gizlidir; lütfen bağlantıyı ve parolayı paylaşmayın.

---

## 🟡 Birlikte karar vereceğimiz noktalar

1. **İsim kişiselleştirme:** Sayfada Atınç Bey'in adı geçmiyor (aynı bağlantı başka
   yatırımcılara da gidebilir). Kapakta "Sayın Atınç Akçayöz için hazırlanmıştır" satırı
   isteniyor mu?
2. **Kapak etiketi:** "Yatırımcı Bilgi Dosyası" mı, "Teknik Danışman Bilgi Dosyası" mı?
3. **Bölüm adları:** "Featurlar / Serverlar / Database / Kodlar" sizin listenizden birebir
   alındı. Türkçe ("Özellikler / Altyapı / Veritabanı / Kod Tabanı") ya da İngilizce tercih?
4. **İletişim:** Görüşme düğmesi `info@corteqs.net`'e gidiyor. Kişisel adres veya takvim
   bağlantısı (Calendly vb.) tercih edilir mi?
5. **Olgunlaşacak alanlar** listesi bilerek açık sözlü. Bir CTO adayı için güven artırır;
   ama tonu yumuşatmak isterseniz buradan başlayalım.
6. **Ekip / kurucular bölümü** yok. Danışmanın kiminle çalışacağını görmesi için kısa bir
   ekip bölümü eklensin mi?
7. **İş metrikleri** (üye sayısı, büyüme) bilerek yok — sayfa teknik odaklı. Eklensin mi?
