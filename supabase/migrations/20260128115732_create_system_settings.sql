/*
  # إنشاء جدول إعدادات النظام

  1. جدول جديد
    - `system_settings`
      - `id` (uuid، primary key)
      - `key` (text، فريد) - مفتاح الإعداد
      - `value` (text) - قيمة الإعداد
      - `description` (text) - وصف الإعداد
      - `category` (text) - تصنيف الإعداد
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. الأمن
    - تفعيل RLS على الجدول
    - سياسة للمديرين للقراءة والتعديل
    - سياسة للمستخدمين للقراءة فقط (لبعض الإعدادات العامة)

  3. بيانات أولية
    - رقم واتساب المدير الافتراضي
*/

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- سياسة للمديرين: قراءة وتعديل جميع الإعدادات
CREATE POLICY "Admins can manage all settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- سياسة للمستخدمين: قراءة الإعدادات العامة فقط
CREATE POLICY "Users can read public settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (category = 'public');

-- إضافة رقم واتساب المدير الافتراضي
INSERT INTO system_settings (key, value, description, category)
VALUES
  ('whatsapp_admin_number', '+966500000000', 'رقم واتساب المدير للتواصل المباشر مع المستثمرين', 'contact'),
  ('whatsapp_enabled', 'true', 'تفعيل/تعطيل زر واتساب', 'contact'),
  ('support_email', 'support@example.com', 'البريد الإلكتروني للدعم', 'contact')
ON CONFLICT (key) DO NOTHING;

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
