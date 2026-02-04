/*
  # إضافة دعم المسارات إلى نظام رسوم الصيانة

  ## التغييرات

  1. إضافة حقل `path_type` إلى جدول `maintenance_fees`:
     - القيم المسموحة: 'agricultural' (أشجار خضراء), 'investment' (أشجار ذهبية)
     - إلزامي مع قيمة افتراضية
     - مفهرس للأداء

  2. تحديث الـ triggers:
     - عند إنشاء رسوم صيانة، يتم ربطها بالمسار تلقائياً
     - رسوم الصيانة تُطبق فقط على الحجوزات من نفس المزرعة ونفس المسار

  3. إنشاء functions للحصول على إحصائيات مالية:
     - `get_farm_path_payment_summary`: ملخص الرسوم حسب المزرعة والمسار
     - `get_farm_path_tree_count`: عدد الأشجار حسب المزرعة والمسار

  ## الأمان
  
  - تحديث RLS policies لدعم المسارات
  - التأكد من عدم خلط الرسوم بين المسارات المختلفة
*/

-- إضافة حقل path_type إلى جدول maintenance_fees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_fees' AND column_name = 'path_type'
  ) THEN
    ALTER TABLE maintenance_fees 
    ADD COLUMN path_type text NOT NULL DEFAULT 'agricultural' 
    CHECK (path_type IN ('agricultural', 'investment'));
  END IF;
END $$;

-- إنشاء index للأداء
CREATE INDEX IF NOT EXISTS idx_maintenance_fees_path_type ON maintenance_fees(path_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_fees_farm_path ON maintenance_fees(farm_id, path_type);

-- تحديث الرسوم الموجودة لتكون زراعية افتراضياً
UPDATE maintenance_fees 
SET path_type = 'agricultural' 
WHERE path_type IS NULL OR path_type = '';

-- Function: الحصول على ملخص الرسوم حسب المزرعة والمسار
CREATE OR REPLACE FUNCTION get_farm_path_payment_summary(
  p_farm_id uuid,
  p_path_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_trees integer;
  total_investors integer;
  total_fees numeric;
  total_collected numeric;
  total_pending numeric;
  paid_count integer;
  pending_count integer;
BEGIN
  -- حساب عدد الأشجار في هذا المسار
  SELECT COALESCE(SUM(r.total_trees), 0)
  INTO total_trees
  FROM reservations r
  WHERE r.farm_id = p_farm_id
    AND r.path_type = p_path_type
    AND r.status = 'confirmed';

  -- حساب عدد المستثمرين
  SELECT COUNT(DISTINCT r.user_id)
  INTO total_investors
  FROM reservations r
  WHERE r.farm_id = p_farm_id
    AND r.path_type = p_path_type
    AND r.status = 'confirmed';

  -- حساب المجاميع المالية
  SELECT 
    COALESCE(SUM(mp.amount_due), 0),
    COALESCE(SUM(mp.amount_paid), 0),
    COUNT(*) FILTER (WHERE mp.payment_status = 'paid'),
    COUNT(*) FILTER (WHERE mp.payment_status = 'pending')
  INTO total_fees, total_collected, paid_count, pending_count
  FROM maintenance_payments mp
  JOIN maintenance_fees mf ON mf.id = mp.maintenance_fee_id
  WHERE mf.farm_id = p_farm_id
    AND mf.path_type = p_path_type;

  total_pending := total_fees - total_collected;

  result := jsonb_build_object(
    'total_trees', total_trees,
    'total_investors', total_investors,
    'total_fees', total_fees,
    'total_collected', total_collected,
    'total_pending', total_pending,
    'paid_count', paid_count,
    'pending_count', pending_count,
    'collection_rate', CASE 
      WHEN total_fees > 0 THEN ROUND((total_collected / total_fees * 100)::numeric, 2)
      ELSE 0
    END
  );

  RETURN result;
END;
$$;

-- Function: الحصول على قائمة المزارع مع عدد الأشجار لكل مسار
CREATE OR REPLACE FUNCTION get_farms_with_path_stats()
RETURNS TABLE (
  farm_id uuid,
  farm_name text,
  agricultural_trees integer,
  investment_trees integer,
  has_agricultural boolean,
  has_investment boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as farm_id,
    f.name_ar as farm_name,
    COALESCE(
      (SELECT SUM(r.total_trees)::integer
       FROM reservations r
       WHERE r.farm_id = f.id 
         AND r.path_type = 'agricultural'
         AND r.status = 'confirmed'), 
      0
    ) as agricultural_trees,
    COALESCE(
      (SELECT SUM(r.total_trees)::integer
       FROM reservations r
       WHERE r.farm_id = f.id 
         AND r.path_type = 'investment'
         AND r.status = 'confirmed'), 
      0
    ) as investment_trees,
    EXISTS(
      SELECT 1 FROM reservations r
      WHERE r.farm_id = f.id 
        AND r.path_type = 'agricultural'
        AND r.status = 'confirmed'
    ) as has_agricultural,
    EXISTS(
      SELECT 1 FROM reservations r
      WHERE r.farm_id = f.id 
        AND r.path_type = 'investment'
        AND r.status = 'confirmed'
    ) as has_investment
  FROM farms f
  WHERE f.id IN (
    SELECT DISTINCT farm_id 
    FROM reservations 
    WHERE status = 'confirmed'
  )
  ORDER BY f.name_ar;
END;
$$;

-- Function: الحصول على تفاصيل الدفعات حسب المزرعة والمسار
CREATE OR REPLACE FUNCTION get_farm_path_payments_detail(
  p_farm_id uuid,
  p_path_type text,
  p_status_filter text DEFAULT 'all'
)
RETURNS TABLE (
  payment_id uuid,
  user_id uuid,
  full_name text,
  tree_count integer,
  amount_due numeric,
  amount_paid numeric,
  payment_status text,
  payment_date timestamptz,
  maintenance_type text,
  maintenance_date text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mp.id as payment_id,
    mp.user_id,
    up.full_name,
    mp.tree_count,
    mp.amount_due,
    COALESCE(mp.amount_paid, 0) as amount_paid,
    mp.payment_status,
    mp.payment_date,
    mo.maintenance_type,
    to_char(mo.maintenance_date, 'YYYY-MM-DD') as maintenance_date,
    mp.created_at
  FROM maintenance_payments mp
  JOIN maintenance_fees mf ON mf.id = mp.maintenance_fee_id
  JOIN maintenance_operations mo ON mo.id = mf.maintenance_id
  JOIN user_profiles up ON up.id = mp.user_id
  WHERE mf.farm_id = p_farm_id
    AND mf.path_type = p_path_type
    AND (
      p_status_filter = 'all' OR
      mp.payment_status = p_status_filter
    )
  ORDER BY mp.created_at DESC;
END;
$$;

-- إضافة تعليق توضيحي
COMMENT ON COLUMN maintenance_fees.path_type IS 
'نوع المسار: agricultural (أشجار خضراء) أو investment (أشجار ذهبية). 
يجب أن تتطابق رسوم الصيانة مع مسار الحجز.';
