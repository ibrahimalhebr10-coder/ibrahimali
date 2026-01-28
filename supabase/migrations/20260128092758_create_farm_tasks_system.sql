/*
  # إنشاء نظام مهام المزارع

  1. الجداول الجديدة
    - `farm_tasks` - جدول المهام الخاصة بكل مزرعة
      - `id` (uuid, primary key)
      - `farm_id` (uuid, foreign key -> farms)
      - `task_type` (text) - نوع العمل
      - `description` (text) - وصف المهمة
      - `assigned_to` (uuid, foreign key -> admins) - الشخص المكلف
      - `assigned_by` (uuid, foreign key -> admins) - من قام بالتكليف
      - `start_time` (timestamptz) - وقت البدء
      - `end_time` (timestamptz, nullable) - وقت الإغلاق
      - `duration_minutes` (integer, nullable) - مدة التنفيذ بالدقائق
      - `status` (text) - حالة المهمة: pending, in_progress, completed
      - `notes` (text, nullable) - ملاحظات
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. الأمان
    - تفعيل RLS على الجدول
    - سياسات للقراءة والكتابة للمستخدمين المخصصين للمزرعة

  3. الفهارس
    - فهرس على farm_id
    - فهرس على assigned_to
    - فهرس على status
*/

-- إنشاء جدول المهام
CREATE TABLE IF NOT EXISTS farm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  task_type text NOT NULL,
  description text NOT NULL,
  assigned_to uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_minutes integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- إضافة تعليقات توضيحية
COMMENT ON TABLE farm_tasks IS 'جدول مهام العمل الخاصة بكل مزرعة';
COMMENT ON COLUMN farm_tasks.task_type IS 'نوع العمل المطلوب (ري، تسميد، تقليم، إلخ)';
COMMENT ON COLUMN farm_tasks.assigned_to IS 'المستخدم الإداري المكلف بالمهمة';
COMMENT ON COLUMN farm_tasks.assigned_by IS 'المستخدم الذي قام بإنشاء المهمة';
COMMENT ON COLUMN farm_tasks.start_time IS 'وقت بدء المهمة (تاريخ + ساعة)';
COMMENT ON COLUMN farm_tasks.end_time IS 'وقت إغلاق المهمة (يتم ملؤه عند الإغلاق)';
COMMENT ON COLUMN farm_tasks.duration_minutes IS 'مدة تنفيذ المهمة بالدقائق (محسوبة تلقائياً)';
COMMENT ON COLUMN farm_tasks.status IS 'حالة المهمة: pending (معلقة), in_progress (جارية), completed (مكتملة)';

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_farm_tasks_farm_id ON farm_tasks(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_tasks_assigned_to ON farm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_farm_tasks_status ON farm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_farm_tasks_start_time ON farm_tasks(start_time);

-- تفعيل RLS
ALTER TABLE farm_tasks ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: يمكن للمستخدمين الإداريين المخصصين للمزرعة رؤية المهام
CREATE POLICY "Admins can view tasks for their assigned farms"
  ON farm_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()
      AND a.is_active = true
      AND (
        -- Super admin يرى كل شيء
        EXISTS (
          SELECT 1 FROM admin_roles r
          WHERE r.id = a.role_id
          AND r.role_key = 'super_admin'
        )
        OR
        -- أو المستخدم مخصص لهذه المزرعة
        EXISTS (
          SELECT 1 FROM admin_farm_assignments afa
          WHERE afa.admin_id = a.id
          AND afa.farm_id = farm_tasks.farm_id
          AND afa.is_active = true
        )
      )
    )
  );

-- سياسة الإدراج: مدراء المزارع والمشرفون يمكنهم إنشاء مهام للمزارع المخصصة لهم
CREATE POLICY "Farm managers can create tasks"
  ON farm_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_farm_assignments afa ON afa.admin_id = a.id
      WHERE a.user_id = auth.uid()
      AND a.is_active = true
      AND afa.farm_id = farm_tasks.farm_id
      AND afa.is_active = true
      AND afa.assignment_type IN ('full_access', 'supervisor')
    )
  );

-- سياسة التحديث: المكلف بالمهمة أو مدير المزرعة يمكنهم تحديث المهمة
CREATE POLICY "Assigned users and managers can update tasks"
  ON farm_tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()
      AND a.is_active = true
      AND (
        -- المكلف بالمهمة
        a.id = farm_tasks.assigned_to
        OR
        -- أو مدير المزرعة
        EXISTS (
          SELECT 1 FROM admin_farm_assignments afa
          WHERE afa.admin_id = a.id
          AND afa.farm_id = farm_tasks.farm_id
          AND afa.is_active = true
          AND afa.assignment_type IN ('full_access', 'supervisor')
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()
      AND a.is_active = true
      AND (
        a.id = farm_tasks.assigned_to
        OR
        EXISTS (
          SELECT 1 FROM admin_farm_assignments afa
          WHERE afa.admin_id = a.id
          AND afa.farm_id = farm_tasks.farm_id
          AND afa.is_active = true
          AND afa.assignment_type IN ('full_access', 'supervisor')
        )
      )
    )
  );

-- سياسة الحذف: فقط مدراء المزارع
CREATE POLICY "Farm managers can delete tasks"
  ON farm_tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_farm_assignments afa ON afa.admin_id = a.id
      WHERE a.user_id = auth.uid()
      AND a.is_active = true
      AND afa.farm_id = farm_tasks.farm_id
      AND afa.is_active = true
      AND afa.assignment_type IN ('full_access', 'supervisor')
    )
  );

-- دالة لحساب مدة التنفيذ تلقائياً عند إغلاق المهمة
CREATE OR REPLACE FUNCTION calculate_task_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger لحساب المدة تلقائياً
DROP TRIGGER IF EXISTS trigger_calculate_task_duration ON farm_tasks;
CREATE TRIGGER trigger_calculate_task_duration
  BEFORE INSERT OR UPDATE ON farm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION calculate_task_duration();

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_farm_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger لتحديث updated_at
DROP TRIGGER IF EXISTS trigger_update_farm_tasks_updated_at ON farm_tasks;
CREATE TRIGGER trigger_update_farm_tasks_updated_at
  BEFORE UPDATE ON farm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_farm_tasks_updated_at();