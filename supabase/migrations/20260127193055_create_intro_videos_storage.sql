/*
  # إنشاء مساحة تخزين للفيديوهات التعريفية
  
  1. إنشاء bucket جديد
    - اسم: `intro-videos`
    - عام: نعم (للقراءة فقط)
    - أنواع الملفات المسموحة: mp4, mov, avi, webm
  
  2. سياسات الأمان
    - الجميع يمكنهم القراءة/التنزيل
    - المدراء فقط يمكنهم الرفع والحذف
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intro-videos',
  'intro-videos',
  true,
  524288000,
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "الجميع يمكنهم عرض الفيديوهات التعريفية"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'intro-videos');

CREATE POLICY "المدراء يمكنهم رفع فيديوهات تعريفية"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'intro-videos' AND
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "المدراء يمكنهم تحديث الفيديوهات التعريفية"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'intro-videos' AND
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "المدراء يمكنهم حذف الفيديوهات التعريفية"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'intro-videos' AND
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );