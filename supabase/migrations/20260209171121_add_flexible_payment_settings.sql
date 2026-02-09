/*
  # إضافة إعدادات نظام الدفع المرن

  1. إعدادات جديدة
    - `flexible_payment_enabled` - تفعيل/تعطيل نظام الدفع المرن
    - `payment_grace_period_days` - المدة المسموحة للدفع (بالأيام)
    - `auto_cancel_after_deadline` - إلغاء تلقائي بعد انتهاء المهلة
    - `reminder_on_booking` - تذكير فور الحجز
    - `reminder_midway` - تذكير في منتصف المدة
    - `reminder_one_day_before` - تذكير قبل يوم من الموعد
    - `reminder_deadline_day` - تذكير في يوم الموعد
    - `payment_reminder_initial` - قالب رسالة التأكيد الأولى
    - `payment_reminder_midway` - قالب رسالة التذكير في منتصف المدة
    - `payment_reminder_urgent` - قالب رسالة التذكير العاجل

  2. ملاحظات
    - جميع الإعدادات من نوع 'payment'
    - القيم الافتراضية مناسبة للاستخدام المباشر
*/

-- إضافة إعدادات نظام الدفع المرن
INSERT INTO system_settings (key, value, description, category)
VALUES
  -- الإعدادات الأساسية
  ('flexible_payment_enabled', 'true', 'تفعيل/تعطيل نظام الدفع المرن', 'payment'),
  ('payment_grace_period_days', '30', 'المدة المسموحة للدفع بالأيام', 'payment'),
  ('auto_cancel_after_deadline', 'false', 'إلغاء الحجز تلقائياً بعد انتهاء المهلة', 'payment'),

  -- إعدادات التذكيرات
  ('reminder_on_booking', 'true', 'إرسال تذكير فور الحجز', 'payment'),
  ('reminder_midway', 'true', 'إرسال تذكير في منتصف المدة', 'payment'),
  ('reminder_one_day_before', 'true', 'إرسال تذكير قبل يوم من الموعد', 'payment'),
  ('reminder_deadline_day', 'true', 'إرسال تذكير في يوم الموعد النهائي', 'payment'),

  -- قوالب الرسائل
  ('payment_reminder_initial', 'شكراً لحجزك معنا! لديك {days} أيام لإتمام الدفع. رابط الدفع: {payment_link}', 'قالب رسالة التأكيد الأولى', 'payment'),
  ('payment_reminder_midway', 'تذكير: لديك {days} أيام متبقية لإتمام دفع حجزك. رابط الدفع: {payment_link}', 'قالب رسالة التذكير في منتصف المدة', 'payment'),
  ('payment_reminder_urgent', 'عاجل: يتبقى {hours} ساعة فقط لإتمام دفع حجزك! رابط الدفع: {payment_link}', 'قالب رسالة التذكير العاجل', 'payment')
ON CONFLICT (key) DO UPDATE
  SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    updated_at = now();