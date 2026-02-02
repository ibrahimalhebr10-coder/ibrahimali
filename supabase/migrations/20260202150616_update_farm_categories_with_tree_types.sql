/*
  # تحديث فئات المزارع مع أنواع الأشجار

  1. التحديثات
    - إضافة عمود `display_order` لترتيب الفئات
    - تحديث الفئات الحالية (الزيتون، النخيل)
    - إضافة فئات جديدة (المانجا، الموز)
    - تحديث أسماء الفئات لتصبح "أشجار الزيتون"، "أشجار النخيل"، إلخ

  2. الترتيب
    - 1: أشجار الزيتون
    - 2: أشجار النخيل
    - 3: أشجار المانجا
    - 4: أشجار الموز

  3. الأيقونات
    - الزيتون: leaf
    - النخيل: wheat (palm tree style)
    - المانجا: apple
    - الموز: grape
*/

-- إضافة عمود display_order إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farm_categories' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE farm_categories ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- حذف الفئات القديمة (القمح والعنب) إذا لم تكن مستخدمة
DELETE FROM farm_categories 
WHERE name_ar IN ('القمح', 'العنب') 
AND NOT EXISTS (
  SELECT 1 FROM farms WHERE farms.category_id = farm_categories.id
);

-- تحديث الفئات الحالية وإضافة الجديدة
-- أولاً: نحدث الفئات الموجودة
UPDATE farm_categories 
SET 
  name_ar = 'أشجار الزيتون',
  name_en = 'Olive Trees',
  icon = 'leaf',
  description_ar = 'استثمر في أشجار الزيتون العضوي',
  display_order = 1
WHERE name_ar = 'الزيتون';

UPDATE farm_categories 
SET 
  name_ar = 'أشجار النخيل',
  name_en = 'Palm Trees',
  icon = 'wheat',
  description_ar = 'استثمر في أشجار النخيل والتمور',
  display_order = 2
WHERE name_ar = 'النخيل';

-- ثانياً: نضيف الفئات الجديدة إذا لم تكن موجودة
INSERT INTO farm_categories (name_ar, name_en, icon, description_ar, active, display_order)
VALUES 
  ('أشجار المانجا', 'Mango Trees', 'apple', 'استثمر في أشجار المانجا الاستوائية', true, 3),
  ('أشجار الموز', 'Banana Trees', 'grape', 'استثمر في أشجار الموز الطازج', true, 4)
ON CONFLICT DO NOTHING;

-- إنشاء index على display_order لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_farm_categories_display_order ON farm_categories(display_order);

-- التأكد من أن جميع الفئات لها ترتيب
UPDATE farm_categories 
SET display_order = 999 
WHERE display_order = 0 OR display_order IS NULL;
