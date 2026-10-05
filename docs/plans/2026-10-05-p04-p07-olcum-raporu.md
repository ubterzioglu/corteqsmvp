# P04–P07 ölçüm raporu (5 Ekim 2026)

> Kaynak: `.kilo/plans/1790537630793-tidy-cactus.md` "ONAY GEREKTİREN İŞLER" (P04–P07) ·
> karar 13 (`docs/kalanlar/KALANLAR.md` §2.0): hepsi onaylı.
> Yazan: yan ajan (Claude). Her bölüm ayrı commit'tir. **Sır değeri bu dosyada YOKTUR**;
> anahtarlar yalnız tür + sha256 ilk 8 hanesiyle (parmak izi) anılır.

---

## P04 · `lansman-admin` + `relocation-notifications` yetki okuması

**Sonuç: kusur YOK, deploy GEREKMEDİ.** İki fonksiyon da canlıda yetkisiz çağrıyı veri
döndürmeden reddediyor; canlı sürüm repodaki kapılı kodla aynı.

### Kod okuması

| Fonksiyon | Service role kullanır mı | Kapı | Veri döndürür mü |
|---|---|---|---|
| `lansman-admin` | `createClient(url, serviceRoleKey)` kurar ama **hiç sorgu atmaz** | yok — gerek de yok | **Hayır.** Her POST'a koşulsuz `410 Deprecated` döner |
| `relocation-notifications` | Evet — `relocation_moves` + `relocation_bureaucratic_steps` (RLS atlanır) | `resolveAdminOrSecretCaller` (`_shared/edge-authorization.ts`): `x-dispatch-secret` **veya** admin JWT (`getUser` + `is_admin` RPC); RPC hatası = ret | Yalnız kapıdan geçen çağırana |

`relocation-notifications` kapısı `d4095d17` (28.09 20:37 UTC, "P3a") ile eklendi.

### Canlı ölçüm (5 Ekim, Management API + gerçek HTTP)

`GET /v1/projects/injprdrsklkxgnaiixzh/functions`:

| Fonksiyon | Sürüm | `verify_jwt` | Son güncelleme (UTC) |
|---|---|---|---|
| `lansman-admin` | v31 ACTIVE | `true` | 2026-05-31 15:06 |
| `relocation-notifications` | v27 ACTIVE | `true` | **2026-09-28 20:38** — `d4095d17` commit'inden 1 dk sonra → kapılı sürüm canlıda |

Gerçek POST `{}` istekleri:

| İstek | `lansman-admin` | `relocation-notifications` |
|---|---|---|
| Authorization yok | **401** (gateway, `verify_jwt=true`) | **401** (gateway) |
| Anon anahtar (geçerli JWT) | **410** `{"error":"Deprecated. …"}` | **401** `{"error":"unauthorized"}` ← fonksiyonun KENDİ reddi |
| Anon + yanlış `x-dispatch-secret` | **410** | **401** `{"error":"unauthorized"}` |

Anon anahtarla gelen isteğin gövdesi fonksiyonun kendi `unauthorized` metni: gateway
anon JWT'yi geçiriyor (beklenen — `verify_jwt` yetki DEĞİLDİR), reddi kod yapıyor.

### Kanıtlanamayan

- Meşru yolun (doğru `NOTIFY_DISPATCH_SECRET` veya admin JWT → 200) bugün çalıştığı
  **denenmedi** — admin oturumu yok, secret'ı çağrıda kullanmak gereksiz risk.
- `lansman-admin` hâlâ `SUPABASE_SERVICE_ROLE_KEY` okuyor (yoksa 500). Fonksiyon ölü
  olduğu için anahtarı okumasının işlevi yok → **U01 spike'ında** ele alındı.

### Yan bulgu (P04 kapsamı dışı, kayda geçti)

`npm run check:functions` → **repo 16 · canlı 15**: `whatsapp-autoreply` **canlıda YOK**.
W05/W06 "bitti" diye kapandı ama W06 kabulünün "deploy sonrası 16/16" maddesi tutmuyor.
Etkisi bugün sıfır (`whatsapp_bot_settings.enabled=false`; webhook'un ateşlediği çağrı
404 alır, `waitUntil` ile beklenmediği için Meta yanıtı bozulmaz) ama bot açılmadan önce
deploy + paylaşımlı secret kontrolü şart → kullanıcı-adımları dosyasına yazıldı.
