-- التحقق من إصلاح path_type في قاعدة البيانات
-- Verify path_type Fix in Database

-- 1. عرض جميع العقود مع نوع المسار
SELECT 
  id,
  contract_name,
  path_type,
  CASE 
    WHEN path_type = 'investment' THEN '🌟 أشجاري الذهبية'
    WHEN path_type = 'agricultural' THEN '🌿 أشجاري الخضراء'
    ELSE '⚠️ غير محدد'
  END as display_type,
  total_trees,
  status,
  created_at
FROM reservations
WHERE status IN ('confirmed', 'completed')
ORDER BY created_at DESC;

-- 2. إحصائيات العقود حسب المسار
SELECT 
  path_type,
  CASE 
    WHEN path_type = 'investment' THEN '🌟 أشجاري الذهبية'
    WHEN path_type = 'agricultural' THEN '🌿 أشجاري الخضراء'
    ELSE '⚠️ غير محدد'
  END as display_type,
  COUNT(*) as total_contracts,
  SUM(total_trees) as total_trees
FROM reservations
WHERE status IN ('confirmed', 'completed')
GROUP BY path_type;

-- 3. التحقق من العقود الاستثمارية
SELECT 
  id,
  contract_name,
  path_type,
  total_trees,
  'هل path_type صحيح؟' as check_question,
  CASE 
    WHEN (contract_name LIKE '%استثمار%' OR contract_name LIKE 'Investment%') 
         AND path_type = 'investment' THEN '✅ صحيح'
    WHEN (contract_name LIKE '%استثمار%' OR contract_name LIKE 'Investment%') 
         AND path_type != 'investment' THEN '❌ خطأ - يجب أن يكون investment'
    ELSE '✅ صحيح'
  END as verification_result
FROM reservations
WHERE status IN ('confirmed', 'completed')
ORDER BY created_at DESC;

-- 4. إيجاد أي عقود بحاجة للإصلاح
SELECT 
  id,
  contract_name,
  path_type,
  '⚠️ يحتاج إصلاح!' as warning
FROM reservations
WHERE (contract_name LIKE '%استثمار%' OR contract_name LIKE 'Investment%')
  AND path_type != 'investment'
  AND status IN ('confirmed', 'completed');

-- 5. عرض توزيع العقود حسب اسم العقد
SELECT 
  contract_name,
  path_type,
  COUNT(*) as count,
  CASE 
    WHEN path_type = 'investment' THEN '🌟'
    WHEN path_type = 'agricultural' THEN '🌿'
    ELSE '⚠️'
  END as icon
FROM reservations
WHERE status IN ('confirmed', 'completed')
  AND contract_name IS NOT NULL
GROUP BY contract_name, path_type
ORDER BY count DESC;
