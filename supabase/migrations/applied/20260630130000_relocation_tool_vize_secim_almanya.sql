-- Relocation Tools — Vize Seçimi (Almanya) [vize_secim_almanya] HUB KAYDI.
-- Bu araç STANDALONE'dur: dallanmalı karar ağacı (src/lib/germany-vize-data), DB skorlama/oturum YOK.
-- Bu migration yalnızca HUB KARTI için relocation_tools satırı ekler; soru seed'i/skor RPC'si YOK.
-- Sayfa gövdesi germany-standalone-tools registry'den gelir (RelocationToolPage → VizeSecimToolPage).
-- result_kind = 'score' yalnızca CHECK'i geçmek için; standalone branch bu değeri kullanmaz.

insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'vize_secim_almanya',
  'vize-secim-almanya',
  'Vize Seçimi (Almanya)',
  'Germany Visa Pathway Finder',
  'Birkaç soruda sana en uygun Almanya vize yolunu bul: EU Mavi Kart, Fachkräftevisa, Chancenkarte, BT Uzmanı, Ausbildung, aile birleşimi ve daha fazlası. Gereken belgeler ve adımlar dahil.',
  'germany_tools',
  0, 0, 'score', true, true, 103,
  '{}'::jsonb
)
on conflict (key) do update set
  slug = excluded.slug, title_tr = excluded.title_tr, title_en = excluded.title_en,
  summary_tr = excluded.summary_tr, category = excluded.category,
  quick_question_count = excluded.quick_question_count,
  detailed_question_count = excluded.detailed_question_count,
  result_kind = excluded.result_kind, requires_auth = excluded.requires_auth,
  is_active = excluded.is_active, sort_order = excluded.sort_order,
  weights = excluded.weights, updated_at = now();
