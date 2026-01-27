/*
  # إضافة تفاصيل العقد للحجوزات

  1. Changes
    - إضافة حقول العقد في جدول reservations:
      - contract_id (uuid) - معرف العقد المختار (foreign key)
      - contract_name (text) - اسم العقد
      - duration_years (integer) - مدة العقد بالسنوات
      - bonus_years (integer) - المدة المجانية بالسنوات
      - tree_details (jsonb) - تفاصيل الأشجار المحجوزة

  2. Security
    - المستخدمون يمكنهم قراءة حجوزاتهم فقط
    - المسؤولون يمكنهم قراءة جميع الحجوزات
*/

-- Add contract fields to reservations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'contract_id'
  ) THEN
    ALTER TABLE reservations ADD COLUMN contract_id uuid REFERENCES farm_contracts(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'contract_name'
  ) THEN
    ALTER TABLE reservations ADD COLUMN contract_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'duration_years'
  ) THEN
    ALTER TABLE reservations ADD COLUMN duration_years integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'bonus_years'
  ) THEN
    ALTER TABLE reservations ADD COLUMN bonus_years integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'tree_details'
  ) THEN
    ALTER TABLE reservations ADD COLUMN tree_details jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
