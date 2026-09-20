-- Etkinlik saatinin referansı: IANA saat dilimi.
--
-- NEDEN: `events.start_time` / `end_time` sütunları `time without time zone`
-- tipindedir — çıplak duvar saati. Bugüne kadar "hangi ülkenin 19:00'u" bilgisi
-- HİÇBİR yerde tutulmuyordu. Diasporada bu sessiz bir kusurdur: Katar'daki üye
-- Berlin'deki bir online etkinliği "19:00" diye görür, iki saat geç kalır ve
-- hiçbir yerde hata çıkmaz. Dahası ülke alanı formda yalnız fiziksel/hibrit
-- etkinlikte çiziliyordu; online etkinlikte saatin referansı hiç sorulmuyordu.
--
-- NEDEN ÜLKE DEĞİL SAAT DİLİMİ: ülke adı yaz saati kuralını taşımaz. "Almanya"
-- 27 Ekim'den sonra bir saat kayar; `Europe/Berlin` kaymaz.
--
-- NEDEN NOT NULL DEĞİL: bu migration canlıya, yeni paket dağıtılmadan ÖNCE
-- uygulanır. O pencerede canlıdaki eski paket hâlâ timezone'suz insert atar;
-- NOT NULL her etkinlik gönderimini düşürürdü. Sütun boş kaldığında arayüz
-- referansı hiç göstermez — yanlış bir "Türkiye saatiyle" etiketi, etiketsiz
-- saatten daha zararlıdır.
--
-- NEDEN CHECK VAR: `events.type` üzerinde CHECK OLMAMASI, 19 Eylül 2026'da
-- ASCII'ye düşürülmüş kategori değerlerinin sessizce kaydedilmesinin sebebiydi.
-- Buradaki kısıt biçim denetler: "Almanya" ya da "Europe Berlin" yazılamaz.
-- Geçerli saat dilimi LİSTESİ TypeScript tarafındadır (`src/lib/events-timezone.ts`)
-- ve `src/lib/events-timezone.test.ts` bu iki tarafı birbirine kilitler.
--
-- Ölçüldü (uygulama öncesi, canlı): `public.events` 0 satır — geri dolum yok.

alter table public.events
  add column if not exists timezone text;

comment on column public.events.timezone is
  'Etkinlik saatinin IANA saat dilimi (ör. Europe/Berlin). start_time/end_time bu '
  'saat diliminde okunur. NULL = 20.09.2026 öncesi kayıt; arayüz referans göstermez.';

alter table public.events
  drop constraint if exists events_timezone_format;

alter table public.events
  add constraint events_timezone_format
  check (timezone is null or timezone ~ '^[A-Za-z]+(/[A-Za-z0-9_+-]+)+$');
