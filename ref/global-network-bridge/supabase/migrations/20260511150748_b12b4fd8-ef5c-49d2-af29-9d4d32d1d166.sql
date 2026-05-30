
CREATE TABLE public.coupon_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  business_user_id UUID,
  business_name TEXT,
  coupon_code TEXT NOT NULL,
  coupon_title TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  buyer_email TEXT,
  buyer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own purchases"
  ON public.coupon_purchases FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id);

CREATE POLICY "Business owners can view sales"
  ON public.coupon_purchases FOR SELECT TO authenticated
  USING (auth.uid() = business_user_id);

CREATE POLICY "Buyers can create own purchases"
  ON public.coupon_purchases FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own pending purchases"
  ON public.coupon_purchases FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id);

CREATE TRIGGER set_coupon_purchases_updated_at
  BEFORE UPDATE ON public.coupon_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_coupon_purchases_buyer ON public.coupon_purchases(buyer_id);
CREATE INDEX idx_coupon_purchases_business ON public.coupon_purchases(business_user_id);
