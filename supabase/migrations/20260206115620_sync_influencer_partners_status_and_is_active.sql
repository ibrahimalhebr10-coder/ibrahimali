/*
  # مزامنة حقول status و is_active في جدول influencer_partners
  
  ## المشكلة
  
  الجدول يحتوي على حقلين للحالة:
  - is_active (boolean) - الحقل الأصلي
  - status (text: pending/active/rejected) - الحقل الجديد
  
  هذا يسبب تضارب عندما يتم التحديث، حيث:
  - RPC functions تتحقق من `status = 'active' AND is_active = true`
  - لكن التحديثات قد تحدث أحدهما فقط
  
  ## الحل
  
  1. إنشاء trigger لمزامنة is_active مع status تلقائياً
  2. تحديث السجلات الموجودة لضمان التطابق
  3. جعل is_active دائماً يطابق status
  
  ## القاعدة
  
  - إذا status = 'active' → is_active = true
  - إذا status != 'active' → is_active = false
*/

-- ========================================
-- الخطوة 1: دالة المزامنة
-- ========================================

CREATE OR REPLACE FUNCTION sync_influencer_status_and_is_active()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- مزامنة is_active مع status
  IF NEW.status = 'active' THEN
    NEW.is_active := true;
  ELSE
    NEW.is_active := false;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION sync_influencer_status_and_is_active() 
IS 'مزامنة حقل is_active مع حقل status تلقائياً';

-- ========================================
-- الخطوة 2: إنشاء trigger
-- ========================================

DROP TRIGGER IF EXISTS trigger_sync_influencer_status ON influencer_partners;

CREATE TRIGGER trigger_sync_influencer_status
  BEFORE INSERT OR UPDATE OF status
  ON influencer_partners
  FOR EACH ROW
  EXECUTE FUNCTION sync_influencer_status_and_is_active();

-- ========================================
-- الخطوة 3: تحديث السجلات الموجودة
-- ========================================

-- تحديث is_active ليطابق status
UPDATE influencer_partners
SET is_active = (status = 'active');

-- ========================================
-- الخطوة 4: تحديث الوثائق
-- ========================================

COMMENT ON COLUMN influencer_partners.is_active 
IS 'يتم مزامنته تلقائياً مع status - لا تحدث يدوياً';

COMMENT ON COLUMN influencer_partners.status 
IS 'حالة الشريك: pending (قيد المراجعة), active (مفعّل), rejected (مرفوض) - يتحكم في is_active تلقائياً';
