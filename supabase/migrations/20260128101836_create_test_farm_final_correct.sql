/*
  # إنشاء مزرعة تجريبية كاملة

  ## بيانات الدخول
  - مدير: test.farm.manager@olivefarms.test / TestPassword123!
  - مستثمر: test.investor@olivefarms.test / TestPassword123!
*/

DO $$
DECLARE
  v_test_farm_id uuid;
  v_test_user_id uuid;
  v_test_investor_id uuid;
  v_test_admin_id uuid;
  v_farm_manager_role_id uuid;
  v_default_category_id uuid;
  v_super_admin_id uuid;
BEGIN
  SELECT id INTO v_test_farm_id FROM farms WHERE name_ar = 'مزرعة تجريبية - اختبار النظام';

  IF v_test_farm_id IS NULL THEN
    
    SELECT id INTO v_default_category_id FROM farm_categories LIMIT 1;

    INSERT INTO farms (
      category_id, name_ar, name_en, description_ar, location, status,
      total_trees, available_trees, reserved_trees, first_year_maintenance_free,
      area_size, marketing_text, marketing_message, return_rate_display,
      annual_return_rate, image_url, min_investment, max_investment,
      total_capacity, current_invested, start_date, end_date
    ) VALUES (
      v_default_category_id,
      'مزرعة تجريبية - اختبار النظام',
      'Test Farm - System Testing',
      'مزرعة تجريبية لاختبار جميع وظائف النظام.' || E'\n\n⚠️ للاختبار فقط',
      'منطقة الاختبار - السعودية',
      'completed',
      100, 90, 10, true,
      '5000 متر',
      'مزرعة للاختبار',
      'اختبر النظام',
      '0%',
      0,
      'https://images.pexels.com/photos/1114690/pexels-photo-1114690.jpeg',
      1000, 100000, 100000, 10000,
      CURRENT_DATE,
      CURRENT_DATE + interval '5 years'
    )
    RETURNING id INTO v_test_farm_id;

    SELECT id INTO v_farm_manager_role_id FROM admin_roles WHERE role_key = 'farm_manager';
    SELECT id INTO v_test_user_id FROM auth.users WHERE email = 'test.farm.manager@olivefarms.test';

    IF v_test_user_id IS NULL THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
        'authenticated', 'authenticated', 'test.farm.manager@olivefarms.test',
        crypt('TestPassword123!', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"مدير مزرعة اختباري","phone":"+966500000001"}',
        now(), now(), '', ''
      )
      RETURNING id INTO v_test_user_id;
    END IF;

    SELECT id INTO v_test_admin_id FROM admins WHERE user_id = v_test_user_id;

    IF v_test_admin_id IS NULL THEN
      INSERT INTO admins (user_id, email, full_name, role_id, is_active)
      VALUES (v_test_user_id, 'test.farm.manager@olivefarms.test', 'مدير مزرعة اختباري', v_farm_manager_role_id, true)
      RETURNING id INTO v_test_admin_id;
    END IF;

    SELECT id INTO v_super_admin_id FROM admins WHERE role_id = (SELECT id FROM admin_roles WHERE role_key = 'super_admin') LIMIT 1;

    INSERT INTO admin_farm_assignments (admin_id, farm_id, assigned_by, is_active)
    VALUES (v_test_admin_id, v_test_farm_id, v_super_admin_id, true)
    ON CONFLICT (admin_id, farm_id) DO UPDATE SET is_active = true;

    SELECT id INTO v_test_investor_id FROM auth.users WHERE email = 'test.investor@olivefarms.test';

    IF v_test_investor_id IS NULL THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
        'authenticated', 'authenticated', 'test.investor@olivefarms.test',
        crypt('TestPassword123!', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"مستثمر اختباري","phone":"+966500000002"}',
        now(), now(), '', ''
      )
      RETURNING id INTO v_test_investor_id;
    END IF;

    INSERT INTO reservations (user_id, farm_id, farm_name, total_trees, total_price, status, duration_years, bonus_years)
    VALUES (v_test_investor_id, v_test_farm_id, 'مزرعة تجريبية - اختبار النظام', 10, 10000, 'paid', 5, 0);

    -- مهمة 1: ري (مكتملة)
    INSERT INTO farm_tasks (farm_id, task_type, description, assigned_to, assigned_by, start_time, end_time, duration_minutes, status, notes)
    VALUES (v_test_farm_id, 'ري', 'ري جميع الأشجار في القطاع A', v_test_admin_id, v_super_admin_id, now() - interval '3 days', now() - interval '3 days' + interval '4 hours', 240, 'completed', 'مكتملة - قطاع A');

    -- مهمة 2: تقليم (قيد التنفيذ)
    INSERT INTO farm_tasks (farm_id, task_type, description, assigned_to, assigned_by, start_time, status, notes)
    VALUES (v_test_farm_id, 'تقليم', 'تقليم الأشجار لتحسين الإنتاج', v_test_admin_id, v_super_admin_id, now() - interval '1 day', 'in_progress', 'جاري العمل - قطاع B');

    -- مهمة 3: رش (متأخرة)
    INSERT INTO farm_tasks (farm_id, task_type, description, assigned_to, assigned_by, start_time, status, notes)
    VALUES (v_test_farm_id, 'رش', 'رش المبيدات للوقاية من الآفات - عاجل!', v_test_admin_id, v_super_admin_id, now() - interval '2 days', 'pending', 'متأخرة');

    -- مهمة 4: حصاد (قادمة)
    INSERT INTO farm_tasks (farm_id, task_type, description, assigned_to, assigned_by, start_time, status, notes)
    VALUES (v_test_farm_id, 'حصاد', 'التحضير لموسم الحصاد', v_test_admin_id, v_super_admin_id, now() + interval '30 days', 'pending', 'بعد 30 يوم');

    -- مهمة 5: تسميد
    INSERT INTO farm_tasks (farm_id, task_type, description, assigned_to, assigned_by, start_time, status, notes)
    VALUES (v_test_farm_id, 'تسميد', 'إضافة الأسمدة العضوية', v_test_admin_id, v_super_admin_id, now() + interval '5 days', 'pending', 'دورة شهرية');

    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════╗';
    RAISE NOTICE '║   ✅ تم إنشاء المزرعة التجريبية بنجاح    ║';
    RAISE NOTICE '╠════════════════════════════════════════════╣';
    RAISE NOTICE '║  👤 مدير المزرعة:                         ║';
    RAISE NOTICE '║     test.farm.manager@olivefarms.test      ║';
    RAISE NOTICE '║                                            ║';
    RAISE NOTICE '║  👤 المستثمر:                             ║';
    RAISE NOTICE '║     test.investor@olivefarms.test          ║';
    RAISE NOTICE '║                                            ║';
    RAISE NOTICE '║  🔑 كلمة المرور: TestPassword123!         ║';
    RAISE NOTICE '║                                            ║';
    RAISE NOTICE '║  📊 تم إنشاء:                             ║';
    RAISE NOTICE '║     • مزرعة تجريبية (100 شجرة)           ║';
    RAISE NOTICE '║     • مدير مزرعة مرتبط بالمزرعة           ║';
    RAISE NOTICE '║     • مستثمر بحجز (10 أشجار)             ║';
    RAISE NOTICE '║     • 5 مهام عمل بحالات مختلفة            ║';
    RAISE NOTICE '╚════════════════════════════════════════════╝';

  ELSE
    RAISE NOTICE '⚠️ المزرعة موجودة: %', v_test_farm_id;
  END IF;

END $$;
