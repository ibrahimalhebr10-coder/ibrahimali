/*
  # إضافة صورة البطل وحقول الفيديو لجدول المزارع

  1. الحقول الجديدة
    - `hero_image_url` (text) - رابط الصورة الرئيسية لأعلى صفحة المزرعة
    - `video_url` (text) - رابط ملف الفيديو المرفوع
    - `video_title` (text) - عنوان الفيديو (يمكن تحريره)
  
  2. الملاحظات
    - جميع الحقول اختيارية (nullable)
    - hero_image_url سيتم استخدامها لعرض صورة مصغرة في أعلى صفحة المزرعة
    - video_url سيتم تخزين رابط الفيديو المرفوع من Storage
    - video_title نص وصفي للفيديو يمكن تحريره
*/

-- إضافة الحقول الجديدة لجدول farms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farms' AND column_name = 'hero_image_url'
  ) THEN
    ALTER TABLE farms ADD COLUMN hero_image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farms' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE farms ADD COLUMN video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farms' AND column_name = 'video_title'
  ) THEN
    ALTER TABLE farms ADD COLUMN video_title text DEFAULT 'شاهد جولة المزرعة';
  END IF;
END $$;