/*
  # Add min_trees column to agricultural_packages
  
  1. Changes
    - Add min_trees column with default value 50
    - Update existing packages with appropriate min_trees values
*/

ALTER TABLE agricultural_packages 
ADD COLUMN IF NOT EXISTS min_trees integer DEFAULT 50;

UPDATE agricultural_packages SET min_trees = 30 WHERE sort_order = 1;
UPDATE agricultural_packages SET min_trees = 50 WHERE sort_order = 2;
UPDATE agricultural_packages SET min_trees = 100 WHERE sort_order = 3;