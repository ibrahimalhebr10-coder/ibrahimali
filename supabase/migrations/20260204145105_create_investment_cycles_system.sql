/*
  # Investment Cycles System for Golden Trees

  1. New Tables
    - `investment_cycles`
      - `id` (uuid, primary key)
      - `farm_id` (uuid, references farms)
      - `cycle_types` (text[], array of: maintenance, waste, factory)
      - `cycle_date` (date)
      - `description` (text, required)
      - `total_amount` (numeric)
      - `cost_per_tree` (numeric, computed)
      - `status` (text: draft, published)
      - `images` (text[], array of image URLs)
      - `videos` (text[], array of video URLs)
      - `visible_to_client` (boolean, default true)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Admins can create, read, update, delete
    - Investors can read only published cycles for their farms

  3. Computed Fields
    - `cost_per_tree` = `total_amount` / farm's total trees
    - Readiness indicator based on required fields
*/

-- Create investment cycles table
CREATE TABLE IF NOT EXISTS investment_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  cycle_types text[] NOT NULL DEFAULT '{}',
  cycle_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  total_amount numeric(10, 2) DEFAULT 0,
  cost_per_tree numeric(10, 2) DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  images text[] DEFAULT '{}',
  videos text[] DEFAULT '{}',
  visible_to_client boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_investment_cycles_farm_id ON investment_cycles(farm_id);
CREATE INDEX IF NOT EXISTS idx_investment_cycles_status ON investment_cycles(status);
CREATE INDEX IF NOT EXISTS idx_investment_cycles_created_by ON investment_cycles(created_by);

-- Enable RLS
ALTER TABLE investment_cycles ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can create investment cycles"
  ON investment_cycles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all investment cycles"
  ON investment_cycles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update investment cycles"
  ON investment_cycles
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

CREATE POLICY "Admins can delete investment cycles"
  ON investment_cycles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Investor policies (can only view published cycles for their farms)
CREATE POLICY "Investors can view published investment cycles for their farms"
  ON investment_cycles
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    AND visible_to_client = true
    AND EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.farm_id = investment_cycles.farm_id
      AND r.user_id = auth.uid()
      AND r.status = 'active'
      AND r.path_type = 'investment'
    )
  );

-- Function to auto-calculate cost_per_tree
CREATE OR REPLACE FUNCTION calculate_investment_cycle_cost_per_tree()
RETURNS TRIGGER AS $$
DECLARE
  farm_tree_count integer;
BEGIN
  SELECT total_trees INTO farm_tree_count
  FROM farms
  WHERE id = NEW.farm_id;

  IF farm_tree_count > 0 AND NEW.total_amount > 0 THEN
    NEW.cost_per_tree := NEW.total_amount / farm_tree_count;
  ELSE
    NEW.cost_per_tree := 0;
  END IF;

  NEW.updated_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate cost_per_tree
DROP TRIGGER IF EXISTS trigger_calculate_investment_cycle_cost_per_tree ON investment_cycles;
CREATE TRIGGER trigger_calculate_investment_cycle_cost_per_tree
  BEFORE INSERT OR UPDATE OF total_amount, farm_id
  ON investment_cycles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_investment_cycle_cost_per_tree();

-- Function to check readiness
CREATE OR REPLACE FUNCTION check_investment_cycle_readiness(cycle_id uuid)
RETURNS jsonb AS $$
DECLARE
  cycle_record record;
  readiness jsonb;
BEGIN
  SELECT * INTO cycle_record
  FROM investment_cycles
  WHERE id = cycle_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ready', false, 'error', 'Cycle not found');
  END IF;

  readiness := jsonb_build_object(
    'has_farm', cycle_record.farm_id IS NOT NULL,
    'has_description', cycle_record.description IS NOT NULL AND length(cycle_record.description) > 0,
    'has_cycle_types', array_length(cycle_record.cycle_types, 1) > 0,
    'has_documentation', (array_length(cycle_record.images, 1) > 0 OR array_length(cycle_record.videos, 1) > 0),
    'has_cost', cycle_record.total_amount > 0,
    'ready', false
  );

  readiness := jsonb_set(
    readiness,
    '{ready}',
    to_jsonb(
      (readiness->>'has_farm')::boolean AND
      (readiness->>'has_description')::boolean AND
      (readiness->>'has_cycle_types')::boolean AND
      (readiness->>'has_documentation')::boolean AND
      (readiness->>'has_cost')::boolean
    )
  );

  RETURN readiness;
END;
$$ LANGUAGE plpgsql;

-- Function to get payment summary for a cycle
CREATE OR REPLACE FUNCTION get_investment_cycle_payment_summary(cycle_id uuid)
RETURNS jsonb AS $$
DECLARE
  cycle_record record;
  total_investors integer := 0;
  paid_investors integer := 0;
  pending_investors integer := 0;
  total_collected numeric := 0;
  total_pending numeric := 0;
BEGIN
  SELECT * INTO cycle_record
  FROM investment_cycles
  WHERE id = cycle_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Cycle not found');
  END IF;

  SELECT COUNT(DISTINCT r.user_id) INTO total_investors
  FROM reservations r
  WHERE r.farm_id = cycle_record.farm_id
  AND r.status = 'active'
  AND r.path_type = 'investment';

  SELECT COUNT(DISTINCT mp.user_id) INTO paid_investors
  FROM maintenance_payments mp
  WHERE mp.maintenance_fee_id IN (
    SELECT mf.id
    FROM maintenance_fees mf
    WHERE mf.farm_id = cycle_record.farm_id
    AND mf.due_date >= cycle_record.cycle_date
    AND mp.payment_status = 'completed'
  );

  pending_investors := total_investors - paid_investors;

  total_collected := cycle_record.cost_per_tree * paid_investors;
  total_pending := cycle_record.cost_per_tree * pending_investors;

  RETURN jsonb_build_object(
    'total_investors', total_investors,
    'paid_investors', paid_investors,
    'pending_investors', pending_investors,
    'total_collected', total_collected,
    'total_pending', total_pending,
    'cost_per_tree', cycle_record.cost_per_tree
  );
END;
$$ LANGUAGE plpgsql;
