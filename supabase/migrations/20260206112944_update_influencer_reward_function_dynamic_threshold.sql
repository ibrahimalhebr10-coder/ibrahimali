/*
  # تحديث دالة المكافآت لاستخدام القيمة الديناميكية

  1. التغييرات
    - تحديث `update_influencer_stats_after_payment` لقراءة `trees_required_for_reward` من `influencer_settings`
    - استخدام القيمة الديناميكية بدلاً من 20 hardcoded
    - تحديث جميع الحسابات لاستخدام القيمة الديناميكية
  
  2. الهدف
    - جعل الحسابات تتحدث تلقائياً عند تغيير الإعدادات
    - مرونة في تغيير عدد الأشجار المطلوبة للمكافأة
*/

-- حذف الدالة القديمة
DROP FUNCTION IF EXISTS update_influencer_stats_after_payment(text, integer, uuid);

-- إنشاء الدالة الجديدة مع القراءة الديناميكية
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
  
  -- الحالة قبل
  v_trees_before integer;
  v_rewards_before integer;
  
  -- الحالة بعد
  v_trees_after integer;
  v_rewards_after integer;
  v_new_rewards integer;
  
  -- التقدم
  v_trees_in_batch integer;
  v_trees_until_next integer;
  
  -- القيمة الديناميكية
  v_trees_required integer;
  
  v_log_id uuid;
BEGIN
  -- قراءة عدد الأشجار المطلوبة من الإعدادات
  SELECT COALESCE(trees_required_for_reward, 20)
  INTO v_trees_required
  FROM influencer_settings
  LIMIT 1;
  
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

  -- البحث عن المؤثر وقراءة الحالة الحالية
  SELECT 
    id, 
    name,
    total_trees_booked,
    total_rewards_earned
  INTO 
    v_influencer_id, 
    v_influencer_name,
    v_trees_before,
    v_rewards_before
  FROM influencer_partners
  WHERE name = p_influencer_code
  AND is_active = true;

  -- إذا لم يُعثر على المؤثر
  IF v_influencer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'كود المؤثر غير موجود أو غير مفعّل',
      'code', p_influencer_code
    );
  END IF;

  -- حساب الحالة الجديدة (استخدام القيمة الديناميكية)
  v_trees_after := v_trees_before + p_trees_count;
  v_rewards_after := FLOOR(v_trees_after / v_trees_required::decimal);
  v_new_rewards := v_rewards_after - v_rewards_before;
  
  -- حساب التقدم (استخدام القيمة الديناميكية)
  v_trees_in_batch := v_trees_after % v_trees_required;
  v_trees_until_next := v_trees_required - v_trees_in_batch;

  -- تحديث جدول المؤثرين
  UPDATE influencer_partners
  SET 
    total_bookings = total_bookings + 1,
    total_trees_booked = v_trees_after,
    total_rewards_earned = v_rewards_after,
    last_booking_at = now(),
    updated_at = now()
  WHERE id = v_influencer_id;

  -- تسجيل العملية في السجل
  INSERT INTO influencer_rewards_log (
    influencer_id,
    reservation_id,
    trees_added,
    trees_before,
    rewards_before,
    trees_after,
    rewards_after,
    new_rewards_earned,
    trees_in_current_batch,
    trees_until_next_reward,
    notes
  ) VALUES (
    v_influencer_id,
    p_reservation_id,
    p_trees_count,
    v_trees_before,
    v_rewards_before,
    v_trees_after,
    v_rewards_after,
    v_new_rewards,
    v_trees_in_batch,
    v_trees_until_next,
    CASE 
      WHEN v_new_rewards > 0 THEN 
        format('تم كسب %s مكافأة جديدة! 🎉', v_new_rewards)
      ELSE 
        format('تقدم نحو المكافأة التالية: %s/%s أشجار', v_trees_in_batch, v_trees_required)
    END
  )
  RETURNING id INTO v_log_id;

  -- تسجيل النجاح
  RAISE NOTICE '✅ تم تحديث المؤثر: % | الحجز: % | الأشجار: %→% | المكافآت: %→% | التقدم: %/%',
    v_influencer_name, p_reservation_id, v_trees_before, v_trees_after, 
    v_rewards_before, v_rewards_after, v_trees_in_batch, v_trees_required;

  -- إرجاع النتيجة التفصيلية
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم تحديث إحصائيات المؤثر بنجاح',
    'influencer_name', v_influencer_name,
    'influencer_id', v_influencer_id,
    'log_id', v_log_id,
    
    -- الحالة قبل
    'trees_before', v_trees_before,
    'rewards_before', v_rewards_before,
    
    -- الحالة بعد
    'trees_after', v_trees_after,
    'rewards_after', v_rewards_after,
    
    -- التغييرات
    'trees_added', p_trees_count,
    'new_rewards_earned', v_new_rewards,
    
    -- التقدم
    'trees_in_current_batch', v_trees_in_batch,
    'trees_until_next_reward', v_trees_until_next,
    'trees_required_for_reward', v_trees_required,
    'progress_percentage', ROUND((v_trees_in_batch::decimal / v_trees_required::decimal) * 100, 1)
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ خطأ في تحديث إحصائيات المؤثر: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'حدث خطأ في تحديث الإحصائيات',
      'error', SQLERRM
    );
END;
$$;

-- السماح للجميع باستخدام الدالة
GRANT EXECUTE ON FUNCTION update_influencer_stats_after_payment(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_influencer_stats_after_payment(text, integer, uuid) TO anon;

-- Comment
COMMENT ON FUNCTION update_influencer_stats_after_payment IS 'تحدّث إحصائيات المؤثر مع قراءة ديناميكية لعدد الأشجار المطلوبة من الإعدادات';
