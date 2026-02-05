/*
  # Add path_type to maintenance_records for proper filtering

  ## Changes
  1. Add path_type column to maintenance_records
  2. Update existing records to have correct path_type based on farm
  3. Add index for better performance

  ## Purpose
  Enable strict filtering of maintenance records by path type (agricultural/investment)
*/

-- Add path_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_records' AND column_name = 'path_type'
  ) THEN
    ALTER TABLE maintenance_records
    ADD COLUMN path_type text CHECK (path_type IN ('agricultural', 'investment')) DEFAULT 'agricultural';
  END IF;
END $$;

-- Update existing records to have correct path_type based on their farm
UPDATE maintenance_records mr
SET path_type = COALESCE(
  (
    SELECT DISTINCT r.path_type
    FROM reservations r
    WHERE r.farm_id = mr.farm_id
    LIMIT 1
  ),
  'agricultural'
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_records_path_type ON maintenance_records(path_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_farm_path ON maintenance_records(farm_id, path_type);