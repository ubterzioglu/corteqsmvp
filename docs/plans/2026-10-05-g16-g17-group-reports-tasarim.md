# G16/G17 → group_reports Bağlantısı — Mini Tasarım Notu

> **Tarih:** 5 Ekim 2026
> **Durum:** TASARIM — politika dosyasından çıkarıldı, kod yazılmadı

---

## 1 · Politika Kaynağı

**Dosya:** `docs/dijital-gruplar/01_politika_v1.1.md`

### G16 — Güvenilir Üye (Bölüm 3, madde 5)

> "Onaylanmış 5 gönderisi olan ve **şikayet almamış** üye o grupta güvenilir üye olur:
> gönderisi önce yayına çıkar, sonra denetlenir."

**Mevcut kod:** `group_member_is_trusted(p_landing_id, p_user_id)`
- ✅ ≥ 5 onaylanmış gönderi kontrolü VAR
- ❌ "Şikayet almamış" kontrolü YOK (migration başlığında not düşülmüş)

**Eklenmesi gereken:** O grupta kullanıcının gönderdiği şikayetlerin `upheld` (onaylanmış) olup olmadığı kontrolü.

### G17 — Sağlık Skoru (Bölüm 7, madde 6)

> "Son 90 günde **onaylanmış şikayet yok**" = 20 puan

**Mevcut kod:** `group_health_score_compute(p_landing_id)`
- Kalem 6: `v_reports := true;` (sabit, vacuous TRUE)
- Migration başlığında not: "G14 bu fonksiyonu genişletirken..."

**Eklenmesi gereken:** Son 90 günde `upheld` statülü şikayet var mı kontrolü.

---

## 2 · Tasarım Kararları

### G16 — Güvenilir Üye Genişletmesi

**Soru:** "Şikayet almamış" ne demek?

**Seçenekler:**
1. **Kullanıcının gönderdiği şikayetlerin hiçbiri `upheld` olmamış** (kullanıcı güvenilir)
2. **Kullanıcının grubunda hiç `upheld` şikayet yok** (grup güvenilir)
3. **Her ikisi de** (hem kullanıcı hem grup temiz)

**Politika okuması:** "Onaylanmış 5 gönderisi olan ve şikayet almamış üye" → Kullanıcının kendisi şikayet konusu olmamış. Yani **Seçenek 1** doğru.

**Uygulama:**
```sql
-- Kullanıcının bu gruptaki şikayetleri kontrol edilir
select not exists (
  select 1
  from public.group_reports
  where landing_id = p_landing_id
    and reporter_id = p_user_id
    and status = 'upheld'
)
```

**Not:** `reporter_id` = şikayeti gönderen. Politika "şikayet almamış" diyor, yani kullanıcının gönderdiği şikayetlerin onaylanıp onaylanmadığı kontrol edilir. Ama bu mantıklı değil — kullanıcının gönderdiği şikayetlerin onaylanması kullanıcının güvenilir olduğunu gösterir, aksini değil.

**Yeniden okuma:** "Şikayet almamış" = Kullanıcı hakkında şikayet gönderilmemiş. Ama `group_reports` tablosunda `reporter_id` var, `reported_user_id` YOK. Şikayetler GRUPlara karşı gönderilir, kullanıcılara karşı değil.

**Sonuç:** Politika belirsiz. G14 tasarımında "kullanıcıya karşı şikayet" kavramı yok — yalnız "gruba karşı şikayet" var. Bu yüzden **G16 güvenilir üye için group_reports bağlantısı YAPILAMAZ** (politika dosyasında "KARAR GEREKİR" yazılır).

### G17 — Sağlık Skoru Genişletmesi

**Soru:** "Son 90 günde onaylanmış şikayet yok" ne demek?

**Okuma:** O grupta son 90 günde `status = 'upheld'` olan şikayet var mı?

**Uygulama:**
```sql
-- O grupta son 90 günde onaylanmış şikayet var mı?
select not exists (
  select 1
  from public.group_reports
  where landing_id = p_landing_id
    and status = 'upheld'
    and reviewed_at >= now() - make_interval(days => 90)
) into v_reports;
```

**Bu uygulanabilir.** Politika açık: grupta onaylanmış şikayet varsa 20 puan kaybedilir.

---

## 3 · Sonuç

| İş | Durum | Açıklama |
|---|---|---|
| G16 güvenilir üye | 🔴 **KARAR GEREKİR** | Politika "şikayet almamış üye" diyor ama `group_reports` kullanıcıya karşı şikayet tutmuyor. Yalnız gruba karşı şikayet var. Politika netleştirilmeli. |
| G17 sağlık skoru | ✅ **UYGULANABİLİR** | "Son 90 günde onaylanmış şikayet yok" = grupta `upheld` şikayet var mı kontrolü. Migration yazılabilir. |

---

## 4 · Öneri

**G17 için:** Yeni migration dosyası yazılabilir:
- `group_health_score_compute` fonksiyonunda `v_reports := true;` yerine `group_reports` tablosunu oku
- `reviewed_at >= now() - interval '90 days'` ve `status = 'upheld'` kontrolü
- Kabul SQL'i: `supabase/qa/group-health-score-reports-acceptance.sql`

**G16 için:** Politika netleştirilmeli. Seçenekler:
1. "Şikayet almamış" = Kullanıcının gönderdiği şikayetlerin hiçbiri `rejected` olmamış (kullanıcı güvenilir, şikayetleri haklı)
2. "Şikayet almamış" = Kullanıcının grubunda hiç `upheld` şikayet yok (grup güvenilir)
3. Bu kalem şimdilik atlanır, politika güncellenir

**Kullanıcıya sorulur.**

---

**Raporu yazan:** Dördüncü ajan (Qwen)
**Tarih:** 5 Ekim 2026, ~15:35 UTC
