/*
  # إنشاء حجوزات تجريبية لغرفة المتابعة
  
  8 حجوزات تجريبية متنوعة مع أنشطة متابعة وتذكيرات دفع
*/

DO $$
DECLARE
  test_user_1 uuid := '03758ec2-bf7d-4873-8a74-d8a609f9e8fd';
  test_user_2 uuid := '1807dcc6-8306-4fe1-b30e-ca9c5fc28ebb';
  test_user_3 uuid := '66cbdadf-a997-4265-824c-616db870bce4';
  test_user_4 uuid := '0c1f1582-adc2-4da3-a00a-fc154c0c53b2';
  test_user_5 uuid := 'a38f8d51-51e0-4635-8abb-fc6384e22f5e';
  
  test_farm_1 uuid := '996e753e-f528-460d-80a8-31ea38cf3c5b';
  test_farm_2 uuid := 'fb84f8a5-3ec0-47c2-9d68-acaaf745172b';
  test_farm_3 uuid := 'a910bce1-166b-4deb-aab4-26c5fe485e6d';
  
  test_res_1 uuid; test_res_2 uuid; test_res_3 uuid; test_res_4 uuid;
  test_res_5 uuid; test_res_6 uuid; test_res_7 uuid; test_res_8 uuid;
BEGIN
  DELETE FROM follow_up_activities WHERE reservation_id IN (
    SELECT id FROM reservations WHERE is_demo = true AND farm_name LIKE '%تجريبي%'
  );
  DELETE FROM payment_reminders WHERE reservation_id IN (
    SELECT id FROM reservations WHERE is_demo = true AND farm_name LIKE '%تجريبي%'
  );
  DELETE FROM reservations WHERE is_demo = true AND farm_name LIKE '%تجريبي%';

  -- 2 حجوزات حرجة (< 24 ساعة)
  INSERT INTO reservations (id, user_id, farm_id, farm_name, total_trees, total_price, status, path_type, is_demo, flexible_payment_enabled, payment_deadline, payment_reminder_count, follow_up_notes, created_at)
  VALUES (gen_random_uuid(), test_user_1, test_farm_1, 'مزرعة النخيل (تجريبي)', 50, 75000, 'pending_payment', 'agricultural', true, true, now() + interval '6 hours', 3, 'تجريبي: طلب تمديد', now() - interval '6 days 18 hours') RETURNING id INTO test_res_1;
  
  INSERT INTO reservations (id, user_id, farm_id, farm_name, total_trees, total_price, status, path_type, is_demo, flexible_payment_enabled, payment_deadline, payment_reminder_count, follow_up_notes, created_at)
  VALUES (gen_random_uuid(), test_user_2, test_farm_2, 'مزرعة حصص زراعية (تجريبي)', 100, 150000, 'pending_payment', 'investment', true, true, now() + interval '12 hours', 2, 'تجريبي: لم يرد', now() - interval '6 days 12 hours') RETURNING id INTO test_res_2;

  -- 2 حجوزات عاجلة (1-2 يوم)
  INSERT INTO reservations (id, user_id, farm_id, farm_name, total_trees, total_price, status, path_type, is_demo, flexible_payment_enabled, payment_deadline, payment_reminder_count, follow_up_notes, created_at)
  VALUES (gen_random_uuid(), test_user_3, test_farm_3, 'مزرعة الزيتون (تجريبي)', 30, 45000, 'pending_payment', 'agricultural', true, true, now() + interval '1 day', 1, 'تجريبي: وعد بالدفع', now() - interval '6 days') RETURNING id INTO test_res_3;
  
  INSERT INTO reservations (id, user_id, farm_id, farm_name, total_trees, total_price, status, path_type, is_demo, flexible_payment_enabled, payment_deadline, payment_reminder_count, last_follow_up_date, created_at)
  VALUES (gen_random_uuid(), test_user_4, test_farm_1, 'مزرعة النخيل (تجريبي)', 75, 112500, 'pending_payment', 'investment', true, true, now() + interval '2 days', 1, now() - interval '1 day', now() - interval '5 days') RETURNING id INTO test_res_4;

  -- 2 حجوزات متوسطة (3-5 أيام)
  INSERT INTO reservations (id, user_id, farm_id, farm_name, total_trees, total_price, status, path_type, is_demo, flexible_payment_enabled, payment_deadline, payment_reminder_count, created_at)
  VALUES (gen_random_uuid(), test_user_5, test_farm_2, 'مزرعة حصص (تجريبي)', 40, 60000, 'pending_payment', 'agricultural', true, true, now() + interval '3 days', 0, now() - interval '4 days') RETURNING id INTO test_res_5;
  
  INSERT INTO reservations (id, user_id, farm_id, farm_name, total_trees, total_price, status, path_type, is_demo, flexible_payment_enabled, payment_deadline, payment_reminder_count, follow_up_notes, created_at)
  VALUES (gen_random_uuid(), test_user_1, test_farm_3, 'مزرعة الزيتون (تجريبي)', 60, 90000, 'pending_payment', 'investment', true, true, now() + interval '5 days', 0, 'تجريبي: عميل جديد', now() - interval '2 days') RETURNING id INTO test_res_6;

  -- 2 حجوزات عادية (> 5 أيام)
  INSERT INTO reservations (id, user_id, farm_id, farm_name, total_trees, total_price, status, path_type, is_demo, flexible_payment_enabled, payment_deadline, payment_reminder_count, created_at)
  VALUES (gen_random_uuid(), test_user_2, test_farm_1, 'مزرعة النخيل (تجريبي)', 25, 37500, 'pending_payment', 'agricultural', true, true, now() + interval '7 days', 0, now() - interval '1 hour') RETURNING id INTO test_res_7;
  
  INSERT INTO reservations (id, user_id, farm_id, farm_name, total_trees, total_price, status, path_type, is_demo, flexible_payment_enabled, payment_deadline, payment_reminder_count, created_at)
  VALUES (gen_random_uuid(), test_user_3, test_farm_2, 'مزرعة حصص (تجريبي)', 80, 120000, 'pending_payment', 'investment', true, true, now() + interval '10 days', 0, now() - interval '30 minutes') RETURNING id INTO test_res_8;

  -- أنشطة متابعة
  INSERT INTO follow_up_activities (reservation_id, activity_type, activity_result, notes, created_at) VALUES 
    (test_res_1, 'call', 'answered', 'تجريبي: طلب تمديد', now() - interval '3 hours'),
    (test_res_1, 'payment_link_sent', 'other', 'تجريبي: إرسال رابط', now() - interval '2 hours'),
    (test_res_1, 'call', 'promised_to_pay', 'تجريبي: وعد بالدفع', now() - interval '30 minutes'),
    (test_res_2, 'call', 'no_answer', 'تجريبي: لم يرد', now() - interval '6 hours'),
    (test_res_2, 'whatsapp', 'other', 'تجريبي: واتساب', now() - interval '4 hours'),
    (test_res_2, 'call', 'no_answer', 'تجريبي: محاولة ثانية', now() - interval '2 hours'),
    (test_res_3, 'call', 'promised_to_pay', 'تجريبي: وعد بالدفع', now() - interval '1 day'),
    (test_res_3, 'note', 'other', 'تجريبي: متابعة', now() - interval '12 hours'),
    (test_res_4, 'email', 'other', 'تجريبي: بريد', now() - interval '1 day');

  -- تذكيرات دفع
  INSERT INTO payment_reminders (reservation_id, reminder_type, scheduled_for, sent_at, message_content, status, channel) VALUES 
    (test_res_1, 'deadline_day', now() - interval '3 hours', now() - interval '3 hours', 'تجريبي: تذكير - 6 ساعات', 'sent', 'whatsapp'),
    (test_res_2, 'one_day_before', now() - interval '1 day', now() - interval '1 day', 'تجريبي: تذكير - يوم واحد', 'sent', 'whatsapp'),
    (test_res_3, 'midway', now() - interval '2 days', now() - interval '2 days', 'تجريبي: تذكير - 3 أيام', 'sent', 'sms'),
    (test_res_7, 'immediate', now() - interval '1 hour', now() - interval '1 hour', 'تجريبي: تذكير - 7 أيام', 'sent', 'whatsapp');

  RAISE NOTICE '✅ تم إنشاء 8 حجوزات تجريبية بنجاح';
  RAISE NOTICE '📊 2 حرج، 2 عاجل، 2 متوسط، 2 عادي';
  RAISE NOTICE '🌱 4 زراعية، 4 استثمارية';
  RAISE NOTICE '📝 9 أنشطة متابعة، 4 تذكيرات';
END $$;
