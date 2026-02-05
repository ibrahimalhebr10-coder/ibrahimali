/*
  # نظام التسويق بالمؤثرين - المرحلة الأولى: البنية الأساسية

  ## الهدف
  تجهيز البنية التحتية لنظام "شركاء المسيرة" (المؤثرين) بدون أي تأثير على الواجهة الحالية.

  ## الجداول الجديدة

  ### 1. `influencer_partners`
  جدول شركاء المسيرة (المؤثرين)
  - `id` - معرف فريد
  - `name` - اسم المؤثر (فريد، حساس لحالة الأحرف)
  - `display_name` - الاسم للعرض (اختياري)
  - `is_active` - الحالة (مفعل / موقوف)
  - `total_bookings` - إجمالي الحجوزات (للإحصاء فقط)
  - `total_trees_booked` - إجمالي الأشجار المحجوزة
  - `total_rewards_earned` - إجمالي المكافآت المستحقة
  - `notes` - ملاحظات إدارية
  - `created_at` - تاريخ الإنشاء
  - `updated_at` - تاريخ آخر تحديث
  - `created_by` - المسؤول الذي أضاف المؤثر

  ### 2. `influencer_settings`
  إعدادات نظام المؤثرين
  - `id` - معرف فريد (صف واحد فقط)
  - `is_system_active` - تفعيل/إيقاف النظام بالكامل
  - `trees_required_for_reward` - عدد الأشجار المطلوبة للمكافأة (افتراضي: 20)
  - `reward_type` - نوع المكافأة (افتراضي: 'tree')
  - `congratulation_message_ar` - نص رسالة "مبرووووك" بالعربية
  - `congratulation_message_en` - نص رسالة "مبرووووك" بالإنجليزية
  - `featured_package_color` - لون الباقة المميزة (hex color)
  - `auto_activate_partners` - تفعيل الشركاء تلقائياً عند الإضافة
  - `updated_at` - تاريخ آخر تحديث
  - `updated_by` - المسؤول الذي حدّث الإعدادات

  ## الأمان
  - RLS مفعّل على جميع الجداول
  - الوصول محصور بالمسؤولين فقط في هذه المرحلة
  - التعديل يتطلب صلاحيات خاصة

  ## ملاحظات
  - هذه المرحلة لا تؤثر على المستخدمين النهائيين
  - الربط مع الحجوزات سيتم في المرحلة الثانية
  - الحسابات والتحليلات ستأتي في المراحل اللاحقة
*/

-- ==========================================
-- الجدول 1: شركاء المسيرة (المؤثرين)
-- ==========================================

CREATE TABLE IF NOT EXISTS influencer_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text,
  is_active boolean DEFAULT true,
  total_bookings integer DEFAULT 0,
  total_trees_booked integer DEFAULT 0,
  total_rewards_earned integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

COMMENT ON TABLE influencer_partners IS 'شركاء المسيرة (المؤثرين) - المرحلة الأولى';

CREATE INDEX IF NOT EXISTS idx_influencer_partners_name ON influencer_partners(name);
CREATE INDEX IF NOT EXISTS idx_influencer_partners_is_active ON influencer_partners(is_active);

CREATE OR REPLACE FUNCTION update_influencer_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_influencer_partners_updated_at
  BEFORE UPDATE ON influencer_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_influencer_partners_updated_at();

-- ==========================================
-- الجدول 2: إعدادات نظام المؤثرين
-- ==========================================

CREATE TABLE IF NOT EXISTS influencer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_system_active boolean DEFAULT false,
  trees_required_for_reward integer DEFAULT 20,
  reward_type text DEFAULT 'tree',
  congratulation_message_ar text DEFAULT 'مبرووووك! 🎉 تم إضافة شجرة مكافأة لحسابك',
  congratulation_message_en text DEFAULT 'Congratulations! 🎉 A reward tree has been added to your account',
  featured_package_color text DEFAULT '#FFD700',
  auto_activate_partners boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

COMMENT ON TABLE influencer_settings IS 'إعدادات نظام شركاء المسيرة - صف واحد فقط';

INSERT INTO influencer_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION update_influencer_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_influencer_settings_updated_at
  BEFORE UPDATE ON influencer_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_influencer_settings_updated_at();

-- ==========================================
-- الأمان: Row Level Security (RLS)
-- ==========================================

ALTER TABLE influencer_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- سياسات الأمان: influencer_partners
-- ==========================================

CREATE POLICY "Admins can view all influencer partners"
  ON influencer_partners
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Admins can insert influencer partners"
  ON influencer_partners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Admins can update influencer partners"
  ON influencer_partners
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Admins can delete influencer partners"
  ON influencer_partners
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- ==========================================
-- سياسات الأمان: influencer_settings
-- ==========================================

CREATE POLICY "Admins can view influencer settings"
  ON influencer_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Admins can update influencer settings"
  ON influencer_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- ==========================================
-- دوال مساعدة للإدارة
-- ==========================================

CREATE OR REPLACE FUNCTION check_influencer_exists(partner_name text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM influencer_partners
    WHERE LOWER(name) = LOWER(partner_name)
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_influencer_by_name(partner_name text)
RETURNS TABLE (
  id uuid,
  name text,
  display_name text,
  is_active boolean,
  total_bookings integer,
  total_trees_booked integer,
  total_rewards_earned integer
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ip.id,
    ip.name,
    ip.display_name,
    ip.is_active,
    ip.total_bookings,
    ip.total_trees_booked,
    ip.total_rewards_earned
  FROM influencer_partners ip
  WHERE LOWER(ip.name) = LOWER(partner_name)
    AND ip.is_active = true;
END;
$$;

CREATE OR REPLACE FUNCTION get_influencer_system_settings()
RETURNS TABLE (
  is_system_active boolean,
  trees_required_for_reward integer,
  reward_type text,
  congratulation_message_ar text,
  congratulation_message_en text,
  featured_package_color text,
  auto_activate_partners boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    is_system_active,
    trees_required_for_reward,
    reward_type,
    congratulation_message_ar,
    congratulation_message_en,
    featured_package_color,
    auto_activate_partners
  FROM influencer_settings
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION get_all_influencer_stats()
RETURNS TABLE (
  id uuid,
  name text,
  display_name text,
  is_active boolean,
  total_bookings integer,
  total_trees_booked integer,
  total_rewards_earned integer,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ip.id,
    ip.name,
    ip.display_name,
    ip.is_active,
    ip.total_bookings,
    ip.total_trees_booked,
    ip.total_rewards_earned,
    ip.created_at
  FROM influencer_partners ip
  ORDER BY ip.created_at DESC;
END;
$$;
