/*
  # Fix Customers List - Email Type Casting

  1. Issue
    - auth.users.email is varchar(255)
    - Function expects text
    - PostgreSQL strict type checking fails

  2. Solution
    - Cast email to text explicitly using ::text
    - This ensures type compatibility
*/

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
    SELECT DISTINCT ON (COALESCE(up.phone, u.email::text))
      u.id as user_id,
      COALESCE(up.full_name, u.email::text, up.phone) as full_name,
      up.phone,
      u.email::text as email,
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
    LEFT JOIN user_profiles up ON up.id = u.id
    WHERE u.id IS NOT NULL
    ORDER BY COALESCE(up.phone, u.email::text), u.email_confirmed_at DESC NULLS LAST, u.created_at DESC
  ),
  customers_with_trees AS (
    SELECT
      ac.user_id,
      ac.full_name,
      ac.phone,
      ac.email,
      ac.account_status,
      COALESCE(COUNT(DISTINCT CASE 
        WHEN r.path_type = 'agricultural' 
        AND r.status IN ('active', 'confirmed', 'waiting_for_payment', 'pending') 
        THEN r.id 
      END), 0) as green_trees_count,
      COALESCE(COUNT(DISTINCT CASE 
        WHEN r.path_type = 'investment' 
        AND r.status IN ('active', 'confirmed', 'waiting_for_payment', 'pending') 
        THEN r.id 
      END), 0) as golden_trees_count,
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

-- Also fix get_customer_profile
DROP FUNCTION IF EXISTS get_customer_profile(text);

CREATE OR REPLACE FUNCTION get_customer_profile(p_identifier text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result jsonb;
  v_user_id uuid;
BEGIN
  SELECT u.id INTO v_user_id
  FROM auth.users u
  LEFT JOIN user_profiles up ON up.id = u.id
  WHERE u.id::text = p_identifier
     OR up.phone = p_identifier
     OR u.email::text = p_identifier
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'العميل غير موجود');
  END IF;
  
  SELECT jsonb_build_object(
    'user_id', u.id,
    'full_name', COALESCE(up.full_name, u.email::text, up.phone),
    'phone', up.phone,
    'email', u.email::text,
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
      WHERE user_id = u.id AND path_type = 'agricultural' AND status IN ('active', 'confirmed', 'waiting_for_payment', 'pending')
    ),
    'golden_trees_count', (
      SELECT COUNT(*) FROM reservations 
      WHERE user_id = u.id AND path_type = 'investment' AND status IN ('active', 'confirmed', 'waiting_for_payment', 'pending')
    ),
    'farms_count', (
      SELECT COUNT(DISTINCT farm_id) FROM reservations 
      WHERE user_id = u.id AND status IN ('active', 'confirmed', 'waiting_for_payment', 'pending')
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
  LEFT JOIN user_profiles up ON up.id = u.id
  WHERE u.id = v_user_id;
  
  RETURN v_result;
END;
$$;