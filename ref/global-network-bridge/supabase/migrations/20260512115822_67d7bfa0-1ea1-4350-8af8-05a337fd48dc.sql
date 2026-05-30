-- Connection requests (mutual permission to message) and blocking
CREATE TABLE IF NOT EXISTS public.user_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined | blocked
  block_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  decided_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (requester_id, recipient_id)
);

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view connections they are part of"
  ON public.user_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can request connections as themselves"
  ON public.user_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipient can update connection status"
  ON public.user_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id OR auth.uid() = requester_id);

CREATE POLICY "Either party can delete connection"
  ON public.user_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE INDEX IF NOT EXISTS idx_user_connections_recipient ON public.user_connections(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON public.user_connections(requester_id, status);

-- Notify recipient on connection request
CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(full_name, 'Bir kullanıcı') INTO v_name FROM public.profiles WHERE id = NEW.requester_id;
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (NEW.recipient_id, 'connection_request', '🤝 Yeni Bağlantı İsteği',
      v_name || ' seninle bağlantı kurmak istiyor. Onaylarsan mesaj atabilir.', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    SELECT COALESCE(full_name, 'Karşı taraf') INTO v_name FROM public.profiles WHERE id = NEW.recipient_id;
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (NEW.requester_id, 'connection_accepted', '✅ Bağlantı Kabul Edildi',
      v_name || ' bağlantı isteğini kabul etti. Artık mesajlaşabilirsiniz.', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_connection_request ON public.user_connections;
CREATE TRIGGER trg_notify_on_connection_request
AFTER INSERT OR UPDATE ON public.user_connections
FOR EACH ROW EXECUTE FUNCTION public.notify_on_connection_request();