-- coupon_purchases table
-- Source: referans 20260511150748

CREATE TABLE IF NOT EXISTS public.coupon_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id uuid NOT NULL,
  business_user_id uuid,
  business_name text,
  coupon_code text NOT NULL,
  coupon_title text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending',
  stripe_session_id text,
  buyer_email text,
  buyer_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own purchases"
  ON public.coupon_purchases FOR SELECT TO authenticated USING (auth.uid() = buyer_id);

CREATE POLICY "Business owners can view sales"
  ON public.coupon_purchases FOR SELECT TO authenticated USING (auth.uid() = business_user_id);

CREATE POLICY "Buyers can create own purchases"
  ON public.coupon_purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own pending purchases"
  ON public.coupon_purchases FOR UPDATE TO authenticated USING (auth.uid() = buyer_id);

CREATE TRIGGER set_coupon_purchases_updated_at
  BEFORE UPDATE ON public.coupon_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_coupon_purchases_buyer ON public.coupon_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_coupon_purchases_business ON public.coupon_purchases(business_user_id);
