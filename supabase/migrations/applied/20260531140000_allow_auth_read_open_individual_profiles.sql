-- Allow authenticated users to read individual profile rows where the owner
-- has set their profile to open visibility. Additive to the existing self-read
-- policy (Postgres OR-s multiple policies for SELECT).
CREATE POLICY "authenticated_read_visible_individual_profiles"
  ON individual_profile_details
  FOR SELECT
  TO authenticated
  USING (visibility_status = 'open');
