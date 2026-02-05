/*
  # Fix Customers List - Show All Active Reservations

  1. Problem
    - Customers with pending/waiting_for_payment reservations show 0 trees
    - Only 'active' status reservations were counted
    - New customers don't appear with their tree counts

  2. Solution
    - Count ALL valid reservation statuses: active, confirmed, waiting_for_payment, pending
    - This ensures customers show their tree counts regardless of payment status

  3. Philosophy
    - A customer with a reservation IS a customer
    - Their tree count should reflect ALL their reservations, not just active ones
*/

-- Drop and recreate the function with corrected logic
DROP FUNCTION IF EXISTS get_customers_list(integer, integer, integer);

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
      -- Count agricultural trees (green) - all valid statuses
      COALESCE(COUNT(DISTINCT CASE 
        WHEN r.path_type = 'agricultural' 
        AND r.status IN ('active', 'confirmed', 'waiting_for_payment', 'pending') 
        THEN r.id 
      END), 0) as green_trees_count,
      -- Count investment trees (golden) - all valid statuses
      COALESCE(COUNT(DISTINCT CASE 
        WHEN r.path_type = 'investment' 
        AND r.status IN ('active', 'confirmed', 'waiting_for_payment', 'pending') 
        THEN r.id 
      END), 0) as golden_trees_count,
      -- Count total trees - all valid statuses
      COALESCE(COUNT(DISTINCT CASE 
        WHEN r.status IN ('active', 'confirmed', 'waiting_for_payment', 'pending') 
        THEN r.id 
      END), 0) as total_trees_count,
      ac.registered_at,
      ac.last_login
    FROM all_customers ac
    LEFT JOIN reservations r ON r.user_id = ac.user_id
    WHERE ac.is_admin = false
    GROUP BY ac.user_id, ac.full_name, ac.phone, ac.email, ac.account_status, ac.registered_at, ac.last_login
    HAVING p_min_trees IS NULL OR COALESCE(COUNT(DISTINCT CASE 
      WHEN r.status IN ('active', 'confirmed', 'waiting_for_payment', 'pending') 
      THEN r.id 
    END), 0) >= p_min_trees
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