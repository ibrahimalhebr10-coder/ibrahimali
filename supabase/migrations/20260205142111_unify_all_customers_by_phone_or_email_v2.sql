/*
  # Unified Customer Identity System
  
  1. Purpose
    - Link ALL registered users to customer section
    - Use phone OR email as unified identity
    - Prevent any duplication
    - Work regardless of registration method
  
  2. Changes
    - Updated get_customers_list() to include ALL sources
    - Added unified identity logic (phone/email)
    - Removed duplicates using DISTINCT ON
    - Prioritize authenticated users over temporary reservations
  
  3. Philosophy
    - One customer = One phone OR One email
    - No matter how they registered (temp booking, full account, etc.)
    - Show ALL registrations in one place
*/

-- Drop old function
DROP FUNCTION IF EXISTS get_customers_list(integer, integer, integer);

-- Create unified customer list function
CREATE OR REPLACE FUNCTION get_customers_list(
  p_min_trees integer DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  phone text,
  email text,
  account_status text,
  green_trees_count bigint,
  golden_trees_count bigint,
  total_trees_count bigint,
  registered_at timestamptz,
  last_login timestamptz
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH all_customers AS (
    SELECT DISTINCT ON (COALESCE(up.phone, u.email))
      u.id as user_id,
      COALESCE(up.full_name, u.email, up.phone) as full_name,
      up.phone,
      u.email,
      CASE 
        WHEN u.banned_until IS NOT NULL AND u.banned_until > now() THEN 'معطل'
        WHEN u.email_confirmed_at IS NULL AND up.phone IS NOT NULL THEN 'غير مفعل'
        WHEN u.email_confirmed_at IS NULL AND up.phone IS NULL THEN 'غير مفعل'
        ELSE 'نشط'
      END as account_status,
      u.created_at as registered_at,
      u.last_sign_in_at as last_login,
      EXISTS (SELECT 1 FROM admins WHERE admins.user_id = u.id) as is_admin
    FROM auth.users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.id IS NOT NULL
    ORDER BY COALESCE(up.phone, u.email), u.email_confirmed_at DESC NULLS LAST, u.created_at DESC
  ),
  customers_with_trees AS (
    SELECT
      ac.user_id,
      ac.full_name,
      ac.phone,
      ac.email,
      ac.account_status,
      COALESCE(COUNT(DISTINCT CASE WHEN r.path_type = 'agricultural' AND r.status = 'active' THEN r.id END), 0) as green_trees_count,
      COALESCE(COUNT(DISTINCT CASE WHEN r.path_type = 'investment' AND r.status = 'active' THEN r.id END), 0) as golden_trees_count,
      COALESCE(COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END), 0) as total_trees_count,
      ac.registered_at,
      ac.last_login
    FROM all_customers ac
    LEFT JOIN reservations r ON r.user_id = ac.user_id
    WHERE ac.is_admin = false
    GROUP BY ac.user_id, ac.full_name, ac.phone, ac.email, ac.account_status, ac.registered_at, ac.last_login
    HAVING p_min_trees IS NULL OR COALESCE(COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END), 0) >= p_min_trees
  )
  SELECT
    cwt.user_id,
    cwt.full_name,
    cwt.phone,
    cwt.email,
    cwt.account_status,
    cwt.green_trees_count,
    cwt.golden_trees_count,
    cwt.total_trees_count,
    cwt.registered_at,
    cwt.last_login
  FROM customers_with_trees cwt
  ORDER BY cwt.registered_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Drop old profile function
DROP FUNCTION IF EXISTS get_customer_profile(uuid);

-- Create unified customer profile function (search by user_id, phone, or email)
CREATE OR REPLACE FUNCTION get_customer_profile(p_identifier text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result jsonb;
  v_user_id uuid;
BEGIN
  -- Try to find user by user_id first, then by phone, then by email
  SELECT u.id INTO v_user_id
  FROM auth.users u
  LEFT JOIN user_profiles up ON up.user_id = u.id
  WHERE u.id::text = p_identifier
     OR up.phone = p_identifier
     OR u.email = p_identifier
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'العميل غير موجود');
  END IF;
  
  SELECT jsonb_build_object(
    'user_id', u.id,
    'full_name', COALESCE(up.full_name, u.email, up.phone),
    'phone', up.phone,
    'email', u.email,
    'country', up.country,
    'account_status', CASE 
      WHEN u.banned_until IS NOT NULL AND u.banned_until > now() THEN 'معطل'
      WHEN u.email_confirmed_at IS NULL THEN 'غير مفعل'
      ELSE 'نشط'
    END,
    'email_confirmed', u.email_confirmed_at IS NOT NULL,
    'phone_confirmed', up.phone IS NOT NULL,
    'registered_at', u.created_at,
    'last_login', u.last_sign_in_at,
    'green_trees_count', (
      SELECT COUNT(*) FROM reservations 
      WHERE user_id = u.id AND path_type = 'agricultural' AND status = 'active'
    ),
    'golden_trees_count', (
      SELECT COUNT(*) FROM reservations 
      WHERE user_id = u.id AND path_type = 'investment' AND status = 'active'
    ),
    'farms_count', (
      SELECT COUNT(DISTINCT farm_id) FROM reservations 
      WHERE user_id = u.id AND status = 'active'
    ),
    'pending_payments', (
      SELECT COALESCE(SUM(amount_due), 0) 
      FROM maintenance_payments 
      WHERE user_id = u.id AND payment_status = 'pending'
    ),
    'groups', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'group_id', cg.id,
        'group_name', cg.group_name
      )), '[]'::jsonb)
      FROM customer_group_members cgm
      JOIN customer_groups cg ON cg.id = cgm.group_id
      WHERE cgm.user_id = u.id
    )
  ) INTO v_result
  FROM auth.users u
  LEFT JOIN user_profiles up ON up.user_id = u.id
  WHERE u.id = v_user_id;
  
  RETURN v_result;
END;
$$;

-- Add index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone) WHERE phone IS NOT NULL;

-- Function to find potential duplicate customers (for admin reporting)
CREATE OR REPLACE FUNCTION find_duplicate_customers()
RETURNS TABLE (
  identifier text,
  identifier_type text,
  user_count bigint,
  user_ids uuid[]
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  -- Find duplicates by phone
  SELECT
    up.phone as identifier,
    'phone' as identifier_type,
    COUNT(DISTINCT u.id) as user_count,
    ARRAY_AGG(DISTINCT u.id) as user_ids
  FROM user_profiles up
  JOIN auth.users u ON u.id = up.user_id
  WHERE up.phone IS NOT NULL
  GROUP BY up.phone
  HAVING COUNT(DISTINCT u.id) > 1
  
  UNION ALL
  
  -- Find duplicates by email
  SELECT
    u.email as identifier,
    'email' as identifier_type,
    COUNT(DISTINCT u.id) as user_count,
    ARRAY_AGG(DISTINCT u.id) as user_ids
  FROM auth.users u
  WHERE u.email IS NOT NULL
  GROUP BY u.email
  HAVING COUNT(DISTINCT u.id) > 1;
END;
$$;
