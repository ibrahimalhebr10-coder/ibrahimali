/*
  # إعادة إنشاء دوال نظام الدفع المرن
  
  حذف الدوال القديمة وإعادة إنشائها بالهيكل الصحيح
*/

-- حذف الدوال القديمة
DROP FUNCTION IF EXISTS get_pending_payment_stats();
DROP FUNCTION IF EXISTS get_pending_payment_reservations();
DROP FUNCTION IF EXISTS log_follow_up_activity(uuid, text, text, text);
DROP FUNCTION IF EXISTS extend_payment_deadline(uuid, integer, text);
DROP FUNCTION IF EXISTS send_immediate_reminder(uuid, text);
DROP FUNCTION IF EXISTS get_pending_reservation_details(uuid);

-- تحديث constraint لإضافة الحالة الجديدة
DO $$
BEGIN
  ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
  ALTER TABLE reservations ADD CONSTRAINT reservations_status_check 
    CHECK (status IN ('pending', 'pending_payment', 'confirmed', 'active', 'cancelled', 'expired', 'completed', 'waiting_for_payment'));
END $$;

-- إضافة أعمدة جديدة لجدول reservations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'payment_deadline'
  ) THEN
    ALTER TABLE reservations ADD COLUMN payment_deadline timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'flexible_payment_enabled'
  ) THEN
    ALTER TABLE reservations ADD COLUMN flexible_payment_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'payment_reminder_count'
  ) THEN
    ALTER TABLE reservations ADD COLUMN payment_reminder_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'last_follow_up_date'
  ) THEN
    ALTER TABLE reservations ADD COLUMN last_follow_up_date timestamptz;
  END IF;
END $$;

-- إضافة إعدادات الدفع المرن
INSERT INTO system_settings (key, value, description, category)
VALUES 
  ('flexible_payment_enabled', 'true', 'تفعيل نظام الدفع المرن', 'payments'),
  ('payment_grace_period_days', '7', 'المدة المسموحة للدفع (بالأيام)', 'payments'),
  ('auto_cancel_after_deadline', 'false', 'إلغاء تلقائي بعد انتهاء المهلة', 'payments'),
  ('reminder_on_booking', 'true', 'إرسال تذكير فور الحجز', 'payments'),
  ('reminder_midway', 'true', 'إرسال تذكير في منتصف المدة', 'payments'),
  ('reminder_one_day_before', 'true', 'إرسال تذكير قبل يوم من الموعد', 'payments'),
  ('reminder_deadline_day', 'true', 'إرسال تذكير في يوم الموعد', 'payments'),
  ('follow_up_room_enabled', 'true', 'تفعيل غرفة المتابعة', 'admin'),
  ('payment_reminder_initial', 'شكراً لحجزك معنا! لديك {days} أيام لإتمام الدفع.', 'رسالة التذكير الأولى', 'payments'),
  ('payment_reminder_midway', 'تذكير: لديك {days} أيام متبقية لإتمام دفع حجزك.', 'رسالة التذكير في منتصف المدة', 'payments'),
  ('payment_reminder_urgent', 'عاجل: يتبقى {hours} ساعة فقط لإتمام دفع حجزك!', 'رسالة التذكير العاجل', 'payments')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;

-- دالة لحساب الحجوزات المعلقة (للإحصائيات)
CREATE FUNCTION get_pending_payment_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  SELECT jsonb_build_object(
    'total_pending', COUNT(*),
    'total_amount', COALESCE(SUM(total_price), 0),
    'critical_count', COUNT(*) FILTER (WHERE payment_deadline < now() + interval '1 day'),
    'new_today', COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE),
    'agricultural_count', COUNT(*) FILTER (WHERE path_type = 'agricultural'),
    'investment_count', COUNT(*) FILTER (WHERE path_type = 'investment')
  )
  INTO result
  FROM reservations
  WHERE status = 'pending_payment' 
    AND flexible_payment_enabled = true
    AND payment_deadline > now();

  RETURN result;
END;
$$;

-- دالة لجلب جميع الحجوزات المعلقة مع التفاصيل
CREATE FUNCTION get_pending_payment_reservations()
RETURNS TABLE (
  id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  farm_name text,
  path_type text,
  tree_count integer,
  total_price numeric,
  created_at timestamptz,
  payment_deadline timestamptz,
  payment_reminder_count integer,
  last_follow_up_date timestamptz,
  days_remaining integer,
  hours_remaining integer,
  urgency_level text,
  last_activity jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    COALESCE(up.full_name, r.customer_name) as customer_name,
    COALESCE(up.phone, r.customer_phone) as customer_phone,
    r.customer_email,
    f.name as farm_name,
    r.path_type,
    r.tree_count,
    r.total_price,
    r.created_at,
    r.payment_deadline,
    r.payment_reminder_count,
    r.last_follow_up_date,
    GREATEST(0, EXTRACT(day FROM (r.payment_deadline - now()))::integer) as days_remaining,
    GREATEST(0, EXTRACT(hour FROM (r.payment_deadline - now()))::integer) as hours_remaining,
    CASE 
      WHEN r.payment_deadline < now() + interval '24 hours' THEN 'critical'
      WHEN r.payment_deadline < now() + interval '48 hours' THEN 'urgent'
      WHEN r.payment_deadline < now() + interval '3 days' THEN 'medium'
      ELSE 'normal'
    END as urgency_level,
    (
      SELECT jsonb_build_object(
        'type', fa.activity_type,
        'result', fa.activity_result,
        'notes', fa.notes,
        'created_at', fa.created_at
      )
      FROM follow_up_activities fa
      WHERE fa.reservation_id = r.id
      ORDER BY fa.created_at DESC
      LIMIT 1
    ) as last_activity
  FROM reservations r
  LEFT JOIN farms f ON f.id = r.farm_id
  LEFT JOIN user_profiles up ON up.id = r.user_id
  WHERE r.status = 'pending_payment'
    AND r.flexible_payment_enabled = true
    AND r.payment_deadline > now()
  ORDER BY 
    CASE 
      WHEN r.payment_deadline < now() + interval '24 hours' THEN 1
      WHEN r.payment_deadline < now() + interval '48 hours' THEN 2
      WHEN r.payment_deadline < now() + interval '3 days' THEN 3
      ELSE 4
    END,
    r.payment_deadline ASC;
END;
$$;

-- دالة لتسجيل نشاط متابعة
CREATE FUNCTION log_follow_up_activity(
  p_reservation_id uuid,
  p_activity_type text,
  p_activity_result text,
  p_notes text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  INSERT INTO follow_up_activities (
    reservation_id,
    admin_id,
    activity_type,
    activity_result,
    notes,
    created_at
  ) VALUES (
    p_reservation_id,
    auth.uid(),
    p_activity_type,
    p_activity_result,
    p_notes,
    now()
  )
  RETURNING id INTO v_activity_id;

  UPDATE reservations
  SET last_follow_up_date = now()
  WHERE id = p_reservation_id;

  RETURN v_activity_id;
END;
$$;

-- دالة لتمديد موعد الدفع
CREATE FUNCTION extend_payment_deadline(
  p_reservation_id uuid,
  p_extra_days integer,
  p_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  UPDATE reservations
  SET payment_deadline = payment_deadline + (p_extra_days || ' days')::interval
  WHERE id = p_reservation_id
    AND status = 'pending_payment';

  PERFORM log_follow_up_activity(
    p_reservation_id,
    'manual_note',
    'extension_granted',
    'تم تمديد موعد الدفع ' || p_extra_days || ' أيام. السبب: ' || p_reason
  );

  RETURN true;
END;
$$;

-- دالة لإرسال تذكير فوري
CREATE FUNCTION send_immediate_reminder(
  p_reservation_id uuid,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reminder_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  INSERT INTO payment_reminders (
    reservation_id,
    reminder_type,
    scheduled_for,
    status,
    channel,
    message_content
  ) VALUES (
    p_reservation_id,
    'manual',
    now(),
    'pending',
    'whatsapp',
    p_message
  )
  RETURNING id INTO v_reminder_id;

  UPDATE reservations
  SET payment_reminder_count = payment_reminder_count + 1
  WHERE id = p_reservation_id;

  PERFORM log_follow_up_activity(
    p_reservation_id,
    'whatsapp',
    'reminder_sent',
    'تم إرسال تذكير يدوي'
  );

  RETURN v_reminder_id;
END;
$$;

-- دالة للحصول على تفاصيل حجز معلق معين
CREATE FUNCTION get_pending_reservation_details(p_reservation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  SELECT jsonb_build_object(
    'reservation', row_to_json(r.*),
    'customer', row_to_json(up.*),
    'farm', row_to_json(f.*),
    'activities', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', fa.id,
          'type', fa.activity_type,
          'result', fa.activity_result,
          'notes', fa.notes,
          'created_at', fa.created_at,
          'admin_name', ad.full_name
        ) ORDER BY fa.created_at DESC
      ), '[]'::jsonb)
      FROM follow_up_activities fa
      LEFT JOIN admins ad ON ad.user_id = fa.admin_id
      WHERE fa.reservation_id = r.id
    ),
    'reminders', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', pr.id,
          'type', pr.reminder_type,
          'scheduled_for', pr.scheduled_for,
          'sent_at', pr.sent_at,
          'status', pr.status,
          'channel', pr.channel
        ) ORDER BY pr.scheduled_for DESC
      ), '[]'::jsonb)
      FROM payment_reminders pr
      WHERE pr.reservation_id = r.id
    )
  )
  INTO result
  FROM reservations r
  LEFT JOIN user_profiles up ON up.id = r.user_id
  LEFT JOIN farms f ON f.id = r.farm_id
  WHERE r.id = p_reservation_id;

  RETURN result;
END;
$$;
