/*
  # إنشاء نظام متابعة أشجاري الكامل

  1. جداول جديدة
    - `tree_operations` - العمليات الزراعية (ري، صيانة، تقليم، حصاد)
      - `id` (uuid, primary key)
      - `farm_id` (uuid, foreign key)
      - `investor_id` (uuid, foreign key)
      - `reservation_id` (uuid, foreign key)
      - `operation_type` (text) - نوع العملية: irrigation, maintenance, pruning, harvest
      - `operation_date` (date) - تاريخ العملية
      - `trees_count` (integer) - عدد الأشجار المتأثرة
      - `total_cost` (decimal) - التكلفة الإجمالية
      - `cost_per_tree` (decimal) - التكلفة لكل شجرة (محسوبة)
      - `notes` (text) - ملاحظات
      - `status_report` (text) - تقرير الحالة
      - `created_by` (uuid, foreign key) - المسؤول الذي أضافها
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `tree_operation_media` - الوسائط المرتبطة بالعمليات
      - `id` (uuid, primary key)
      - `operation_id` (uuid, foreign key)
      - `media_type` (text) - photo, video
      - `media_url` (text) - رابط الصورة/الفيديو
      - `caption` (text) - وصف
      - `created_at` (timestamptz)

    - `harvest_preferences` - اختيارات المزارع للمحصول
      - `id` (uuid, primary key)
      - `investor_id` (uuid, foreign key)
      - `farm_id` (uuid, foreign key)
      - `reservation_id` (uuid, foreign key)
      - `preference_type` (text) - personal_use, gift, charity
      - `trees_count` (integer) - عدد الأشجار
      - `recipient_name` (text) - اسم المستلم (للإهداء)
      - `recipient_phone` (text) - هاتف المستلم (للإهداء)
      - `recipient_address` (text) - عنوان المستلم
      - `charity_name` (text) - اسم الجمعية (للصدقة)
      - `special_instructions` (text) - تعليمات خاصة
      - `status` (text) - pending, in_progress, completed, cancelled
      - `processing_notes` (text) - ملاحظات المعالجة
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS على جميع الجداول
    - Admins يمكنهم إضافة وتعديل وحذف العمليات
    - المستثمرون يمكنهم رؤية العمليات الخاصة بهم فقط
    - المستثمرون يمكنهم إضافة وتعديل اختيارات المحصول الخاصة بهم
*/

-- Create tree_operations table
CREATE TABLE IF NOT EXISTS tree_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  investor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  operation_type text NOT NULL CHECK (operation_type IN ('irrigation', 'maintenance', 'pruning', 'harvest')),
  operation_date date NOT NULL DEFAULT CURRENT_DATE,
  trees_count integer NOT NULL CHECK (trees_count > 0),
  total_cost decimal(10, 2) DEFAULT 0,
  cost_per_tree decimal(10, 2) GENERATED ALWAYS AS (
    CASE WHEN trees_count > 0 THEN total_cost / trees_count ELSE 0 END
  ) STORED,
  notes text,
  status_report text,
  created_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tree_operation_media table
CREATE TABLE IF NOT EXISTS tree_operation_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid REFERENCES tree_operations(id) ON DELETE CASCADE NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video')),
  media_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

-- Create harvest_preferences table
CREATE TABLE IF NOT EXISTS harvest_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  preference_type text NOT NULL CHECK (preference_type IN ('personal_use', 'gift', 'charity')),
  trees_count integer NOT NULL CHECK (trees_count > 0),
  recipient_name text,
  recipient_phone text,
  recipient_address text,
  charity_name text,
  special_instructions text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  processing_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tree_operations_farm_id ON tree_operations(farm_id);
CREATE INDEX IF NOT EXISTS idx_tree_operations_investor_id ON tree_operations(investor_id);
CREATE INDEX IF NOT EXISTS idx_tree_operations_operation_date ON tree_operations(operation_date);
CREATE INDEX IF NOT EXISTS idx_tree_operation_media_operation_id ON tree_operation_media(operation_id);
CREATE INDEX IF NOT EXISTS idx_harvest_preferences_investor_id ON harvest_preferences(investor_id);
CREATE INDEX IF NOT EXISTS idx_harvest_preferences_farm_id ON harvest_preferences(farm_id);
CREATE INDEX IF NOT EXISTS idx_harvest_preferences_status ON harvest_preferences(status);

-- Enable RLS
ALTER TABLE tree_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_operation_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tree_operations

-- Admins can do everything
CREATE POLICY "Admins can manage all tree operations"
  ON tree_operations
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

-- Investors can view their own operations
CREATE POLICY "Investors can view their tree operations"
  ON tree_operations
  FOR SELECT
  TO authenticated
  USING (investor_id = auth.uid());

-- RLS Policies for tree_operation_media

-- Admins can manage all media
CREATE POLICY "Admins can manage all operation media"
  ON tree_operation_media
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

-- Investors can view media for their operations
CREATE POLICY "Investors can view their operation media"
  ON tree_operation_media
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tree_operations
      WHERE tree_operations.id = tree_operation_media.operation_id
        AND tree_operations.investor_id = auth.uid()
    )
  );

-- RLS Policies for harvest_preferences

-- Admins can manage all preferences
CREATE POLICY "Admins can manage all harvest preferences"
  ON harvest_preferences
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

-- Investors can manage their own preferences
CREATE POLICY "Investors can view their harvest preferences"
  ON harvest_preferences
  FOR SELECT
  TO authenticated
  USING (investor_id = auth.uid());

CREATE POLICY "Investors can create their harvest preferences"
  ON harvest_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (investor_id = auth.uid());

CREATE POLICY "Investors can update their pending harvest preferences"
  ON harvest_preferences
  FOR UPDATE
  TO authenticated
  USING (investor_id = auth.uid() AND status = 'pending')
  WITH CHECK (investor_id = auth.uid());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_tree_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_tree_operations_updated_at
  BEFORE UPDATE ON tree_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_tree_tracking_updated_at();

CREATE TRIGGER update_harvest_preferences_updated_at
  BEFORE UPDATE ON harvest_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_tree_tracking_updated_at();

-- Create storage bucket for tree operation media
INSERT INTO storage.buckets (id, name, public)
VALUES ('tree-operation-media', 'tree-operation-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tree operation media
CREATE POLICY "Admins can upload tree operation media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'tree-operation-media' AND
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view tree operation media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'tree-operation-media');

CREATE POLICY "Admins can delete tree operation media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'tree-operation-media' AND
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );
