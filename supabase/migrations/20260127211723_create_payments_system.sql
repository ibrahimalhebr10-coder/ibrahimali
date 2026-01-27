/*
  # Create Payments System

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `reservation_id` (uuid, foreign key to reservations)
      - `user_id` (uuid, references auth.users)
      - `farm_id` (integer, matches reservations.farm_id type)
      - `amount` (numeric, total payment amount)
      - `payment_method` (text, e.g., 'mada', 'tabby', 'tamara')
      - `payment_status` (text, 'waiting_for_payment', 'paid', 'failed', 'refunded')
      - `transaction_id` (text, unique transaction reference from payment gateway)
      - `payment_date` (timestamptz, when payment was completed)
      - `gateway_response` (jsonb, full response from payment gateway)
      - `metadata` (jsonb, additional payment information)
      - `created_at` (timestamptz, when payment record was created)
      - `updated_at` (timestamptz, last update timestamp)

  2. Security
    - Enable RLS on `payments` table
    - Admins can view all payments
    - Users can only view their own payments
    - Only authenticated users can insert/update payments (via service)

  3. Important Notes
    - Each payment is linked to exactly one reservation
    - Each reservation is linked to exactly one farm
    - Payment status flow: waiting_for_payment → paid OR failed
    - Admins can only VIEW payments, not modify reservations
    - Finance section is read-only for operational data
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  farm_id integer NOT NULL,
  farm_name text NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('mada', 'tabby', 'tamara')),
  payment_status text NOT NULL DEFAULT 'waiting_for_payment' CHECK (payment_status IN ('waiting_for_payment', 'paid', 'failed', 'refunded')),
  transaction_id text UNIQUE,
  payment_date timestamptz,
  gateway_response jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_farm_id ON payments(farm_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_payment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_timestamp
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_timestamp();

COMMENT ON TABLE payments IS 'Stores all payment transactions for reservations';
COMMENT ON COLUMN payments.reservation_id IS 'Links payment to specific reservation';
COMMENT ON COLUMN payments.payment_method IS 'Payment gateway used: mada, tabby, or tamara';
COMMENT ON COLUMN payments.payment_status IS 'Current status: waiting_for_payment, paid, failed, or refunded';
COMMENT ON COLUMN payments.transaction_id IS 'Unique transaction ID from payment gateway';
COMMENT ON COLUMN payments.gateway_response IS 'Full JSON response from payment gateway';
