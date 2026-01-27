/*
  # نظام إدارة الفيديو التعريفي
  
  1. جداول جديدة
    - `video_intro`
      - `id` (uuid, primary key)
      - `video_type` (text) - نوع الفيديو: 'upload' أو 'youtube' أو 'tiktok'
      - `video_url` (text) - رابط الفيديو (للفيديو المرفوع من storage أو رابط خارجي)
      - `title` (text) - عنوان الفيديو
      - `description` (text) - وصف الفيديو
      - `thumbnail_url` (text, optional) - صورة مصغرة للفيديو
      - `duration_seconds` (integer, optional) - مدة الفيديو بالثواني
      - `is_active` (boolean) - هل الفيديو نشط
      - `display_order` (integer) - ترتيب العرض
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, foreign key to auth.users)
  
  2. الأمان
    - تفعيل RLS على جدول `video_intro`
    - سياسة للقراءة للجميع (الفيديوهات النشطة فقط)
    - سياسات للإدارة (إضافة/تعديل/حذف) للمدراء فقط
*/

CREATE TABLE IF NOT EXISTS video_intro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_type text NOT NULL CHECK (video_type IN ('upload', 'youtube', 'tiktok')),
  video_url text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  thumbnail_url text,
  duration_seconds integer,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE video_intro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الجميع يمكنهم عرض الفيديوهات النشطة"
  ON video_intro FOR SELECT
  USING (is_active = true);

CREATE POLICY "المدراء يمكنهم إضافة فيديوهات"
  ON video_intro FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "المدراء يمكنهم تعديل الفيديوهات"
  ON video_intro FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "المدراء يمكنهم حذف الفيديوهات"
  ON video_intro FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_video_intro_active ON video_intro(is_active);
CREATE INDEX IF NOT EXISTS idx_video_intro_display_order ON video_intro(display_order);

CREATE TRIGGER update_video_intro_updated_at
  BEFORE UPDATE ON video_intro
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();