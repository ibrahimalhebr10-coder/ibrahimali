/*
  # المعمارية الصحيحة: المزرعة = خزان أشجار (Tree Pool)

  ## المفهوم الأساسي
  
  ### المزرعة (Farm) = خزان أشجار فقط
  - ليست مسارًا
  - ليست تجربة
  - صامتة
  - تحتوي فقط على: الموقع، أنواع الأشجار، عدد الأشجار المتاحة
  
  ### الحجز (Reservation) = عملية السحب من الخزان
  - المستخدم يختار المسار (زراعي أو استثماري)
  - النظام يسحب عدد أشجار من المزرعة
  - يتم تسجيل: user_id + farm_id + path_type + tree_count
  - يتم إنقاص العدد من المزرعة
  
  ### المسارات = طريقة العرض والتجربة
  - المسار الزراعي: يعامل الأشجار المسحوبة كتجربة زراعية
  - المسار الاستثماري: يعامل الأشجار المسحوبة كأصل استثماري
  - نفس المزرعة، سجل مختلف حسب المسار
  
  ## التغييرات
  
  1. إضافة حقل `path_type` إلى جدول `reservations`
     - 'agricultural' للمسار الزراعي
     - 'investment' للمسار الاستثماري
  
  2. توضيح أن جميع الأصول الزراعية والاستثمارية
     يجب أن تُبنى من الحجوزات وليس مباشرة من المزرعة
  
  ## ملاحظة هامة
  
  - المزرعة لا "تنتمي" لمسار
  - المزرعة خزان محايد
  - المسار يُختار عند الحجز
  - التجربة تُبنى حسب المسار المُختار
*/

-- إضافة حقل path_type إلى جدول reservations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'path_type'
  ) THEN
    ALTER TABLE reservations 
    ADD COLUMN path_type text NOT NULL DEFAULT 'agricultural' 
    CHECK (path_type IN ('agricultural', 'investment'));
  END IF;
END $$;

-- إنشاء index للأداء
CREATE INDEX IF NOT EXISTS idx_reservations_path_type ON reservations(path_type);
CREATE INDEX IF NOT EXISTS idx_reservations_user_path ON reservations(user_id, path_type);

-- تحديث الحجوزات الموجودة لتكون زراعية افتراضياً
UPDATE reservations 
SET path_type = 'agricultural' 
WHERE path_type IS NULL OR path_type = '';

-- تحديث جدول investment_agricultural_assets ليكون واضحاً أنه يبني من الحجوزات
COMMENT ON TABLE investment_agricultural_assets IS 
'أصول المستثمر - تُبنى من الحجوزات (reservations) ذات path_type=investment. 
لا تُسحب مباشرة من المزرعة. المزرعة خزان فقط.';

COMMENT ON COLUMN reservations.path_type IS 
'نوع المسار المُختار عند الحجز: agricultural (زراعي) أو investment (استثماري). 
هذا يحدد كيف ستُعامل الأشجار المسحوبة من خزان المزرعة.';

COMMENT ON TABLE farms IS 
'المزرعة = خزان أشجار فقط (Tree Pool). 
ليست مسارًا، ليست تجربة، صامتة. 
الأشجار تُسحب منها عبر الحجوزات.';
