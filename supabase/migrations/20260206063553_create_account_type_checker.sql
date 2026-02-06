/*
  # Account Type Checker Function

  ## Purpose
  Checks what types of accounts a user has:
  - Regular account (has reservations or trees)
  - Success Partner account (linked to influencer_partners)
  - Both accounts
  - None

  ## Returns
  {
    has_regular_account: boolean,
    has_partner_account: boolean,
    account_type: 'none' | 'regular' | 'partner' | 'both'
  }

  ## Security
  - Authenticated users can only check their own accounts
  - SECURITY DEFINER for cross-table checks
*/

CREATE OR REPLACE FUNCTION get_user_account_types()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  has_regular boolean := false;
  has_partner boolean := false;
  account_type text;
  reservation_count integer;
  partner_count integer;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'has_regular_account', false,
      'has_partner_account', false,
      'account_type', 'none'
    );
  END IF;

  -- Check for regular account (has reservations)
  SELECT COUNT(*) INTO reservation_count
  FROM reservations
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF reservation_count > 0 THEN
    has_regular := true;
  END IF;

  -- Check for partner account (linked to influencer_partners)
  SELECT COUNT(*) INTO partner_count
  FROM influencer_partners
  WHERE user_id = auth.uid()
    AND status = 'active'
    AND is_active = true
  LIMIT 1;

  IF partner_count > 0 THEN
    has_partner := true;
  END IF;

  -- Determine account type
  IF has_regular AND has_partner THEN
    account_type := 'both';
  ELSIF has_partner THEN
    account_type := 'partner';
  ELSIF has_regular THEN
    account_type := 'regular';
  ELSE
    account_type := 'none';
  END IF;

  RETURN jsonb_build_object(
    'has_regular_account', has_regular,
    'has_partner_account', has_partner,
    'account_type', account_type
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'has_regular_account', false,
      'has_partner_account', false,
      'account_type', 'none',
      'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION get_user_account_types IS 'Returns what types of accounts a user has (regular, partner, both, or none)';
