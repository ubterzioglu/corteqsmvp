-- m89/m90: Cadde feed ve yorumlar için Realtime publication'a tablo ekleme
-- Supabase Realtime, supabase_realtime publication'a dahil tabloları dinler.
-- notifications zaten dahil; cadde_posts ve cadde_post_comments eksikti.

-- 1) cadde_posts ekle (m89: yeni paylaşım bildirimi)
ALTER PUBLICATION supabase_realtime ADD TABLE cadde_posts;

-- 2) cadde_post_comments ekle (m90: yeni yorum bildirimi)
ALTER PUBLICATION supabase_realtime ADD TABLE cadde_post_comments;

-- Doğrulama
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
    AND tablename IN ('cadde_posts', 'cadde_post_comments');
  
  IF v_count < 2 THEN
    RAISE EXCEPTION 'Realtime publication tablo ekleme başarısız — beklenen 2, bulunan %', v_count;
  END IF;
  
  RAISE NOTICE 'm89/m90: cadde_posts ve cadde_post_comments Realtime publication eklendi';
END $$;
