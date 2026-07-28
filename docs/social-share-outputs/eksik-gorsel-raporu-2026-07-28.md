# Social Share Görsel Eksik Raporu — 2026-07-28

Kaynak: canlı Supabase DB (`social_share_assets` / `social_share_asset_images`,
`aws-1-eu-west-2.pooler.supabase.com` üzerinden sorgulandı) + `RANDOMIZED_ORDER`
(`src/lib/admin-shell/social-share-unified.ts`).

## Özet

| Metrik | Değer |
|---|---|
| Toplam kart (displayOrder 1-100) | 100 |
| DB'de görseli olan kart (`social_share_assets`) | 30 |
| **Hiç görseli olmayan kart** | **70** |
| DB'deki toplam kapak slotu (`social_share_assets`) | 35 |
| DB'deki toplam ek görsel (`social_share_asset_images`) | 35 |

DB'de görseli olan 30 kartın bir kısmı (Burak = çok varyantlı kartlar) birden
fazla slot kaplıyor, bu yüzden 30 kart → 35 kapak/35 ek görsel satırı var.

## DB'de görseli OLAN 30 kart (globalId : varyant sayısı)

```
item-3:1  item-4:1  item-6:1  item-12:1 item-14:1 item-21:2 item-29:1 item-30:2
item-33:1 item-36:1 item-39:1 item-40:1 item-48:1 item-53:1 item-55:1 item-56:1
item-62:3 item-64:1 item-69:1 item-71:1 item-74:1 item-80:1 item-81:1 item-83:1
item-89:1 item-90:1 item-91:1 item-94:1 item-98:2 item-99:1
```

## Hiç görseli OLMAYAN 70 kart (panel displayOrder : globalId)

```
13:item-9   14:item-49  15:item-57  16:item-51  17:item-43  18:item-79  19:item-26
20:item-37  21:item-25  22:item-54  23:item-1   24:item-95  25:item-2   26:item-16
27:item-52  28:item-28  29:item-59  30:item-58  33:item-17  34:item-11  35:item-92
36:item-75  37:item-35  38:item-23  39:item-24  40:item-65  43:item-8   44:item-68
45:item-13  46:item-93  47:item-88  48:item-60  49:item-7   50:item-78  52:item-41
53:item-22  54:item-66  55:item-19  56:item-67  57:item-82  58:item-84  59:item-72
60:item-76  61:item-15  62:item-18  63:item-61  64:item-31  65:item-32  66:item-5
67:item-47  68:item-20  69:item-42  70:item-27  71:item-63  72:item-85  73:item-97
74:item-46  75:item-50  76:item-77  77:item-44  78:item-70  79:item-86  80:item-87
84:item-45  85:item-73  86:item-10  87:item-100 88:item-38  89:item-34  90:item-96
```

## Değerlendirme

- Panelin ilk 12 sırası (displayOrder 1-12, Burak kartları) neredeyse tam işlenmiş;
  eksik sadece bazı çok-varyantlı kartların bir-iki ek varyantı (örn. item-98'in
  3. varyantı henüz yok).
- displayOrder 13-100 aralığının büyük çoğunluğu (66/88) tamamen görselsiz —
  yani Test Araçları, Diaspora Postları ve Araç Tanıtımları kaynaklarının
  neredeyse tamamı hâlâ bekliyor.
- `docs/social-share-outputs/` klasöründeki dosya sayısı (74 dosya, 34 kart)
  DB'deki 30 karttan az farklı — bu, klasöre eklenmiş ama henüz DB'ye
  (`social_share_assets`/`social_share_asset_images`) işlenmemiş birkaç dosya
  olabileceğini gösteriyor; ayrıca doğrulanıp işlenmesi gerekiyor.

İlgili memory: `project_burak_prompt_images_numeric_reseed_2026_07_23`,
`reference_social_share_naming_convention`, `feedback_social_share_new_images_workflow`.
