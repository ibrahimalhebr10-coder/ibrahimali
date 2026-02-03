/*
  # نظام إدارة مزرعتي - المسار الزراعي

  ## الملخص
  نظام شامل لإدارة الحياة الزراعية للأشجار في لوحة التحكم الإدارية.
  هذا النظام هو المصدر الوحيد لما يظهر في قسم "مزرعتي الزراعي" في واجهة المستخدم.

  ## الجداول الجديدة

  ### 1. agricultural_tree_inventory
  مخزون الأشجار الزراعية حسب المزرعة والنوع
  - `id` (uuid, primary key)
  - `farm_id` (uuid, foreign key to farms)
  - `tree_type` (text) - نوع الشجرة
  - `quantity` (integer) - عدد الأشجار
  - `current_state` (text) - الحالة الحالية: نمو، إثمار، راحة موسمية
  - `planting_date` (date) - تاريخ الزراعة
  - `notes` (text) - ملاحظات داخلية
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. agricultural_operations
  سجل العمليات الزراعية
  - `id` (uuid, primary key)
  - `farm_id` (uuid, foreign key to farms)
  - `operation_type` (text) - نوع العملية: ري، تقليم، تسميد، مكافحة آفات
  - `operation_date` (date) - تاريخ العملية
  - `description` (text) - وصف العملية
  - `internal_notes` (text) - ملاحظات داخلية
  - `photos` (jsonb) - مسارات الصور المرفقة
  - `performed_by` (uuid, foreign key to admins) - من قام بالعملية
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. agricultural_documentation
  توثيق زراعي مرتبط بالعمليات أو المراحل
  - `id` (uuid, primary key)
  - `farm_id` (uuid, foreign key to farms)
  - `media_type` (text) - نوع الملف: صورة أو فيديو
  - `media_url` (text) - رابط الملف
  - `linked_to_type` (text) - نوع الربط: operation أو growth_stage
  - `linked_to_id` (uuid) - معرف العملية أو المرحلة
  - `caption` (text) - تعليق
  - `upload_date` (date)
  - `uploaded_by` (uuid, foreign key to admins)
  - `created_at` (timestamptz)

  ### 4. agricultural_growth_stages
  مراحل النمو والمحصول
  - `id` (uuid, primary key)
  - `farm_id` (uuid, foreign key to farms)
  - `tree_type` (text) - نوع الشجرة
  - `current_stage` (text) - المرحلة الحالية
  - `stage_description` (text) - وصف المرحلة
  - `estimated_timeframe` (text) - نافذة زمنية تقديرية (بدون أرقام دقيقة)
  - `stage_start_date` (date) - بداية المرحلة
  - `stage_end_date` (date) - نهاية المرحلة المتوقعة
  - `notes` (text) - ملاحظات
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. agricultural_experience_content
  محتوى Experience Builder - ما سيراه المزارع في الواجهة
  - `id` (uuid, primary key)
  - `farm_id` (uuid, foreign key to farms)
  - `is_active` (boolean) - فعال أم لا
  - `display_text` (text) - النص الذي سيظهر للمزارع
  - `selected_photos` (jsonb) - الصور المختارة للعرض
  - `status_message` (text) - رسالة الحالة (أسبوعية/شهرية)
  - `last_updated` (timestamptz) - آخر تحديث
  - `updated_by` (uuid, foreign key to admins)
  - `created_at` (timestamptz)

  ## الأمان
  - تفعيل RLS على جميع الجداول
  - السماح للمدراء فقط بالقراءة والكتابة
  - المزارعون يقرؤون فقط من agricultural_experience_content
*/

-- 1. جدول مخزون الأشجار
CREATE TABLE IF NOT EXISTS agricultural_tree_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  tree_type text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  current_state text NOT NULL CHECK (current_state IN ('نمو', 'إثمار', 'راحة موسمية')),
  planting_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. جدول العمليات الزراعية
CREATE TABLE IF NOT EXISTS agricultural_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  operation_type text NOT NULL CHECK (operation_type IN ('ري', 'تقليم', 'تسميد', 'مكافحة آفات')),
  operation_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  internal_notes text,
  photos jsonb DEFAULT '[]'::jsonb,
  performed_by uuid REFERENCES admins(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. جدول التوثيق الزراعي
CREATE TABLE IF NOT EXISTS agricultural_documentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('صورة', 'فيديو')),
  media_url text NOT NULL,
  linked_to_type text NOT NULL CHECK (linked_to_type IN ('operation', 'growth_stage')),
  linked_to_id uuid NOT NULL,
  caption text,
  upload_date date DEFAULT CURRENT_DATE,
  uploaded_by uuid REFERENCES admins(id),
  created_at timestamptz DEFAULT now()
);

-- 4. جدول مراحل النمو
CREATE TABLE IF NOT EXISTS agricultural_growth_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  tree_type text NOT NULL,
  current_stage text NOT NULL,
  stage_description text,
  estimated_timeframe text,
  stage_start_date date,
  stage_end_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. جدول محتوى Experience Builder
CREATE TABLE IF NOT EXISTS agricultural_experience_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  display_text text NOT NULL,
  selected_photos jsonb DEFAULT '[]'::jsonb,
  status_message text,
  last_updated timestamptz DEFAULT now(),
  updated_by uuid REFERENCES admins(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(farm_id)
);

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_agri_tree_inventory_farm_id ON agricultural_tree_inventory(farm_id);
CREATE INDEX IF NOT EXISTS idx_agri_operations_farm_id ON agricultural_operations(farm_id);
CREATE INDEX IF NOT EXISTS idx_agri_operations_date ON agricultural_operations(operation_date DESC);
CREATE INDEX IF NOT EXISTS idx_agri_documentation_farm_id ON agricultural_documentation(farm_id);
CREATE INDEX IF NOT EXISTS idx_agri_growth_stages_farm_id ON agricultural_growth_stages(farm_id);
CREATE INDEX IF NOT EXISTS idx_agri_experience_farm_id ON agricultural_experience_content(farm_id);

-- تفعيل RLS
ALTER TABLE agricultural_tree_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agricultural_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agricultural_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE agricultural_growth_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agricultural_experience_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies للمدراء - الوصول الكامل
CREATE POLICY "Admins have full access to tree inventory"
  ON agricultural_tree_inventory
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

CREATE POLICY "Admins have full access to operations"
  ON agricultural_operations
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

CREATE POLICY "Admins have full access to documentation"
  ON agricultural_documentation
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

CREATE POLICY "Admins have full access to growth stages"
  ON agricultural_growth_stages
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

CREATE POLICY "Admins have full access to experience content"
  ON agricultural_experience_content
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

-- Policies للمستخدمين - قراءة فقط من experience_content
CREATE POLICY "Users can read their farm experience content"
  ON agricultural_experience_content
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.farm_id = agricultural_experience_content.farm_id
        AND r.user_id = auth.uid()
        AND r.status = 'active'
    )
  );

-- Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_agricultural_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers لـ updated_at
DROP TRIGGER IF EXISTS update_agri_tree_inventory_updated_at ON agricultural_tree_inventory;
CREATE TRIGGER update_agri_tree_inventory_updated_at
  BEFORE UPDATE ON agricultural_tree_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_agricultural_updated_at();

DROP TRIGGER IF EXISTS update_agri_operations_updated_at ON agricultural_operations;
CREATE TRIGGER update_agri_operations_updated_at
  BEFORE UPDATE ON agricultural_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_agricultural_updated_at();

DROP TRIGGER IF EXISTS update_agri_growth_stages_updated_at ON agricultural_growth_stages;
CREATE TRIGGER update_agri_growth_stages_updated_at
  BEFORE UPDATE ON agricultural_growth_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_agricultural_updated_at();

-- إنشاء storage bucket للصور والفيديوهات الزراعية
INSERT INTO storage.buckets (id, name, public)
VALUES ('agricultural-media', 'agricultural-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Admins can upload agricultural media" ON storage.objects;
CREATE POLICY "Admins can upload agricultural media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'agricultural-media'
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update agricultural media" ON storage.objects;
CREATE POLICY "Admins can update agricultural media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'agricultural-media'
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can delete agricultural media" ON storage.objects;
CREATE POLICY "Admins can delete agricultural media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'agricultural-media'
    AND EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public can view agricultural media" ON storage.objects;
CREATE POLICY "Public can view agricultural media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'agricultural-media');
