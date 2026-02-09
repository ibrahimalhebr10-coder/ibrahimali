/*
  # Add usage_type to reservations for smart integration

  1. Changes
    - Add `usage_type` column to reservations table
    - Values: 'personal' (for agricultural/personal use) or 'investment' (for financial returns)
    - This allows unified booking while tracking user intent

  2. Notes
    - Default value is NULL for backwards compatibility
    - Existing reservations will use path_type to determine usage
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'usage_type'
  ) THEN
    ALTER TABLE reservations ADD COLUMN usage_type text CHECK (usage_type IN ('personal', 'investment'));
    
    COMMENT ON COLUMN reservations.usage_type IS 'User selected usage type: personal (get produce) or investment (get money returns)';
  END IF;
END $$;
