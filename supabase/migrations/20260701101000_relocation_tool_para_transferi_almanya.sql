-- Relocation Tools — Para Transferi (Almanya) [para_transferi_almanya] HUB KAYDI.
-- STANDALONE: deterministik ücret/kur hesaplayıcı (src/lib/germany-transfer), DB skorlama/oturum YOK.
-- Sadece HUB KARTI için relocation_tools satırı; sayfa germany-standalone-tools registry'den gelir.

insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'para_transferi_almanya',
  'para-transferi-almanya',
  'Para Transferi (Almanya)',
  'Germany→Turkey Money Transfer Comparison',
  'Almanya''dan Türkiye''ye para gönderirken en avantajlı yöntemi bul: tutarını gir, her sağlayıcının ücreti ve kur marjı sonrası eline geçecek net TL''ye göre sıralı karşılaştırma al.',
  'germany_tools',
  0, 0, 'comparison', true, true, 105,
  '{}'::jsonb
)
on conflict (key) do update set
  slug = excluded.slug, title_tr = excluded.title_tr, title_en = excluded.title_en,
  summary_tr = excluded.summary_tr, category = excluded.category,
  result_kind = excluded.result_kind, requires_auth = excluded.requires_auth,
  is_active = excluded.is_active, sort_order = excluded.sort_order, updated_at = now();
