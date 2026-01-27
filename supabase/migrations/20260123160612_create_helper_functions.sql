/*
  # Helper Functions for Investment Platform

  Creates database functions to help with common operations:
  1. increment_user_investment - Updates user profile when investment is made
  2. calculate_investment_returns - Helper to calculate expected returns
*/

-- Function to increment user's total investment
CREATE OR REPLACE FUNCTION increment_user_investment(
  user_id uuid,
  amount_to_add decimal
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, total_invested)
  VALUES (user_id, '', amount_to_add)
  ON CONFLICT (id)
  DO UPDATE SET
    total_invested = user_profiles.total_invested + amount_to_add,
    updated_at = now();
END;
$$;

-- Function to calculate expected return for an investment
CREATE OR REPLACE FUNCTION calculate_expected_return(
  investment_amount decimal,
  annual_return_rate decimal,
  duration_months integer DEFAULT 12
)
RETURNS decimal
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (investment_amount * annual_return_rate / 100) * (duration_months / 12.0);
END;
$$;