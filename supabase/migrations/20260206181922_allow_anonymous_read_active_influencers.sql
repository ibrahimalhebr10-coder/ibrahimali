/*
  # السماح للزوار المجهولين بقراءة بيانات المؤثرين النشطين

  **المشكلة**:
  - نظام المؤثرين يعمل فقط عندما يكون المدير مسجل دخول
  - عندما يخرج المدير، لا يستطيع أي مستخدم التحقق من كود المؤثر
  - السبب: RLS لا يسمح للزوار المجهولين (anon) بقراءة جدول influencer_partners

  **الحل**:
  - إضافة سياسة RLS للزوار المجهولين للقراءة فقط
  - السماح بقراءة الشركاء النشطين والمعتمدين فقط (status = 'active' AND is_active = true)
  - هذا يضمن أن التحقق من الكود يعمل لجميع الزوار

  **الأمان**:
  - الزوار يمكنهم فقط القراءة (SELECT)
  - لا يمكن INSERT/UPDATE/DELETE
  - قراءة الشركاء النشطين فقط
*/

-- إضافة سياسة للزوار المجهولين للقراءة فقط من الشركاء النشطين
CREATE POLICY "anonymous_can_verify_active_partners"
  ON influencer_partners
  FOR SELECT
  TO anon
  USING (
    is_active = true
    AND status = 'active'
  );

COMMENT ON POLICY "anonymous_can_verify_active_partners" ON influencer_partners
  IS 'يسمح للزوار المجهولين بقراءة الشركاء النشطين فقط للتحقق من صحة كود المؤثر';