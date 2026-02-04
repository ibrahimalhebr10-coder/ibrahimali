/*
  # المرحلة الأولى: إضافة نظام تتبع التكاليف على مستوى المزرعة

  ## الملخص
  إضافة حقول التكلفة إلى جدول agricultural_operations لتمكين:
  - تتبع التكلفة الإجمالية للعملية
  - حساب تكلفة الشجرة الواحدة تلقائيًا
  - توزيع التكاليف ديناميكيًا حسب عدد الأشجار

  ## التغييرات
  1. إضافة حقل total_cost (التكلفة الإجمالية للعملية)
  2. إضافة حقل cost_per_tree (تكلفة الشجرة الواحدة - محسوبة تلقائيًا)
  3. إنشاء trigger لحساب cost_per_tree تلقائيًا عند الإدخال/التحديث
  4. إنشاء جدول farm_operation_notifications للإشعارات على مستوى المزرعة

  ## المبدأ المعماري
  - ✅ لا يوجد user_id في العمليات
  - ✅ التكاليف تُحسب على مستوى المزرعة
  - ✅ التوزيع يحدث ديناميكيًا وقت العرض
  - ✅ قابلية التوسع لآلاف المستخدمين

  ## الأمان
  - للأدمن فقط: إدخال وتعديل العمليات والتكاليف
  - للمستخدمين: عرض العمليات المرتبطة بمزارعهم فقط
*/

-- 1. إضافة حقول التكلفة إلى agricultural_operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agricultural_operations' AND column_name = 'total_cost'
  ) THEN
    ALTER TABLE agricultural_operations
    ADD COLUMN total_cost decimal(12,2) DEFAULT 0 CHECK (total_cost >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agricultural_operations' AND column_name = 'cost_per_tree'
  ) THEN
    ALTER TABLE agricultural_operations
    ADD COLUMN cost_per_tree decimal(12,2) DEFAULT 0 CHECK (cost_per_tree >= 0);
  END IF;
END $$;

-- 2. إنشاء function لحساب cost_per_tree تلقائيًا
CREATE OR REPLACE FUNCTION calculate_cost_per_tree()
RETURNS TRIGGER AS $$
DECLARE
  total_trees integer;
BEGIN
  -- جلب إجمالي عدد الأشجار في المزرعة
  SELECT COALESCE(SUM(quantity), 0)
  INTO total_trees
  FROM agricultural_tree_inventory
  WHERE farm_id = NEW.farm_id;

  -- حساب تكلفة الشجرة الواحدة
  IF total_trees > 0 THEN
    NEW.cost_per_tree := NEW.total_cost / total_trees;
  ELSE
    NEW.cost_per_tree := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. إنشاء trigger لحساب cost_per_tree تلقائيًا
DROP TRIGGER IF EXISTS trigger_calculate_cost_per_tree ON agricultural_operations;
CREATE TRIGGER trigger_calculate_cost_per_tree
  BEFORE INSERT OR UPDATE OF total_cost
  ON agricultural_operations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_cost_per_tree();

-- 4. إنشاء جدول الإشعارات على مستوى المزرعة
CREATE TABLE IF NOT EXISTS farm_operation_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  operation_id uuid NOT NULL REFERENCES agricultural_operations(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('operation_created', 'operation_updated', 'cost_added')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(operation_id)
);

-- 5. إنشاء index للأداء
CREATE INDEX IF NOT EXISTS idx_farm_notifications_farm_id ON farm_operation_notifications(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_notifications_created_at ON farm_operation_notifications(created_at DESC);

-- 6. تفعيل RLS
ALTER TABLE farm_operation_notifications ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- الأدمن: وصول كامل
CREATE POLICY "Admins have full access to farm notifications"
  ON farm_operation_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- المستخدمون: عرض الإشعارات للمزارع التي لديهم أشجار فيها
CREATE POLICY "Users can view notifications for their farms"
  ON farm_operation_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.farm_id = farm_operation_notifications.farm_id
        AND r.user_id = auth.uid()
        AND r.status = 'active'
    )
  );

-- 8. إنشاء function لإنشاء إشعار تلقائيًا عند إضافة عملية
CREATE OR REPLACE FUNCTION create_farm_operation_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO farm_operation_notifications (
    farm_id,
    operation_id,
    notification_type,
    title,
    message
  )
  VALUES (
    NEW.farm_id,
    NEW.id,
    'operation_created',
    'عملية زراعية جديدة',
    format('تم إضافة عملية %s بتاريخ %s', NEW.operation_type, NEW.operation_date)
  )
  ON CONFLICT (operation_id) DO UPDATE
  SET
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    created_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. إنشاء trigger لإنشاء إشعار تلقائيًا
DROP TRIGGER IF EXISTS trigger_create_farm_operation_notification ON agricultural_operations;
CREATE TRIGGER trigger_create_farm_operation_notification
  AFTER INSERT ON agricultural_operations
  FOR EACH ROW
  EXECUTE FUNCTION create_farm_operation_notification();

-- 10. إضافة تعليق على الجداول
COMMENT ON COLUMN agricultural_operations.total_cost IS 'التكلفة الإجمالية للعملية على مستوى المزرعة';
COMMENT ON COLUMN agricultural_operations.cost_per_tree IS 'تكلفة الشجرة الواحدة (محسوبة تلقائيًا = total_cost / عدد الأشجار)';
COMMENT ON TABLE farm_operation_notifications IS 'إشعارات على مستوى المزرعة - يراها كل من لديه أشجار في المزرعة';
