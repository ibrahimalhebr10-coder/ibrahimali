/*
  # Add farmer_price to farm_contracts

  1. Changes
    - Add `farmer_price` column to farm_contracts table
      - This is the price for farmers who want to own trees (agricultural harvest mode)
      - Typically lower than investor_price as farmers receive the crops directly
      - investor_price is for investors who receive financial returns

  2. Security
    - No RLS changes needed (existing policies cover the new column)

  3. Notes
    - farmer_price will be used in "محصولي الزراعي" (Agricultural Harvest) mode
    - investor_price will be used in "محصولي الاستثماري" (Investment) mode
    - Both modes share the same tree pool (availableTrees)
*/

-- Add farmer_price column to farm_contracts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farm_contracts' AND column_name = 'farmer_price'
  ) THEN
    ALTER TABLE farm_contracts
    ADD COLUMN farmer_price numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Update existing contracts with farmer_price (80% of investor_price as default)
UPDATE farm_contracts
SET farmer_price = ROUND(investor_price * 0.8, 2)
WHERE farmer_price = 0;
