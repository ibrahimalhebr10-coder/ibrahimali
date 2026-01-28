/*
  # Add Payment Duplicate Prevention

  1. New Constraints
    - Prevent multiple approved receipts for same reservation
    - Prevent uploading receipt if reservation already has approved payment

  2. New Function
    - `check_duplicate_payment()` - Validates before receipt upload

  3. Security Improvements
    - Ensure only one successful payment per reservation
    - Clear error messages for duplicate attempts

  4. Notes
    - This prevents investors from paying twice
    - This prevents uploading receipt if already paid
*/

-- Create function to check for duplicate payments
CREATE OR REPLACE FUNCTION check_duplicate_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_reservation_status TEXT;
BEGIN
  -- Check if reservation already has an approved payment receipt
  IF EXISTS (
    SELECT 1 FROM payment_receipts
    WHERE reservation_id = NEW.reservation_id
    AND status = 'approved'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'لا يمكن رفع إيصال جديد. يوجد إيصال معتمد مسبقاً لهذا الحجز';
  END IF;

  -- Check reservation status
  SELECT status INTO v_reservation_status
  FROM reservations
  WHERE id = NEW.reservation_id;

  IF v_reservation_status = 'paid' THEN
    RAISE EXCEPTION 'هذا الحجز مدفوع بالفعل. لا يمكن رفع إيصال جديد';
  END IF;

  IF v_reservation_status NOT IN ('waiting_for_payment', 'pending') THEN
    RAISE EXCEPTION 'لا يمكن رفع إيصال لحجز بهذه الحالة';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to prevent duplicate payments
DROP TRIGGER IF EXISTS prevent_duplicate_payment ON payment_receipts;
CREATE TRIGGER prevent_duplicate_payment
  BEFORE INSERT ON payment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_payment();

-- Add unique constraint to prevent multiple approved receipts per reservation
DROP INDEX IF EXISTS one_approved_receipt_per_reservation;
CREATE UNIQUE INDEX one_approved_receipt_per_reservation
ON payment_receipts (reservation_id)
WHERE status = 'approved';