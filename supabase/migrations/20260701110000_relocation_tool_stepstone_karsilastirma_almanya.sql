-- Relocation Tools — StepStone Maaş Karşılaştırma (Almanya) [stepstone_karsilastirma_almanya] HUB KAYDI.
-- STANDALONE: StepStone Gehaltsreport 2026 verisiyle medyan karşılaştırma (src/lib/germany-stepstone),
-- DB skorlama/oturum YOK. Sadece HUB KARTI için relocation_tools satırı; sayfa registry'den gelir.

insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'stepstone_karsilastirma_almanya',
  'stepstone-karsilastirma-almanya',
  'StepStone Maaş Karşılaştırma (Almanya)',
  'Germany StepStone Salary Benchmark 2026',
  'StepStone Gehaltsreport 2026 verilerine göre maaşını sektör, deneyim, şehir ve şirket büyüklüğü medyanlarıyla karşılaştır. Pazar değerini gör, maaş pazarlığına somut veriyle gir.',
  'germany_tools',
  0, 0, 'comparison', true, true, 106,
  '{}'::jsonb
)
on conflict (key) do update set
  slug = excluded.slug, title_tr = excluded.title_tr, title_en = excluded.title_en,
  summary_tr = excluded.summary_tr, category = excluded.category,
  result_kind = excluded.result_kind, requires_auth = excluded.requires_auth,
  is_active = excluded.is_active, sort_order = excluded.sort_order, updated_at = now();
