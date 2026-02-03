/*
  # إضافة رقم جوال التواصل مع الإدارة

  1. الغرض
    - إضافة إعداد لرقم الجوال الذي سيظهر في شاشة نجاح عرض المزرعة
    - يمكن للإدارة تحديثه من لوحة التحكم

  2. الإعدادات المضافة
    - admin_contact_phone: رقم جوال الإدارة للتواصل
*/

-- إضافة إعداد رقم جوال التواصل مع الإدارة
INSERT INTO system_settings (key, value, category, description)
VALUES 
  ('admin_contact_phone', '+966500000000', 'contact', 'رقم جوال الإدارة للتواصل')
ON CONFLICT (key) DO NOTHING;

-- تحديث وصف إعداد الواتساب الموجود
UPDATE system_settings
SET description = 'رقم واتساب الإدارة للتواصل'
WHERE key = 'whatsapp_admin_number';
