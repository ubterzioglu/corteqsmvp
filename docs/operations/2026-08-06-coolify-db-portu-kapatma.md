# Coolify PostgreSQL — portu dışa kapatma runbook'u

> **Karar (2026-08-06, kullanıcı):** Veritabanı **silinmeyecek, kalacak**. Yalnız
> **5432 portu dışa kapatılacak**. Bu veritabanına şu an erişilmeyecek; uygulama
> Supabase üzerinden devam ediyor.

## Neden

2026-08-05'te Supabase → Coolify self-hosted PostgreSQL geçişi denendi ve **iptal edildi**
(ayrıntı: `CLAUDE.md` ve oturum notları). Geçiş iptal olmasına rağmen sunucuda üretim
verisinin tam bir kopyası kaldı ve port internete açık durumda.

### Ölçülen durum (2026-08-06)

| | |
|---|---|
| Host / port | `87.106.222.106:5432` |
| Erişilebilirlik | **açık** — `Test-NetConnection` → `TcpTestSucceeded = True` |
| Kimlik | `postgres` superuser, parola düz metin olarak `.env.local` ve kökteki bir `.md` dosyasındaydı (ikisi de 2026-08-05'te temizlendi) |
| İçerik | 237 tablo · 152 dolu tablo · **158 kullanıcı satırı** · 391 fonksiyon |
| Sürüm | PostgreSQL 18.4 (postgres:18-alpine) |

Yani: **kimlik bilgisi bilinen, internete açık, üretim verisi taşıyan bir superuser
bağlantısı.** Riski kapatan tek şey portun kapanmasıdır.

## Yapılacaklar (Coolify panelinden — psql'den YAPILAMAZ)

Aşağıdakiler sunucu/panel işidir. `psql` ile bağlanıp SQL çalıştırmak portu kapatmaz,
parolayı döndürmez; bu yüzden ajan tarafından yapılamaz.

### 1. Portu dışa kapat (asıl iş)

Coolify panelinde ilgili PostgreSQL kaynağına git:

- **Configuration → Network / Ports** bölümünde public port eşlemesini **kaldır**
  (`5432:5432` yayınını kapat). Coolify sürümüne göre bu ayar
  *"Public Port"* / *"Ports Exposes"* / *"Make it publicly available"* gibi
  adlandırılabilir — etiket farklı olsa da aradığın şey **dışa açılan port eşlemesi**.
- Kaynağı **redeploy** et; port eşlemesi ancak konteyner yeniden yaratılınca düşer.

Veritabanı kapatılmaz, silinmez — yalnız dışarıdan erişim kesilir. Aynı Docker ağındaki
servisler (varsa) erişmeye devam eder.

### 2. Doğrula (bu adım atlanmaz)

Kapattıktan sonra **dışarıdan** bağlantı denemesi başarısız olmalı:

```powershell
Test-NetConnection -ComputerName 87.106.222.106 -Port 5432
# Beklenen: TcpTestSucceeded = False
```

```bash
# Alternatif (bash):
nc -vz -w 5 87.106.222.106 5432
# Beklenen: baglanti kurulamadi / timeout
```

⚠️ **Panelde ayarı değiştirmek yeterli değildir** — redeploy edilmeden eski konteyner
eski port eşlemesiyle çalışmaya devam eder. Doğrulamayı mutlaka yukarıdaki komutla yap.

### 3. Parolayı döndür (önerilir, karar dışı)

Superuser parolası bir süre düz metin dosyalarda durdu ve bu oturumda dışarıdan
kullanıldı. Port kapandıktan sonra risk büyük ölçüde düşer, ama parolanın kendisi
"bilinen" sayılmalı. Coolify → Database → **Environment / Credentials** üzerinden
yenileyip redeploy etmek ucuz bir ek güvenlik adımıdır.

## Yapılmayacaklar

- **Veritabanı silinmeyecek.** (Karar 2026-08-06.)
- **Bu veritabanına uygulama bağlanmayacak.** Repoda `COOLIFY_DB_*` / `DATABASE_URL`
  referansı **sıfırdır** — `.env.local` 2026-08-05'te temizlendi. Yeniden eklenmemeli.
- Geçişle ilgili hiçbir şey (PostgREST, gateway, self-hosted realtime/storage)
  kurulmayacak.

## İlgili

- `CLAUDE.md` → Deployment & Environment (prod runtime nginx, Supabase esas kaynak)
- `docs/operations/2026-08-05-uye-konum-onarim.sql` — aynı oturumun canlı DB işleri
