-- Create storage bucket for farm images with public read access

INSERT INTO storage.buckets (id, name, public)
VALUES ('farm-images', 'farm-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read access for farm images
DROP POLICY IF EXISTS "Public read access for farm images" ON storage.objects;
CREATE POLICY "Public read access for farm images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'farm-images');

-- Admins can upload farm images
DROP POLICY IF EXISTS "Admins can upload farm images" ON storage.objects;
CREATE POLICY "Admins can upload farm images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'farm-images'
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Admins can update farm images
DROP POLICY IF EXISTS "Admins can update farm images" ON storage.objects;
CREATE POLICY "Admins can update farm images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'farm-images'
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    bucket_id = 'farm-images'
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Admins can delete farm images
DROP POLICY IF EXISTS "Admins can delete farm images" ON storage.objects;
CREATE POLICY "Admins can delete farm images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'farm-images'
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );