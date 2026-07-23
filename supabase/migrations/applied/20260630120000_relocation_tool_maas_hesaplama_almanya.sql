-- Relocation Tools — Maaş Hesaplama (Almanya) [maas_hesaplama_almanya] HUB KAYDI.
-- Bu araç STANDALONE'dur: deterministik Brüt↔Net hesaplayıcı (src/lib/germany-salary), DB
-- skorlama/oturum YOK. Bu migration yalnızca HUB KARTI için relocation_tools satırı ekler;
-- soru seed'i veya skor RPC'si YOKTUR. Sayfa gövdesi germany-standalone-tools registry'den gelir
-- (RelocationToolPage slug'ı tanıyıp MaasHesaplamaToolPage'i render eder).
--
-- result_kind = 'score' yalnızca CHECK'i geçmek için; standalone branch bu değeri kullanmaz.

insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'maas_hesaplama_almanya',
  'maas-hesaplama-almanya',
  'Maaş Hesaplama (Almanya)',
  'Germany Salary Calculator (Gross↔Net)',
  'Almanya''da brütten nete ve netten brüte hesapla: vergi sınıfı (Steuerklasse 1-6), eyalet, kilise vergisi, çocuk ve sağlık sigortası türüne göre 2026 tahmini.',
  'germany_tools',
  0, 0, 'score', true, true, 102,
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
