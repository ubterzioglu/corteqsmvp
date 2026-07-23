-- user_connections table
-- Source: referans 20260512115822

CREATE TABLE IF NOT EXISTS public.user_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  block_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  UNIQUE (requester_id, recipient_id)
);

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view connections they are part of"
  ON public.user_connections FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can request connections as themselves"
  ON public.user_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipient can update connection status"
  ON public.user_connections FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id OR auth.uid() = requester_id);

CREATE POLICY "Either party can delete connection"
  ON public.user_connections FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE INDEX IF NOT EXISTS idx_user_connections_recipient ON public.user_connections(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON public.user_connections(requester_id, status);
