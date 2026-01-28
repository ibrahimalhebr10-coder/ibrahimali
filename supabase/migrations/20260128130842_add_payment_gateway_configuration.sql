/*
  # Add Payment Gateway Configuration Fields

  1. Changes to `payment_methods` Table
    - Add `gateway_config` JSONB column for gateway-specific configuration
    - Add `is_gateway` boolean to differentiate gateways from manual methods
    - Add validation for gateway configuration

  2. Gateway Configuration Structure
    - For Mada (مدى):
      - merchant_id
      - api_key
      - environment (sandbox/production)

    - For Tabby (تابي):
      - merchant_id
      - api_key
      - environment (sandbox/production)

    - For Tamara (تمارا):
      - merchant_id
      - api_key
      - environment (sandbox/production)

  3. Notes
    - Gateway activation is disabled for now (is_active = false by default)
    - Configuration fields are stored but not yet functional
    - Ready for future integration when needed
*/

-- Add new columns to payment_methods table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_methods' AND column_name = 'is_gateway'
  ) THEN
    ALTER TABLE payment_methods ADD COLUMN is_gateway BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_methods' AND column_name = 'gateway_config'
  ) THEN
    ALTER TABLE payment_methods ADD COLUMN gateway_config JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update existing payment methods
UPDATE payment_methods
SET is_gateway = CASE
  WHEN method_type IN ('mada', 'tabby', 'tamara') THEN true
  ELSE false
END
WHERE is_gateway IS NULL;

-- Add comment to explain gateway_config structure
COMMENT ON COLUMN payment_methods.gateway_config IS
'Gateway configuration in JSON format:
{
  "merchant_id": "string",
  "api_key": "string",
  "environment": "sandbox|production",
  "webhook_secret": "string (optional)"
}';

-- Add check constraint for environment values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_gateway_environment'
  ) THEN
    ALTER TABLE payment_methods
    ADD CONSTRAINT valid_gateway_environment
    CHECK (
      gateway_config->>'environment' IS NULL OR
      gateway_config->>'environment' IN ('sandbox', 'production')
    );
  END IF;
END $$;