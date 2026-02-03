/*
  # نظام إدارة مزرعتي - المسار الاستثماري

  ## الملخص
  نظام شامل لإدارة الأصول الاستثمارية للأشجار بدون تفاصيل تشغيلية زراعية.
  هذا النظام هو المصدر الوحيد لما يظهر في قسم "مزرعتي الاستثماري" في واجهة المستخدم.
  فصل كامل عن المسار الزراعي.

  ## الجداول الجديدة

  ### 1. investment_agricultural_assets
  الأصول الزراعية للمستثمر (الأشجار)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to user_profiles) - المستثمر
  - `farm_id` (uuid, foreign key to farms) - المزرعة
  - `contract_id` (uuid, foreign key to reservations) - العقد المرتبط
  - `tree_type` (text) - نوع الشجرة
  - `quantity` (integer) - عدد الأشجار
  - `acquisition_date` (date) - تاريخ الاستحواذ
  - `notes` (text) - ملاحظات
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. investment_status_tracking
  تتبع حالة الاستثمار
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to user_profiles) - المستثمر
  - `contract_id` (uuid, foreign key to reservations) - العقد
  - `current_status` (text) - الحالة: نشط | فترة مجانية | يقترب من الانتهاء | مكتمل
  - `status_start_date` (date) - بداية الحالة
  - `status_end_date` (date) - نهاية الحالة المتوقعة
  - `free_period_remaining_days` (integer) - الأيام المتبقية من الفترة المجانية
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. investment_products_yields
  المنتجات والعوائد
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to user_profiles) - المستثمر
  - `asset_id` (uuid, foreign key to investment_agricultural_assets) - الأصل
  - `product_type` (text) - نوع المنتج: ثمار | زيوت | مخلفات تقليم | مخلفات عصر
  - `harvest_date` (date) - تاريخ الحصاد/الإنتاج
  - `value` (numeric) - القيمة فقط
  - `value_unit` (text) - وحدة القيمة (كجم، لتر، SAR)
  - `description` (text) - وصف
  - `created_at` (timestamptz)

  ### 4. investment_waste_yields
  المخلفات والمنتجات الثانوية
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to user_profiles) - المستثمر
  - `asset_id` (uuid, foreign key to investment_agricultural_assets) - الأصل
  - `waste_type` (text) - نوع المخلفات: مخلفات تقليم | مخلفات عصر | أخرى
  - `collection_date` (date) - تاريخ الجمع
  - `value` (numeric) - القيمة
  - `value_unit` (text) - وحدة القيمة
  - `description` (text)
  - `created_at` (timestamptz)

  ### 5. investment_expansion_opportunities
  فرص التوسعة
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to user_profiles) - المستثمر
  - `opportunity_type` (text) - نوع الفرصة: إضافة أشجار | ترقية عقد | دخول مزرعة جديدة
  - `farm_id` (uuid, foreign key to farms) - المزرعة (للفرص الحالية)
  - `title` (text) - عنوان الفرصة
  - `description` (text) - وصف الفرصة
  - `estimated_investment` (numeric) - الاستثمار المتوقع
  - `potential_trees` (integer) - عدد الأشجار المحتمل إضافتها
  - `is_active` (boolean) - فعالة أم لا
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. investment_experience_content
  محتوى Experience Builder الاستثماري - ما سيراه المستثمر في الواجهة
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to user_profiles) - المستثمر
  - `is_active` (boolean) - فعال أم لا
  - `display_text` (text) - النص الذي سيظهر للمستثمر
  - `selected_photos` (jsonb) - الصور المختارة للعرض
  - `status_message` (text) - رسالة الحالة
  - `growth_metrics` (jsonb) - مقاييس النمو (عدد الأشجار، القيمة، النمو%)
  - `last_updated` (timestamptz) - آخر تحديث
  - `updated_by` (uuid, foreign key to admins)
  - `created_at` (timestamptz)
  - UNIQUE(user_id)

  ## الأمان
  - تفعيل RLS على جميع الجداول
  - المدراء: قراءة وكتابة كاملة
  - المستثمرون: قراءة بياناتهم فقط
*/

-- 1. جدول الأصول الزراعية
CREATE TABLE IF NOT EXISTS investment_agricultural_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES reservations(id) ON DELETE SET NULL,
  tree_type text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  acquisition_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. جدول حالة الاستثمار
CREATE TABLE IF NOT EXISTS investment_status_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES reservations(id) ON DELETE SET NULL,
  current_status text NOT NULL CHECK (current_status IN ('نشط', 'فترة مجانية', 'يقترب من الانتهاء', 'مكتمل')),
  status_start_date date DEFAULT CURRENT_DATE,
  status_end_date date,
  free_period_remaining_days integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. جدول المنتجات والعوائد
CREATE TABLE IF NOT EXISTS investment_products_yields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES investment_agricultural_assets(id) ON DELETE CASCADE,
  product_type text NOT NULL CHECK (product_type IN ('ثمار', 'زيوت', 'مخلفات تقليم', 'مخلفات عصر')),
  harvest_date date DEFAULT CURRENT_DATE,
  value numeric NOT NULL DEFAULT 0,
  value_unit text NOT NULL DEFAULT 'كجم',
  description text,
  created_at timestamptz DEFAULT now()
);

-- 4. جدول المخلفات
CREATE TABLE IF NOT EXISTS investment_waste_yields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES investment_agricultural_assets(id) ON DELETE CASCADE,
  waste_type text NOT NULL CHECK (waste_type IN ('مخلفات تقليم', 'مخلفات عصر', 'أخرى')),
  collection_date date DEFAULT CURRENT_DATE,
  value numeric NOT NULL DEFAULT 0,
  value_unit text NOT NULL DEFAULT 'كجم',
  description text,
  created_at timestamptz DEFAULT now()
);

-- 5. جدول فرص التوسعة
CREATE TABLE IF NOT EXISTS investment_expansion_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  opportunity_type text NOT NULL CHECK (opportunity_type IN ('إضافة أشجار', 'ترقية عقد', 'دخول مزرعة جديدة')),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  estimated_investment numeric DEFAULT 0,
  potential_trees integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. جدول محتوى Experience Builder الاستثماري
CREATE TABLE IF NOT EXISTS investment_experience_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  display_text text NOT NULL,
  selected_photos jsonb DEFAULT '[]'::jsonb,
  status_message text,
  growth_metrics jsonb DEFAULT '{}'::jsonb,
  last_updated timestamptz DEFAULT now(),
  updated_by uuid REFERENCES admins(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_inv_assets_user_id ON investment_agricultural_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_inv_assets_farm_id ON investment_agricultural_assets(farm_id);
CREATE INDEX IF NOT EXISTS idx_inv_status_user_id ON investment_status_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_inv_products_user_id ON investment_products_yields(user_id);
CREATE INDEX IF NOT EXISTS idx_inv_products_asset_id ON investment_products_yields(asset_id);
CREATE INDEX IF NOT EXISTS idx_inv_waste_user_id ON investment_waste_yields(user_id);
CREATE INDEX IF NOT EXISTS idx_inv_expansion_user_id ON investment_expansion_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_inv_experience_user_id ON investment_experience_content(user_id);

-- تفعيل RLS
ALTER TABLE investment_agricultural_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_status_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_products_yields ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_waste_yields ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_expansion_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_experience_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies للمدراء - الوصول الكامل
CREATE POLICY "Admins have full access to investment assets"
  ON investment_agricultural_assets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to investment status"
  ON investment_status_tracking
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to products yields"
  ON investment_products_yields
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to waste yields"
  ON investment_waste_yields
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to expansion opportunities"
  ON investment_expansion_opportunities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to investment experience content"
  ON investment_experience_content
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Policies للمستثمرين - قراءة بياناتهم فقط
CREATE POLICY "Users can read their own investment assets"
  ON investment_agricultural_assets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read their own investment status"
  ON investment_status_tracking
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read their own products yields"
  ON investment_products_yields
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read their own waste yields"
  ON investment_waste_yields
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read their own expansion opportunities"
  ON investment_expansion_opportunities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read their own investment experience content"
  ON investment_experience_content
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_investment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers لـ updated_at
DROP TRIGGER IF EXISTS update_inv_assets_updated_at ON investment_agricultural_assets;
CREATE TRIGGER update_inv_assets_updated_at
  BEFORE UPDATE ON investment_agricultural_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_investment_updated_at();

DROP TRIGGER IF EXISTS update_inv_status_updated_at ON investment_status_tracking;
CREATE TRIGGER update_inv_status_updated_at
  BEFORE UPDATE ON investment_status_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_investment_updated_at();

DROP TRIGGER IF EXISTS update_inv_expansion_updated_at ON investment_expansion_opportunities;
CREATE TRIGGER update_inv_expansion_updated_at
  BEFORE UPDATE ON investment_expansion_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_investment_updated_at();
