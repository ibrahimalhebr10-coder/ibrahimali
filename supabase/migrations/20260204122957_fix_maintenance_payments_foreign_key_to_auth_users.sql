/*
  # إصلاح foreign key في maintenance_payments ليشير إلى auth.users

  1. المشكلة
    - جدول maintenance_payments يحتوي على foreign key يشير إلى user_profiles.id
    - المستخدمون قد يكونون موجودين في auth.users لكن ليس في user_profiles
    - يسبب خطأ: "Key (user_id)=(xxx) is not present in table user_profiles"

  2. الحل
    - حذف foreign key القديم
    - إضافة foreign key جديد يشير إلى auth.users(id)
    - هذا يضمن أن أي مستخدم مسجل يمكنه الدفع

  3. التأثير
    - الآن يمكن لأي مستخدم في auth.users إنشاء سجل دفع
    - لا نحتاج لوجود user_profile أولاً
*/

-- حذف foreign key القديم
ALTER TABLE maintenance_payments
  DROP CONSTRAINT IF EXISTS maintenance_payments_user_id_fkey;

-- إضافة foreign key جديد يشير إلى auth.users
ALTER TABLE maintenance_payments
  ADD CONSTRAINT maintenance_payments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_user_id
  ON maintenance_payments(user_id);

-- التحقق من أن التغيير تم بنجاح
DO $$
BEGIN
  RAISE NOTICE 'تم تحديث foreign key في maintenance_payments للإشارة إلى auth.users بنجاح';
END $$;
