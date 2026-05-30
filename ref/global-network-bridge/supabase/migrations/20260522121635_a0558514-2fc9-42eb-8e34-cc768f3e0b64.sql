-- Auto-establish messaging connection between requester and provider when a proposal is sent
CREATE OR REPLACE FUNCTION public.auto_connect_on_proposal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester uuid;
  v_exists boolean;
BEGIN
  SELECT user_id INTO v_requester FROM public.service_requests WHERE id = NEW.request_id;
  IF v_requester IS NULL OR v_requester = NEW.consultant_id THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_connections
    WHERE (requester_id = NEW.consultant_id AND recipient_id = v_requester)
       OR (requester_id = v_requester AND recipient_id = NEW.consultant_id)
  ) INTO v_exists;

  IF NOT v_exists THEN
    INSERT INTO public.user_connections (requester_id, recipient_id, status, decided_at)
    VALUES (NEW.consultant_id, v_requester, 'accepted', now());
  ELSE
    -- upgrade pending to accepted so they can message immediately
    UPDATE public.user_connections
       SET status = 'accepted', decided_at = COALESCE(decided_at, now())
     WHERE status = 'pending'
       AND ((requester_id = NEW.consultant_id AND recipient_id = v_requester)
         OR (requester_id = v_requester AND recipient_id = NEW.consultant_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_connect_on_proposal ON public.service_proposals;
CREATE TRIGGER trg_auto_connect_on_proposal
AFTER INSERT ON public.service_proposals
FOR EACH ROW EXECUTE FUNCTION public.auto_connect_on_proposal();