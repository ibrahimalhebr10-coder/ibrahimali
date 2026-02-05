/*
  # Finance System - Simple & Solid

  1. New Tables
    - `farm_financial_transactions`
      - Tracks all income/expense for each farm
      - Separated by path_type (agricultural/investment)
      - Simple: date, type, description, amount
    
    - `platform_wallet_transfers`
      - Tracks transfers from farms to platform wallet
      - Auto-splits: 75% platform / 25% charity
      - Immutable records (no edit/delete)
  
  2. Business Rules
    - Each farm = independent financial entity
    - Finance only tracks (no calculations)
    - Manual transfer to wallet
    - No automatic deductions
  
  3. Security
    - Admin-only access
    - RLS enabled on all tables
    - Immutable wallet transfers
*/

-- Farm Financial Transactions Table
CREATE TABLE IF NOT EXISTS farm_financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  path_type text NOT NULL CHECK (path_type IN ('agricultural', 'investment')),
  transaction_type text NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount decimal(12, 2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Platform Wallet Transfers Table
CREATE TABLE IF NOT EXISTS platform_wallet_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  transfer_amount decimal(12, 2) NOT NULL CHECK (transfer_amount > 0),
  platform_share decimal(12, 2) NOT NULL,
  charity_share decimal(12, 2) NOT NULL,
  transferred_by uuid NOT NULL REFERENCES auth.users(id),
  transferred_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_farm_financial_transactions_farm_id ON farm_financial_transactions(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_financial_transactions_path_type ON farm_financial_transactions(path_type);
CREATE INDEX IF NOT EXISTS idx_platform_wallet_transfers_farm_id ON platform_wallet_transfers(farm_id);

-- Enable RLS
ALTER TABLE farm_financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_wallet_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
CREATE POLICY "Admins can view all financial transactions"
  ON farm_financial_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert financial transactions"
  ON farm_financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update financial transactions"
  ON farm_financial_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete financial transactions"
  ON farm_financial_transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all wallet transfers"
  ON platform_wallet_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert wallet transfers"
  ON platform_wallet_transfers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Helper Function: Get Farm Balance
CREATE OR REPLACE FUNCTION get_farm_balance(p_farm_id uuid, p_path_type text DEFAULT NULL)
RETURNS TABLE (
  total_income decimal,
  total_expenses decimal,
  current_balance decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END), 0) as current_balance
  FROM farm_financial_transactions
  WHERE farm_id = p_farm_id
    AND (p_path_type IS NULL OR path_type = p_path_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Get Platform Wallet Summary
CREATE OR REPLACE FUNCTION get_platform_wallet_summary()
RETURNS TABLE (
  total_transferred decimal,
  platform_balance decimal,
  charity_balance decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(transfer_amount), 0) as total_transferred,
    COALESCE(SUM(platform_share), 0) as platform_balance,
    COALESCE(SUM(charity_share), 0) as charity_balance
  FROM platform_wallet_transfers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Transfer to Platform Wallet
CREATE OR REPLACE FUNCTION transfer_to_platform_wallet(
  p_farm_id uuid,
  p_amount decimal
)
RETURNS jsonb AS $$
DECLARE
  v_current_balance decimal;
  v_platform_share decimal;
  v_charity_share decimal;
  v_transfer_id uuid;
BEGIN
  -- Get current farm balance
  SELECT current_balance INTO v_current_balance
  FROM get_farm_balance(p_farm_id);
  
  -- Validate sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'رصيد المزرعة غير كافٍ'
    );
  END IF;
  
  -- Calculate splits
  v_platform_share := p_amount * 0.75;
  v_charity_share := p_amount * 0.25;
  
  -- Create wallet transfer record
  INSERT INTO platform_wallet_transfers (
    farm_id,
    transfer_amount,
    platform_share,
    charity_share,
    transferred_by
  ) VALUES (
    p_farm_id,
    p_amount,
    v_platform_share,
    v_charity_share,
    auth.uid()
  ) RETURNING id INTO v_transfer_id;
  
  -- Deduct from farm balance (create expense transaction)
  INSERT INTO farm_financial_transactions (
    farm_id,
    path_type,
    transaction_type,
    amount,
    description,
    created_by
  ) VALUES (
    p_farm_id,
    'investment', -- Default to investment, can be adjusted
    'expense',
    p_amount,
    'تحويل فائض مالي إلى محفظة المنصة',
    auth.uid()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'platform_share', v_platform_share,
    'charity_share', v_charity_share
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
