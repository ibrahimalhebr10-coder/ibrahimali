/*
  # إنشاء نظام الإدارة الشامل

  ## الجداول الجديدة
  
  ### 1. جدول المديرين (admins)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `email` (text)
  - `full_name` (text)
  - `role` (text) - super_admin, farm_manager, financial_manager
  - `permissions` (jsonb) - صلاحيات مخصصة
  - `is_active` (boolean)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

  ### 2. جدول سجلات الإدارة (admin_logs)
  - `id` (uuid, primary key)
  - `admin_id` (uuid, foreign key to admins)
  - `action_type` (text)
  - `entity_type` (text)
  - `entity_id` (uuid)
  - `description` (text)
  - `metadata` (jsonb)
  - `created_at` (timestamp)

  ### 3. جدول المعاملات المالية (payment_transactions)
  - `id` (uuid, primary key)
  - `reservation_id` (uuid, foreign key to reservations)
  - `user_id` (uuid, foreign key to auth.users)
  - `amount` (decimal)
  - `payment_method` (text)
  - `status` (text)
  - `transaction_reference` (text)
  - `payment_date` (timestamp)
  - `approved_by` (uuid, foreign key to admins)
  - `notes` (text)
  - `metadata` (jsonb)

  ## الأمان
  - تفعيل RLS على جميع الجداول
  - سياسات للمديرين فقط
*/

-- جدول المديرين
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'farm_manager',
  permissions jsonb DEFAULT '{"view_farms": true, "manage_farms": false, "view_reservations": true, "manage_reservations": false, "view_payments": true, "manage_payments": false}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('super_admin', 'farm_manager', 'financial_manager', 'support'))
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view other admins"
  ON admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Super admins can manage admins"
  ON admins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
      AND admins.is_active = true
    )
  );

-- جدول سجلات الإدارة
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_action_type CHECK (action_type IN ('create', 'update', 'delete', 'approve', 'reject', 'view', 'export')),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('farm', 'reservation', 'payment', 'user', 'message', 'settings'))
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Admins can create logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- جدول المعاملات المالية
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount decimal(10, 2) NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  transaction_reference text,
  payment_date timestamptz,
  approved_by uuid REFERENCES admins(id),
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('mada', 'bank_transfer', 'tamara', 'tabby', 'cash')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled'))
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Admins can manage transactions"
  ON payment_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
      AND (admins.role IN ('super_admin', 'financial_manager') OR admins.permissions->>'manage_payments' = 'true')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
      AND (admins.role IN ('super_admin', 'financial_manager') OR admins.permissions->>'manage_payments' = 'true')
    )
  );

-- تعديلات على جدول المزارع لإضافة حقول إدارية
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farm_display_projects' AND column_name = 'is_open_for_booking'
  ) THEN
    ALTER TABLE farm_display_projects ADD COLUMN is_open_for_booking boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farm_display_projects' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE farm_display_projects ADD COLUMN admin_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farm_display_projects' AND column_name = 'maintenance_status'
  ) THEN
    ALTER TABLE farm_display_projects ADD COLUMN maintenance_status text DEFAULT 'active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farm_display_projects' AND column_name = 'last_maintenance_date'
  ) THEN
    ALTER TABLE farm_display_projects ADD COLUMN last_maintenance_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farm_display_projects' AND column_name = 'next_maintenance_date'
  ) THEN
    ALTER TABLE farm_display_projects ADD COLUMN next_maintenance_date timestamptz;
  END IF;
END $$;

-- تعديلات على جدول الحجوزات
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE reservations ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE reservations ADD COLUMN admin_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE reservations ADD COLUMN approved_by uuid REFERENCES admins(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE reservations ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity_type ON admin_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_reservation_id ON payment_transactions(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_method ON payment_transactions(payment_method);