/*
  # إصلاح دالة add_offer_timeline - إضافة SECURITY DEFINER

  1. التحديث
    - إضافة SECURITY DEFINER لدالة add_offer_timeline
    - إضافة SECURITY DEFINER لدالة update_farm_offer_timestamp
    - ضمان عمل جميع الـ triggers بدون مشاكل RLS

  2. الفائدة
    - ✅ الـ triggers تعمل بشكل سليم
    - ✅ لا تتأثر بسياسات RLS
    - ✅ تسجيل التاريخ يعمل بشكل صحيح
*/

-- إعادة إنشاء دالة update_farm_offer_timestamp مع SECURITY DEFINER
DROP FUNCTION IF EXISTS update_farm_offer_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION update_farm_offer_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_updated_at := now();
  RETURN NEW;
END;
$$;

-- إعادة إنشاء الـ trigger
CREATE TRIGGER update_farm_offer_timestamp_trigger
  BEFORE UPDATE ON farm_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_farm_offer_timestamp();

-- إعادة إنشاء دالة add_offer_timeline مع SECURITY DEFINER
DROP FUNCTION IF EXISTS add_offer_timeline() CASCADE;

CREATE OR REPLACE FUNCTION add_offer_timeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO farm_offer_timeline (offer_id, status, note, created_by)
    VALUES (NEW.id, NEW.status, NEW.admin_notes, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- إعادة إنشاء الـ trigger
CREATE TRIGGER add_offer_timeline_trigger
  AFTER UPDATE ON farm_offers
  FOR EACH ROW
  EXECUTE FUNCTION add_offer_timeline();

-- إضافة تعليقات توضيحية
COMMENT ON FUNCTION update_farm_offer_timestamp() IS 'تحديث last_updated_at تلقائياً - SECURITY DEFINER';
COMMENT ON FUNCTION add_offer_timeline() IS 'إضافة سجل في timeline عند تغيير الحالة - SECURITY DEFINER';
