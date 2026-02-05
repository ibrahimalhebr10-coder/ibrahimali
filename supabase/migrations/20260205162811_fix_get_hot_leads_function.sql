/*
  # Fix get_hot_leads Function

  ## Problem
  The function tries to access `up.email` column which doesn't exist in user_profiles table.
  
  ## Solution
  - Remove references to `up.email` since user_profiles doesn't have email column
  - Email is stored in auth.users table, but we'll use ls.email from lead_scores
  
  ## Changes
  - Fix the COALESCE to only use ls.email (from lead_scores)
  - Remove up.email reference
*/

-- Drop and recreate the function with fixed column references
DROP FUNCTION IF EXISTS get_hot_leads(integer);

CREATE OR REPLACE FUNCTION get_hot_leads(limit_count integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  session_id text,
  total_points integer,
  temperature text,
  conversion_stage text,
  last_activity_at timestamptz,
  first_seen_at timestamptz,
  phone text,
  email text,
  full_name text,
  activities_count bigint,
  last_activity_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ls.id,
    ls.user_id,
    ls.session_id,
    ls.total_points,
    ls.temperature,
    ls.conversion_stage,
    ls.last_activity_at,
    ls.first_seen_at,
    COALESCE(ls.phone, up.phone) as phone,
    ls.email as email,
    up.full_name,
    COUNT(la.id) as activities_count,
    (
      SELECT la2.activity_type 
      FROM lead_activities la2 
      WHERE (la2.user_id = ls.user_id OR la2.session_id = ls.session_id)
      ORDER BY la2.created_at DESC 
      LIMIT 1
    ) as last_activity_type
  FROM lead_scores ls
  LEFT JOIN user_profiles up ON ls.user_id = up.id
  LEFT JOIN lead_activities la ON (la.user_id = ls.user_id OR la.session_id = ls.session_id)
  WHERE ls.temperature IN ('hot', 'burning')
    AND ls.conversion_stage != 'converted'
    AND ls.last_activity_at > now() - interval '7 days'
  GROUP BY ls.id, ls.user_id, ls.session_id, ls.total_points, ls.temperature, 
           ls.conversion_stage, ls.last_activity_at, ls.first_seen_at, 
           ls.phone, ls.email, up.phone, up.full_name
  ORDER BY ls.total_points DESC, ls.last_activity_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
