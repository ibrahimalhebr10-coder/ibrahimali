/*
  # إضافة حقول رقم الجوال والحالة لشركاء النجاح

  ## الهدف
  
  تحضير جدول influencer_partners لاستقبال طلبات التسجيل من الواجهة الأمامية.

  ## التغييرات
  
  1. إضافة حقل phone (رقم الجوال) - مطلوب وفريد
  2. إضافة حقل status (pending/active/rejected) - افتراضي: pending
  3. تحديث RLS للسماح بالتسجيل العام (INSERT بدون مصادقة)
  4. إنشاء دالة للتسجيل كشريك نجاح

  ## الأمان
  
  - السماح بالتسجيل العام (بدون مصادقة)
  - التحقق من عدم تكرار رقم الجوال
  - الحالة الافتراضية: pending
  - المسؤولون فقط يمكنهم تفعيل الحسابات
*/

-- إضافة حقل phone (رقم الجوال)
ALTER TABLE influencer_partners
ADD COLUMN IF NOT EXISTS phone text;

-- إضافة حقل status (الحالة)
ALTER TABLE influencer_partners
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
CHECK (status IN ('pending', 'active', 'rejected'));

-- إضافة constraint UNIQUE على رقم الجوال
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'influencer_partners_phone_unique'
  ) THEN
    ALTER TABLE influencer_partners
    ADD CONSTRAINT influencer_partners_phone_unique UNIQUE (phone);
  END IF;
END $$;

-- Index للأداء
CREATE INDEX IF NOT EXISTS idx_influencer_partners_phone 
ON influencer_partners(phone) 
WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_influencer_partners_status 
ON influencer_partners(status);

-- Comments
COMMENT ON COLUMN influencer_partners.phone IS 'رقم الجوال للتواصل والتفعيل';
COMMENT ON COLUMN influencer_partners.status IS 'حالة الشريك: pending (قيد المراجعة), active (مفعّل), rejected (مرفوض)';

-- تحديث RLS: السماح بالتسجيل العام
DROP POLICY IF EXISTS "Anyone can register as success partner" ON influencer_partners;

CREATE POLICY "Anyone can register as success partner"
ON influencer_partners
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND phone IS NOT NULL
  AND name IS NOT NULL
);

-- دالة التسجيل كشريك نجاح
CREATE OR REPLACE FUNCTION register_success_partner(
  partner_name text,
  partner_phone text
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_partner_id uuid;
  existing_phone_count integer;
  existing_name_count integer;
BEGIN
  -- التحقق من عدم تكرار رقم الجوال
  SELECT COUNT(*) INTO existing_phone_count
  FROM influencer_partners
  WHERE phone = partner_phone;

  IF existing_phone_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'phone_exists',
      'message', 'رقم الجوال مسجل مسبقاً'
    );
  END IF;

  -- التحقق من عدم تكرار الاسم
  SELECT COUNT(*) INTO existing_name_count
  FROM influencer_partners
  WHERE LOWER(name) = LOWER(partner_name);

  IF existing_name_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'name_exists',
      'message', 'هذا الاسم مسجل مسبقاً'
    );
  END IF;

  -- إنشاء سجل شريك نجاح جديد
  INSERT INTO influencer_partners (
    name,
    display_name,
    phone,
    status,
    is_active
  )
  VALUES (
    partner_name,
    partner_name,
    partner_phone,
    'pending',
    false
  )
  RETURNING id INTO new_partner_id;

  RETURN jsonb_build_object(
    'success', true,
    'partner_id', new_partner_id,
    'message', 'تم استلام طلبك بنجاح! سنتواصل معك قريباً'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unknown',
      'message', 'حدث خطأ أثناء التسجيل. يرجى المحاولة لاحقاً'
    );
END;
$$;

COMMENT ON FUNCTION register_success_partner IS 'تسجيل شريك نجاح جديد من الواجهة الأمامية';
