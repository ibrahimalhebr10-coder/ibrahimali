/*
  # Migrate Email Format to Unified Format
  
  ## Purpose
  Updates all existing accounts from old email formats to unified format:
  - From: @temp.local → To: @ashjari.local
  - From: @investor.harvest.local → To: @ashjari.local
  - From: @farmer.harvest.local → To: @ashjari.local
  
  ## Security
  - SECURITY DEFINER for auth.users access
  - Updates only email format, preserves all other data
  - Maintains phone number as primary identifier
  
  ## Impact
  Allows existing users to login with new unified email format
*/

-- Create function to migrate email formats
CREATE OR REPLACE FUNCTION migrate_email_formats()
RETURNS TABLE (
  old_email text,
  new_email text,
  user_id uuid
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH updated_users AS (
    UPDATE auth.users
    SET email = CASE
      -- Replace @temp.local with @ashjari.local
      WHEN email LIKE '%@temp.local' THEN 
        REPLACE(email, '@temp.local', '@ashjari.local')
      -- Replace @investor.harvest.local with @ashjari.local
      WHEN email LIKE '%@investor.harvest.local' THEN 
        REPLACE(email, '@investor.harvest.local', '@ashjari.local')
      -- Replace @farmer.harvest.local with @ashjari.local
      WHEN email LIKE '%@farmer.harvest.local' THEN 
        REPLACE(email, '@farmer.harvest.local', '@ashjari.local')
      -- Keep other emails unchanged
      ELSE email
    END
    WHERE 
      email LIKE '%@temp.local' 
      OR email LIKE '%@investor.harvest.local'
      OR email LIKE '%@farmer.harvest.local'
    RETURNING 
      id as user_id,
      CASE
        WHEN email LIKE '%@ashjari.local' THEN
          REPLACE(REPLACE(REPLACE(email, '@ashjari.local', '@temp.local'), '@temp.local', email), email, 
            CASE 
              WHEN email LIKE '%@temp.local' THEN email
              ELSE REPLACE(email, '@ashjari.local', '@temp.local')
            END
          )
        ELSE 'old_format'
      END as old_email,
      email as new_email
  )
  SELECT 
    old_email::text,
    new_email::text,
    user_id
  FROM updated_users;
END;
$$;

-- Execute the migration
DO $$
DECLARE
  migration_result RECORD;
  total_migrated INTEGER := 0;
BEGIN
  -- Count users to migrate
  SELECT COUNT(*) INTO total_migrated
  FROM auth.users
  WHERE 
    email LIKE '%@temp.local' 
    OR email LIKE '%@investor.harvest.local'
    OR email LIKE '%@farmer.harvest.local';
  
  RAISE NOTICE '🔄 Starting email format migration...';
  RAISE NOTICE '📊 Found % users to migrate', total_migrated;
  
  -- Perform migration if needed
  IF total_migrated > 0 THEN
    -- Update email formats
    UPDATE auth.users
    SET email = CASE
      WHEN email LIKE '%@temp.local' THEN 
        REPLACE(email, '@temp.local', '@ashjari.local')
      WHEN email LIKE '%@investor.harvest.local' THEN 
        REPLACE(email, '@investor.harvest.local', '@ashjari.local')
      WHEN email LIKE '%@farmer.harvest.local' THEN 
        REPLACE(email, '@farmer.harvest.local', '@ashjari.local')
      ELSE email
    END
    WHERE 
      email LIKE '%@temp.local' 
      OR email LIKE '%@investor.harvest.local'
      OR email LIKE '%@farmer.harvest.local';
    
    RAISE NOTICE '✅ Successfully migrated % users to @ashjari.local format', total_migrated;
  ELSE
    RAISE NOTICE '✅ No users to migrate - all emails already in unified format';
  END IF;
END $$;

-- Drop the helper function (no longer needed)
DROP FUNCTION IF EXISTS migrate_email_formats();

COMMENT ON SCHEMA public IS 'Email formats migrated to unified @ashjari.local format';
