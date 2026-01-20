-- Storage bucket creation requires elevated permissions
-- Please create the bucket manually through Supabase Dashboard:
-- Storage > New bucket
-- - Name: company-logos
-- - Public: Yes
-- - File size limit: 5MB
-- - Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp
--
-- Alternatively, use the Supabase Management API with a service role key

-- RLS is already enabled on storage.objects by Supabase
-- Policy: Anyone can view logos (bucket is public)
-- Since the bucket is public, we don't need a SELECT policy
-- But we'll add one for consistency and potential future private bucket use
CREATE POLICY "Users can view company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Policy: Organization owners can upload logos
-- Files are named as {organizationId}-{timestamp}.{ext}
-- Server action validates ownership and file naming
CREATE POLICY "Organization owners can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'owner'
  )
);

-- Policy: Organization owners can update their logos
-- File name validation is handled by server action
CREATE POLICY "Organization owners can update their logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'owner'
  )
);

-- Policy: Organization owners can delete their logos
-- File name validation is handled by server action
CREATE POLICY "Organization owners can delete their logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'owner'
  )
);

