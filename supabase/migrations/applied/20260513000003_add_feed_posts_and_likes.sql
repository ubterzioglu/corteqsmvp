-- feed_posts + feed_likes tables + like count trigger
-- Source: referans 20260511083015

CREATE TABLE IF NOT EXISTS public.feed_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  country text,
  city text,
  tags text[] DEFAULT '{}',
  author_role text,
  like_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_country ON public.feed_posts(country);
CREATE INDEX IF NOT EXISTS idx_feed_posts_city ON public.feed_posts(city);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON public.feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_status ON public.feed_posts(status);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts"
  ON public.feed_posts FOR SELECT USING (status = 'published');

CREATE POLICY "Users can create own posts"
  ON public.feed_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.feed_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.feed_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_feed_posts_updated_at
  BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.feed_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_likes_post ON public.feed_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_user ON public.feed_likes(user_id);

ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON public.feed_likes FOR SELECT USING (true);

CREATE POLICY "Users can like as themselves"
  ON public.feed_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes"
  ON public.feed_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_feed_like_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER feed_likes_count_trigger
  AFTER INSERT OR DELETE ON public.feed_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_feed_like_count();
