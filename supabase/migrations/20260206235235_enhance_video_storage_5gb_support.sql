/*
  # تحديث نظام تخزين الفيديو لدعم ملفات حتى 5 جيجابايت

  ## التحديثات

  1. **تحديث bucket intro-videos:**
     - زيادة حجم الملف المسموح إلى 5 GB (كان 1 GB)
     - تفعيل chunked upload support
     - تحسين الأداء للملفات الكبيرة

  2. **إضافة metadata للتتبع:**
     - حفظ معلومات الرفع (chunks, speed, time)
     - تتبع نوع الرفع (simple vs chunked)

  ## ملاحظات
  - يدعم الآن رفع فيديوهات حتى 5 GB
  - رفع متوازي للأجزاء (3 أجزاء في نفس الوقت)
  - استئناف تلقائي إذا انقطع الاتصال
  - عرض سرعة الرفع والوقت المتبقي
*/

-- تحديث إعدادات bucket intro-videos
-- ملاحظة: في Supabase، bucket settings تُدار عبر Dashboard أو API
-- لكن يمكننا تحديث الـ policies والـ metadata

DO $$
BEGIN
  -- التأكد من وجود bucket
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'intro-videos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'intro-videos',
      'intro-videos',
      true,
      5368709120, -- 5 GB in bytes
      ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska']
    );
  ELSE
    -- تحديث file_size_limit للبوكيت الموجود
    UPDATE storage.buckets
    SET 
      file_size_limit = 5368709120, -- 5 GB
      allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska']
    WHERE id = 'intro-videos';
  END IF;
END $$;

-- إضافة جدول لتتبع حالة الرفع (للاستئناف)
CREATE TABLE IF NOT EXISTS video_upload_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  total_chunks int NOT NULL,
  uploaded_chunks int[] DEFAULT '{}',
  upload_speed numeric,
  time_elapsed int, -- بالثواني
  upload_type text CHECK (upload_type IN ('simple', 'chunked')) DEFAULT 'chunked',
  status text CHECK (status IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Index للأداء
CREATE INDEX IF NOT EXISTS idx_video_upload_sessions_user_id 
ON video_upload_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_video_upload_sessions_status 
ON video_upload_sessions(status);

-- RLS policies
ALTER TABLE video_upload_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own upload sessions"
  ON video_upload_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own upload sessions"
  ON video_upload_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own upload sessions"
  ON video_upload_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own upload sessions"
  ON video_upload_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function لتنظيف الجلسات القديمة (أكثر من 7 أيام)
CREATE OR REPLACE FUNCTION cleanup_old_upload_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM video_upload_sessions
  WHERE created_at < now() - interval '7 days'
    AND status IN ('completed', 'failed');
END;
$$;

-- إضافة معلومات متقدمة لجدول video_intro
DO $$
BEGIN
  -- إضافة أعمدة جديدة إذا لم تكن موجودة
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'video_intro' AND column_name = 'file_size_bytes'
  ) THEN
    ALTER TABLE video_intro ADD COLUMN file_size_bytes bigint;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'video_intro' AND column_name = 'upload_type'
  ) THEN
    ALTER TABLE video_intro ADD COLUMN upload_type text CHECK (upload_type IN ('upload', 'youtube', 'tiktok', 'simple', 'chunked'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'video_intro' AND column_name = 'upload_duration_seconds'
  ) THEN
    ALTER TABLE video_intro ADD COLUMN upload_duration_seconds int;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'video_intro' AND column_name = 'upload_metadata'
  ) THEN
    ALTER TABLE video_intro ADD COLUMN upload_metadata jsonb;
  END IF;
END $$;

-- تعليق على الجدول
COMMENT ON TABLE video_upload_sessions IS 'تتبع حالة رفع الفيديوهات الكبيرة لدعم الاستئناف التلقائي';
COMMENT ON COLUMN video_upload_sessions.uploaded_chunks IS 'قائمة بأرقام الأجزاء التي تم رفعها بنجاح';
COMMENT ON COLUMN video_upload_sessions.upload_speed IS 'سرعة الرفع بالبايت في الثانية';
