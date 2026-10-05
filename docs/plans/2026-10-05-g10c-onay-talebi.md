# G10c · `whatsapp_landings` eski kolonlarının düşürülmesi — ONAY TALEBİ (5 Ekim 2026)

> Karar 11 (`KALANLAR.md` §2.0): **G10c AYRI ONAY ister; kolon düşürmek geri alınamaz.**
> Bu dosya yalnız onay talebidir — **hiçbir şey ÇALIŞTIRILMADI**, migration yazılmadı.
> ⚠️ Bu oturumda canlı DB okuması izinsizdi: `pg_depend` / canlı veri sayıları **ölçülemedi**.
> Bağımlılıklar repodaki migration metninden ve kod taramasından çıkarıldı; onaydan önce
> §5'teki SQL canlıda koşulmalı.

---

## 1 · Özet — ne isteniyor, ne önerilir

KALANLAR'daki G10c tanımı: düşürülecekler `member_approved` · `admin_approved` · (spec'e göre)
`status`. Devir notu ayrıca G11 sonrası duran legacy `country` / `city` metnini soruyor.

**Ölçümün vardığı sonuç: G10c bugün TEK batch olarak onaylanmaya HAZIR DEĞİL.**

| Kolon | Bugün okuyan | Düşürmeye hazır mı |
|---|---|---|
| `member_approved` | view `whatsapp_landings_public` (kolon olarak döndürür) · `catalog_sync_whatsapp_landing` (trigger fn) · `submit_group_v1` (yazar) · `types.ts` | 🟡 **Hazırlıkla evet** — frontend okumuyor (yalnız `types.ts` + testler) |
| `admin_approved` | aynı dört yer | 🟡 aynı |
| `status` | view'un **`where l.status = 'approved'`** filtresi · `get_whatsapp_landing_invite` (`l.status = 'approved'`) · `catalog_sync_whatsapp_landing` · `src/lib/whatsapp-landings.ts:509` (`.eq("status","approved")`) ve `:624` (admin moderasyon filtresi) · eski editör RPC'si (`status = 'pending'` yazar) · yer tutucu veri (`whatsapp-landing-placeholders.ts`) · G12 bilinçli olarak İKİ durum sistemini paralel yaşatıyor | 🔴 **HAYIR** — herkese açık dizin bu kolona göre süzüyor |
| `country` / `city` (serbest metin) | `LandingCard.tsx:63` · `LandingDetailMetaCards.tsx:27` · `AddWhatsAppPage.tsx:215-234` (filtre + şehir listesi) · `WhatsAppLandingEditorPage.tsx:96-97` · `whatsapp-landings.ts:369-370` · view · `catalog_sync_whatsapp_landing` (`v_landing.city`) · `submit_group_v1` geo'dan DOLDURUR (`Global→'Genel'`) · eski editör RPC'si yazar | 🔴 **HAYIR** — kullanıcıya görünen kart ve filtreler bunu çiziyor |

**Öneri (onaya sunulan):**
- **G10c-1** (`member_approved` + `admin_approved`): §3'teki hazırlık + düşürme. Onaylanabilir.
- **G10c-2** (`status`, `country`, `city`): önce okuyan kodun `listing_status` / `country_code` +
  `city_id` → `geo_cities` adına taşınması (ayrı batch'ler, deploy dahil); düşürme onayı o
  zaman ayrıca istenir. **Bugün onay İSTENMİYOR.**

---

## 2 · Bağımlılık dökümü (repo metni — son tanımlar)

Yöntem: `archive/` + `applied/` migration'ları dosya adı sırasıyla tarandı, her nesnenin
**en son** `create [or replace]` tanımı alındı (betik: oturum scratchpad'i `g10c_deps.py`),
sonra `rg` ile çapraz bakıldı.

| Nesne | Son tanım | Okuduğu eski kolonlar |
|---|---|---|
| fn `catalog_sync_whatsapp_landing` (trigger `trg_catalog_sync_whatsapp_landing`) | `archive/20260604105000_catalog_legacy_bridge_functions.sql` | `admin_approved` · `member_approved` · `status` · `city` (+ `category`, `description` …) |
| view `whatsapp_landings_public` | `applied/20261002090000_public_view_motor_badges.sql` | seçer: `country` · `city` · `status` · `member_approved` · `admin_approved`; **süzer:** `l.status = 'approved'` |
| fn `get_whatsapp_landing_invite` | `applied/20261001110000_…invite_rpc.sql` | `status = 'approved'` |
| fn `submit_group_v1` | `applied/20261002080000_group_submit.sql` | YAZAR: `status, member_approved, admin_approved` + `country/city` |
| fn `update_current_user_editable_whatsapp_landing` | `archive/20260603190000_add_whatsapp_community_fields.sql` | YAZAR: `country` · `city` · `status = 'pending'` |
| fn `get_current_user_editable_whatsapp_landing` | `archive/20260531120000_…editor_permissions.sql` | satırı döndürür |
| G12 guard trigger | `applied/20261002030000_group_status_machine.sql` | yorum: "iki durum sistemi G10c'ye dek paralel yaşar" |

⚠️ **`pg_depend` bunun yalnız bir kısmını görür:** view → kolon bağımlılığı `pg_depend`'de
vardır (bu yüzden `drop column` view'u **reddeder**, `cascade` ile **view'u da siler** — herkese
açık dizin anında düşer). plpgsql fonksiyon gövdeleri `pg_depend`'e GİRMEZ: kolon düşerse
`catalog_sync_whatsapp_landing` hata vermeden **ilk INSERT/UPDATE'te** patlar — yani grup
ekleme/moderasyon kırılır ve bu, düşürme anında görünmez.

Frontend (`git grep`): `member_approved` / `admin_approved` yalnız `src/integrations/supabase/types.ts`
ve iki testte (`whatsapp-landings-group-schema.test.ts` düşürmeyi YASAKLAR,
`hot-fix-whatsapp-seed.test.ts` eski migration metnini denetler). KALANLAR'ın "9 dosyada
kullanılıyor" notu **bayat** (G03b sonrası 0 üretim dosyası).

---

## 3 · G10c-1 için önerilen sıra (onay gelirse)

1. Yeni migration A (salt ekleme/yeniden tanım, geri alınabilir):
   - `catalog_sync_whatsapp_landing`: onay mantığını `listing_status = 'published'`'tan türet,
     eski iki kolonu okuma.
   - `whatsapp_landings_public`: iki kolonu çıkararak `create or replace view` (Postgres
     `create or replace view` kolon ÇIKARMAYA izin vermez → `drop view` + `create view` +
     grant'lar **aynı işlemde**; anon grant'ı G03c'deki gibi yeniden ver).
   - `submit_group_v1`: iki kolonu yazmayı bırak (gövdenin geri kalanı birebir).
2. `types.ts` regen · `tsc` 0 · kabul: `group-motor-acceptance.sql` 13/13 + catalog sync
   geri alınan işlemde 10/10 hatasız (G10'un K5 kanıtının aynısı).
3. Canlı paket kontrolü: yayındaki JS'te `member_approved` / `admin_approved` geçen chunk **0**.
4. Migration B (**geri alınamaz**): `alter table public.whatsapp_landings drop column
   member_approved, drop column admin_approved;` — `cascade` YOK (bir şey bağlıysa hata versin).
5. Sözleşme testi `whatsapp-landings-group-schema.test.ts` tersine çevrilir (düşürmeyi
   yasaklamak yerine yokluğunu kilitler).

---

## 4 · Veri göçü — tamam mı?

- `listing_status` 10/10 `published` (G10, 02.10) · G11c ile 2 grup `hidden` (04.10).
  `status`'ten `listing_status`'e eşleme G10'da yapıldı; **ama yeni ekleme yolu
  (`submit_group_v1`) hâlâ ikisini birlikte yazıyor** — yani kaynak tek değil.
- `member_approved` / `admin_approved`'ın yerine geçen alan `listing_status` + `review_flags`.
  Bu iki kolonun düşmesiyle kaybolan bilgi: geçmiş onay bayrakları. Kayıt için düşürmeden
  önce yedek tablo önerilir (§6).
- `country`/`city` → `country_code` + `city_id`: G11 04.10'da kapandı (KALANLAR; bu oturumda
  canlı sayı yeniden ölçülmedi), ama legacy
  metin **duruyor ve kartlar onu çiziyor**; `city_id` boş olan (ülke geneli, ör. TED
  InnoVenture `country_code='TR'`, şehir YOK) ve `is_global` gruplar için legacy metin
  `'Genel'` vb. değer taşıyor. Silinirse kart bugün boş konum gösterir.
- ❌ Canlı sayılar bu oturumda yeniden ölçülemedi.

---

## 5 · Önce / sonra ölçüm komutları (salt-okunur kısımlar)

```sql
-- ÖNCE: pg_depend ile kolon bağımlıları (view/kural)
select c.relname as bagimli, a.attname as kolon
  from pg_depend d
  join pg_rewrite r on r.oid = d.objid
  join pg_class c on c.oid = r.ev_class
  join pg_attribute a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
 where d.refobjid = 'public.whatsapp_landings'::regclass
   and a.attname in ('member_approved','admin_approved','status','country','city')
 group by 1, 2 order by 1, 2;
-- ÖNCE: gövdesinde eski kolon geçen fonksiyonlar (pg_depend görmez)
select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.prosrc ~ '\m(member_approved|admin_approved)\M' order by 1;
-- ÖNCE: veri
select listing_status, status, member_approved, admin_approved, count(*)
  from public.whatsapp_landings group by 1,2,3,4 order by 1,2;
-- SONRA (G10c-1): kolon yok + view çalışıyor + sync çalışıyor
select count(*) from information_schema.columns
 where table_schema='public' and table_name='whatsapp_landings'
   and column_name in ('member_approved','admin_approved');          -- 0 beklenir
select count(*) from public.whatsapp_landings_public;                -- öncekiyle aynı
```

```bash
# canlı pakette eski kolon adı (deploy sonrası, adım 3)
curl -s https://corteqs.net/ | grep -o 'assets/[^"]*\.js' | sort -u | while read a; do curl -s "https://corteqs.net/$a" | grep -c 'member_approved' ; done | paste -sd+ | bc
```

---

## 6 · Geri alma planı

- Migration A geri alınabilir: önceki tanımlar (`archive/20260604105000…`,
  `applied/20261002090000…`, `applied/20261002080000…`) aynen yeniden uygulanır.
- Migration B **geri alınamaz** — kolon ve verisi gider. Telafi için B'den hemen önce:
  `create table public.whatsapp_landings_g10c_backup as select id, member_approved,
  admin_approved, status, now() as backed_up_at from public.whatsapp_landings;`
  (RLS açık, grant yok) → gerekirse `add column` + `update … from backup` ile geri doldurulur.
- B'yi her zaman `cascade`'siz yaz: unutulmuş bir bağımlı varsa migration düşer, site düşmez.

---

## 7 · Kullanıcıdan istenen

> **"G10c-1'i (`member_approved` + `admin_approved` düşürme, §3 sırasıyla, yedek tabloyla)
> onaylıyor musun? `status` / `country` / `city` bu turda düşürülmeyecek."**
