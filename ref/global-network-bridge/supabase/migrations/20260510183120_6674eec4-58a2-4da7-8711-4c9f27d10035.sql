-- Platform-wide messaging table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  sender_name TEXT,
  recipient_user_id UUID,
  recipient_kind TEXT NOT NULL DEFAULT 'consultant', -- consultant | volunteer | business | association | blogger | vlogger | ambassador | individual
  recipient_slug TEXT,
  recipient_name TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  context_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_recipient_user ON public.messages(recipient_user_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_thread ON public.messages(thread_id, created_at);
CREATE INDEX idx_messages_recipient_slug ON public.messages(recipient_kind, recipient_slug);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can send messages as themselves"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their sent or received messages"
ON public.messages
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_user_id);

CREATE POLICY "Recipients can mark messages read"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
