BEGIN;

CREATE TABLE IF NOT EXISTS public.marquee_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('news', 'stat', 'announcement')),
  slug TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail_content TEXT,
  image_url TEXT,
  image_alt TEXT,
  metric_value TEXT,
  link_enabled BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT marquee_items_slug_format CHECK (
    slug IS NULL OR slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  CONSTRAINT marquee_items_link_slug_required CHECK (
    link_enabled = false OR (slug IS NOT NULL AND BTRIM(slug) <> '')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS marquee_items_slug_unique_idx
  ON public.marquee_items (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS marquee_items_public_lookup_idx
  ON public.marquee_items (is_active, sort_order, published_at DESC);

CREATE OR REPLACE FUNCTION public.set_marquee_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_marquee_items_updated_at ON public.marquee_items;
CREATE TRIGGER set_marquee_items_updated_at
  BEFORE UPDATE ON public.marquee_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_marquee_items_updated_at();

ALTER TABLE public.marquee_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active marquee items" ON public.marquee_items;
DROP POLICY IF EXISTS "Admin users can read marquee items" ON public.marquee_items;
DROP POLICY IF EXISTS "Admin users can insert marquee items" ON public.marquee_items;
DROP POLICY IF EXISTS "Admin users can update marquee items" ON public.marquee_items;
DROP POLICY IF EXISTS "Admin users can delete marquee items" ON public.marquee_items;

CREATE POLICY "Public can read active marquee items"
  ON public.marquee_items
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admin users can read marquee items"
  ON public.marquee_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can insert marquee items"
  ON public.marquee_items
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can update marquee items"
  ON public.marquee_items
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can delete marquee items"
  ON public.marquee_items
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

INSERT INTO public.marquee_items (
  type,
  slug,
  title,
  summary,
  detail_content,
  image_url,
  image_alt,
  metric_value,
  link_enabled,
  sort_order
)
VALUES
  (
    'stat',
    'turk-diasporasi-164-ulke',
    'Türk diasporası 164 ülkede görünür',
    'CorteQS, şehir bazlı bağlantılarla küresel Türk topluluğunu tek ekosistemde toplamayı hedefliyor.',
    'CorteQS, Türk diasporasının yaşadığı şehirlerde danışmanlar, işletmeler, topluluklar ve bireyler arasında güven odaklı bağlantılar kurmak için tasarlanmıştır. 164 ülkeye yayılan bu ağ, yerel ihtiyaçları küresel görünürlükle buluşturmayı amaçlar.',
    'https://corteqs.net/og-image.png',
    'CorteQS küresel diaspora ağı görseli',
    '164 ülke',
    true,
    10
  ),
  (
    'stat',
    NULL,
    '8.8 milyon kişilik küresel topluluk',
    'Yurt dışında yaşayan Türkler için şehir, meslek ve ihtiyaç bazlı bağlantı alanı kuruluyor.',
    NULL,
    'https://corteqs.net/logocorteqsbig.png',
    'CorteQS logo ve diaspora ağı',
    '8.8 milyon',
    false,
    20
  ),
  (
    'announcement',
    'erken-kayit-duyurusu',
    'Erken kayıt ve şehir elçisi başvuruları açık',
    'Platform açılışı öncesi danışman, işletme, içerik üreticisi ve şehir elçisi adayları kayıt bırakabiliyor.',
    'Erken kayıt süreci, CorteQS açılışı öncesinde topluluk yoğunluğunu ve şehir bazlı ihtiyaçları ölçmek için kullanılır. Başvurular danışman, işletme, dernek, içerik üreticisi, şehir elçisi ve bireysel kullanıcı kategorilerinde toplanır.',
    'https://corteqs.net/og-image.png',
    'CorteQS erken kayıt duyurusu',
    NULL,
    true,
    30
  )
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'newsimage',
  'newsimage',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read news images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can upload news images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update news images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete news images" ON storage.objects;

CREATE POLICY "Public can read news images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'newsimage');

CREATE POLICY "Admin users can upload news images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'newsimage'
    AND EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid())
  );

CREATE POLICY "Admin users can update news images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'newsimage'
    AND EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'newsimage'
    AND EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid())
  );

CREATE POLICY "Admin users can delete news images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'newsimage'
    AND EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid())
  );

COMMIT;
