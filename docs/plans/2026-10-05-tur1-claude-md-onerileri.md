# CLAUDE.md Önerileri — A1.8 (5 Ekim 2026)

> A13 (20261005900000_events_auto_approval.sql) ile ilk-onay kuralı KALDIRILDI.
> CLAUDE.md'deki bazı satırlar artık bayat. Bu dosya önerilen diff'leri listeler.
> **Düzenleme YAPILMADI** — kullanıcı onayı bekliyor.

---

## Öneri 1 — Satır 653–656 (T1 maddesi)

**Mevcut:**
```
PostgREST'e doğrudan `status='published'` POST atan onayı TAMAMEN atlar. "İlk etkinlik
onaydan geçer, sonrakiler otomatik" kuralı İSTEMCİDE yazılırsa kural hiç var olmamış
olur — **kural SQL'de olmalı** (M02 `create_event_v1` + M03 INSERT politikası/status
trigger'ı bunu kapatır; kapanana dek istemciye güvenme).
```

**Önerilen:**
```
PostgREST'e doğrudan `status='published'` POST atan onayı TAMAMEN atlar.
**A13 (5 Ekim 2026) ile ilk-onay kuralı KALDIRILDI** — tüm etkinlikler otomatik
`published` olur. Ancak T1 hâlâ geçerli: `create_event_v1` TEK yazma yoludur,
PostgREST INSERT politikası hâlâ açık. Kapanana dek istemciye güvenme.
```

---

## Öneri 2 — Satır 655 referansı

**Mevcut:**
```
(M02 `create_event_v1` + M03 INSERT politikası/status trigger'ı bunu kapatır;
```

**Önerilen:**
```
(A13 `create_event_v1` güncellendi; M03 INSERT politikası/status trigger'ı hâlâ bekliyor;
```

---

## Gerekçe

- A13 migration'ı `create_event_v1`'i yeniden tanımladı: tüm etkinlikler `status='published'`, `approval_source='auto'`.
- `approval_requests` yazımı kaldırıldı.
- İlk-onay kuralı artık yok → CLAUDE.md'deki "İlk etkinlik onaydan geçer" ifadesi yanlış.
- T1 (PostgREST INSERT açığı) hâlâ geçerli — M03 bekliyor.

---

## Öneri 3 — SG2 `alter default privileges` notu (GV4, 6 Ekim 2026)

**Eklenecek bölüm:** Güvenlik / RPC yetkilendirme

```
SG2 (20261006000000) ile iç SECURITY DEFINER RPC'lerden anon/authenticated EXECUTE kaldırıldı.
`alter default privileges in schema public revoke execute on functions from public, anon`
**gelecekteki** fonksiyonları da etkiler → yeni RPC yazan herkes açıkça `grant execute on
function ... to authenticated` (veya `service_role`) ister. Aksi halde fonksiyon çağrılamaz.
```

**Gerekçe:**
- SG2 migration'ı `alter default privileges` ile yeni fonksiyonlar için otomatik revoke koydu.
- Unutulursa: yeni RPC deploy sonrası "permission denied" verir.
