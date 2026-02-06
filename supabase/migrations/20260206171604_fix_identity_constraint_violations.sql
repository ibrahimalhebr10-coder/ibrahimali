/*
  # إصلاح انتهاكات قيد الهوية المختلفة

  ## المشكلة
  - بعض السجلات في user_profiles قد تحتوي على primary_identity = secondary_identity
  - هذا ينتهك قيد different_identities_check

  ## الحل
  1. تعيين secondary_identity إلى NULL للسجلات المتعارضة
  2. التأكد من عدم حدوث هذه المشكلة مستقبلاً

  ## الأمان
  - آمن تماماً: نقوم فقط بمسح secondary_identity المتطابقة
*/

-- إصلاح السجلات القديمة التي تنتهك القيد
UPDATE user_profiles
SET
  secondary_identity = NULL,
  secondary_identity_enabled = false
WHERE
  secondary_identity IS NOT NULL
  AND primary_identity = secondary_identity;

-- التحقق من النتائج
DO $$
DECLARE
  v_violations_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_violations_count
  FROM user_profiles
  WHERE
    secondary_identity IS NOT NULL
    AND primary_identity = secondary_identity;

  IF v_violations_count > 0 THEN
    RAISE WARNING 'تم العثور على % سجل لا يزال ينتهك القيد!', v_violations_count;
  ELSE
    RAISE NOTICE 'تم إصلاح جميع انتهاكات القيد بنجاح ✓';
  END IF;
END $$;