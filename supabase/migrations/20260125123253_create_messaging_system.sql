/*
  # نظام الرسائل الذكي

  1. جداول جديدة
    - `messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable) - null للرسائل العامة للزوار
      - `type` (text) - نوع الرسالة: welcome, admin, operational, farm_update, important
      - `priority` (text) - أولوية: high, medium, low
      - `title` (text) - عنوان الرسالة
      - `content` (text) - محتوى الرسالة
      - `is_read` (boolean) - هل تم قراءتها
      - `category` (text) - تصنيف: important, general
      - `related_farm_id` (uuid, nullable) - معرف المزرعة المرتبطة
      - `action_url` (text, nullable) - رابط إجراء اختياري
      - `created_at` (timestamptz)
      - `read_at` (timestamptz, nullable)
    
  2. الأمان
    - تفعيل RLS
    - سياسات الوصول للرسائل
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('welcome', 'admin', 'operational', 'farm_update', 'important')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  title text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('important', 'general')),
  related_farm_id uuid REFERENCES farms(id) ON DELETE SET NULL,
  action_url text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can view welcome messages"
  ON messages FOR SELECT
  TO anon
  USING (user_id IS NULL AND type = 'welcome');

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert messages"
  ON messages FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

INSERT INTO messages (user_id, type, priority, title, content, category) VALUES
(
  NULL,
  'welcome',
  'high',
  'مرحباً بك في منصة الاستثمار الزراعي',
  'نحن سعداء بزيارتك! اكتشف فرص استثمارية فريدة في الزراعة السعودية. امتلك شجرتك الخاصة واحصل على عوائد سنوية مجزية. سجل الآن لتبدأ رحلتك الاستثمارية معنا.',
  'important'
);
