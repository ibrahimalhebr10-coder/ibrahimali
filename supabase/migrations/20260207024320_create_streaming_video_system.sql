/*
  # نظام الفيديو التعريفي عبر Streaming

  1. الجدول الجديد
    - `streaming_video`
      - `id` (uuid, primary key) - معرف الفيديو
      - `title` (text) - عنوان الفيديو
      - `description` (text) - وصف الفيديو
      - `stream_url` (text) - رابط البث المباشر (HLS, MP4, YouTube, etc.)
      - `thumbnail_url` (text, optional) - صورة مصغرة
      - `is_active` (boolean) - تفعيل/إيقاف الفيديو
      - `display_order` (integer) - ترتيب العرض
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `updated_at` (timestamptz) - تاريخ التحديث
      - `created_by` (uuid) - المستخدم المنشئ

  2. الأمان
    - تفعيل RLS
    - سياسة قراءة للجميع (الفيديوهات النشطة فقط)
    - سياسات إدارية للمدراء فقط

  3. المميزات
    - بدون رفع ملفات
    - دعم جميع أنواع البث (HLS, DASH, MP4, YouTube, Vimeo)
    - تشغيل فوري بدون انتظار
    - دعم فيديوهات طويلة (بدون قيود)
    - سهولة في الإدارة
*/

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS streaming_video (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'فيديو تعريفي',
  description text DEFAULT '',
  stream_url text NOT NULL,
  thumbnail_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- تفعيل RLS
ALTER TABLE streaming_video ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للجميع (الفيديوهات النشطة فقط)
CREATE POLICY "الجميع يمكنهم عرض الفيديوهات النشطة"
  ON streaming_video FOR SELECT
  USING (is_active = true);

-- سياسات الإدارة للمدراء فقط
CREATE POLICY "المدراء يمكنهم إضافة فيديوهات"
  ON streaming_video FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "المدراء يمكنهم تعديل الفيديوهات"
  ON streaming_video FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "المدراء يمكنهم حذف الفيديوهات"
  ON streaming_video FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_streaming_video_active ON streaming_video(is_active);
CREATE INDEX IF NOT EXISTS idx_streaming_video_order ON streaming_video(display_order);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_streaming_video_updated_at
  BEFORE UPDATE ON streaming_video
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
