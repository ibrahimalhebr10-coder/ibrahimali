/*
  # بذر وسائل السداد الافتراضية - Seed Default Payment Methods

  ## النظرة العامة
  إضافة الوسائل الأربعة المطلوبة مع البيانات الكاملة

  ## الوسائل المضافة
  1. مدى (MADA) - بطاقات محلية سعودية
  2. تابي (Tabby) - التقسيط
  3. تمارا (Tamara) - التقسيط
  4. التحويل البنكي (Bank Transfer)

  ## الملاحظات
  - جميع الوسائل غير مفعلة افتراضياً (is_active = false)
  - يتم تفعيلها يدوياً من لوحة الإدارة
  - الأولوية تحدد ترتيب الظهور
*/

-- إدراج وسيلة مدى
INSERT INTO payment_methods (
  method_type,
  name_ar,
  name_en,
  description_ar,
  description_en,
  is_active,
  priority,
  icon,
  features,
  requirements,
  config
) VALUES (
  'mada',
  'مدى',
  'MADA',
  'الدفع ببطاقة مدى السعودية - فوري وآمن',
  'Pay with MADA card - Instant and secure',
  false,
  1,
  'CreditCard',
  '["دفع فوري", "آمن ومضمون", "بطاقات محلية", "لا رسوم إضافية"]'::jsonb,
  '["حساب تاجر لدى بنك سعودي", "ربط بوابة دفع (Moyasar أو HyperPay)", "تفعيل خدمة مدى"]'::jsonb,
  '{
    "provider": "",
    "merchant_id": "",
    "api_key": "",
    "secret_key": "",
    "test_mode": true
  }'::jsonb
)
ON CONFLICT (method_type) DO NOTHING;

-- إدراج وسيلة تابي
INSERT INTO payment_methods (
  method_type,
  name_ar,
  name_en,
  description_ar,
  description_en,
  is_active,
  priority,
  icon,
  features,
  requirements,
  config
) VALUES (
  'tabby',
  'تابي',
  'Tabby',
  'قسّم مشترياتك على 4 دفعات - بدون فوائد',
  'Split your purchases into 4 payments - No interest',
  false,
  2,
  'CalendarCheck',
  '["قسّم على 4 دفعات", "بدون فوائد", "موافقة فورية", "لا رسوم خفية"]'::jsonb,
  '["حساب تاجر لدى تابي", "API Key من تابي", "Webhook URL", "اتفاقية تجارية"]'::jsonb,
  '{
    "merchant_code": "",
    "public_key": "",
    "secret_key": "",
    "webhook_secret": "",
    "test_mode": true
  }'::jsonb
)
ON CONFLICT (method_type) DO NOTHING;

-- إدراج وسيلة تمارا
INSERT INTO payment_methods (
  method_type,
  name_ar,
  name_en,
  description_ar,
  description_en,
  is_active,
  priority,
  icon,
  features,
  requirements,
  config
) VALUES (
  'tamara',
  'تمارا',
  'Tamara',
  'اشترِ الآن وادفع لاحقاً - بدون فوائد',
  'Buy now, pay later - No interest',
  false,
  3,
  'Clock',
  '["ادفع لاحقاً", "بدون فوائد", "موافقة فورية", "مرونة في السداد"]'::jsonb,
  '["حساب تاجر لدى تمارا", "API Token من تمارا", "Notification Key", "اتفاقية تجارية"]'::jsonb,
  '{
    "merchant_url": "",
    "api_token": "",
    "notification_key": "",
    "webhook_id": "",
    "test_mode": true
  }'::jsonb
)
ON CONFLICT (method_type) DO NOTHING;

-- إدراج وسيلة التحويل البنكي
INSERT INTO payment_methods (
  method_type,
  name_ar,
  name_en,
  description_ar,
  description_en,
  is_active,
  priority,
  icon,
  features,
  requirements,
  config
) VALUES (
  'bank_transfer',
  'تحويل بنكي',
  'Bank Transfer',
  'التحويل المباشر لحسابنا البنكي',
  'Direct transfer to our bank account',
  false,
  4,
  'Building2',
  '["تحويل مباشر", "لا رسوم إضافية", "موثوق وآمن", "تأكيد خلال 24 ساعة"]'::jsonb,
  '["حساب بنكي تجاري", "معلومات الحساب", "نظام تتبع التحويلات"]'::jsonb,
  '{
    "bank_name": "",
    "account_name": "",
    "account_number": "",
    "iban": "",
    "swift_code": "",
    "requires_manual_verification": true
  }'::jsonb
)
ON CONFLICT (method_type) DO NOTHING;
