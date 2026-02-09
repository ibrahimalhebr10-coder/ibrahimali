/*
  # إضافة نظام إدارة السنوات المجانية لأكواد الشركاء

  ## التغييرات
  
  1. إضافة عمود bonus_years في جدول influencer_partners
     - يحدد عدد السنوات المجانية لكل شريك
     - القيمة الافتراضية: 3 سنوات
  
  2. إضافة إعدادات عامة في system_settings
     - default_partner_bonus_years: السنوات المجانية الافتراضية لكل شريك جديد
     - max_partner_bonus_years: الحد الأقصى للسنوات المجانية
     - min_partner_bonus_years: الحد الأدنى للسنوات المجانية
  
  3. ملاحظات
     - يمكن تخصيص السنوات لكل شريك بشكل منفصل
     - الإعدادات العامة تستخدم كقيم افتراضية فقط
*/

-- 1. إضافة عمود bonus_years في جدول influencer_partners
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'influencer_partners' 
    AND column_name = 'bonus_years'
  ) THEN
    ALTER TABLE influencer_partners 
    ADD COLUMN bonus_years integer DEFAULT 3 NOT NULL CHECK (bonus_years >= 0 AND bonus_years <= 10);
    
    COMMENT ON COLUMN influencer_partners.bonus_years IS 'عدد السنوات المجانية التي يحصل عليها العميل عند استخدام كود هذا الشريك';
  END IF;
END $$;

-- 2. تحديث السنوات المجانية للشركاء الحاليين إلى 3 سنوات
UPDATE influencer_partners 
SET bonus_years = 3 
WHERE bonus_years IS NULL OR bonus_years = 0;

-- 3. إضافة إعدادات عامة لنظام أكواد الشركاء
INSERT INTO system_settings (setting_key, setting_value, setting_type, setting_category, description, is_public)
VALUES 
  (
    'default_partner_bonus_years',
    '3',
    'number',
    'partner_codes',
    'عدد السنوات المجانية الافتراضية لأكواد الشركاء الجدد',
    false
  ),
  (
    'max_partner_bonus_years',
    '10',
    'number',
    'partner_codes',
    'الحد الأقصى لعدد السنوات المجانية التي يمكن منحها لكود شريك',
    false
  ),
  (
    'min_partner_bonus_years',
    '1',
    'number',
    'partner_codes',
    'الحد الأدنى لعدد السنوات المجانية لكود شريك',
    false
  ),
  (
    'partner_code_bonus_description',
    'سنوات مجانية إضافية عند استخدام كود الشريك',
    'text',
    'partner_codes',
    'وصف المميزات التي يحصل عليها العميل عند استخدام كود الشريك',
    true
  )
ON CONFLICT (setting_key) DO UPDATE
SET 
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();

-- 4. إضافة دالة للحصول على السنوات المجانية من كود الشريك
CREATE OR REPLACE FUNCTION get_partner_bonus_years(p_partner_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bonus_years integer;
BEGIN
  -- الحصول على السنوات المجانية للشريك
  SELECT bonus_years INTO v_bonus_years
  FROM influencer_partners
  WHERE partner_code = p_partner_code
    AND is_active = true
    AND status = 'active';
  
  -- إذا لم يتم العثور على الشريك، نرجع 0
  IF v_bonus_years IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN v_bonus_years;
END;
$$;

COMMENT ON FUNCTION get_partner_bonus_years IS 'دالة للحصول على عدد السنوات المجانية من كود شريك محدد';
