/*
  # تحديث نظام عرض المزارع - إضافة نوع العرض وعدد الأشجار

  1. التعديلات على جدول farm_offers
    - إضافة `offer_type` (sale, full_lease, partnership) - نوع العرض
    - إضافة `tree_count` (integer) - عدد الأشجار
    - إضافة `proposed_price` (numeric, optional) - السعر المقترح
    - إضافة `partnership_acknowledgment` (boolean) - إقرار المشاركة
    - تحويل `area_hectares` إلى اختياري
    
  2. تحديث الحالة الافتراضية
    - تغيير الحالة الافتراضية من 'submitted' إلى 'under_review' (قيد التقييم)
*/

-- إضافة الحقول الجديدة
ALTER TABLE farm_offers 
ADD COLUMN IF NOT EXISTS offer_type text CHECK (offer_type IN ('sale', 'full_lease', 'partnership')),
ADD COLUMN IF NOT EXISTS tree_count integer,
ADD COLUMN IF NOT EXISTS proposed_price numeric,
ADD COLUMN IF NOT EXISTS partnership_acknowledgment boolean DEFAULT false;

-- جعل area_hectares اختياري (إزالة NOT NULL إذا كان موجوداً)
DO $$
BEGIN
  ALTER TABLE farm_offers ALTER COLUMN area_hectares DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- تحديث الحالة الافتراضية لتكون 'under_review'
ALTER TABLE farm_offers ALTER COLUMN status SET DEFAULT 'under_review';

-- تحديث قيد CHECK للتأكد من منطق المشاركة
DO $$
BEGIN
  -- إزالة القيود القديمة إذا كانت موجودة
  ALTER TABLE farm_offers DROP CONSTRAINT IF EXISTS valid_partnership_acknowledgment;
  
  -- إضافة قيد جديد: إذا كان نوع العرض مشاركة، يجب الموافقة على الإقرار
  ALTER TABLE farm_offers ADD CONSTRAINT valid_partnership_acknowledgment 
    CHECK (
      offer_type != 'partnership' OR 
      (offer_type = 'partnership' AND partnership_acknowledgment = true)
    );
END $$;