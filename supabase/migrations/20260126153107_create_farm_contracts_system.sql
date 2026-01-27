/*
  # Create Farm Contracts System

  1. New Tables
    - `farm_contracts`
      - `id` (uuid, primary key)
      - `farm_id` (uuid, foreign key to farms)
      - `contract_name` (text) - اسم العقد
      - `duration_years` (integer) - عدد السنوات
      - `investor_price` (numeric) - سعر المستثمر للشجرة
      - `bonus_years` (integer) - سنوات إضافية تشجيعية
      - `is_active` (boolean) - حالة العقد
      - `display_order` (integer) - ترتيب العرض
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Changes to farms table
    - Add `area_size` (text) - مساحة المزرعة
    - Add `marketing_text` (text) - نص دعائي قصير

  3. Security
    - Enable RLS on `farm_contracts` table
    - Add policies for authenticated admin users to manage contracts
    - Add policy for public users to view active contracts

  4. Notes
    - Contracts are separate from tree types
    - Tree types contain only: name, subtitle, count, base_price, maintenance_fee
    - Contracts contain: duration and investor pricing
    - This separation allows flexible pricing strategies
*/

-- Add new columns to farms table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farms' AND column_name = 'area_size'
  ) THEN
    ALTER TABLE farms ADD COLUMN area_size text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farms' AND column_name = 'marketing_text'
  ) THEN
    ALTER TABLE farms ADD COLUMN marketing_text text;
  END IF;
END $$;

-- Create farm_contracts table
CREATE TABLE IF NOT EXISTS farm_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  contract_name text NOT NULL,
  duration_years integer NOT NULL DEFAULT 1,
  investor_price numeric NOT NULL DEFAULT 0,
  bonus_years integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE farm_contracts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active contracts
CREATE POLICY "Anyone can view active contracts"
  ON farm_contracts FOR SELECT
  USING (is_active = true);

-- Policy: Admins can view all contracts
CREATE POLICY "Admins can view all contracts"
  ON farm_contracts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Policy: Admins can insert contracts
CREATE POLICY "Admins can insert contracts"
  ON farm_contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
      AND admins.permissions->>'manage_farms' = 'true'
    )
  );

-- Policy: Admins can update contracts
CREATE POLICY "Admins can update contracts"
  ON farm_contracts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
      AND admins.permissions->>'manage_farms' = 'true'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
      AND admins.permissions->>'manage_farms' = 'true'
    )
  );

-- Policy: Admins can delete contracts
CREATE POLICY "Admins can delete contracts"
  ON farm_contracts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
      AND admins.permissions->>'manage_farms' = 'true'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_farm_contracts_farm_id ON farm_contracts(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_contracts_active ON farm_contracts(is_active);
