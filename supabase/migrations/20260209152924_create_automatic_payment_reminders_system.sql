/*
  # نظام التذكيرات التلقائية للدفع

  1. الوظائف الجديدة
    - `process_payment_reminders()` - دالة رئيسية لمعالجة وإرسال التذكيرات
    - تفحص جميع الحجوزات المعلقة
    - ترسل التذكيرات المناسبة حسب الوقت المتبقي
    - تسجل التذكيرات المرسلة في جدول payment_reminders
    - تحدث عداد التذكيرات في الحجوزات

  2. آلية العمل
    - تعمل كل ساعة عبر Cron Job
    - تفحص الإعدادات من system_settings
    - ترسل تذكيرات حسب:
      * عند الحجز (reminder_on_booking)
      * في منتصف المدة (reminder_midway)
      * قبل يوم واحد (reminder_one_day_before)
      * يوم الموعد النهائي (reminder_deadline_day)

  3. الحماية
    - تمنع إرسال نفس التذكير مرتين
    - تحترم إعدادات التفعيل/التعطيل
    - تسجل جميع الأنشطة

  4. ملاحظات مهمة
    - الدالة تُستدعى من Edge Function
    - يمكن استدعاؤها يدوياً للاختبار
    - ترجع تقرير بعدد التذكيرات المرسلة
*/

-- إنشاء دالة معالجة التذكيرات التلقائية
CREATE OR REPLACE FUNCTION process_payment_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings jsonb;
  v_reminder_enabled boolean;
  v_reminder_on_booking boolean;
  v_reminder_midway boolean;
  v_reminder_one_day_before boolean;
  v_reminder_deadline_day boolean;
  v_grace_period_days integer;
  v_template_initial text;
  v_template_midway text;
  v_template_urgent text;
  v_reservation record;
  v_days_remaining numeric;
  v_hours_remaining numeric;
  v_midway_point numeric;
  v_message text;
  v_reminder_type text;
  v_should_send boolean;
  v_last_reminder_type text;
  v_sent_count integer := 0;
  v_skipped_count integer := 0;
  v_result jsonb;
BEGIN
  -- قراءة الإعدادات
  SELECT jsonb_object_agg(key, value)
  INTO v_settings
  FROM system_settings
  WHERE key IN (
    'flexible_payment_enabled',
    'payment_grace_period_days',
    'reminder_on_booking',
    'reminder_midway',
    'reminder_one_day_before',
    'reminder_deadline_day',
    'payment_reminder_initial',
    'payment_reminder_midway',
    'payment_reminder_urgent'
  );

  -- التحقق من تفعيل النظام
  v_reminder_enabled := (v_settings->>'flexible_payment_enabled')::boolean;
  
  IF NOT v_reminder_enabled THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'نظام التذكيرات معطل',
      'sent', 0,
      'skipped', 0
    );
  END IF;

  -- قراءة الإعدادات الفردية
  v_reminder_on_booking := COALESCE((v_settings->>'reminder_on_booking')::boolean, true);
  v_reminder_midway := COALESCE((v_settings->>'reminder_midway')::boolean, true);
  v_reminder_one_day_before := COALESCE((v_settings->>'reminder_one_day_before')::boolean, true);
  v_reminder_deadline_day := COALESCE((v_settings->>'reminder_deadline_day')::boolean, true);
  v_grace_period_days := COALESCE((v_settings->>'payment_grace_period_days')::integer, 7);
  v_template_initial := COALESCE(v_settings->>'payment_reminder_initial', 'شكراً لحجزك معنا! لديك {days} أيام لإتمام الدفع.');
  v_template_midway := COALESCE(v_settings->>'payment_reminder_midway', 'تذكير: لديك {days} أيام متبقية لإتمام دفع حجزك.');
  v_template_urgent := COALESCE(v_settings->>'payment_reminder_urgent', 'عاجل: يتبقى {hours} ساعة فقط لإتمام دفع حجزك!');

  -- حلقة على جميع الحجوزات المعلقة
  FOR v_reservation IN
    SELECT 
      r.id,
      r.customer_name,
      r.customer_phone,
      r.customer_email,
      r.payment_deadline,
      r.flexible_payment_enabled,
      r.payment_reminder_count,
      r.created_at,
      COALESCE(
        (SELECT pr.reminder_type 
         FROM payment_reminders pr 
         WHERE pr.reservation_id = r.id 
         ORDER BY pr.sent_at DESC 
         LIMIT 1),
        NULL
      ) as last_reminder_type
    FROM reservations r
    WHERE r.status = 'pending'
      AND r.flexible_payment_enabled = true
      AND r.payment_deadline IS NOT NULL
      AND r.payment_deadline > NOW()
  LOOP
    -- حساب الوقت المتبقي
    v_days_remaining := EXTRACT(EPOCH FROM (v_reservation.payment_deadline - NOW())) / 86400;
    v_hours_remaining := EXTRACT(EPOCH FROM (v_reservation.payment_deadline - NOW())) / 3600;
    v_midway_point := v_grace_period_days / 2.0;
    
    v_should_send := false;
    v_reminder_type := NULL;
    v_message := NULL;

    -- تحديد نوع التذكير المناسب
    
    -- 1. تذكير عند الحجز (خلال أول ساعتين)
    IF v_reminder_on_booking 
       AND v_reservation.payment_reminder_count = 0
       AND EXTRACT(EPOCH FROM (NOW() - v_reservation.created_at)) < 7200 THEN
      v_should_send := true;
      v_reminder_type := 'initial';
      v_message := REPLACE(v_template_initial, '{days}', FLOOR(v_days_remaining)::text);
    
    -- 2. تذكير في منتصف المدة
    ELSIF v_reminder_midway 
          AND v_days_remaining <= v_midway_point 
          AND v_days_remaining > 1
          AND v_reservation.last_reminder_type != 'midway' THEN
      v_should_send := true;
      v_reminder_type := 'midway';
      v_message := REPLACE(v_template_midway, '{days}', FLOOR(v_days_remaining)::text);
    
    -- 3. تذكير قبل يوم واحد
    ELSIF v_reminder_one_day_before 
          AND v_days_remaining <= 1 
          AND v_days_remaining > 0.25
          AND v_reservation.last_reminder_type != 'one_day_before' THEN
      v_should_send := true;
      v_reminder_type := 'one_day_before';
      v_message := REPLACE(v_template_urgent, '{hours}', FLOOR(v_hours_remaining)::text);
    
    -- 4. تذكير يوم الموعد (آخر 6 ساعات)
    ELSIF v_reminder_deadline_day 
          AND v_hours_remaining <= 6
          AND v_hours_remaining > 0
          AND v_reservation.last_reminder_type != 'deadline_day' THEN
      v_should_send := true;
      v_reminder_type := 'deadline_day';
      v_message := REPLACE(v_template_urgent, '{hours}', FLOOR(v_hours_remaining)::text);
    END IF;

    -- إرسال التذكير إذا كان مطلوباً
    IF v_should_send THEN
      -- تسجيل التذكير
      INSERT INTO payment_reminders (
        reservation_id,
        reminder_type,
        message,
        sent_at
      ) VALUES (
        v_reservation.id,
        v_reminder_type,
        v_message,
        NOW()
      );

      -- تحديث عداد التذكيرات
      UPDATE reservations
      SET 
        payment_reminder_count = payment_reminder_count + 1,
        last_follow_up_date = NOW()
      WHERE id = v_reservation.id;

      -- تسجيل في سجل المتابعة
      INSERT INTO follow_up_activities (
        reservation_id,
        activity_type,
        activity_result,
        notes
      ) VALUES (
        v_reservation.id,
        'reminder',
        'sent',
        'تذكير تلقائي: ' || v_reminder_type
      );

      v_sent_count := v_sent_count + 1;
    ELSE
      v_skipped_count := v_skipped_count + 1;
    END IF;
  END LOOP;

  -- إرجاع النتيجة
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تمت معالجة التذكيرات بنجاح',
    'sent', v_sent_count,
    'skipped', v_skipped_count,
    'processed_at', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sent', v_sent_count,
      'skipped', v_skipped_count
    );
END;
$$;

-- إنشاء دالة لمعالجة الحجوزات المنتهية (اختياري - إلغاء تلقائي)
CREATE OR REPLACE FUNCTION process_expired_reservations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auto_cancel boolean;
  v_cancelled_count integer := 0;
  v_reservation record;
BEGIN
  -- قراءة إعداد الإلغاء التلقائي
  SELECT (value::boolean)
  INTO v_auto_cancel
  FROM system_settings
  WHERE key = 'auto_cancel_after_deadline';

  v_auto_cancel := COALESCE(v_auto_cancel, false);

  IF NOT v_auto_cancel THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'الإلغاء التلقائي معطل',
      'cancelled', 0
    );
  END IF;

  -- إلغاء الحجوزات المنتهية
  FOR v_reservation IN
    SELECT id, customer_name
    FROM reservations
    WHERE status = 'pending'
      AND flexible_payment_enabled = true
      AND payment_deadline IS NOT NULL
      AND payment_deadline < NOW()
  LOOP
    -- تحديث الحالة
    UPDATE reservations
    SET 
      status = 'cancelled',
      updated_at = NOW()
    WHERE id = v_reservation.id;

    -- تسجيل في سجل المتابعة
    INSERT INTO follow_up_activities (
      reservation_id,
      activity_type,
      activity_result,
      notes
    ) VALUES (
      v_reservation.id,
      'cancellation',
      'auto_cancelled',
      'إلغاء تلقائي بسبب انتهاء المهلة'
    );

    v_cancelled_count := v_cancelled_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'تمت معالجة الحجوزات المنتهية',
    'cancelled', v_cancelled_count,
    'processed_at', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'cancelled', v_cancelled_count
    );
END;
$$;

-- إنشاء دالة اختبار يدوي
CREATE OR REPLACE FUNCTION test_payment_reminders()
RETURNS TABLE (
  reservation_id uuid,
  customer_name text,
  days_remaining numeric,
  hours_remaining numeric,
  should_send_reminder boolean,
  suggested_reminder_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_grace_period_days integer;
  v_midway_point numeric;
BEGIN
  -- قراءة مدة المهلة
  SELECT COALESCE((value::integer), 7)
  INTO v_grace_period_days
  FROM system_settings
  WHERE key = 'payment_grace_period_days';

  v_midway_point := v_grace_period_days / 2.0;

  RETURN QUERY
  SELECT 
    r.id,
    r.customer_name,
    EXTRACT(EPOCH FROM (r.payment_deadline - NOW())) / 86400 as days_remaining,
    EXTRACT(EPOCH FROM (r.payment_deadline - NOW())) / 3600 as hours_remaining,
    CASE
      WHEN r.payment_reminder_count = 0 THEN true
      WHEN EXTRACT(EPOCH FROM (r.payment_deadline - NOW())) / 86400 <= v_midway_point THEN true
      WHEN EXTRACT(EPOCH FROM (r.payment_deadline - NOW())) / 86400 <= 1 THEN true
      WHEN EXTRACT(EPOCH FROM (r.payment_deadline - NOW())) / 3600 <= 6 THEN true
      ELSE false
    END as should_send_reminder,
    CASE
      WHEN r.payment_reminder_count = 0 THEN 'initial'
      WHEN EXTRACT(EPOCH FROM (r.payment_deadline - NOW())) / 3600 <= 6 THEN 'deadline_day'
      WHEN EXTRACT(EPOCH FROM (r.payment_deadline - NOW())) / 86400 <= 1 THEN 'one_day_before'
      WHEN EXTRACT(EPOCH FROM (r.payment_deadline - NOW())) / 86400 <= v_midway_point THEN 'midway'
      ELSE 'none'
    END as suggested_reminder_type
  FROM reservations r
  WHERE r.status = 'pending'
    AND r.flexible_payment_enabled = true
    AND r.payment_deadline IS NOT NULL
    AND r.payment_deadline > NOW()
  ORDER BY r.payment_deadline ASC;
END;
$$;

-- منح الصلاحيات المناسبة
GRANT EXECUTE ON FUNCTION process_payment_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION process_expired_reservations() TO authenticated;
GRANT EXECUTE ON FUNCTION test_payment_reminders() TO authenticated;
