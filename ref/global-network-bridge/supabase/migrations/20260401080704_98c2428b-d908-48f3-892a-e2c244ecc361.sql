ALTER TABLE public.welcome_pack_orders
  ADD COLUMN needs_mentor boolean NOT NULL DEFAULT false,
  ADD COLUMN mentor_type text DEFAULT null;