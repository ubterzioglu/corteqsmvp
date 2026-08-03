-- Relocation Tools — ZGEN Nesil Bulucu [zgen_generation_finder] HUB KAYDI.
-- Bu araç STANDALONE'dur: deterministik doğum yılı → kuşak eşlemesi (src/lib/zgen), DB
-- skorlama/oturum YOK. Bu migration yalnızca HUB KARTI için relocation_tools satırı ekler;
-- soru seed'i veya skor RPC'si YOKTUR. Sayfa gövdesi standalone-tools registry'den gelir
-- (RelocationToolPage slug'ı tanıyıp ZgenToolPage'i render eder).
--
-- result_kind = 'persona' — hub kartı rozetinde/renginde kullanılır (Sparkles/indigo).

insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'zgen_generation_finder',
  'zgen-nesil-bulucu',
  'ZGEN – Nesil Bulucu',
  'ZGEN – Generation Finder',
  'Doğum yılını gir; hangi kuşaktan olduğunu, tipik özelliklerini ve diğer kuşaklarla nasıl geçineceğini öğren.',
  'nesil_analizi',
  0, 0, 'persona', true, true, 120,
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
