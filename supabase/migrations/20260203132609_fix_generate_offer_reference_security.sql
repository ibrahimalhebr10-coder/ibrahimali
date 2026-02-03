/*
  # إصلاح دالة توليد رقم المرجع - مشكلة الأمان

  1. المشكلة الجذرية
    - دالة generate_offer_reference() تحاول قراءة من farm_offers
    - المستخدمون غير المسجلين (anon) لا يملكون صلاحية SELECT
    - هذا يتسبب في فشل RLS عند الإدخال

  2. الحل
    - جعل الدالة SECURITY DEFINER
    - تعمل بصلاحيات مالك الدالة (postgres/supabase_admin)
    - بذلك يمكنها قراءة farm_offers بغض النظر عن RLS

  3. التأثير
    - ✅ المستخدمون غير المسجلين يمكنهم الإدخال
    - ✅ يتم توليد رقم المرجع تلقائياً
    - ✅ لا تأثير على الأمان العام
*/

-- حذف الدوال القديمة
DROP FUNCTION IF EXISTS generate_offer_reference() CASCADE;
DROP FUNCTION IF EXISTS set_offer_reference() CASCADE;

-- إعادة إنشاء دالة توليد رقم المرجع مع SECURITY DEFINER
CREATE OR REPLACE FUNCTION generate_offer_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER  -- هذا هو المفتاح: تعمل بصلاحيات المالك
SET search_path = public
AS $$
DECLARE
  year text;
  sequence_num text;
BEGIN
  year := EXTRACT(YEAR FROM NOW())::text;
  sequence_num := LPAD((SELECT COUNT(*) + 1 FROM farm_offers)::text, 5, '0');
  RETURN 'FM-' || year || '-' || sequence_num;
END;
$$;

-- إعادة إنشاء دالة تعيين رقم المرجع مع SECURITY DEFINER
CREATE OR REPLACE FUNCTION set_offer_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- تعمل بصلاحيات المالك
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_offer_reference();
  END IF;
  RETURN NEW;
END;
$$;

-- إعادة إنشاء الـ trigger
CREATE TRIGGER set_offer_reference_trigger
  BEFORE INSERT ON farm_offers
  FOR EACH ROW
  EXECUTE FUNCTION set_offer_reference();

-- إضافة تعليق توضيحي
COMMENT ON FUNCTION generate_offer_reference() IS 'توليد رقم مرجع فريد تلقائياً - SECURITY DEFINER للسماح بالقراءة من farm_offers';
COMMENT ON FUNCTION set_offer_reference() IS 'تعيين رقم المرجع تلقائياً قبل الإدخال - SECURITY DEFINER';
