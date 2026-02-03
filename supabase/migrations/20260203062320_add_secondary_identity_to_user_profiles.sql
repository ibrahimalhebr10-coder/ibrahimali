/*
  # إضافة الهوية الثانية لملفات المستخدمين

  ## الهدف
  تجهيز البنية المنطقية لحفظ هوية ثانية للمستخدم بدون عرضها في الواجهة

  ## التغييرات

  ### 1. الحقول الجديدة في user_profiles
    - `primary_identity` (text) - الهوية الأساسية: 'agricultural' أو 'investment'
    - `secondary_identity` (text, nullable) - الهوية الثانية (نائمة): 'agricultural' أو 'investment'
    - `secondary_identity_enabled` (boolean) - هل الهوية الثانية مفعلة؟ (دائماً false في MVP)

  ### 2. القيم الافتراضية
    - `primary_identity` = 'agricultural' (افتراضي)
    - `secondary_identity` = NULL (غير مفعلة)
    - `secondary_identity_enabled` = false

  ### 3. القيود (Constraints)
    - primary_identity يجب أن يكون 'agricultural' أو 'investment'
    - secondary_identity يجب أن يكون 'agricultural' أو 'investment' أو NULL
    - secondary_identity يجب أن يكون مختلفاً عن primary_identity

  ## ملاحظات
  - هذه البنية نائمة ولن تظهر في الواجهة
  - جاهزة للتفعيل في المراحل المستقبلية
  - لا توجد واجهة مستخدم لتعديل هذه القيم حالياً
*/

-- إضافة حقل primary_identity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'primary_identity'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN primary_identity text DEFAULT 'agricultural' NOT NULL
    CHECK (primary_identity IN ('agricultural', 'investment'));
  END IF;
END $$;

-- إضافة حقل secondary_identity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'secondary_identity'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN secondary_identity text DEFAULT NULL
    CHECK (secondary_identity IN ('agricultural', 'investment') OR secondary_identity IS NULL);
  END IF;
END $$;

-- إضافة حقل secondary_identity_enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'secondary_identity_enabled'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN secondary_identity_enabled boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- إضافة constraint للتأكد من أن الهوية الثانية مختلفة عن الأساسية
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'different_identities_check'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT different_identities_check
    CHECK (
      secondary_identity IS NULL
      OR primary_identity != secondary_identity
    );
  END IF;
END $$;

-- تحديث المستخدمين الحاليين بالقيم الافتراضية
UPDATE user_profiles
SET
  primary_identity = 'agricultural',
  secondary_identity = NULL,
  secondary_identity_enabled = false
WHERE primary_identity IS NULL;

-- إنشاء index لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS idx_user_profiles_primary_identity
ON user_profiles(primary_identity);

CREATE INDEX IF NOT EXISTS idx_user_profiles_secondary_identity
ON user_profiles(secondary_identity)
WHERE secondary_identity IS NOT NULL;

-- إنشاء دالة مساعدة للحصول على الهوية الحالية
CREATE OR REPLACE FUNCTION get_user_current_identity(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_primary_identity text;
BEGIN
  SELECT primary_identity INTO v_primary_identity
  FROM user_profiles
  WHERE id = p_user_id;

  RETURN COALESCE(v_primary_identity, 'agricultural');
END;
$$;

-- إنشاء دالة مساعدة للتحقق من وجود هوية ثانية
CREATE OR REPLACE FUNCTION has_secondary_identity(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_secondary boolean;
BEGIN
  SELECT
    secondary_identity IS NOT NULL
    AND secondary_identity_enabled = true
  INTO v_has_secondary
  FROM user_profiles
  WHERE id = p_user_id;

  RETURN COALESCE(v_has_secondary, false);
END;
$$;

-- إضافة تعليق على الجدول
COMMENT ON COLUMN user_profiles.primary_identity IS 'الهوية الأساسية للمستخدم: agricultural (مزارع) أو investment (مستثمر)';
COMMENT ON COLUMN user_profiles.secondary_identity IS 'الهوية الثانية (نائمة): agricultural أو investment أو NULL';
COMMENT ON COLUMN user_profiles.secondary_identity_enabled IS 'هل الهوية الثانية مفعلة؟ (دائماً false في المرحلة الحالية)';