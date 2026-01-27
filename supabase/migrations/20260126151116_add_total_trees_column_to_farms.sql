/*
  # Add total_trees column to farms table

  1. Changes
    - Add `total_trees` column to `farms` table
      - Type: integer
      - Not null with default value 0
      - Represents the total physical count of trees in the farm
    
  2. Notes
    - This field stores the total inventory of trees in the farm
    - It is independent of rental duration and contract terms
    - Used for validation to ensure tree type allocations don't exceed total capacity
*/

-- Add total_trees column to farms table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farms' AND column_name = 'total_trees'
  ) THEN
    ALTER TABLE farms ADD COLUMN total_trees integer NOT NULL DEFAULT 0;
  END IF;
END $$;
