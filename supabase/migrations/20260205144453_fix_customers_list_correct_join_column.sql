/*
  # Fix Customers List - Correct JOIN Column

  1. Root Cause
    - user_profiles table uses 'id' as primary key (not 'user_id')
    - Functions were trying to join on 'up.user_id' which doesn't exist
    - This caused the function to fail completely

  2. Solution
    - Change all JOINs from 'up.user_id' to 'up.id'
    - This is the correct way to join auth.users with user_profiles

  3. Tables Structure
    - auth.users: id (uuid)
    - user_profiles: id (uuid) PRIMARY KEY REFERENCES auth.users(id)
*/

-- Drop and recreate get_customers_list with correct JOIN
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
    LEFT JOIN user_profiles up ON up.id = u.id
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

-- Fix get_customer_profile function as well
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

-- Fix get_customer_green_trees function
DROP FUNCTION IF EXISTS get_customer_green_trees(uuid);

CREATE OR REPLACE FUNCTION get_customer_green_trees(p_user_id uuid)
RETURNS TABLE (
  reservation_id uuid,
  farm_id uuid,
  farm_name text,
  tree_count integer,
  contract_start_date date,
  last_maintenance timestamptz,
  maintenance_status text,
  pending_fees decimal
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id as reservation_id,
    f.id as farm_id,
    f.name_ar as farm_name,
    COALESCE(jsonb_array_length(r.tree_types), 0) as tree_count,
    r.contract_start_date,
    (
      SELECT MAX(mr.maintenance_date)
      FROM maintenance_records mr
      WHERE mr.farm_id = f.id AND mr.path_type = 'agricultural'
    ) as last_maintenance,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM maintenance_payments mp
        WHERE mp.user_id = r.user_id AND mp.payment_status = 'pending'
      ) THEN 'مستحق'
      ELSE 'مسدد'
    END as maintenance_status,
    (
      SELECT COALESCE(SUM(mp.amount_due), 0)
      FROM maintenance_payments mp
      WHERE mp.user_id = r.user_id AND mp.payment_status = 'pending'
    ) as pending_fees
  FROM reservations r
  JOIN farms f ON f.id = r.farm_id
  WHERE r.user_id = p_user_id 
    AND r.path_type = 'agricultural' 
    AND r.status IN ('active', 'confirmed', 'waiting_for_payment', 'pending')
  ORDER BY r.contract_start_date DESC;
END;
$$;

-- Fix get_customer_golden_trees function
DROP FUNCTION IF EXISTS get_customer_golden_trees(uuid);

CREATE OR REPLACE FUNCTION get_customer_golden_trees(p_user_id uuid)
RETURNS TABLE (
  reservation_id uuid,
  farm_id uuid,
  farm_name text,
  tree_count integer,
  contract_start_date date,
  utilization_type text,
  maintenance_status text,
  last_update timestamptz
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id as reservation_id,
    f.id as farm_id,
    f.name_ar as farm_name,
    COALESCE(jsonb_array_length(r.tree_types), 0) as tree_count,
    r.contract_start_date,
    'مصنع ومخلفات' as utilization_type,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM maintenance_payments mp
        WHERE mp.user_id = r.user_id AND mp.payment_status = 'pending'
      ) THEN 'مستحق'
      ELSE 'مسدد'
    END as maintenance_status,
    r.updated_at as last_update
  FROM reservations r
  JOIN farms f ON f.id = r.farm_id
  WHERE r.user_id = p_user_id 
    AND r.path_type = 'investment' 
    AND r.status IN ('active', 'confirmed', 'waiting_for_payment', 'pending')
  ORDER BY r.contract_start_date DESC;
END;
$$;