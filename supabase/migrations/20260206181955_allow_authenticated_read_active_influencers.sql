/*
  # السماح للمستخدمين المسجلين بقراءة بيانات المؤثرين النشطين

  **المشكلة المتبقية**:
  - أضفنا سياسة للزوار المجهولين (anon)
  - لكن المستخدمين المسجلين العاديين (authenticated) لا يمكنهم قراءة الشركاء
  - السياسات الحالية تسمح فقط للمديرين أو الشركاء أنفسهم
  
  **الحل**:
  - إضافة سياسة للمستخدمين المسجلين (authenticated) لقراءة الشركاء النشطين
  - هذا يضمن أن جميع المستخدمين (مجهولين ومسجلين) يمكنهم التحقق من كود المؤثر

  **الأمان**:
  - القراءة فقط (SELECT)
  - الشركاء النشطين فقط (status = 'active' AND is_active = true)
*/

-- إضافة سياسة للمستخدمين المسجلين للقراءة فقط من الشركاء النشطين
CREATE POLICY "authenticated_can_verify_active_partners"
  ON influencer_partners
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND status = 'active'
  );

COMMENT ON POLICY "authenticated_can_verify_active_partners" ON influencer_partners
  IS 'يسمح للمستخدمين المسجلين بقراءة الشركاء النشطين للتحقق من صحة كود المؤثر';