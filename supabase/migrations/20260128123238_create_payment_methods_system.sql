/*
  # نظام وسائل السداد - Payment Methods System

  ## النظرة العامة
  هذا النظام يدير وسائل السداد المتاحة في المنصة (مدى، تابي، تمارا، تحويل بنكي)
  مع القدرة على التحكم في تفعيلها وإيقافها دون الحاجة لتعديل الكود.

  ## الجداول المنشأة

  ### 1. payment_methods
  جدول رئيسي يحتوي على جميع وسائل السداد المتاحة

  الحقول:
  - `id` - معرف فريد لوسيلة السداد
  - `method_type` - نوع الوسيلة (mada, tabby, tamara, bank_transfer)
  - `name_ar` - الاسم بالعربية
  - `name_en` - الاسم بالإنجليزية
  - `description_ar` - الوصف بالعربية (يظهر للمستثمر)
  - `description_en` - الوصف بالإنجليزية
  - `is_active` - حالة التفعيل (true/false)
  - `priority` - ترتيب الظهور (1 = أول، 2 = ثاني، إلخ)
  - `config` - إعدادات إضافية (JSON)
  - `icon` - اسم الأيقونة
  - `features` - مميزات الوسيلة (JSON array)
  - `requirements` - متطلبات التفعيل (JSON array)
  - `created_at` - تاريخ الإنشاء
  - `updated_at` - تاريخ آخر تحديث

  ## الأمان
  - Row Level Security (RLS) مفعل
  - فقط المدير العام يمكنه تعديل وسائل السداد
  - الجميع يمكنهم رؤية الوسائل المفعلة فقط

  ## الملاحظات
  - لا يوجد ربط فعلي ببوابات الدفع في هذه المرحلة
  - التركيز على البنية التحتية والإعدادات فقط
  - جاهز للربط المستقبلي مع البوابات
*/

-- إنشاء جدول وسائل السداد
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_type TEXT NOT NULL UNIQUE CHECK (method_type IN ('mada', 'tabby', 'tamara', 'bank_transfer')),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  description_en TEXT,
  is_active BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 1,
  config JSONB DEFAULT '{}'::jsonb,
  icon TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- إنشاء index على الحقول المستخدمة في الاستعلامات
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_priority ON payment_methods(priority);
CREATE INDEX IF NOT EXISTS idx_payment_methods_method_type ON payment_methods(method_type);

-- تفعيل RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy: فقط المدير العام يمكنه إدارة وسائل السداد
CREATE POLICY "Super admin can manage payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
      AND admins.is_active = true
    )
  );

-- Policy: المديرون يمكنهم رؤية الوسائل المفعلة
CREATE POLICY "Admins can view active payment methods"
  ON payment_methods
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Policy: المستثمرون يمكنهم رؤية الوسائل المفعلة فقط
CREATE POLICY "Investors can view active payment methods"
  ON payment_methods
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Function: تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: تحديث updated_at عند التعديل
DROP TRIGGER IF EXISTS payment_methods_updated_at ON payment_methods;
CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_methods_updated_at();

-- إضافة تعليقات توضيحية
COMMENT ON TABLE payment_methods IS 'جدول وسائل السداد المتاحة في المنصة';
COMMENT ON COLUMN payment_methods.method_type IS 'نوع وسيلة السداد: mada, tabby, tamara, bank_transfer';
COMMENT ON COLUMN payment_methods.is_active IS 'حالة التفعيل - لا تظهر للمستثمر إلا إذا كانت مفعلة';
COMMENT ON COLUMN payment_methods.priority IS 'ترتيب الظهور - الأصغر يظهر أولاً';
COMMENT ON COLUMN payment_methods.config IS 'إعدادات إضافية خاصة بكل وسيلة (JSON)';
COMMENT ON COLUMN payment_methods.features IS 'قائمة مميزات الوسيلة للعرض في الواجهة';
COMMENT ON COLUMN payment_methods.requirements IS 'متطلبات تفعيل الوسيلة';
