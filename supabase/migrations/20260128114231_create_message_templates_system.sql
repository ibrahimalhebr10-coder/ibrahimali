/*
  # إنشاء نظام قوالب الرسائل

  1. جدول جديد
    - `message_templates` - لتخزين قوالب الرسائل
      - `id` (uuid, primary key)
      - `name` (text) - اسم القالب
      - `content` (text) - نص الرسالة
      - `variables` (text[]) - المتغيرات الديناميكية المتاحة
      - `category` (text) - تصنيف القالب
      - `is_system` (boolean) - هل هو قالب نظام أم مخصص
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. الأمان
    - تفعيل RLS على جدول القوالب
    - سياسات للمدير العام فقط
*/

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  variables text[] DEFAULT '{}',
  category text DEFAULT 'general',
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة - المدير العام فقط
CREATE POLICY "Super admin can view templates"
  ON message_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
    )
  );

-- سياسة الإنشاء - المدير العام فقط
CREATE POLICY "Super admin can create templates"
  ON message_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
    )
  );

-- سياسة التعديل - المدير العام فقط
CREATE POLICY "Super admin can update templates"
  ON message_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
    )
  );

-- سياسة الحذف - المدير العام فقط والقوالب غير النظامية
CREATE POLICY "Super admin can delete custom templates"
  ON message_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
    )
    AND is_system = false
  );

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);
CREATE INDEX IF NOT EXISTS idx_message_templates_is_system ON message_templates(is_system);