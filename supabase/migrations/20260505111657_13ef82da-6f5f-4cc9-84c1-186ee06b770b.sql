DROP POLICY IF EXISTS "Consultants can view open requests" ON public.service_requests;

CREATE POLICY "Providers can view open requests"
ON public.service_requests
FOR SELECT
TO authenticated
USING (
  status = 'open'
  AND (has_role(auth.uid(), 'consultant'::app_role) OR has_role(auth.uid(), 'business'::app_role))
);

DROP POLICY IF EXISTS "Consultants can create proposals" ON public.service_proposals;

CREATE POLICY "Providers can create proposals"
ON public.service_proposals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = consultant_id
  AND (has_role(auth.uid(), 'consultant'::app_role) OR has_role(auth.uid(), 'business'::app_role))
);