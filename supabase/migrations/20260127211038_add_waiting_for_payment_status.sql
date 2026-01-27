/*
  # Add Waiting for Payment Status

  1. Changes
    - Add 'waiting_for_payment' status to reservations table
    - This status is automatically set when admin approves a reservation
    - It indicates the reservation is approved and waiting for customer payment

  2. Status Flow
    - pending → waiting_for_payment (when admin approves)
    - waiting_for_payment → paid (when customer completes payment)
    - pending → cancelled (when admin cancels)

  3. Notes
    - No payment options are shown before admin approval
    - Payment options are only available for 'waiting_for_payment' status
*/

DO $$
BEGIN
  ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

  ALTER TABLE reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('pending', 'waiting_for_payment', 'paid', 'cancelled'));
END $$;
