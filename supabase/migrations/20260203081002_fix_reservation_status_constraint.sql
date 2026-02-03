/*
  # إصلاح constraint حالة الحجوزات

  1. التغييرات
    - إضافة حالة 'confirmed' إلى قائمة الحالات المسموحة
    - إضافة حالة 'completed' إلى قائمة الحالات المسموحة
  
  2. الحالات المسموحة بعد التحديث
    - temporary: حجز مؤقت قبل التسجيل
    - pending: حجز معلق
    - waiting_for_payment: في انتظار الدفع
    - payment_submitted: تم إرسال طلب الدفع
    - paid: تم الدفع
    - confirmed: حجز مؤكد (بعد الدفع)
    - completed: حجز مكتمل
    - transferred_to_harvest: تم النقل لنظام الحصاد
    - cancelled: ملغي
*/

-- حذف الـ constraint القديم
ALTER TABLE reservations 
DROP CONSTRAINT IF EXISTS reservations_status_check;

-- إضافة الـ constraint الجديد مع الحالات الإضافية
ALTER TABLE reservations
ADD CONSTRAINT reservations_status_check 
CHECK (status = ANY (ARRAY[
  'temporary'::text,
  'pending'::text,
  'waiting_for_payment'::text,
  'payment_submitted'::text,
  'paid'::text,
  'confirmed'::text,
  'completed'::text,
  'transferred_to_harvest'::text,
  'cancelled'::text
]));
