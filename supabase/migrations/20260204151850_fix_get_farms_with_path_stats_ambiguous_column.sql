/*
  # إصلاح دالة get_farms_with_path_stats - حل مشكلة الغموض في أسماء الأعمدة

  ## المشكلة
  
  كان هناك غموض في الإشارة إلى عمود `farm_id` في الاستعلام الفرعي.
  الخطأ: "column reference 'farm_id' is ambiguous"

  ## الحل
  
  إعادة كتابة الدالة مع تحديد واضح لجميع الأعمدة باستخدام اسم الجدول أو الـ alias
*/

-- حذف الدالة القديمة
DROP FUNCTION IF EXISTS get_farms_with_path_stats();

-- إنشاء الدالة الصحيحة
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
  WHERE EXISTS (
    SELECT 1 
    FROM reservations res
    WHERE res.farm_id = f.id 
      AND res.status = 'confirmed'
  )
  ORDER BY f.name_ar;
END;
$$;
