/*
  # Add tree_types column to reservations

  1. Changes
    - Add `tree_types` text column to `reservations` table
    - This column stores a comma-separated list of tree types (e.g., "زيتون، نخيل")
  
  2. Purpose
    - Enable displaying tree types in investor account and virtual farm
    - Support aggregation of trees by type across multiple investments
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'tree_types'
  ) THEN
    ALTER TABLE reservations ADD COLUMN tree_types TEXT;
  END IF;
END $$;
