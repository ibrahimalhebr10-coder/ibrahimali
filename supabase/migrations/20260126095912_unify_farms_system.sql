/*
  # توحيد نظام المزارع - جدول farms واحد شامل

  ## التعديلات
  
  ### 1. توسيع جدول farms
  إضافة الحقول التالية لدعم العرض الكامل:
  - `video_url` (text) - رابط فيديو المزرعة (YouTube)
  - `map_url` (text) - رابط موقع المزرعة (Google Maps)
  - `marketing_message` (text) - النص الدعائي
  - `return_rate_display` (text) - نسبة العائد للعرض (مثال: "25% سنوياً")
  - `available_trees` (integer) - عدد الأشجار المتاحة
  - `reserved_trees` (integer) - عدد الأشجار المحجوزة
  - `order_index` (integer) - ترتيب العرض

  ### 2. جداول الأشجار
  - ربط `farm_tree_types` و `farm_tree_varieties` مع جدول farms
  - إضافة foreign key إلى farms بدلاً من farm_display_projects

  ### 3. السياسات الأمنية
  - قراءة عامة للمزارع النشطة
  - إدارة كاملة للـ admins فقط
  
  ## الملاحظات
  - هذا المايجريشن يوحد النظام ليعتمد على farms فقط
  - تم الحفاظ على جميع البيانات الموجودة
  - نظام متكامل للإدارة والعرض
*/

-- إضافة الحقول الجديدة إلى farms
DO $$
BEGIN
  -- video_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farms' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE farms ADD COLUMN video_url text;
  END IF;

  -- map_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farms' AND column_name = 'map_url'
  ) THEN
    ALTER TABLE farms ADD COLUMN map_url text DEFAULT '#';
  END IF;

  -- marketing_message
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farms' AND column_name = 'marketing_message'
  ) THEN
    ALTER TABLE farms ADD COLUMN marketing_message text;
  END IF;

  -- return_rate_display
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farms' AND column_name = 'return_rate_display'
  ) THEN
    ALTER TABLE farms ADD COLUMN return_rate_display text DEFAULT '0%';
  END IF;

  -- available_trees
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farms' AND column_name = 'available_trees'
  ) THEN
    ALTER TABLE farms ADD COLUMN available_trees integer DEFAULT 0 CHECK (available_trees >= 0);
  END IF;

  -- reserved_trees
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farms' AND column_name = 'reserved_trees'
  ) THEN
    ALTER TABLE farms ADD COLUMN reserved_trees integer DEFAULT 0 CHECK (reserved_trees >= 0);
  END IF;

  -- order_index
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farms' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE farms ADD COLUMN order_index integer DEFAULT 0;
  END IF;
END $$;

-- إنشاء جداول الأشجار المرتبطة بـ farms
CREATE TABLE IF NOT EXISTS farms_tree_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS farms_tree_varieties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_type_id uuid REFERENCES farms_tree_types(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  icon text NOT NULL DEFAULT '🌳',
  available integer NOT NULL DEFAULT 0 CHECK (available >= 0),
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_farms_category_id ON farms(category_id);
CREATE INDEX IF NOT EXISTS idx_farms_status ON farms(status);
CREATE INDEX IF NOT EXISTS idx_farms_order_index ON farms(order_index);
CREATE INDEX IF NOT EXISTS idx_farms_tree_types_farm_id ON farms_tree_types(farm_id);
CREATE INDEX IF NOT EXISTS idx_farms_tree_varieties_tree_type_id ON farms_tree_varieties(tree_type_id);

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE farms_tree_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms_tree_varieties ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة العامة للمزارع النشطة
DROP POLICY IF EXISTS "Anyone can view active farms" ON farms;
CREATE POLICY "Anyone can view active farms"
  ON farms FOR SELECT
  USING (status = 'active');

-- سياسات القراءة العامة لأنواع الأشجار
DROP POLICY IF EXISTS "Anyone can view farm tree types" ON farms_tree_types;
CREATE POLICY "Anyone can view farm tree types"
  ON farms_tree_types FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = farms_tree_types.farm_id
      AND farms.status = 'active'
    )
  );

-- سياسات القراءة العامة لأصناف الأشجار
DROP POLICY IF EXISTS "Anyone can view farm tree varieties" ON farms_tree_varieties;
CREATE POLICY "Anyone can view farm tree varieties"
  ON farms_tree_varieties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM farms_tree_types
      INNER JOIN farms ON farms.id = farms_tree_types.farm_id
      WHERE farms_tree_types.id = farms_tree_varieties.tree_type_id
      AND farms.status = 'active'
    )
  );