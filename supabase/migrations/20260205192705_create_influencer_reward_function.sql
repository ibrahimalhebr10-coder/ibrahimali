/*
  # دالة تحديث مكافآت المؤثر

  ## الوظيفة

  تُنفذ بعد تأكيد الدفع لحجز مرتبط بكود مؤثر:
  1. تبحث عن المؤثر بالكود
  2. تتحقق من أنه مفعّل
  3. تحدّث إحصائياته:
     - total_bookings += 1
     - total_trees_booked += عدد الأشجار
     - total_rewards_earned = حساب المكافآت (كل 20 شجرة = 1)
  4. تُسجل آخر تحديث

  ## المدخلات
  
  - p_influencer_code: كود المؤثر من الحجز
  - p_trees_count: عدد الأشجار في الحجز
  - p_reservation_id: معرّف الحجز (للتسجيل)

  ## المخرجات
  
  - success: boolean
  - message: text
  - influencer_name: text (اسم المؤثر إن وُجد)
*/

CREATE OR REPLACE FUNCTION update_influencer_stats_after_payment(
  p_influencer_code text,
  p_trees_count integer,
  p_reservation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_influencer_id uuid;
  v_influencer_name text;
  v_new_total_trees integer;
  v_new_rewards integer;
BEGIN
  -- التحقق من المدخلات
  IF p_influencer_code IS NULL OR p_influencer_code = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'كود المؤثر فارغ'
    );
  END IF;

  IF p_trees_count <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'عدد الأشجار غير صالح'
    );
  END IF;

  -- البحث عن المؤثر بالكود
  SELECT id, partner_name
  INTO v_influencer_id, v_influencer_name
  FROM influencer_partners
  WHERE referral_code = p_influencer_code
  AND is_active = true;

  -- إذا لم يُعثر على المؤثر
  IF v_influencer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'كود المؤثر غير موجود أو غير مفعّل',
      'code', p_influencer_code
    );
  END IF;

  -- تحديث الإحصائيات
  UPDATE influencer_partners
  SET 
    total_bookings = total_bookings + 1,
    total_trees_booked = total_trees_booked + p_trees_count,
    last_booking_at = now()
  WHERE id = v_influencer_id
  RETURNING total_trees_booked INTO v_new_total_trees;

  -- حساب المكافآت: كل 20 شجرة = 1 شجرة مكافأة
  v_new_rewards := FLOOR(v_new_total_trees / 20.0);

  -- تحديث المكافآت المحسوبة
  UPDATE influencer_partners
  SET total_rewards_earned = v_new_rewards
  WHERE id = v_influencer_id;

  -- تسجيل النجاح
  RAISE NOTICE 'تم تحديث إحصائيات المؤثر: % (ID: %) - الحجز: % - الأشجار: % - المكافآت: %',
    v_influencer_name, v_influencer_id, p_reservation_id, p_trees_count, v_new_rewards;

  -- إرجاع النتيجة
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم تحديث إحصائيات المؤثر بنجاح',
    'influencer_name', v_influencer_name,
    'influencer_id', v_influencer_id,
    'total_trees', v_new_total_trees,
    'total_rewards', v_new_rewards,
    'trees_added', p_trees_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'خطأ في تحديث إحصائيات المؤثر: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'حدث خطأ في تحديث الإحصائيات',
      'error', SQLERRM
    );
END;
$$;

-- السماح للجميع باستخدام الدالة (لأنها SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION update_influencer_stats_after_payment(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_influencer_stats_after_payment(text, integer, uuid) TO anon;

-- إضافة comment للتوضيح
COMMENT ON FUNCTION update_influencer_stats_after_payment IS 'تحدّث إحصائيات المؤثر بعد تأكيد الدفع - تُنفذ فقط بعد نجاح الدفع';