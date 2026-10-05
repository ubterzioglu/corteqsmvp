# Cadde Reactors İnceleme Raporu (A1.9)

> Tarih: 5 Ekim 2026
> Dosyalar: `CaddeReactionActorsPopover.tsx`, `cadde-api.ts`, `cadde-types.ts`, `…150000_cadde_post_reactors_list.sql`

## Ne yapıyor?

"Kimler beğendi?" popover'ı: Authenticated kullanıcı, yayınlanmış bir Cadde post'undaki reaksiyon butonuna tıkladığında, o reaksiyonu veren kullanıcıların listesini görür (avatar + isim + rol etiketi).

## Kime ne gösteriyor?

- **Kim görür**: Yalnız authenticated kullanıcılar (anon erişemez — RPC `revoke from public, anon; grant to authenticated`).
- **Ne gösterir**: `user_id`, `display_name`, `avatar_url`, `role_label`, `reacted_at`.
- **Kaynak**: `cadde_post_reactions` tablosu + `catalog_items`/`auth.users` (isim/avatar) + `roles` (rol etiketi).

## Banlı/gizli kullanıcı süzülüyor mu?

**HAYIR — süzme YOK.** RPC banlı veya gizlenmiş kullanıcıları filtrelemiyor:

```sql
from public.cadde_post_reactions r
where r.post_id = p_post_id
  and r.reaction_type = p_reaction_type
  and p.status = 'published'
-- ❌ Kullanıcı ban durumu kontrolü YOK
-- ❌ catalog_items.status filtresi YOK (yalnız display_name alt sorgusunda var)
```

**Risk**: Banlı kullanıcının reaksiyonu hâlâ popover'da görünebilir.

## diaspora_key filtresi

**YOK.** RPC `diaspora_key` parametresi almıyor, tüm reaksiyonları döndürüyor.

## Plansız iş (B11)

Bu 4 dosya (2 değiştirilmiş + 1 izlenmeyen + 1 migration) **planda yok**. Ajan tarafından eklenmiş. Karar bekliyor:
- Ayrı commit mi?
- Geri al mı?
- Plana mı alınsın?

## Öneriler

1. **Ban filtresi ekle**: `cadde_user_bans` tablosunu kontrol et (banlı kullanıcıları süz).
2. **Kullanıcı durumu filtresi**: `auth.users` veya `catalog_items` üzerinden gizlenmiş kullanıcıları süz.
3. **B11 kararı**: §B11'de bu işin akıbeti belirlenmeli.
