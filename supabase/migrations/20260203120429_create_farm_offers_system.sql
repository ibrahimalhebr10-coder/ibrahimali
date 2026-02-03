/*
  # نظام عرض المزارع - Farm Offers System

  1. الجداول الجديدة
    - `farm_offers`
      - `id` (uuid, primary key) - معرف فريد
      - `reference_number` (text, unique) - رقم المرجع #FM-2026-00042
      - `owner_name` (text) - اسم المزارع
      - `phone` (text) - رقم الهاتف
      - `email` (text, optional) - البريد الإلكتروني
      - `location` (text) - موقع المزرعة
      - `area_hectares` (numeric) - المساحة بالهكتار
      - `current_crop_type` (text) - نوع الزراعة الحالية
      - `has_legal_docs` (text) - هل يملك توثيق قانوني
      - `additional_notes` (text) - ملاحظات إضافية
      - `status` (text) - حالة الطلب
      - `submitted_at` (timestamptz) - تاريخ التقديم
      - `last_updated_at` (timestamptz) - آخر تحديث
      - `decision_at` (timestamptz) - تاريخ القرار
      - `admin_notes` (text) - ملاحظات الإدارة
      - `rejection_reason` (text) - سبب الرفض
      - `field_visit_date` (timestamptz) - موعد الزيارة الميدانية
      - `field_visit_notes` (text) - ملاحظات الزيارة

    - `farm_offer_timeline`
      - `id` (uuid, primary key)
      - `offer_id` (uuid, foreign key) - الطلب المرتبط
      - `status` (text) - الحالة
      - `note` (text) - ملاحظة
      - `created_by` (uuid) - من قام بالتحديث
      - `created_at` (timestamptz)

  2. الأمان
    - Enable RLS على كل الجداول
    - سياسات للمستخدمين والإداريين

  3. الدوال
    - دالة لتوليد رقم المرجع التلقائي
*/

-- جدول طلبات عرض المزارع
CREATE TABLE IF NOT EXISTS farm_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL,
  
  -- بيانات المزارع
  owner_name text NOT NULL,
  phone text NOT NULL,
  email text,
  
  -- بيانات المزرعة
  location text NOT NULL,
  area_hectares numeric NOT NULL,
  current_crop_type text,
  has_legal_docs text CHECK (has_legal_docs IN ('yes', 'no', 'partial')) DEFAULT 'no',
  additional_notes text,
  
  -- حالة الطلب
  status text DEFAULT 'submitted' CHECK (status IN (
    'submitted',              -- تم التقديم
    'under_review',           -- قيد المراجعة
    'technical_eval',         -- التقييم الفني
    'field_visit_scheduled',  -- زيارة مجدولة
    'field_visit_done',       -- تمت الزيارة
    'approved',               -- تم القبول
    'rejected'                -- تم الرفض
  )),
  
  -- تواريخ مهمة
  submitted_at timestamptz DEFAULT now(),
  last_updated_at timestamptz DEFAULT now(),
  decision_at timestamptz,
  
  -- ملاحظات الإدارة
  admin_notes text,
  rejection_reason text,
  
  -- معلومات الزيارة الميدانية
  field_visit_date timestamptz,
  field_visit_notes text,
  
  created_at timestamptz DEFAULT now()
);

-- جدول تاريخ الطلب (Timeline)
CREATE TABLE IF NOT EXISTS farm_offer_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES farm_offers(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- دالة لتوليد رقم المرجع التلقائي
CREATE OR REPLACE FUNCTION generate_offer_reference()
RETURNS text AS $$
DECLARE
  year text;
  sequence_num text;
BEGIN
  year := EXTRACT(YEAR FROM NOW())::text;
  sequence_num := LPAD((SELECT COUNT(*) + 1 FROM farm_offers)::text, 5, '0');
  RETURN 'FM-' || year || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتعيين رقم المرجع تلقائياً
CREATE OR REPLACE FUNCTION set_offer_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_offer_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_offer_reference_trigger
  BEFORE INSERT ON farm_offers
  FOR EACH ROW
  EXECUTE FUNCTION set_offer_reference();

-- Trigger لتحديث last_updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_farm_offer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_farm_offer_timestamp_trigger
  BEFORE UPDATE ON farm_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_farm_offer_timestamp();

-- Trigger لإضافة timeline عند تغيير الحالة
CREATE OR REPLACE FUNCTION add_offer_timeline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO farm_offer_timeline (offer_id, status, note, created_by)
    VALUES (NEW.id, NEW.status, NEW.admin_notes, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_offer_timeline_trigger
  AFTER UPDATE ON farm_offers
  FOR EACH ROW
  EXECUTE FUNCTION add_offer_timeline();

-- Enable RLS
ALTER TABLE farm_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_offer_timeline ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول farm_offers

-- أي شخص يستطيع إضافة طلب جديد (حتى غير المسجلين)
CREATE POLICY "Anyone can submit farm offer"
  ON farm_offers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- الإداريون يستطيعون قراءة كل الطلبات
CREATE POLICY "Admins can view all offers"
  ON farm_offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- الإداريون يستطيعون تحديث الطلبات
CREATE POLICY "Admins can update offers"
  ON farm_offers
  FOR UPDATE
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

-- سياسات RLS لجدول farm_offer_timeline

-- الإداريون يستطيعون قراءة التاريخ
CREATE POLICY "Admins can view timeline"
  ON farm_offer_timeline
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- النظام يستطيع إضافة سجلات التاريخ
CREATE POLICY "System can insert timeline"
  ON farm_offer_timeline
  FOR INSERT
  TO authenticated
  WITH CHECK (true);