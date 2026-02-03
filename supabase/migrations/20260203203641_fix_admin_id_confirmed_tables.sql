/*
  # إصلاح عدم تطابق ID الأدمن - الجداول المؤكدة فقط
  
  1. المشكلة:
    - ID الأدمن لا يطابق auth.users
    - auth.users.id = 6c2418a0-20ba-4873-afe9-3f9203864c6a
    - admins.id = 873e278f-8c8c-4c0d-a5f5-5b48fd9d35a6
  
  2. الحل:
    - تحديث البريد مؤقتاً
    - إنشاء السجل الجديد
    - تحديث الجداول المؤكدة فقط
    - حذف السجل القديم
*/

-- أولاً: تحديث البريد للسجل القديم مؤقتاً
UPDATE admins 
SET email = 'old_' || email || '_temp'
WHERE id = '873e278f-8c8c-4c0d-a5f5-5b48fd9d35a6'
  AND email = 'ibrahimalhebr1@gmail.com';

-- ثانياً: إنشاء السجل الجديد بالـ ID الصحيح
INSERT INTO admins (id, email, role, full_name, scope_type, is_active, created_at)
VALUES (
  '6c2418a0-20ba-4873-afe9-3f9203864c6a',
  'ibrahimalhebr1@gmail.com',
  'super_admin',
  'إبراهيم الحبر',
  'all',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  scope_type = EXCLUDED.scope_type,
  is_active = EXCLUDED.is_active;

-- ثالثاً: تحديث admin_logs
UPDATE admin_logs 
SET admin_id = '6c2418a0-20ba-4873-afe9-3f9203864c6a'::uuid
WHERE admin_id = '873e278f-8c8c-4c0d-a5f5-5b48fd9d35a6'::uuid;

-- تحديث agricultural_operations
UPDATE agricultural_operations 
SET performed_by = '6c2418a0-20ba-4873-afe9-3f9203864c6a'::uuid
WHERE performed_by = '873e278f-8c8c-4c0d-a5f5-5b48fd9d35a6'::uuid;

-- رابعاً: حذف السجل القديم
DELETE FROM admins WHERE id = '873e278f-8c8c-4c0d-a5f5-5b48fd9d35a6';
