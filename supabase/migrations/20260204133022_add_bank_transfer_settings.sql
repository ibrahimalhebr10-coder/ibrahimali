/*
  # إضافة إعدادات التحويل البنكي

  1. الإعدادات الجديدة
    - `bank_name_ar` - اسم البنك بالعربية
    - `bank_name_en` - اسم البنك بالإنجليزية
    - `bank_account_name` - اسم صاحب الحساب
    - `bank_account_number` - رقم الحساب البنكي
    - `bank_iban` - رقم الآيبان (IBAN)
    - `bank_swift_code` - رمز السويفت (اختياري)

  2. ملاحظات
    - يمكن للمسؤولين تحديث هذه المعلومات من لوحة التحكم
    - تُستخدم لعرض معلومات التحويل البنكي للعملاء
*/

-- إضافة معلومات الحساب البنكي الافتراضية
INSERT INTO system_settings (key, value, description, category, created_at, updated_at)
VALUES
  ('bank_name_ar', 'البنك الأهلي التجاري', 'اسم البنك بالعربية', 'payment', now(), now()),
  ('bank_name_en', 'Al Ahli Bank', 'اسم البنك بالإنجليزية', 'payment', now(), now()),
  ('bank_account_name', 'منصة المزارع الخضراء', 'اسم صاحب الحساب', 'payment', now(), now()),
  ('bank_account_number', 'SA1234567890123456789012', 'رقم الحساب البنكي / الآيبان', 'payment', now(), now()),
  ('bank_swift_code', 'NCBKSAJE', 'رمز السويفت للتحويلات الدولية', 'payment', now(), now())
ON CONFLICT (key) DO NOTHING;
