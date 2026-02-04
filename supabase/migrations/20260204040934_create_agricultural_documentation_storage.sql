/*
  # إنشاء مساحة تخزين للتوثيق الزراعي

  1. الوصف:
    - إنشاء bucket جديد لتخزين صور وفيديوهات التوثيق الزراعي
    - السماح للأدمن برفع وحذف الملفات
    - السماح للجميع بعرض الملفات
  
  2. البنية:
    - اسم الـ bucket: agricultural-documentation
    - الملفات العامة: نعم (للسماح بالعرض)
    - حد أقصى لحجم الملف: 50MB
  
  3. الأمان:
    - رفع الملفات: للأدمن المصادقين فقط
    - حذف الملفات: للأدمن المصادقين فقط
    - عرض الملفات: للجميع
*/

-- إنشاء bucket للتوثيق الزراعي
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agricultural-documentation',
  'agricultural-documentation',
  true,
  52428800, -- 50MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Admins can upload documentation files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documentation files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view documentation files" ON storage.objects;

-- 1. السماح للأدمن برفع الملفات
CREATE POLICY "Admins can upload documentation files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'agricultural-documentation'
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- 2. السماح للأدمن بحذف الملفات
CREATE POLICY "Admins can delete documentation files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'agricultural-documentation'
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- 3. السماح للجميع بعرض الملفات (الـ bucket عام)
CREATE POLICY "Anyone can view documentation files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'agricultural-documentation');
