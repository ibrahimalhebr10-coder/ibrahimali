/*
  # إنشاء نظام الباقات الاستثمارية

  1. الجداول الجديدة
    - `investment_packages`
      - `id` (uuid, primary key)
      - `package_name` (text) - اسم الباقة
      - `contract_id` (uuid) - معرف العقد المرتبط
      - `price_per_tree` (integer) - سعر الشجرة الواحدة
      - `motivational_text` (text) - نص تحفيزي
      - `description` (text) - وصف الباقة
      - `investment_duration_title` (text) - عنوان مدة الاستثمار
      - `investor_rights` (jsonb) - حقوق المستثمر
      - `management_approach` (text) - آلية الإدارة
      - `returns_info` (text) - معلومات العائد
      - `disclaimer` (text) - التنويه
      - `action_button_text` (text) - نص زر الإجراء
      - `is_active` (boolean) - حالة التفعيل
      - `sort_order` (integer) - ترتيب العرض
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. الأمان
    - تفعيل RLS على الجدول
    - سماح للجميع بقراءة الباقات النشطة
    - السماح للمشرفين بإدارة الباقات
*/

-- إنشاء جدول الباقات الاستثمارية
CREATE TABLE IF NOT EXISTS investment_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name text NOT NULL,
  contract_id uuid NOT NULL REFERENCES farm_contracts(id) ON DELETE CASCADE,
  price_per_tree integer NOT NULL DEFAULT 0,
  motivational_text text,
  description text NOT NULL DEFAULT 'هذه الباقة تمثل عقد استثمار في أشجار مثمرة حقيقية تُدار بالكامل من المنصة طوال مدة العقد.',
  investment_duration_title text DEFAULT 'مدة الاستثمار',
  investor_rights jsonb DEFAULT '["الثمار الموسمية", "الزيوت المستخرجة", "مخلفات التقليم (الحطب)", "أوراق الأشجار", "بقايا العصر والنواتج النباتية"]'::jsonb,
  management_approach text DEFAULT 'المنصة تتولى الزراعة، الري، الصيانة، والحصاد. إدارة بيع المنتجات والمخلفات. متابعة دورية عبر حساب المستثمر.',
  returns_info text DEFAULT 'العائد مرتبط بالإنتاج والموسم. لا توجد عوائد ثابتة أو مضمونة. تفاصيل العوائد تظهر داخل الحساب عند توفرها.',
  disclaimer text DEFAULT 'الاستثمار الزراعي يخضع لعوامل طبيعية ومناخية والمنصة تدير الاستثمار ولا تضمن نتائج مالية محددة.',
  action_button_text text DEFAULT 'اختيار هذه الباقة وبدء استثمار أشجاري',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE investment_packages ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الباقات النشطة
CREATE POLICY "Anyone can view active investment packages"
  ON investment_packages
  FOR SELECT
  USING (is_active = true);

-- السماح للمشرفين بإدارة الباقات
CREATE POLICY "Admins can manage investment packages"
  ON investment_packages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- إنشاء index للأداء
CREATE INDEX IF NOT EXISTS idx_investment_packages_contract_id ON investment_packages(contract_id);
CREATE INDEX IF NOT EXISTS idx_investment_packages_is_active ON investment_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_investment_packages_sort_order ON investment_packages(sort_order);

-- تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_investment_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_investment_packages_updated_at
  BEFORE UPDATE ON investment_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_investment_packages_updated_at();
