BEGIN;

ALTER TABLE public.marquee_items
  ADD COLUMN IF NOT EXISTS news_post_id BIGINT NULL;

ALTER TABLE public.marquee_items
  DROP CONSTRAINT IF EXISTS marquee_items_news_post_id_key;

ALTER TABLE public.marquee_items
  ADD CONSTRAINT marquee_items_news_post_id_key UNIQUE (news_post_id);

COMMIT;
