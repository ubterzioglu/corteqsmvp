-- messages table (platform messaging)
-- Source: referans 20260510183120

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  sender_name text,
  recipient_user_id uuid,
  recipient_kind text NOT NULL DEFAULT 'consultant',
  recipient_slug text,
  recipient_name text,
  subject text,
  body text NOT NULL,
  context_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_user ON public.messages(recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_slug ON public.messages(recipient_kind, recipient_slug);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can send messages as themselves"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their sent or received messages"
  ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_user_id);

CREATE POLICY "Recipients can mark messages read"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
