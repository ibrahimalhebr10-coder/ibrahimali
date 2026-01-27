/*
  # نظام تخزين فيديوهات المزارع
  
  1. Storage Bucket
    - إنشاء bucket لتخزين فيديوهات المزارع
    - دعم فيديوهات MP4/MOV/WEBM
    
  2. Storage Policies
    - السماح للعامة بمشاهدة الفيديوهات
    - السماح للأدمن برفع وحذف الفيديوهات
    
  3. ملاحظات
    - حجم الملف الأقصى: 100MB
    - الأنواع المسموحة: video/mp4, video/quicktime, video/webm
*/

-- Create storage bucket for farm videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'farm-videos',
  'farm-videos',
  true,
  104857600, -- 100MB
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public to view videos
CREATE POLICY "Public can view farm videos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'farm-videos');

-- Allow admins to upload videos
CREATE POLICY "Admins can upload farm videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'farm-videos' AND
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Allow admins to update videos
CREATE POLICY "Admins can update farm videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'farm-videos' AND
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    bucket_id = 'farm-videos' AND
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Allow admins to delete videos
CREATE POLICY "Admins can delete farm videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'farm-videos' AND
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );