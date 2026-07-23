CREATE TABLE IF NOT EXISTS public.direct_messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid       NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  read_at     timestamptz
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Sender inserts their own messages; cannot message themselves
CREATE POLICY "authenticated_sender_insert"
  ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND auth.uid() <> recipient_id);

-- Both sender and recipient can read the conversation
CREATE POLICY "participant_select"
  ON public.direct_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE INDEX IF NOT EXISTS direct_messages_recipient_idx
  ON public.direct_messages (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS direct_messages_sender_idx
  ON public.direct_messages (sender_id, created_at DESC);
