# Devir notu — 4 Ekim 2026

> Bu notu okuyan ajana: **önce §0'ı yap.** Sonra `docs/kalanlar/KALANLAR.md` §2
> durum panosundan devam et. Bu not o dosyanın yerine geçmez, onu tamamlar.
>
> ⚠️ Bugün **iki oturum paralel çalıştı** (aynı çalışma dizininde). Bu notta
> "A oturumu" = M serisi (Topluluk Motoru), "B oturumu" = güvenlik denetimi.

---

## 0 · ÖNCE BUNU YAP — 27 commit PUSH'LANMADI

```
git status -sb   →   ## main...origin/main [ahead 27]
```

Bugünkü **16 commit** dahil, toplam 27 commit **yalnız bu makinede**. Sonuç:

- **CI hiç koşmadı** — `ingest:tools:check`, `check:dead`, tam takım hiçbiri
  doğrulanmadı. Yeşil olduğunu VARSAYMA.
- Altı güvenlik düzeltmesi dahil her şey yedeksiz.

⚠️ Push etmeden önce tam takımı yerelde koş (`npm run test`) — paralel iki
oturumun commit'leri birbirine karışmış olabilir.

---

## 1 · Bugün kapanan — 16 commit

### A oturumu · Topluluk Motoru (M serisi)

| Batch | Commit | Not |
|---|---|---|
| M21 | `4ae87e2b` | `CaddeRecommendationCard` — bant/skor sıralamasına BULAŞMADIĞI ölçüldü |
| M22 | `2e59f427` | Eşleşme bildirimi (5 parçalı hat) + `ProLockedInboxCard` |
| M23 | `dbed5379` | **Faz 2 TAMAM** — canlı 4/4, bildirim gerçek drenajla `sent` |
| M26 | `52f0c737` | `city-follows-api` + `CityFollowCard` + şablon + edge — **DEPLOY EDİLDİ**, kill switch KAPALI kaldı |

### B oturumu · M serisi (devralınan) + güvenlik

| Batch | Commit | Not |
|---|---|---|
| M24 | `78d4e456` | `user_city_follows` — ⚠️ plan "serbest metin PK" diyordu, **`geo_cities`'e FK** yapıldı |
| M25 | `49975b90` | `enqueue_weekly_city_digest()` + haftalık cron, kill switch kapalı |
| 🔴 | `7d0d37fb` | **938 satır üye verisi anonime açıktı** (user_id + `<telefon>@wa.local`) |
| 🔴 | `333a3e49` | 51 `admin_*` RPC'de gereksiz `anon` EXECUTE |
| 🔴 | `6dee7680` | 3 özgeçmiş herkese açık kovada — **Eylül'de raporlanmış, kapatılmamıştı** |
| 🔴 | `65636d3e` | **Komuta Merkezi 1.761 kayıt** anonime açık **+ yazılabilir** |
| 🔴 | `6ef1f4be` | **Eski pano 15 tablo ~1.650 kayıt** anonime açık + 2'si yazılabilir |
| 🔴 | `17d39dc7` | Aynı tablolar girişli **173 üyeye** açıktı → `is_admin()` |

Ayrıca: A15 (Cadde logosu), katalog CHECK temizliği, Komuta Merkezi arşivi
(1635→495), `is_verified` türetilmiş alan — hepsi 03.10 gecesi/04.10 sabahı.

**Toplam ~4.350 satır** iç veri ve kişisel veri anonim erişime kapatıldı.
Hiçbiri planda yoktu; RLS/yetki yüzeyi sistematik taranınca çıktılar.

---

## 2 · YARIDA KALAN — M27 (A oturumu)

Çalışma ağacında duruyor, **commit'lenmedi**:

```
 M supabase/functions/_shared/emails/weekly-city-digest.ts (+ .test.ts)
 M supabase/functions/send-notification-emails/index.ts
?? supabase/migrations/applied/20261004180000_weekly_city_digest_recipient_email.sql
?? supabase/qa/m27-canli-part1.sql
?? supabase/qa/m27-canli-part2-temizlik.sql
?? supabase/qa/m27-recipient-email-acceptance.sql
```

M27 = Faz 4 canlı doğrulama. 🔴 **"cron yeşil" KANIT DEĞİLDİR** (Radar dersi):
kanıt = gerçek outbox satırı + dolu `sent_at`. Kill switch
`email.weekly_city_digest.enabled` hâlâ **`false`** — M27 kanıtlanınca İNSAN açar.

---

## 3 · Açık işler

**Blokesiz:** M27 (yarıda) · G14 (⛔ G04'e bağlı) yok sayılırsa G serisinde
blokesiz iş kalmadı.

**Kullanıcıyı bekleyen (bloke):**
- **U09** WhatsApp 5 secret → W01–W08 (8 batch)
- **U06** SMS sağlayıcısı → G04–G05 → G14
- **U07** 10 grubun 4 veri kararı → G11 → G10c

**Kullanıcı kararı bekleyen (bugün eklendi):**
1. 🔴 **Erişim loglarının incelenmesi** — altı açık daha önce kötüye kullanıldı mı?
2. **Önbellekteki CV kopyaları** — kova kapatıldı ama CDN'deki kopyalar TTL
   dolana kadar erişilebilir. Bağlantılar paylaşıldıysa dosyalar YENİ ADLA
   yeniden yüklenmeli.
3. **Komuta Merkezi'nde kalan 451 bekleyen kayıt** — hepsi arşive mi (33 kalır),
   yoksa dursun mu? ⚠️ Plandaki "~150-200 kalsın" hedefi ÖLÇÜMLE ÇÜRÜDÜ.

**Ertelenen:** SEO/GEO serisi (SG01–SG08) — plan hazır, kullanıcı "tüm işler
bitince" dedi. `claude-seo` eklentisi kuruldu (yeniden başlatma gerektirir).
⚠️ CLAUDE.md'de `index.html` JSON-LD maddeleri **"yalnız raporla, DEĞİŞTİRME"**
diye işaretli — SG serisine onaysız girme.

---

## 4 · BUGÜN ÖĞRENİLEN TUZAKLAR (yenileri)

1. 🔴 **Paylaşımlı çalışma dizini — damga çakışması İKİ KEZ yaşandı.**
   İki oturum aynı saniyede migration üretti (`20261004110000`, `20261004180000`).
   Çözüm: damgayı sabit yazma, boş olanı bul:
   `TS=...; while ls applied/ | grep -q "^$TS"; do TS=$((TS+10000)); done`

2. 🔴 **`ingest:tools` DİSK'i tarar, git'i değil.** Bir oturumun geçici dosyası
   diğerinin commit'ine girdi (`b3648782`). Önce `git status --short src/` bak.

3. 🔴 **Paylaşılan dosyada pathspec KORUMAZ.** `docs/kalanlar/KALANLAR.md`
   pathspec'li commit'lendi ama o an diğer oturumun yazdığı satırlar da gitti.
   Pathspec ilgisiz DOSYALARDAN korur, aynı dosyanın içeriğinden korumaz.

4. 🔴 **`PATCH` → HTTP 204 yazma izni KANITI DEĞİLDİR.** RLS 0 satır
   eşleştirdiğinde de 204 gelir. Yazmayı kanıtlamak için **`INSERT`** dene.

5. 🔴 **Politika ADINA güvenme, `roles` sütununu oku.**
   `command_center_legacy_map_all_authenticated` adına rağmen `anon` içeriyordu.

6. 🔴 **Kova `public` bayrağı değişimini tek istekle doğrulama — CDN önbelleği
   yanıltır.** Cache-bust parametresi kullan, yoksa "düzelmedi" sanırsın.

7. 🔴 **Mutasyon düzeneği "betik patladı" ile "iddia düştü"yü AYIRT ETMELİ.**
   Üç mutasyon sahte "geçti" verdi: migration erken patlıyordu, çıktıda "DUSTU"
   olmadığı için vakum sanıldı. Özet satırına ("TUMU GECTI") bak, yokluğa değil.

8. 🔴 **Kabul testinde `set role authenticated` sonrası geçici tablolar
   OKUNAMAZ.** Sayımları rol içinde psql değişkenine al (`\gset`), rolden
   çıkınca yaz. İki koşu bu yüzden düştü.

9. 🔴 **Reddi ölçerken fixture daha ERKEN bir kontrole takılmasın.** G06'da üç
   iddia "yanlış sebeple" geçti; hata kodunu TEK kodla eşleştir, `or` ile gevşetme.

10. ⚠️ **Türkçe karakterli SQL'i `-c` ile gönderme** (`invalid byte sequence`),
    `-f` ile dosyadan gönder. Python yama betiklerinde de aynı tuzak var.

11. ⚠️ **`is_admin()` PARAMETRESİZ DEĞİL** — canlı imza `is_admin(uid uuid)`.

12. ⚠️ **`n_live_tup` istatistiktir, 0 gösterebilir.** Gerçek sayım `count(*)`.

---

## 5 · Ölçüm tabanı (04.10 akşam)

```text
check:migrations  484 dosya · 484 canlı kayıt · sapma YOK (2 bilinen eski çift damga)
tsc               0 hata
verify:text       ✓ 1991 dosya
admin-updates     30/30
RLS               285 tablodan 284'ü RLS'li; tek istisna spatial_ref_sys (PostGIS, 0 satır)
anon yüzeyi       admin_* RPC'de anon EXECUTE = 0 · eski pano tablolarında anon politika = 0
push              ⚠️ origin/main'in 27 commit GERİSİNDE
```

**Kalıcı tripwire'lar (silme, gevşetme):**
- `supabase/qa/public-exposure-tripwire.sql` — RLS'siz + anon erişimli tablo tarar
- `supabase/qa/command-center-rls-acceptance.sql`
- `supabase/qa/legacy-dashboard-rls-acceptance.sql`
- `supabase/qa/legacy-dashboard-admin-only-acceptance.sql`
- `supabase/qa/user-city-follows-acceptance.sql` · `weekly-city-digest-acceptance.sql`
- `supabase/qa/catalog-is-verified-acceptance.sql` · `catalog-constraint-cleanup-acceptance.sql`
- `supabase/qa/admin-rpc-anon-revoke-acceptance.sql` · `org-verification-acceptance.sql`

## 6 · DB erişimi (çalışıyor)

```bash
PW=$(grep -E '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2- | tr -d '\r')
PGPASSWORD="$PW" psql -h aws-1-eu-west-2.pooler.supabase.com -p 6543 \
  -U postgres.injprdrsklkxgnaiixzh -d postgres -f <dosya>
```

⚠️ Bash tool'da `dangerouslyDisableSandbox: true` ŞART. `db.<ref>` IPv6-only ve
ölü — pooler kullan, `aws-0` değil **`aws-1`**.
