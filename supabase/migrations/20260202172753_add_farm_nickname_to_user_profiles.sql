/*
  # إضافة اسم المزرعة الشخصي للمستثمرين

  1. التغييرات
    - إضافة حقل `farm_nickname` إلى جدول `user_profiles`
      - نص اختياري
      - قابل للتعديل
      - يُستخدم في الواجهات والرسائل والتقارير

  2. الملاحظات
    - هذا اسم عاطفي شخصي يختاره المزارع
    - يظهر بدلاً من "مزرعتي" في جميع الواجهات
    - يمكن تركه فارغاً (اختياري)
    - مثال: "مزرعة الأمل"، "بستان العائلة"، "حديقة الذكريات"
*/

-- Add farm_nickname column to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'farm_nickname'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN farm_nickname text;
  END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_farm_nickname 
ON user_profiles(farm_nickname) 
WHERE farm_nickname IS NOT NULL;

-- Users can already update their own profile through existing RLS policies
-- No additional policy needed
