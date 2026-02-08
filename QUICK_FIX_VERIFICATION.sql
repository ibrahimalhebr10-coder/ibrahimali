-- ⚡ تحقق سريع من إصلاح أخطاء Console
-- نفّذ هذا الملف في Supabase SQL Editor للتحقق من أن كل شيء يعمل

-- ==================================================
-- 1️⃣ تحقق من وجود الجداول والـ Functions
-- ==================================================
SELECT
  'maintenance_payments table' as item,
  CASE WHEN EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'maintenance_payments'
  ) THEN '✅ موجود' ELSE '❌ غير موجود' END as status

UNION ALL

SELECT
  'get_client_maintenance_records function' as item,
  CASE WHEN EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_client_maintenance_records'
  ) THEN '✅ موجود' ELSE '❌ غير موجود' END as status

UNION ALL

SELECT
  'update_lead_score function' as item,
  CASE WHEN EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'update_lead_score'
  ) THEN '✅ موجود' ELSE '❌ غير موجود' END as status;

-- النتيجة المتوقعة: جميعها ✅ موجود


-- ==================================================
-- 2️⃣ تحقق من RLS Policies على maintenance_payments
-- ==================================================
SELECT
  policyname,
  cmd::text as command,
  roles::text
FROM pg_policies
WHERE tablename = 'maintenance_payments'
ORDER BY policyname;

-- النتيجة المتوقعة: 4 policies على الأقل


-- ==================================================
-- 3️⃣ تحقق من Indexes على maintenance_payments
-- ==================================================
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'maintenance_payments'
ORDER BY indexname;

-- النتيجة المتوقعة: 5 indexes على الأقل


-- ==================================================
-- 4️⃣ تحقق من الـ Trigger على lead_activities
-- ==================================================
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'lead_activities'
  AND trigger_name = 'trigger_update_lead_score';

-- النتيجة المتوقعة: 1 trigger


-- ==================================================
-- 5️⃣ اختبار الـ Function (إذا كان لديك user_id)
-- ==================================================
-- استبدل 'YOUR_USER_ID' بمعرف مستخدم حقيقي
/*
SELECT * FROM get_client_maintenance_records('YOUR_USER_ID');
*/

-- يجب أن يعمل بدون أخطاء (حتى لو كانت النتيجة فارغة)


-- ==================================================
-- 6️⃣ تحقق من بنية جدول maintenance_payments
-- ==================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'maintenance_payments'
ORDER BY ordinal_position;

-- النتيجة المتوقعة: 10 أعمدة


-- ==================================================
-- 7️⃣ تحقق من Foreign Keys
-- ==================================================
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'maintenance_payments';

-- النتيجة المتوقعة: 3 foreign keys (user_id, maintenance_fee_id, farm_id)


-- ==================================================
-- 8️⃣ اختبار إدخال بيانات تجريبية (اختياري)
-- ==================================================
-- لا تنفّذ هذا إلا إذا كنت متأكداً!
/*
INSERT INTO maintenance_payments (
  user_id,
  maintenance_fee_id,
  farm_id,
  tree_count,
  amount_due
) VALUES (
  'test-user-id',
  'test-fee-id',
  'test-farm-id',
  10,
  100.00
);
*/


-- ==================================================
-- ✅ Checklist النهائي
-- ==================================================
-- [ ] maintenance_payments table موجود
-- [ ] get_client_maintenance_records function موجودة
-- [ ] update_lead_score function موجودة
-- [ ] 4+ RLS policies على maintenance_payments
-- [ ] 5+ indexes على maintenance_payments
-- [ ] trigger_update_lead_score موجود على lead_activities
-- [ ] 10 أعمدة في maintenance_payments
-- [ ] 3 foreign keys في maintenance_payments

-- إذا كل ✅ → الإصلاح تم بنجاح!


-- ==================================================
-- 📊 معلومات إضافية
-- ==================================================

-- عدد السجلات في maintenance_payments (يجب أن يكون 0 في البداية)
SELECT COUNT(*) as total_payments FROM maintenance_payments;

-- عدد السجلات في lead_scores
SELECT COUNT(*) as total_lead_scores FROM lead_scores;

-- عدد الـ activities المسجلة
SELECT COUNT(*) as total_activities FROM lead_activities;

-- آخر 5 migrations تم تطبيقها
SELECT
  filename,
  executed_at
FROM _sqlx_migrations
ORDER BY executed_at DESC
LIMIT 5;
