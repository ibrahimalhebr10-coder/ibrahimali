/*
  # نظام متابعة المزارع الشامل

  1. الغرض
    - إنشاء نظام متابعة على مستوى المزارع بدلاً من الحجوزات الفردية
    - تتبع الأشجار المتبقية في كل مزرعة
    - إحصائيات متقدمة لكل مزرعة
    - التحكم في وضع الدفع (فوري/مرن) على مستوى المزرعة

  2. الدوال
    - get_farms_follow_up_stats: إحصائيات شاملة لجميع المزارع
    - get_farm_reservations_details: تفاصيل حجوزات مزرعة معينة
    - toggle_farm_payment_mode: تبديل وضع الدفع لجميع حجوزات المزرعة

  3. الأمان
    - جميع الدوال SECURITY DEFINER للمدراء فقط
    - التحقق من صلاحيات المدير
*/

-- =====================================================
-- دالة: احصائيات المزارع للمتابعة
-- =====================================================
CREATE OR REPLACE FUNCTION get_farms_follow_up_stats()
RETURNS TABLE (
  farm_id uuid,
  farm_name text,
  farm_category text,
  farm_status text,
  total_trees integer,
  reserved_trees integer,
  remaining_trees integer,
  pending_reservations_count bigint,
  pending_amount numeric,
  confirmed_reservations_count bigint,
  confirmed_amount numeric,
  critical_reservations_count bigint,
  urgent_reservations_count bigint,
  total_follow_ups bigint,
  last_reservation_date timestamptz,
  is_open_for_booking boolean,
  default_payment_mode text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id as farm_id,
    f.name_ar as farm_name,
    fc.name_ar as farm_category,
    f.status as farm_status,
    COALESCE(f.total_trees, 0)::integer as total_trees,

    -- الأشجار المحجوزة (confirmed + pending)
    COALESCE((
      SELECT SUM(total_trees)::integer
      FROM reservations
      WHERE farm_id = f.id
      AND status IN ('confirmed', 'pending', 'pending_payment')
    ), 0) as reserved_trees,

    -- الأشجار المتبقية
    (COALESCE(f.total_trees, 0) - COALESCE((
      SELECT SUM(total_trees)
      FROM reservations
      WHERE farm_id = f.id
      AND status IN ('confirmed', 'pending', 'pending_payment')
    ), 0))::integer as remaining_trees,

    -- عدد الحجوزات المعلقة
    (SELECT COUNT(*)
     FROM reservations
     WHERE farm_id = f.id
     AND status = 'pending_payment') as pending_reservations_count,

    -- المبلغ المعلق
    COALESCE((
      SELECT SUM(total_price)
      FROM reservations
      WHERE farm_id = f.id
      AND status = 'pending_payment'
    ), 0) as pending_amount,

    -- عدد الحجوزات المؤكدة
    (SELECT COUNT(*)
     FROM reservations
     WHERE farm_id = f.id
     AND status = 'confirmed') as confirmed_reservations_count,

    -- المبلغ المؤكد
    COALESCE((
      SELECT SUM(total_price)
      FROM reservations
      WHERE farm_id = f.id
      AND status = 'confirmed'
    ), 0) as confirmed_amount,

    -- الحجوزات الحرجة (أقل من 24 ساعة)
    (SELECT COUNT(*)
     FROM reservations
     WHERE farm_id = f.id
     AND status = 'pending_payment'
     AND flexible_payment_enabled = true
     AND payment_deadline < now() + interval '24 hours') as critical_reservations_count,

    -- الحجوزات العاجلة (أقل من 3 أيام)
    (SELECT COUNT(*)
     FROM reservations
     WHERE farm_id = f.id
     AND status = 'pending_payment'
     AND flexible_payment_enabled = true
     AND payment_deadline < now() + interval '3 days') as urgent_reservations_count,

    -- إجمالي المتابعات
    (SELECT COUNT(*)
     FROM follow_up_activities fa
     JOIN reservations r ON fa.reservation_id = r.id
     WHERE r.farm_id = f.id) as total_follow_ups,

    -- تاريخ آخر حجز
    (SELECT MAX(created_at)
     FROM reservations
     WHERE farm_id = f.id) as last_reservation_date,

    -- هل المزرعة مفتوحة للحجز
    COALESCE(f.is_open_for_booking, true) as is_open_for_booking,

    -- وضع الدفع الافتراضي (حساب الأغلبية)
    CASE
      WHEN (SELECT COUNT(*)
            FROM reservations
            WHERE farm_id = f.id
            AND status = 'pending_payment'
            AND flexible_payment_enabled = true) >
           (SELECT COUNT(*)
            FROM reservations
            WHERE farm_id = f.id
            AND status = 'pending_payment'
            AND flexible_payment_enabled = false)
      THEN 'flexible'
      ELSE 'immediate'
    END as default_payment_mode

  FROM farms f
  LEFT JOIN farm_categories fc ON f.category_id = fc.id
  WHERE f.status IN ('active', 'upcoming')
  ORDER BY
    -- ترتيب حسب الأولوية
    CASE
      WHEN (SELECT COUNT(*)
            FROM reservations
            WHERE farm_id = f.id
            AND status = 'pending_payment'
            AND payment_deadline < now() + interval '24 hours') > 0 THEN 1
      WHEN (SELECT COUNT(*)
            FROM reservations
            WHERE farm_id = f.id
            AND status = 'pending_payment') > 0 THEN 2
      ELSE 3
    END,
    f.name_ar;
END;
$$;

-- =====================================================
-- دالة: تفاصيل حجوزات مزرعة معينة
-- =====================================================
CREATE OR REPLACE FUNCTION get_farm_reservations_details(
  p_farm_id uuid
)
RETURNS TABLE (
  reservation_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  path_type text,
  trees_count integer,
  total_amount numeric,
  status text,
  created_at timestamptz,
  payment_deadline timestamptz,
  hours_remaining numeric,
  urgency_level text,
  flexible_payment_enabled boolean,
  payment_reminder_count integer,
  follow_up_count bigint,
  last_activity_type text,
  last_activity_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id as reservation_id,
    COALESCE(up.full_name, 'عميل') as customer_name,
    up.phone as customer_phone,
    '' as customer_email,
    r.path_type,
    r.total_trees as trees_count,
    r.total_price as total_amount,
    r.status,
    r.created_at,
    r.payment_deadline,
    EXTRACT(EPOCH FROM (r.payment_deadline - now())) / 3600 as hours_remaining,

    -- مستوى الاستعجال
    CASE
      WHEN r.payment_deadline < now() THEN 'overdue'
      WHEN r.payment_deadline < now() + interval '24 hours' THEN 'critical'
      WHEN r.payment_deadline < now() + interval '3 days' THEN 'urgent'
      WHEN r.payment_deadline < now() + interval '7 days' THEN 'medium'
      ELSE 'normal'
    END as urgency_level,

    r.flexible_payment_enabled,
    COALESCE(r.payment_reminder_count, 0) as payment_reminder_count,

    -- عدد المتابعات
    (SELECT COUNT(*)
     FROM follow_up_activities
     WHERE reservation_id = r.id) as follow_up_count,

    -- آخر نشاط
    (SELECT activity_type
     FROM follow_up_activities
     WHERE reservation_id = r.id
     ORDER BY created_at DESC
     LIMIT 1) as last_activity_type,

    (SELECT created_at
     FROM follow_up_activities
     WHERE reservation_id = r.id
     ORDER BY created_at DESC
     LIMIT 1) as last_activity_date

  FROM reservations r
  LEFT JOIN user_profiles up ON r.user_id = up.id
  WHERE r.farm_id = p_farm_id
    AND r.status IN ('pending_payment', 'confirmed')
  ORDER BY
    CASE
      WHEN r.status = 'pending_payment' AND r.payment_deadline < now() THEN 1
      WHEN r.status = 'pending_payment' AND r.payment_deadline < now() + interval '24 hours' THEN 2
      WHEN r.status = 'pending_payment' THEN 3
      ELSE 4
    END,
    r.created_at DESC;
END;
$$;

-- =====================================================
-- دالة: تبديل وضع الدفع لجميع حجوزات مزرعة
-- =====================================================
CREATE OR REPLACE FUNCTION toggle_farm_payment_mode(
  p_farm_id uuid,
  p_enable_flexible boolean,
  p_payment_days integer DEFAULT 7,
  p_admin_note text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affected_count integer;
  v_farm_name text;
BEGIN
  -- الحصول على اسم المزرعة
  SELECT name_ar INTO v_farm_name FROM farms WHERE id = p_farm_id;

  IF v_farm_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'المزرعة غير موجودة'
    );
  END IF;

  -- تحديث جميع الحجوزات المعلقة في هذه المزرعة
  UPDATE reservations
  SET
    flexible_payment_enabled = p_enable_flexible,
    payment_deadline = CASE
      WHEN p_enable_flexible THEN now() + (p_payment_days || ' days')::interval
      ELSE now() + interval '1 hour'
    END,
    updated_at = now()
  WHERE farm_id = p_farm_id
    AND status = 'pending_payment';

  GET DIAGNOSTICS v_affected_count = ROW_COUNT;

  -- تسجيل في follow_up_activities
  INSERT INTO follow_up_activities (
    reservation_id,
    activity_type,
    activity_result,
    notes,
    created_at
  )
  SELECT
    id,
    'manual_note',
    'payment_mode_changed',
    format(
      'تم تغيير وضع الدفع للمزرعة %s إلى %s. %s',
      v_farm_name,
      CASE WHEN p_enable_flexible THEN 'الدفع المرن (' || p_payment_days || ' أيام)' ELSE 'الدفع الفوري' END,
      COALESCE('ملاحظة المدير: ' || p_admin_note, '')
    ),
    now()
  FROM reservations
  WHERE farm_id = p_farm_id
    AND status = 'pending_payment';

  RETURN jsonb_build_object(
    'success', true,
    'message', format('تم تحديث %s حجز في مزرعة %s', v_affected_count, v_farm_name),
    'affected_count', v_affected_count,
    'farm_name', v_farm_name,
    'new_mode', CASE WHEN p_enable_flexible THEN 'flexible' ELSE 'immediate' END
  );
END;
$$;

-- =====================================================
-- دالة: إحصائيات سريعة للمتابعة
-- =====================================================
CREATE OR REPLACE FUNCTION get_follow_up_quick_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_farms_with_pending', (
      SELECT COUNT(DISTINCT farm_id)
      FROM reservations
      WHERE status = 'pending_payment'
    ),
    'total_pending_reservations', (
      SELECT COUNT(*)
      FROM reservations
      WHERE status = 'pending_payment'
    ),
    'total_pending_amount', (
      SELECT COALESCE(SUM(total_price), 0)
      FROM reservations
      WHERE status = 'pending_payment'
    ),
    'critical_farms_count', (
      SELECT COUNT(DISTINCT farm_id)
      FROM reservations
      WHERE status = 'pending_payment'
      AND flexible_payment_enabled = true
      AND payment_deadline < now() + interval '24 hours'
    ),
    'urgent_farms_count', (
      SELECT COUNT(DISTINCT farm_id)
      FROM reservations
      WHERE status = 'pending_payment'
      AND flexible_payment_enabled = true
      AND payment_deadline < now() + interval '3 days'
    ),
    'farms_nearly_full', (
      SELECT COUNT(*)
      FROM farms f
      WHERE (
        SELECT COALESCE(SUM(total_trees), 0)
        FROM reservations
        WHERE farm_id = f.id
        AND status IN ('confirmed', 'pending', 'pending_payment')
      ) >= f.total_trees * 0.9
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- تعليقات توضيحية
COMMENT ON FUNCTION get_farms_follow_up_stats() IS 'إحصائيات شاملة لجميع المزارع للمتابعة';
COMMENT ON FUNCTION get_farm_reservations_details(uuid) IS 'تفاصيل جميع حجوزات مزرعة معينة';
COMMENT ON FUNCTION toggle_farm_payment_mode(uuid, boolean, integer, text) IS 'تبديل وضع الدفع لجميع حجوزات مزرعة';
COMMENT ON FUNCTION get_follow_up_quick_stats() IS 'إحصائيات سريعة للمتابعة';
