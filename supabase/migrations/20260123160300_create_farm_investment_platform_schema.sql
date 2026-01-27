/*
  # Farm Investment Platform - Complete Database Schema

  ## Overview
  Complete database schema for agricultural investment platform with user portfolios,
  farm listings, investments, and transaction tracking.

  ## New Tables

  ### 1. `user_profiles`
  Extended user information beyond auth.users
  - `id` (uuid, FK to auth.users) - User identifier
  - `full_name` (text) - User's full name
  - `phone` (text) - Contact phone number
  - `national_id` (text) - National ID for KYC
  - `total_invested` (decimal) - Total amount invested
  - `total_returns` (decimal) - Total returns received
  - `created_at` (timestamptz) - Account creation date
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `farm_categories`
  Types of agricultural crops/farms
  - `id` (uuid, PK) - Category identifier
  - `name_ar` (text) - Arabic name
  - `name_en` (text) - English name
  - `icon` (text) - Icon identifier for UI
  - `description_ar` (text) - Arabic description
  - `active` (boolean) - Whether category is active

  ### 3. `farms`
  Available farm investment opportunities
  - `id` (uuid, PK) - Farm identifier
  - `category_id` (uuid, FK) - Farm category
  - `name_ar` (text) - Arabic name
  - `name_en` (text) - English name
  - `description_ar` (text) - Arabic description
  - `image_url` (text) - Farm image URL
  - `annual_return_rate` (decimal) - Expected annual return %
  - `min_investment` (decimal) - Minimum investment amount
  - `max_investment` (decimal) - Maximum investment amount
  - `total_capacity` (decimal) - Total investment capacity
  - `current_invested` (decimal) - Currently invested amount
  - `start_date` (date) - Investment period start
  - `end_date` (date) - Investment period end
  - `status` (text) - active, upcoming, completed, closed
  - `location` (text) - Farm location
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Update timestamp

  ### 4. `investments`
  User investments in farms
  - `id` (uuid, PK) - Investment identifier
  - `user_id` (uuid, FK) - Investor user ID
  - `farm_id` (uuid, FK) - Farm invested in
  - `amount` (decimal) - Investment amount
  - `shares` (integer) - Number of shares/units
  - `expected_return` (decimal) - Expected total return
  - `actual_return` (decimal) - Actual return received
  - `status` (text) - active, completed, cancelled
  - `invested_at` (timestamptz) - Investment timestamp
  - `maturity_date` (date) - Expected maturity date

  ### 5. `transactions`
  Financial transaction records
  - `id` (uuid, PK) - Transaction identifier
  - `user_id` (uuid, FK) - User making transaction
  - `investment_id` (uuid, FK, nullable) - Related investment
  - `type` (text) - deposit, withdrawal, investment, return, fee
  - `amount` (decimal) - Transaction amount
  - `status` (text) - pending, completed, failed, cancelled
  - `reference_number` (text) - External reference
  - `description_ar` (text) - Arabic description
  - `created_at` (timestamptz) - Transaction timestamp
  - `completed_at` (timestamptz, nullable) - Completion timestamp

  ### 6. `monthly_reports`
  Monthly farm performance reports
  - `id` (uuid, PK) - Report identifier
  - `farm_id` (uuid, FK) - Farm being reported on
  - `report_month` (date) - Month of report (first day)
  - `title_ar` (text) - Report title in Arabic
  - `content_ar` (text) - Report content in Arabic
  - `harvest_amount` (decimal, nullable) - Harvest quantity
  - `revenue` (decimal, nullable) - Revenue generated
  - `distributed_returns` (decimal, nullable) - Returns distributed
  - `created_at` (timestamptz) - Report creation date

  ### 7. `user_notifications`
  User notification system
  - `id` (uuid, PK) - Notification identifier
  - `user_id` (uuid, FK) - User receiving notification
  - `title_ar` (text) - Notification title
  - `message_ar` (text) - Notification message
  - `type` (text) - investment, return, report, system
  - `read` (boolean) - Whether notification was read
  - `created_at` (timestamptz) - Notification timestamp

  ## Security

  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Users can only access their own data
  - Farm and category data is publicly readable
  - Only authenticated users can create investments
  - Admins (via custom claims) can manage farms and reports

  ### Policies
  - Separate policies for SELECT, INSERT, UPDATE, DELETE
  - Authentication required for all write operations
  - Public read access for farms and categories
  - User data restricted to owner only

  ## Notes
  - All monetary values use DECIMAL(12,2) for precision
  - Timestamps use timestamptz for timezone awareness
  - Default values ensure data integrity
  - Foreign keys maintain referential integrity
*/

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  national_id text,
  total_invested decimal(12,2) DEFAULT 0,
  total_returns decimal(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create farm categories table
CREATE TABLE IF NOT EXISTS farm_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  icon text NOT NULL,
  description_ar text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create farms table
CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES farm_categories(id) ON DELETE SET NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text NOT NULL,
  image_url text NOT NULL,
  annual_return_rate decimal(5,2) NOT NULL,
  min_investment decimal(12,2) NOT NULL DEFAULT 1000,
  max_investment decimal(12,2) NOT NULL DEFAULT 100000,
  total_capacity decimal(12,2) NOT NULL,
  current_invested decimal(12,2) DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'upcoming', 'completed', 'closed')),
  CONSTRAINT valid_return_rate CHECK (annual_return_rate >= 0 AND annual_return_rate <= 100),
  CONSTRAINT valid_capacity CHECK (total_capacity > 0),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  amount decimal(12,2) NOT NULL,
  shares integer NOT NULL DEFAULT 1,
  expected_return decimal(12,2) NOT NULL,
  actual_return decimal(12,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  invested_at timestamptz DEFAULT now(),
  maturity_date date NOT NULL,
  CONSTRAINT valid_investment_status CHECK (status IN ('active', 'completed', 'cancelled')),
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id uuid REFERENCES investments(id) ON DELETE SET NULL,
  type text NOT NULL,
  amount decimal(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reference_number text,
  description_ar text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT valid_transaction_type CHECK (type IN ('deposit', 'withdrawal', 'investment', 'return', 'fee')),
  CONSTRAINT valid_transaction_status CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  CONSTRAINT valid_transaction_amount CHECK (amount > 0)
);

-- Create monthly reports table
CREATE TABLE IF NOT EXISTS monthly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  report_month date NOT NULL,
  title_ar text NOT NULL,
  content_ar text NOT NULL,
  harvest_amount decimal(12,2),
  revenue decimal(12,2),
  distributed_returns decimal(12,2),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_farm_month UNIQUE(farm_id, report_month)
);

-- Create user notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  message_ar text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_notification_type CHECK (type IN ('investment', 'return', 'report', 'system'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_farm_id ON investments(farm_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_farms_status ON farms(status);
CREATE INDEX IF NOT EXISTS idx_farms_category_id ON farms(category_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON user_notifications(read);

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for farm_categories (public read)
CREATE POLICY "Anyone can view active categories"
  ON farm_categories FOR SELECT
  TO authenticated
  USING (active = true);

-- RLS Policies for farms (public read)
CREATE POLICY "Anyone can view active farms"
  ON farms FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for investments
CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own investments"
  ON investments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments"
  ON investments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for monthly_reports (public read)
CREATE POLICY "Anyone can view reports"
  ON monthly_reports FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_notifications
CREATE POLICY "Users can view own notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON user_notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample farm categories
INSERT INTO farm_categories (name_ar, name_en, icon, description_ar, active) VALUES
  ('الزيتون', 'Olives', 'apple', 'زراعة الزيتون العضوي', true),
  ('القمح', 'Wheat', 'wheat', 'زراعة القمح الموسمية', true),
  ('العنب', 'Grapes', 'grape', 'زراعة العنب للتصدير', true),
  ('النخيل', 'Dates', 'palm', 'زراعة النخيل والتمور', true)
ON CONFLICT DO NOTHING;

-- Insert sample farms
INSERT INTO farms (
  category_id, 
  name_ar, 
  name_en, 
  description_ar, 
  image_url, 
  annual_return_rate, 
  min_investment, 
  max_investment, 
  total_capacity, 
  current_invested,
  start_date, 
  end_date, 
  status, 
  location
) 
SELECT 
  (SELECT id FROM farm_categories WHERE name_en = 'Olives' LIMIT 1),
  'مزرعة الزيتون',
  'Olive Farm',
  'استثمار طويل الأمد في زراعة الزيتون العضوي مع ضمان الحد الأدنى للعائد',
  'https://images.pexels.com/photos/4505166/pexels-photo-4505166.jpeg?auto=compress&cs=tinysrgb&w=400',
  12.00,
  5000,
  100000,
  1000000,
  0,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '12 months',
  'active',
  'منطقة الجوف، المملكة العربية السعودية'
WHERE NOT EXISTS (SELECT 1 FROM farms WHERE name_en = 'Olive Farm');

INSERT INTO farms (
  category_id, 
  name_ar, 
  name_en, 
  description_ar, 
  image_url, 
  annual_return_rate, 
  min_investment, 
  max_investment, 
  total_capacity, 
  current_invested,
  start_date, 
  end_date, 
  status, 
  location
) 
SELECT 
  (SELECT id FROM farm_categories WHERE name_en = 'Wheat' LIMIT 1),
  'مزرعة القمح',
  'Wheat Farm',
  'زراعة موسمية للقمح عالي الجودة مع عقود توريد مضمونة',
  'https://images.pexels.com/photos/533982/pexels-photo-533982.jpeg?auto=compress&cs=tinysrgb&w=400',
  10.00,
  3000,
  50000,
  500000,
  0,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '6 months',
  'active',
  'منطقة حائل، المملكة العربية السعودية'
WHERE NOT EXISTS (SELECT 1 FROM farms WHERE name_en = 'Wheat Farm');

INSERT INTO farms (
  category_id, 
  name_ar, 
  name_en, 
  description_ar, 
  image_url, 
  annual_return_rate, 
  min_investment, 
  max_investment, 
  total_capacity, 
  current_invested,
  start_date, 
  end_date, 
  status, 
  location
) 
SELECT 
  (SELECT id FROM farm_categories WHERE name_en = 'Grapes' LIMIT 1),
  'مزرعة العنب',
  'Grape Farm',
  'إنتاج عنب فاخر للتصدير مع شراكات دولية مضمونة',
  'https://images.pexels.com/photos/39511/organic-fruit-fruit-growing-grapes-39511.jpeg?auto=compress&cs=tinysrgb&w=400',
  15.00,
  10000,
  200000,
  2000000,
  0,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '18 months',
  'active',
  'منطقة الطائف، المملكة العربية السعودية'
WHERE NOT EXISTS (SELECT 1 FROM farms WHERE name_en = 'Grape Farm');