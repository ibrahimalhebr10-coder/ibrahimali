/*
  # حماية العمليات المالية + Audit Log (أولوية عالية - الخيار A)

  ## القرار
  ✅ منع التعديل والحذف نهائيًا
  ✅ إضافة Audit Log لتسجيل أي محاولة
  ✅ التصحيحات عبر عمليات عكسية فقط
  ❌ لا تعديل مباشر
  ❌ لا حذف تحت أي صلاحية

  ## الأسباب
  - حماية وثقة كاملة
  - منع أي عبث أو خطأ غير قابل للتتبع
  - الحفاظ على مصداقية السجلات المالية
  - أبسط وأأمن على المدى الطويل

  ## التنفيذ
  1. إنشاء جدول financial_audit_log
  2. إزالة policies UPDATE و DELETE
  3. إضافة trigger لتسجيل محاولات التعديل/الحذف
  4. استثناء: تحويلات المحفظة محمية أصلاً (بدون UPDATE/DELETE policies)

  ## الاستثناءات
  - تحويلات المحفظة: محمية بالفعل (immutable)
  - العمليات المالية العادية: ممنوع التعديل/الحذف الآن
*/

-- إنشاء جدول Audit Log
CREATE TABLE IF NOT EXISTS financial_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('UPDATE_ATTEMPT', 'DELETE_ATTEMPT')),
  record_id uuid NOT NULL,
  attempted_by uuid REFERENCES auth.users(id),
  attempted_at timestamptz DEFAULT now(),
  old_values jsonb,
  attempted_new_values jsonb,
  reason text,
  ip_address text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_table ON financial_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_record ON financial_audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_user ON financial_audit_log(attempted_by);
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_date ON financial_audit_log(attempted_at);

-- Enable RLS
ALTER TABLE financial_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view audit log"
  ON financial_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- إزالة policies التعديل والحذف من farm_financial_transactions
DROP POLICY IF EXISTS "Admins can update financial transactions" ON farm_financial_transactions;
DROP POLICY IF EXISTS "Admins can delete financial transactions" ON farm_financial_transactions;

-- إنشاء trigger لتسجيل محاولات التعديل
CREATE OR REPLACE FUNCTION log_financial_transaction_modification_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- تسجيل محاولة التعديل في Audit Log
  INSERT INTO financial_audit_log (
    table_name,
    operation,
    record_id,
    attempted_by,
    old_values,
    attempted_new_values,
    reason
  ) VALUES (
    TG_TABLE_NAME,
    CASE TG_OP
      WHEN 'UPDATE' THEN 'UPDATE_ATTEMPT'
      WHEN 'DELETE' THEN 'DELETE_ATTEMPT'
    END,
    OLD.id,
    auth.uid(),
    row_to_json(OLD)::jsonb,
    CASE TG_OP
      WHEN 'UPDATE' THEN row_to_json(NEW)::jsonb
      ELSE NULL
    END,
    'محاولة تعديل عملية مالية - ممنوع حسب السياسة'
  );

  -- منع العملية
  RAISE EXCEPTION 'التعديل والحذف ممنوع على العمليات المالية. استخدم عملية عكسية للتصحيح.';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تطبيق Trigger على UPDATE و DELETE
DROP TRIGGER IF EXISTS prevent_financial_transaction_update ON farm_financial_transactions;
DROP TRIGGER IF EXISTS prevent_financial_transaction_delete ON farm_financial_transactions;

CREATE TRIGGER prevent_financial_transaction_update
  BEFORE UPDATE ON farm_financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_financial_transaction_modification_attempt();

CREATE TRIGGER prevent_financial_transaction_delete
  BEFORE DELETE ON farm_financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_financial_transaction_modification_attempt();

-- دالة مساعدة: إنشاء عملية عكسية
CREATE OR REPLACE FUNCTION create_reversal_transaction(
  p_original_transaction_id uuid,
  p_reason text
)
RETURNS jsonb AS $$
DECLARE
  v_original record;
  v_reversal_id uuid;
BEGIN
  -- الحصول على العملية الأصلية
  SELECT * INTO v_original
  FROM farm_financial_transactions
  WHERE id = p_original_transaction_id;

  IF v_original.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'العملية الأصلية غير موجودة'
    );
  END IF;

  -- إنشاء عملية عكسية
  INSERT INTO farm_financial_transactions (
    farm_id,
    path_type,
    transaction_type,
    amount,
    description,
    transaction_date,
    created_by
  ) VALUES (
    v_original.farm_id,
    v_original.path_type,
    CASE v_original.transaction_type
      WHEN 'income' THEN 'expense'
      WHEN 'expense' THEN 'income'
    END,
    v_original.amount,
    'عملية عكسية: ' || v_original.description || ' - السبب: ' || p_reason,
    now(),
    auth.uid()
  ) RETURNING id INTO v_reversal_id;

  RETURN jsonb_build_object(
    'success', true,
    'reversal_id', v_reversal_id,
    'original_id', p_original_transaction_id,
    'message', 'تم إنشاء عملية عكسية بنجاح'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للحصول على Audit Log
CREATE OR REPLACE FUNCTION get_financial_audit_log(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  table_name text,
  operation text,
  record_id uuid,
  attempted_by uuid,
  admin_name text,
  attempted_at timestamptz,
  old_values jsonb,
  attempted_new_values jsonb,
  reason text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fal.id,
    fal.table_name,
    fal.operation,
    fal.record_id,
    fal.attempted_by,
    up.full_name as admin_name,
    fal.attempted_at,
    fal.old_values,
    fal.attempted_new_values,
    fal.reason
  FROM financial_audit_log fal
  LEFT JOIN user_profiles up ON up.user_id = fal.attempted_by
  ORDER BY fal.attempted_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إضافة تعليقات توضيحية
COMMENT ON TABLE financial_audit_log IS
'سجل تدقيق لجميع محاولات تعديل أو حذف العمليات المالية.
يُستخدم للأمان والمراجعة والتتبع.';

COMMENT ON FUNCTION create_reversal_transaction IS
'إنشاء عملية عكسية لتصحيح عملية مالية خاطئة.
هذه هي الطريقة الوحيدة المسموحة لتصحيح الأخطاء.';

COMMENT ON TRIGGER prevent_financial_transaction_update ON farm_financial_transactions IS
'يمنع أي محاولة تعديل على العمليات المالية ويسجلها في Audit Log.';

COMMENT ON TRIGGER prevent_financial_transaction_delete ON farm_financial_transactions IS
'يمنع أي محاولة حذف على العمليات المالية ويسجلها في Audit Log.';
