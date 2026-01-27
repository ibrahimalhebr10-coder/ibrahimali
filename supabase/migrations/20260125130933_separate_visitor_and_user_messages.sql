/*
  # فصل رسائل الزوار عن رسائل المستثمرين

  1. المشكلة
    - التداخل بين الرسائل العامة (للزوار) والرسائل الخاصة (للمستثمرين)
    - المستخدمون المسجلون يروا الرسائل العامة مع رسائلهم الخاصة
  
  2. الحل
    - حذف السياسة التي تسمح للمستخدمين المسجلين برؤية الرسائل العامة
    - توسيع سياسة الزوار لتشمل جميع أنواع الرسائل العامة (ليس فقط welcome)
  
  3. النتيجة النهائية
    - الزوار (غير مسجلين): يروا جميع الرسائل العامة فقط (user_id IS NULL)
    - المستثمرون المسجلون: يروا رسائلهم الخاصة فقط (user_id = auth.uid())
    - لا يوجد تداخل بين الرسائل
*/

-- حذف السياسة التي تسبب التداخل
DROP POLICY IF EXISTS "Authenticated users can view general messages" ON messages;

-- تحديث سياسة الزوار لتشمل جميع الرسائل العامة
DROP POLICY IF EXISTS "Anonymous users can view welcome messages" ON messages;

CREATE POLICY "Anonymous users can view all public messages"
  ON messages FOR SELECT
  TO anon
  USING (user_id IS NULL);