/*
  # إصلاح تعارض نوع البيانات في farm_id

  ## المشكلة
  - جدول `farms` يستخدم `id` من نوع `uuid`
  - جدول `reservations` يستخدم `farm_id` من نوع `integer`
  - هذا يسبب خطأ عند محاولة حذف المزارع أو ربط الحجوزات بالمزارع

  ## الحل
  1. تغيير نوع `farm_id` في جدول `reservations` من `integer` إلى `uuid`
  2. إضافة foreign key constraint يربط `reservations.farm_id` بـ `farms.id`
  3. حذف foreign key constraints القديمة إن وجدت

  ## ملاحظات
  - هذا التغيير آمن لأنه لا توجد بيانات في جدول `reservations` حالياً
  - يتم استخدام IF EXISTS للتأكد من عدم حدوث أخطاء
*/

-- حذف foreign key constraint القديم إن وجد
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reservations_farm_id_fkey'
    AND table_name = 'reservations'
  ) THEN
    ALTER TABLE reservations DROP CONSTRAINT reservations_farm_id_fkey;
  END IF;
END $$;

-- تغيير نوع عمود farm_id من integer إلى uuid
ALTER TABLE reservations 
ALTER COLUMN farm_id TYPE uuid USING NULL;

-- إضافة foreign key constraint جديد يربط مع جدول farms
ALTER TABLE reservations
ADD CONSTRAINT reservations_farm_id_fkey 
FOREIGN KEY (farm_id) 
REFERENCES farms(id) 
ON DELETE RESTRICT;

-- إضافة index للأداء
CREATE INDEX IF NOT EXISTS idx_reservations_farm_id ON reservations(farm_id);
