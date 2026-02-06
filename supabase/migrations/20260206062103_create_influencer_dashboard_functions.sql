/*
  # وظائف لوحة تحكم شريك النجاح

  ## الهدف
  توفير وظائف للحصول على إحصائيات شريك النجاح وعدد الأشجار المكتسبة

  ## الوظائف الجديدة

  1. `get_my_influencer_dashboard()` - الحصول على بيانات لوحة التحكم للمستخدم الحالي
  2. `get_influencer_by_code(code text)` - الحصول على معلومات الشريك بواسطة الكود

  ## الإحصائيات المُرجعة
  - اسم الشريك
  - كود الشريك (الاسم)
  - عدد الأشجار المكتسبة (من الحجوزات)
  - عدد الحجوزات الناجحة
  - الحالة (active/pending)

  ## الأمان
  - المستخدم المصادق يمكنه فقط رؤية بياناته الخاصة
  - get_influencer_by_code متاحة للجميع (للتحقق من الكود)
*/

-- ==========================================
-- الوظيفة 1: لوحة تحكم شريك النجاح
-- ==========================================

CREATE OR REPLACE FUNCTION get_my_influencer_dashboard()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  partner_record influencer_partners%ROWTYPE;
  trees_count integer;
  bookings_count integer;
  progress_percentage integer;
BEGIN
  -- الحصول على بيانات الشريك
  SELECT * INTO partner_record
  FROM influencer_partners
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- إذا لم يكن المستخدم شريك نجاح
  IF partner_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_partner',
      'message', 'المستخدم ليس شريك نجاح'
    );
  END IF;

  -- حساب عدد الأشجار من الحجوزات المؤكدة
  SELECT COALESCE(SUM(tree_count), 0) INTO trees_count
  FROM reservations
  WHERE influencer_code = partner_record.name
    AND status = 'confirmed';

  -- حساب عدد الحجوزات
  SELECT COUNT(*) INTO bookings_count
  FROM reservations
  WHERE influencer_code = partner_record.name
    AND status = 'confirmed';

  -- حساب نسبة التقدم (مثال: كل 20 شجرة = 100%)
  progress_percentage := LEAST(100, (trees_count * 100) / 20);

  -- إرجاع البيانات
  RETURN jsonb_build_object(
    'success', true,
    'partner', jsonb_build_object(
      'id', partner_record.id,
      'name', partner_record.name,
      'display_name', partner_record.display_name,
      'phone', partner_record.phone,
      'status', partner_record.status,
      'is_active', partner_record.is_active,
      'trees_earned', trees_count,
      'total_bookings', bookings_count,
      'progress_percentage', progress_percentage,
      'created_at', partner_record.created_at
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unknown',
      'message', 'حدث خطأ أثناء الحصول على البيانات'
    );
END;
$$;

COMMENT ON FUNCTION get_my_influencer_dashboard IS 'الحصول على لوحة تحكم شريك النجاح للمستخدم الحالي';

-- ==========================================
-- الوظيفة 2: التحقق من كود الشريك
-- ==========================================

CREATE OR REPLACE FUNCTION get_influencer_by_code(code text)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  partner_record influencer_partners%ROWTYPE;
BEGIN
  -- البحث عن الشريك بالاسم (الكود)
  SELECT * INTO partner_record
  FROM influencer_partners
  WHERE LOWER(name) = LOWER(code)
    AND status = 'active'
    AND is_active = true
  LIMIT 1;

  -- إذا لم يتم العثور على الشريك
  IF partner_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_found',
      'message', 'لم يتم العثور على شريك نجاح بهذا الاسم'
    );
  END IF;

  -- إرجاع البيانات الأساسية
  RETURN jsonb_build_object(
    'success', true,
    'partner', jsonb_build_object(
      'id', partner_record.id,
      'name', partner_record.name,
      'display_name', partner_record.display_name
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unknown',
      'message', 'حدث خطأ أثناء التحقق من الكود'
    );
END;
$$;

COMMENT ON FUNCTION get_influencer_by_code IS 'التحقق من كود شريك النجاح (متاح للجميع)';

-- ==========================================
-- الوظيفة 3: ربط شريك النجاح بحساب المستخدم
-- ==========================================

CREATE OR REPLACE FUNCTION link_partner_to_user(
  partner_phone text
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  partner_record influencer_partners%ROWTYPE;
BEGIN
  -- البحث عن الشريك برقم الجوال
  SELECT * INTO partner_record
  FROM influencer_partners
  WHERE phone = partner_phone
    AND status = 'active'
  LIMIT 1;

  -- إذا لم يتم العثور على الشريك
  IF partner_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_found',
      'message', 'لم يتم العثور على شريك نجاح بهذا الرقم أو لم يتم تفعيل حسابك بعد'
    );
  END IF;

  -- التحقق من أن الشريك غير مرتبط بمستخدم آخر
  IF partner_record.user_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_linked',
      'message', 'هذا الحساب مرتبط بالفعل بمستخدم آخر'
    );
  END IF;

  -- ربط الـ user_id الحالي بالشريك
  UPDATE influencer_partners
  SET user_id = auth.uid()
  WHERE id = partner_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم ربط الحساب بنجاح',
    'partner_id', partner_record.id,
    'partner_name', partner_record.name
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unknown',
      'message', 'حدث خطأ أثناء ربط الحساب'
    );
END;
$$;

COMMENT ON FUNCTION link_partner_to_user IS 'ربط شريك النجاح بحساب المستخدم الحالي';
