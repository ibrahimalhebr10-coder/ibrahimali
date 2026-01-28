/*
  # إنشاء نظام سجل الرسائل

  1. جدول جديد
    - `messages_log` - لتوثيق جميع الرسائل المرسلة
      - `id` (uuid, primary key)
      - `investor_id` (uuid) - المستثمر المستلم
      - `investor_name` (text) - اسم المستثمر
      - `message_type` (text) - نوع الرسالة (reservation, payment, general, notification)
      - `template_id` (uuid) - القالب المستخدم
      - `template_name` (text) - اسم القالب
      - `channel` (text) - القناة (website, whatsapp, sms, email)
      - `subject` (text) - عنوان الرسالة
      - `content` (text) - محتوى الرسالة المرسلة
      - `sent_by` (uuid) - المسؤول الذي أرسل الرسالة
      - `sent_by_name` (text) - اسم المسؤول
      - `farm_id` (uuid) - المزرعة المرتبطة (اختياري)
      - `farm_name` (text) - اسم المزرعة (اختياري)
      - `reservation_id` (uuid) - الحجز المرتبط (اختياري)
      - `payment_id` (uuid) - الدفعة المرتبطة (اختياري)
      - `status` (text) - حالة الإرسال (sent, failed, pending)
      - `metadata` (jsonb) - بيانات إضافية
      - `created_at` (timestamptz)

  2. الأمان
    - تفعيل RLS على الجدول
    - سياسات للعرض فقط (للمدير العام والمشرفين)
*/

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS messages_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid,
  investor_name text NOT NULL,
  message_type text NOT NULL DEFAULT 'general',
  template_id uuid,
  template_name text,
  channel text NOT NULL DEFAULT 'website',
  subject text,
  content text NOT NULL,
  sent_by uuid,
  sent_by_name text,
  farm_id uuid,
  farm_name text,
  reservation_id uuid,
  payment_id uuid,
  status text DEFAULT 'sent',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE messages_log ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة - المدير العام والمشرفين
CREATE POLICY "Admins can view messages log"
  ON messages_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role IN ('super_admin', 'supervisor')
    )
  );

-- سياسة الإدراج - المدير العام والأدوار المصرح لها
CREATE POLICY "Authorized admins can log messages"
  ON messages_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role IN ('super_admin', 'farm_manager', 'finance_officer', 'supervisor')
    )
  );

-- فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_messages_log_investor_id ON messages_log(investor_id);
CREATE INDEX IF NOT EXISTS idx_messages_log_message_type ON messages_log(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_log_channel ON messages_log(channel);
CREATE INDEX IF NOT EXISTS idx_messages_log_sent_by ON messages_log(sent_by);
CREATE INDEX IF NOT EXISTS idx_messages_log_farm_id ON messages_log(farm_id);
CREATE INDEX IF NOT EXISTS idx_messages_log_created_at ON messages_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_log_status ON messages_log(status);