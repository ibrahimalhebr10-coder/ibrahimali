/*
  # إنشاء حساب المدير العام للتطوير
  
  1. الهدف
    - إنشاء حساب مدير عام بمعلومات ثابتة ومعروفة
    - تسهيل عملية التطوير والاختبار
    - معلومات دخول واضحة للمدير العام
  
  2. معلومات الحساب
    - البريد الإلكتروني: admin@dev.com
    - كلمة المرور: Admin@123
    - الاسم الكامل: المدير العام
    - الدور: super_admin
    - الصلاحيات: كاملة
  
  3. Security
    - RLS enabled
    - IMPORTANT: هذا حساب للتطوير فقط
    - يجب تغيير كلمة المرور في الإنتاج
*/

-- إنشاء المستخدم في auth.users
DO $$
DECLARE
  v_user_id uuid;
  v_super_admin_role_id uuid;
BEGIN
  -- الحصول على role_id للمدير العام
  SELECT id INTO v_super_admin_role_id
  FROM admin_roles
  WHERE role_key = 'super_admin'
  LIMIT 1;

  -- حذف المستخدم القديم إذا كان موجوداً
  DELETE FROM auth.users WHERE email = 'admin@dev.com';
  
  -- إنشاء المستخدم الجديد
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@dev.com',
    crypt('Admin@123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"],"role":"super_admin"}',
    '{"full_name":"المدير العام"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO v_user_id;

  -- حذف المدير القديم من جدول admins إذا كان موجوداً
  DELETE FROM admins WHERE email = 'admin@dev.com';

  -- إضافة المدير إلى جدول admins
  INSERT INTO admins (
    id,
    user_id,
    email,
    full_name,
    role,
    role_id,
    permissions,
    is_active,
    scope_type,
    scope_value,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'admin@dev.com',
    'المدير العام',
    'super_admin',
    v_super_admin_role_id,
    jsonb_build_object(
      'view_farms', true,
      'manage_farms', true,
      'view_reservations', true,
      'manage_reservations', true,
      'view_payments', true,
      'manage_payments', true,
      'view_analytics', true,
      'manage_users', true,
      'manage_settings', true,
      'manage_admins', true
    ),
    true,
    'all',
    null,
    now(),
    now()
  );

  RAISE NOTICE 'تم إنشاء حساب المدير العام بنجاح';
  RAISE NOTICE 'البريد الإلكتروني: admin@dev.com';
  RAISE NOTICE 'كلمة المرور: Admin@123';
END $$;
