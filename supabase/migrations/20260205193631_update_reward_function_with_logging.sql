/*
  # تحديث دالة المكافآت مع التسجيل التفصيلي

  ## التحديثات

  1. قراءة الحالة الحالية قبل التحديث
  2. حساب المكافآت الجديدة
  3. تسجيل العملية في influencer_rewards_log
  4. حساب التقدم (trees_in_current_batch & trees_until_next_reward)

  ## الحسابات

  - trees_in_current_batch = total_trees MOD 20
  - trees_until_next_reward = 20 - trees_in_current_batch
  - new_rewards_earned = rewards_after - rewards_before

  ## مثال

  قبل: 85 أشجار → 4 مكافآت
  حجز: 30 شجرة
  بعد: 115 شجرة → 5 مكافآت
  
  التسجيل:
  - trees_before: 85
  - trees_after: 115
  - rewards_before: 4
  - rewards_after: 5
  - new_rewards_earned: 1
  - trees_in_current_batch: 115 % 20 = 15
  - trees_until_next_reward: 20 - 15 = 5
*/

-- حذف الدالة القديمة
DROP FUNCTION IF EXISTS update_influencer_stats_after_payment(text, integer, uuid);

-- إنشاء الدالة الجديدة مع التسجيل
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
  
  v_log_id uuid;
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

  -- حساب الحالة الجديدة
  v_trees_after := v_trees_before + p_trees_count;
  v_rewards_after := FLOOR(v_trees_after / 20.0);
  v_new_rewards := v_rewards_after - v_rewards_before;
  
  -- حساب التقدم
  v_trees_in_batch := v_trees_after % 20;
  v_trees_until_next := 20 - v_trees_in_batch;

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
        format('تقدم نحو المكافأة التالية: %s/%s أشجار', v_trees_in_batch, 20)
    END
  )
  RETURNING id INTO v_log_id;

  -- تسجيل النجاح
  RAISE NOTICE '✅ تم تحديث المؤثر: % | الحجز: % | الأشجار: %→% | المكافآت: %→% | التقدم: %/20',
    v_influencer_name, p_reservation_id, v_trees_before, v_trees_after, 
    v_rewards_before, v_rewards_after, v_trees_in_batch;

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
    'progress_percentage', ROUND((v_trees_in_batch::decimal / 20.0) * 100, 1)
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
COMMENT ON FUNCTION update_influencer_stats_after_payment IS 'تحدّث إحصائيات المؤثر مع تسجيل تفصيلي في influencer_rewards_log - شفافية 100%';