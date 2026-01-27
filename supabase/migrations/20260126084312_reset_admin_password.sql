/*
  # إعادة تعيين كلمة مرور المدير العام
  
  1. الهدف
    - تحديث كلمة المرور للمستخدم ibrahimalhebr1@gmail.com
    - ضمان إمكانية تسجيل الدخول بكلمة المرور: 2931
  
  2. الإجراءات
    - تحديث كلمة المرور المشفرة في جدول auth.users
    - استخدام extension crypt لتشفير كلمة المرور
  
  3. ملاحظات
    - يتم استخدام extension pgcrypto لتشفير كلمة المرور بشكل آمن
    - كلمة المرور النصية: 2931
*/

-- تفعيل extension للتشفير إذا لم يكن مفعلاً
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- تحديث كلمة المرور للمستخدم
UPDATE auth.users
SET 
  encrypted_password = crypt('2931', gen_salt('bf')),
  updated_at = now()
WHERE email = 'ibrahimalhebr1@gmail.com';
