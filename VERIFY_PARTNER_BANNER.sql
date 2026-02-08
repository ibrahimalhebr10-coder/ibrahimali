-- ✅ دليل التحقق السريع من شريط شركاء النجاح
-- نفّذ هذه الاستعلامات في Supabase SQL Editor للتحقق من أن كل شيء يعمل

-- ==================================================
-- 1️⃣ تحقق من قيمة التفعيل (يجب أن تكون 'true')
-- ==================================================
SELECT
  key,
  value,
  category,
  description
FROM system_settings
WHERE key = 'partner_share_message_enabled';

-- النتيجة المتوقعة:
-- key: partner_share_message_enabled
-- value: true  ← يجب أن تكون 'true'
-- category: marketing
-- ✅ إذا كانت 'true' → جيد!
-- ❌ إذا كانت 'false' → شغّل الأمر التالي:
-- UPDATE system_settings SET value = 'true' WHERE key = 'partner_share_message_enabled';


-- ==================================================
-- 2️⃣ تحقق من جميع إعدادات الشريط (يجب أن تكون 3)
-- ==================================================
SELECT
  key,
  value,
  category
FROM system_settings
WHERE key LIKE 'partner_share%'
ORDER BY key;

-- النتيجة المتوقعة (3 صفوف):
-- 1. partner_share_message_enabled = 'true' (category: marketing)
-- 2. partner_share_message_template = '🌿 استثمر...' (category: marketing)
-- 3. partner_share_website_url = 'https://ashjari.com' (category: marketing)
-- ✅ 3 صفوف مع category = 'marketing' → جيد!


-- ==================================================
-- 3️⃣ تحقق من RLS Policies (يجب أن تكون 3)
-- ==================================================
SELECT
  policyname,
  roles::text,
  cmd::text,
  qual::text as "using_clause"
FROM pg_policies
WHERE tablename = 'system_settings'
ORDER BY policyname;

-- النتيجة المتوقعة (3 policies):
-- 1. Admins can manage all settings (roles: {authenticated}, cmd: ALL)
-- 2. Anyone can read public and marketing settings (roles: {public}, cmd: SELECT) ← هذه مهمة!
-- 3. Users can read public settings (roles: {authenticated}, cmd: SELECT)
-- ✅ 3 policies موجودة بما فيهم "Anyone can read public and marketing settings" → جيد!


-- ==================================================
-- 4️⃣ اختبر قراءة الإعدادات كمستخدم anonymous
-- ==================================================
-- هذا الاستعلام يجب أن ينجح حتى بدون تسجيل دخول
SELECT key, value
FROM system_settings
WHERE category IN ('public', 'marketing')
  AND key = 'partner_share_message_enabled';

-- النتيجة المتوقعة:
-- key: partner_share_message_enabled
-- value: true
-- ✅ إذا حصلت على النتيجة → RLS policy تعمل بشكل صحيح!
-- ❌ إذا لم تحصل على نتيجة → هناك مشكلة في RLS policy


-- ==================================================
-- 5️⃣ عرض نص الشريط الكامل (للمراجعة)
-- ==================================================
SELECT
  value as "نص_الشريط"
FROM system_settings
WHERE key = 'partner_share_message_template';

-- يجب أن ترى النص الكامل للشريط مع الإيموجي والتنسيق


-- ==================================================
-- 🛠️ أوامر الإصلاح (استخدمها إذا لزم الأمر)
-- ==================================================

-- ✅ تفعيل الشريط
-- UPDATE system_settings SET value = 'true' WHERE key = 'partner_share_message_enabled';

-- ❌ إيقاف الشريط
-- UPDATE system_settings SET value = 'false' WHERE key = 'partner_share_message_enabled';

-- 📝 تغيير نص الشريط
-- UPDATE system_settings
-- SET value = 'النص الجديد هنا'
-- WHERE key = 'partner_share_message_template';

-- 🔗 تغيير رابط الموقع
-- UPDATE system_settings
-- SET value = 'https://example.com'
-- WHERE key = 'partner_share_website_url';


-- ==================================================
-- 🚨 إصلاح RLS Policy (إذا كانت غير موجودة)
-- ==================================================

-- تحقق أولاً من وجود الـ policy:
-- SELECT COUNT(*) FROM pg_policies
-- WHERE tablename = 'system_settings'
-- AND policyname = 'Anyone can read public and marketing settings';

-- إذا كانت النتيجة 0، أنشئ الـ policy:
/*
CREATE POLICY "Anyone can read public and marketing settings"
  ON system_settings
  FOR SELECT
  TO public
  USING (category IN ('public', 'marketing'));
*/


-- ==================================================
-- ✅ Checklist التحقق النهائي
-- ==================================================

-- [ ] partner_share_message_enabled = 'true'
-- [ ] 3 إعدادات موجودة (enabled, template, url)
-- [ ] كل الإعدادات category = 'marketing'
-- [ ] 3 RLS policies موجودة
-- [ ] Policy "Anyone can read public and marketing settings" موجودة
-- [ ] يمكن قراءة الإعدادات بدون تسجيل دخول

-- إذا كل ✅ → الشريط يجب أن يعمل الآن!

-- ==================================================
-- 📊 معلومات إضافية
-- ==================================================

-- عرض جميع الإعدادات مع تواريخ التحديث
SELECT
  key,
  value,
  category,
  updated_at
FROM system_settings
WHERE category = 'marketing'
ORDER BY updated_at DESC;

-- عرض إحصائيات الإعدادات حسب الفئة
SELECT
  category,
  COUNT(*) as total_settings
FROM system_settings
GROUP BY category
ORDER BY total_settings DESC;
