/*
  # Remove Old Investor Virtual Farm System

  This migration removes all remnants of the old "InvestorVirtualFarm" system that was replaced by the new comprehensive "My Farm" system (which was later removed entirely).

  ## Changes
  
  1. Drop farm_nickname column from user_profiles
     - This column was used by the old virtual farm system
     - No longer needed as the feature is completely removed
  
  ## Data Safety
  
  - This is a non-destructive operation for critical data
  - Only removes a cosmetic feature column (farm_nickname)
  - No user data, contracts, or reservations are affected
*/

-- Drop farm_nickname column from user_profiles
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS farm_nickname;
