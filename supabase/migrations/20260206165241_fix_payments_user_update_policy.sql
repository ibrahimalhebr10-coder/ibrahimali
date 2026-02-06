/*
  # إصلاح صلاحيات تحديث المدفوعات
  
  ## المشكلة
  - المستخدم لا يستطيع تحديث مدفوعاته الخاصة
  - Policy موجودة للأدمن فقط
  
  ## الحل
  - إضافة policy للمستخدم ليستطيع تحديث مدفوعاته
*/

-- إضافة policy للمستخدم ليحدث مدفوعاته
CREATE POLICY "Users can update own payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
