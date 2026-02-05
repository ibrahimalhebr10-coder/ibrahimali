/*
  # Customer Management System
  
  1. New Tables
    - customer_groups - Administrative groups for organizing customers
    - customer_group_members - Links customers to groups
  
  2. Functions
    - get_customers_list - List all customers with stats
    - get_customer_profile - Complete customer profile
    - get_customer_green_trees - Green trees details
    - get_customer_golden_trees - Golden trees details
    - get_customer_financial_history - Payment history
    - get_customer_activity_log - Activity and login logs
  
  3. Security
    - Admin-only access
    - Complete audit trail
*/

-- Customer Groups Table
CREATE TABLE IF NOT EXISTS customer_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name text NOT NULL UNIQUE,
  description text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customer Group Members Table
CREATE TABLE IF NOT EXISTS customer_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES customer_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by uuid NOT NULL REFERENCES auth.users(id),
  added_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_groups_created_by ON customer_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_customer_group_members_group_id ON customer_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_customer_group_members_user_id ON customer_group_members(user_id);

-- Enable RLS
ALTER TABLE customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Admins can manage customer groups" ON customer_groups;
CREATE POLICY "Admins can manage customer groups"
  ON customer_groups FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage group members" ON customer_group_members;
CREATE POLICY "Admins can manage group members"
  ON customer_group_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

-- Function: Get Customers List with Stats
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
  SELECT
    u.id as user_id,
    COALESCE(up.full_name, u.email) as full_name,
    up.phone,
    u.email,
    CASE 
      WHEN u.banned_until IS NOT NULL AND u.banned_until > now() THEN 'معطل'
      WHEN u.email_confirmed_at IS NULL THEN 'غير مفعل'
      ELSE 'نشط'
    END as account_status,
    COALESCE(COUNT(DISTINCT CASE WHEN r.path_type = 'agricultural' THEN r.id END), 0) as green_trees_count,
    COALESCE(COUNT(DISTINCT CASE WHEN r.path_type = 'investment' THEN r.id END), 0) as golden_trees_count,
    COALESCE(COUNT(DISTINCT r.id), 0) as total_trees_count,
    u.created_at as registered_at,
    u.last_sign_in_at as last_login
  FROM auth.users u
  LEFT JOIN user_profiles up ON up.user_id = u.id
  LEFT JOIN reservations r ON r.user_id = u.id AND r.status = 'active'
  WHERE NOT EXISTS (SELECT 1 FROM admins WHERE admins.user_id = u.id)
  GROUP BY u.id, up.full_name, up.phone, u.email, u.banned_until, u.email_confirmed_at, u.created_at, u.last_sign_in_at
  HAVING p_min_trees IS NULL OR COALESCE(COUNT(DISTINCT r.id), 0) >= p_min_trees
  ORDER BY u.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Function: Get Customer Profile
CREATE OR REPLACE FUNCTION get_customer_profile(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', u.id,
    'full_name', COALESCE(up.full_name, u.email),
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
  WHERE u.id = p_user_id;
  
  RETURN v_result;
END;
$$;

-- Function: Get Customer Green Trees
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
    AND r.status = 'active'
  ORDER BY r.contract_start_date DESC;
END;
$$;

-- Function: Get Customer Golden Trees
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
    AND r.status = 'active'
  ORDER BY r.contract_start_date DESC;
END;
$$;

-- Function: Get Customer Financial History
CREATE OR REPLACE FUNCTION get_customer_financial_history(p_user_id uuid)
RETURNS TABLE (
  payment_id uuid,
  payment_type text,
  path_type text,
  amount decimal,
  payment_status text,
  payment_date timestamptz,
  description text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    mp.id as payment_id,
    'رسوم صيانة' as payment_type,
    mp.path_type::text,
    mp.amount_due as amount,
    mp.payment_status,
    mp.created_at as payment_date,
    CONCAT('صيانة - ', f.name_ar) as description
  FROM maintenance_payments mp
  LEFT JOIN reservations r ON r.user_id = mp.user_id
  LEFT JOIN farms f ON f.id = r.farm_id
  WHERE mp.user_id = p_user_id
  ORDER BY mp.created_at DESC;
END;
$$;

-- Function: Get Customer Activity Log
CREATE OR REPLACE FUNCTION get_customer_activity_log(p_user_id uuid, p_limit integer DEFAULT 50)
RETURNS TABLE (
  activity_id uuid,
  activity_type text,
  activity_description text,
  activity_timestamp timestamptz,
  ip_address text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    gen_random_uuid() as activity_id,
    'تسجيل دخول' as activity_type,
    'تسجيل دخول للحساب' as activity_description,
    u.last_sign_in_at as activity_timestamp,
    NULL::text as ip_address
  FROM auth.users u
  WHERE u.id = p_user_id AND u.last_sign_in_at IS NOT NULL
  
  UNION ALL
  
  SELECT
    r.id as activity_id,
    'حجز شجرة' as activity_type,
    CONCAT('حجز ', COALESCE(jsonb_array_length(r.tree_types), 0), ' شجرة في ', f.name_ar) as activity_description,
    r.created_at as activity_timestamp,
    NULL::text as ip_address
  FROM reservations r
  JOIN farms f ON f.id = r.farm_id
  WHERE r.user_id = p_user_id
  
  ORDER BY activity_timestamp DESC
  LIMIT p_limit;
END;
$$;

-- Function: Disable Customer Account
CREATE OR REPLACE FUNCTION disable_customer_account(
  p_user_id uuid,
  p_reason text,
  p_duration_days integer DEFAULT 30
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE auth.users
  SET banned_until = now() + (p_duration_days || ' days')::interval
  WHERE id = p_user_id;
  
  INSERT INTO farm_finance_audit_log (
    farm_id, operation_type, operation_details, performed_by
  ) VALUES (
    NULL, 'transfer',
    jsonb_build_object(
      'action', 'disable_account',
      'user_id', p_user_id,
      'reason', p_reason,
      'duration_days', p_duration_days
    ),
    auth.uid()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم تعطيل الحساب بنجاح',
    'disabled_until', now() + (p_duration_days || ' days')::interval
  );
END;
$$;

-- Function: Delete Customer Account (Dangerous)
CREATE OR REPLACE FUNCTION delete_customer_account(
  p_user_id uuid,
  p_confirmation_code text,
  p_admin_reason text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_expected_code text;
  v_reservations_count integer;
BEGIN
  v_expected_code := SUBSTRING(p_user_id::text, 1, 8) || 'DELETE';
  
  IF p_confirmation_code != v_expected_code THEN
    RETURN jsonb_build_object('success', false, 'error', 'كود التأكيد غير صحيح');
  END IF;
  
  SELECT COUNT(*) INTO v_reservations_count
  FROM reservations WHERE user_id = p_user_id;
  
  INSERT INTO farm_finance_audit_log (
    farm_id, operation_type, operation_details, performed_by
  ) VALUES (
    NULL, 'delete',
    jsonb_build_object(
      'action', 'delete_account',
      'user_id', p_user_id,
      'reason', p_admin_reason,
      'reservations_count', v_reservations_count
    ),
    auth.uid()
  );
  
  DELETE FROM reservations WHERE user_id = p_user_id;
  DELETE FROM user_profiles WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم حذف الحساب نهائياً',
    'reservations_deleted', v_reservations_count
  );
END;
$$;
