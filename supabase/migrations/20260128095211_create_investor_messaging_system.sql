/*
  # نظام مراسلة المستثمرين

  ## نظرة عامة
  هذا النظام يسمح لمديري المزارع بإرسال تحديثات دورية للمستثمرين
  المرتبطين بمزارعهم بطريقة منظمة ومركزية.

  ## 1. الجداول الجديدة

  ### جدول `investor_messages`
  - `id` (uuid, primary key) - معرف الرسالة
  - `farm_id` (uuid) - معرف المزرعة
  - `sender_id` (uuid) - معرف مدير المزرعة المُرسِل
  - `title` (text) - عنوان الرسالة
  - `content` (text) - محتوى الرسالة
  - `summary_data` (jsonb) - ملخص البيانات من محصولي (اختياري)
  - `image_urls` (text[]) - روابط الصور المرفقة
  - `sent_at` (timestamptz) - وقت الإرسال
  - `recipients_count` (integer) - عدد المستلمين
  - `read_count` (integer) - عدد من قرأ الرسالة
  - `created_at` (timestamptz) - تاريخ الإنشاء
  - `updated_at` (timestamptz) - تاريخ آخر تحديث

  ### جدول `investor_message_recipients`
  - `id` (uuid, primary key) - معرف السجل
  - `message_id` (uuid) - معرف الرسالة
  - `investor_id` (uuid) - معرف المستثمر (user_id)
  - `reservation_id` (uuid) - معرف الحجز
  - `is_read` (boolean) - هل قرأ الرسالة
  - `read_at` (timestamptz) - وقت القراءة
  - `created_at` (timestamptz) - تاريخ الإرسال

  ## 2. الأمان (RLS)
  - مديرو المزارع يرون رسائل مزارعهم فقط
  - المستثمرون يرون الرسائل المرسلة لهم فقط
  - Super Admin يرى كل شيء

  ## 3. الفهارس
  - فهرس على `farm_id` للبحث السريع
  - فهرس على `sender_id` لمعرفة رسائل كل مدير
  - فهرس على `investor_id` لجلب رسائل كل مستثمر
*/

-- جدول الرسائل الرئيسي
CREATE TABLE IF NOT EXISTS investor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  summary_data jsonb DEFAULT '{}'::jsonb,
  image_urls text[] DEFAULT ARRAY[]::text[],
  sent_at timestamptz DEFAULT now(),
  recipients_count integer DEFAULT 0,
  read_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول المستلمين
CREATE TABLE IF NOT EXISTS investor_message_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES investor_messages(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_investor_messages_farm_id 
  ON investor_messages(farm_id);

CREATE INDEX IF NOT EXISTS idx_investor_messages_sender_id 
  ON investor_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_investor_messages_sent_at 
  ON investor_messages(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_investor_message_recipients_message_id 
  ON investor_message_recipients(message_id);

CREATE INDEX IF NOT EXISTS idx_investor_message_recipients_investor_id 
  ON investor_message_recipients(investor_id);

CREATE INDEX IF NOT EXISTS idx_investor_message_recipients_is_read 
  ON investor_message_recipients(is_read, investor_id);

-- Trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_investor_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER investor_messages_updated_at
  BEFORE UPDATE ON investor_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_investor_messages_updated_at();

-- Trigger لتحديث عدد القراءات تلقائياً
CREATE OR REPLACE FUNCTION update_message_read_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    UPDATE investor_messages
    SET read_count = read_count + 1
    WHERE id = NEW.message_id;
  END IF;
  
  IF NEW.is_read = true AND NEW.read_at IS NULL THEN
    NEW.read_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_read_count_trigger
  BEFORE UPDATE ON investor_message_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_message_read_count();

-- تفعيل RLS
ALTER TABLE investor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_message_recipients ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول investor_messages

-- 1. Super Admin يرى جميع الرسائل
CREATE POLICY "Super admins can view all investor messages"
  ON investor_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles ar ON a.role_id = ar.id
      WHERE a.user_id = auth.uid()
      AND ar.role_key = 'super_admin'
      AND a.is_active = true
    )
  );

-- 2. مديرو المزارع يرون رسائل مزارعهم فقط
CREATE POLICY "Farm managers can view their farm messages"
  ON investor_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_farm_assignments afa ON a.id = afa.admin_id
      WHERE a.user_id = auth.uid()
      AND afa.farm_id = investor_messages.farm_id
      AND afa.is_active = true
      AND a.is_active = true
    )
  );

-- 3. مديرو المزارع يمكنهم إنشاء رسائل لمزارعهم
CREATE POLICY "Farm managers can create messages for their farms"
  ON investor_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_farm_assignments afa ON a.id = afa.admin_id
      WHERE a.user_id = auth.uid()
      AND a.id = sender_id
      AND afa.farm_id = farm_id
      AND afa.is_active = true
      AND a.is_active = true
    )
  );

-- 4. Super Admin يمكنه إنشاء رسائل لأي مزرعة
CREATE POLICY "Super admins can create messages for any farm"
  ON investor_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles ar ON a.role_id = ar.id
      WHERE a.user_id = auth.uid()
      AND ar.role_key = 'super_admin'
      AND a.is_active = true
    )
  );

-- سياسات RLS لجدول investor_message_recipients

-- 1. المستثمرون يرون الرسائل المرسلة لهم فقط
CREATE POLICY "Investors can view their messages"
  ON investor_message_recipients FOR SELECT
  TO authenticated
  USING (investor_id = auth.uid());

-- 2. مديرو المزارع يرون مستلمي رسائل مزارعهم
CREATE POLICY "Farm managers can view recipients of their farm messages"
  ON investor_message_recipients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investor_messages im
      JOIN admins a ON im.sender_id = a.id
      JOIN admin_farm_assignments afa ON a.id = afa.admin_id
      WHERE a.user_id = auth.uid()
      AND im.id = message_id
      AND afa.farm_id = im.farm_id
      AND afa.is_active = true
      AND a.is_active = true
    )
  );

-- 3. Super Admin يرى جميع المستلمين
CREATE POLICY "Super admins can view all message recipients"
  ON investor_message_recipients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles ar ON a.role_id = ar.id
      WHERE a.user_id = auth.uid()
      AND ar.role_key = 'super_admin'
      AND a.is_active = true
    )
  );

-- 4. مديرو المزارع يمكنهم إضافة مستلمين لرسائلهم
CREATE POLICY "Farm managers can add recipients to their messages"
  ON investor_message_recipients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM investor_messages im
      JOIN admins a ON im.sender_id = a.id
      WHERE a.user_id = auth.uid()
      AND im.id = message_id
      AND a.is_active = true
    )
  );

-- 5. المستثمرون يمكنهم تحديث حالة القراءة فقط
CREATE POLICY "Investors can mark their messages as read"
  ON investor_message_recipients FOR UPDATE
  TO authenticated
  USING (investor_id = auth.uid())
  WITH CHECK (investor_id = auth.uid());

-- 6. Super Admin يمكنه تحديث أي سجل
CREATE POLICY "Super admins can update any recipient record"
  ON investor_message_recipients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles ar ON a.role_id = ar.id
      WHERE a.user_id = auth.uid()
      AND ar.role_key = 'super_admin'
      AND a.is_active = true
    )
  );
