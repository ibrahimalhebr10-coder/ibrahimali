/*
  # إصلاح سياسات RLS للرسائل

  1. المشكلة
    - المستخدمون المسجلون (authenticated) لا يستطيعون رؤية الرسائل العامة (user_id IS NULL)
    - السياسة الحالية تسمح فقط برؤية رسائلهم الخاصة
  
  2. الحل
    - إضافة سياسة جديدة تسمح للمستخدمين المسجلين برؤية الرسائل العامة
    - الرسائل العامة هي التي user_id = NULL
  
  3. الملاحظات
    - الآن المستخدمون المسجلون يمكنهم رؤية:
      * رسائلهم الخاصة (user_id = auth.uid())
      * الرسائل العامة (user_id IS NULL)
*/

CREATE POLICY "Authenticated users can view general messages"
  ON messages FOR SELECT
  TO authenticated
  USING (user_id IS NULL);