/*
  # نظام الفيديوهات التعريفية المتطور

  ## الوصف
  نظام متقدم لإدارة الفيديوهات التعريفية مع دعم الرفع من الموبايل والكمبيوتر

  ## الجداول الجديدة

  ### `intro_videos`
  - `id` (uuid, primary key) - معرف الفيديو
  - `title` (text) - عنوان الفيديو
  - `description` (text) - وصف الفيديو
  - `file_url` (text) - رابط ملف الفيديو
  - `thumbnail_url` (text) - رابط صورة المعاينة
  - `duration` (integer) - مدة الفيديو بالثواني
  - `file_size` (bigint) - حجم الملف بالبايت
  - `device_type` (text) - نوع الجهاز (all, mobile, desktop)
  - `is_active` (boolean) - حالة التفعيل
  - `display_order` (integer) - ترتيب العرض
  - `view_count` (integer) - عدد المشاهدات
  - `created_at` (timestamptz) - تاريخ الإنشاء
  - `updated_at` (timestamptz) - تاريخ التحديث

  ## الأمان
  - تفعيل RLS على جميع الجداول
  - المدراء فقط يمكنهم إدارة الفيديوهات
  - الجميع يمكنهم مشاهدة الفيديوهات النشطة
*/

-- إنشاء جدول الفيديوهات التعريفية
CREATE TABLE IF NOT EXISTS intro_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  thumbnail_url text,
  duration integer,
  file_size bigint NOT NULL,
  device_type text NOT NULL DEFAULT 'all' CHECK (device_type IN ('all', 'mobile', 'desktop')),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer DEFAULT 0,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- إنشاء index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_intro_videos_active ON intro_videos(is_active);
CREATE INDEX IF NOT EXISTS idx_intro_videos_device_type ON intro_videos(device_type);
CREATE INDEX IF NOT EXISTS idx_intro_videos_display_order ON intro_videos(display_order);

-- تفعيل RLS
ALTER TABLE intro_videos ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة: الجميع يمكنهم قراءة الفيديوهات النشطة
CREATE POLICY "Anyone can view active intro videos"
  ON intro_videos
  FOR SELECT
  USING (is_active = true);

-- سياسات الإدارة: المدراء فقط
CREATE POLICY "Admins can view all intro videos"
  ON intro_videos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert intro videos"
  ON intro_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update intro videos"
  ON intro_videos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete intro videos"
  ON intro_videos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- دالة لزيادة عدد المشاهدات
CREATE OR REPLACE FUNCTION increment_video_views(video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE intro_videos
  SET view_count = view_count + 1
  WHERE id = video_id;
END;
$$;

-- دالة للحصول على الفيديو النشط حسب نوع الجهاز
CREATE OR REPLACE FUNCTION get_active_intro_video(p_device_type text DEFAULT 'all')
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  file_url text,
  thumbnail_url text,
  duration integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    iv.id,
    iv.title,
    iv.description,
    iv.file_url,
    iv.thumbnail_url,
    iv.duration
  FROM intro_videos iv
  WHERE iv.is_active = true
    AND (iv.device_type = 'all' OR iv.device_type = p_device_type)
  ORDER BY iv.display_order ASC, iv.created_at DESC
  LIMIT 1;
END;
$$;

-- Trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_intro_videos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_intro_videos_updated_at_trigger
  BEFORE UPDATE ON intro_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_intro_videos_updated_at();

-- إضافة تعليق على الجدول
COMMENT ON TABLE intro_videos IS 'نظام الفيديوهات التعريفية المتطور مع دعم الرفع من الموبايل والكمبيوتر';
