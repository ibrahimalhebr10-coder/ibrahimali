/*
  # Create Messaging Channels Infrastructure
  
  ## Purpose
  This migration creates the infrastructure for integrating external messaging providers
  (SMS and WhatsApp Business API) with the platform. It prepares the system for future
  integration with messaging service providers without requiring code changes.
  
  ## New Tables
  
  ### 1. `messaging_providers`
  Stores configuration for external messaging service providers.
  
  - `id` (uuid, primary key)
  - `channel_type` (text) - Type of channel: 'sms', 'whatsapp_business', 'email'
  - `provider_name` (text) - Name of the provider (e.g., 'Twilio', 'Unifonic', 'MessageBird')
  - `is_active` (boolean) - Whether this provider is currently active
  - `is_default` (boolean) - Whether this is the default provider for its channel type
  - `config` (jsonb) - Provider-specific configuration (API keys, endpoints, etc.)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `created_by` (uuid, references admins)
  - `updated_by` (uuid, references admins)
  
  ### 2. `messaging_channel_stats`
  Tracks usage statistics for each messaging channel.
  
  - `id` (uuid, primary key)
  - `provider_id` (uuid, references messaging_providers)
  - `messages_sent` (integer) - Total messages sent
  - `messages_delivered` (integer) - Successfully delivered messages
  - `messages_failed` (integer) - Failed messages
  - `last_sent_at` (timestamptz) - Last time a message was sent
  - `month` (date) - Month for this stat record
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## Configuration Schema Examples
  
  ### SMS Provider Configuration
  ```json
  {
    "api_base_url": "https://api.provider.com/v1",
    "api_key": "encrypted_key",
    "sender_id": "FARMNAME",
    "delivery_report_endpoint": "/webhook/sms/delivery",
    "supports_unicode": true,
    "max_message_length": 160
  }
  ```
  
  ### WhatsApp Business API Configuration
  ```json
  {
    "api_base_url": "https://api.whatsapp.com/v1",
    "api_key": "encrypted_key",
    "phone_number_id": "123456789",
    "business_account_id": "987654321",
    "webhook_verify_token": "encrypted_token",
    "webhook_endpoint": "/webhook/whatsapp/messages"
  }
  ```
  
  ## Security
  - Enable RLS on all tables
  - Only super_admin can create/update/delete providers
  - All admins can read provider configurations (but sensitive data should be masked in the app)
  - Stats are readable by all admins
  
  ## Notes
  1. API keys and sensitive data in the config field should be encrypted before storage
  2. Only one provider per channel_type can be set as default
  3. Stats are tracked monthly for reporting purposes
*/

-- Create messaging_providers table
CREATE TABLE IF NOT EXISTS messaging_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type text NOT NULL CHECK (channel_type IN ('sms', 'whatsapp_business', 'email')),
  provider_name text NOT NULL,
  is_active boolean DEFAULT false,
  is_default boolean DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES admins(id),
  updated_by uuid REFERENCES admins(id),
  UNIQUE(channel_type, provider_name)
);

-- Create messaging_channel_stats table
CREATE TABLE IF NOT EXISTS messaging_channel_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES messaging_providers(id) ON DELETE CASCADE,
  messages_sent integer DEFAULT 0,
  messages_delivered integer DEFAULT 0,
  messages_failed integer DEFAULT 0,
  last_sent_at timestamptz,
  month date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, month)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messaging_providers_channel_type ON messaging_providers(channel_type);
CREATE INDEX IF NOT EXISTS idx_messaging_providers_is_active ON messaging_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_messaging_providers_is_default ON messaging_providers(is_default);
CREATE INDEX IF NOT EXISTS idx_messaging_channel_stats_provider_id ON messaging_channel_stats(provider_id);
CREATE INDEX IF NOT EXISTS idx_messaging_channel_stats_month ON messaging_channel_stats(month);

-- Enable RLS
ALTER TABLE messaging_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_channel_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messaging_providers

-- Super admin can do everything
CREATE POLICY "Super admin can manage messaging providers"
  ON messaging_providers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles r ON a.role_id = r.id
      WHERE a.user_id = auth.uid()
      AND r.role_key = 'super_admin'
      AND a.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles r ON a.role_id = r.id
      WHERE a.user_id = auth.uid()
      AND r.role_key = 'super_admin'
      AND a.is_active = true
    )
  );

-- All active admins can read providers
CREATE POLICY "Active admins can view messaging providers"
  ON messaging_providers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- RLS Policies for messaging_channel_stats

-- Super admin can manage stats
CREATE POLICY "Super admin can manage messaging stats"
  ON messaging_channel_stats
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles r ON a.role_id = r.id
      WHERE a.user_id = auth.uid()
      AND r.role_key = 'super_admin'
      AND a.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles r ON a.role_id = r.id
      WHERE a.user_id = auth.uid()
      AND r.role_key = 'super_admin'
      AND a.is_active = true
    )
  );

-- All active admins can read stats
CREATE POLICY "Active admins can view messaging stats"
  ON messaging_channel_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messaging_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_messaging_providers_updated_at
  BEFORE UPDATE ON messaging_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_messaging_providers_updated_at();

-- Function to ensure only one default provider per channel type
CREATE OR REPLACE FUNCTION ensure_single_default_provider()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE messaging_providers
    SET is_default = false
    WHERE channel_type = NEW.channel_type
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_provider
  BEFORE INSERT OR UPDATE ON messaging_providers
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_provider();
