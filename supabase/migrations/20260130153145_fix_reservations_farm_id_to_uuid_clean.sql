/*
  # تصحيح نوع farm_id في جدول reservations (مع تنظيف البيانات)

  1. المشكلة
    - جدول farms يستخدم id من نوع UUID
    - جدول reservations يستخدم farm_id من نوع integer
    - هذا التضارب يمنع إنشاء الحجوزات الجديدة
    - البيانات الموجودة هي بيانات اختبار فقط

  2. الحل
    - حذف جميع الحجوزات المؤقتة والقديمة (test data)
    - تغيير farm_id في reservations من integer إلى UUID
    - إضافة foreign key constraint للربط مع farms
    - تحديث الـ indexes

  3. الأمان
    - الحفاظ على جميع سياسات RLS الموجودة
    - إضافة foreign key للتحقق من صحة البيانات
*/

-- حذف جميع الحجوزات الموجودة (بيانات اختبار)
-- سيتم حذف reservation_items تلقائياً بسبب ON DELETE CASCADE
TRUNCATE TABLE reservations CASCADE;

-- حذف الـ index القديم
DROP INDEX IF EXISTS idx_reservations_farm_id;

-- تغيير نوع farm_id من integer إلى uuid
ALTER TABLE reservations 
  ALTER COLUMN farm_id TYPE uuid USING NULL;

-- جعل farm_id NOT NULL
ALTER TABLE reservations 
  ALTER COLUMN farm_id SET NOT NULL;

-- إضافة foreign key constraint
ALTER TABLE reservations 
  ADD CONSTRAINT fk_reservations_farm_id 
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE;

-- إعادة إنشاء الـ index
CREATE INDEX IF NOT EXISTS idx_reservations_farm_id ON reservations(farm_id);

-- تأكيد التعليق على الجدول
COMMENT ON COLUMN reservations.farm_id IS 'UUID reference to farms table';

-- تأكيد أن الجدول جاهز
COMMENT ON TABLE reservations IS 'Updated: farm_id now references farms(id) as UUID';
