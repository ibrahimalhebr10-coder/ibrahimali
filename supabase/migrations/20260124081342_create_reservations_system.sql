/*
  # إنشاء نظام الحجوزات

  1. جداول جديدة
    - `reservations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `farm_id` (integer, references farms)
      - `total_trees` (integer)
      - `total_price` (decimal)
      - `status` (text) - حالة الحجز
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `reservation_items`
      - `id` (uuid, primary key)
      - `reservation_id` (uuid, references reservations)
      - `variety_name` (text)
      - `type_name` (text)
      - `quantity` (integer)
      - `price_per_tree` (decimal)
      - `created_at` (timestamp)
  
  2. الأمان
    - تفعيل RLS على جميع الجداول
    - المستخدمون يمكنهم قراءة حجوزاتهم فقط
    - المستخدمون يمكنهم إنشاء حجوزات جديدة
    
  3. ملاحظات مهمة
    - الحجز يبدأ بحالة "pending" (بانتظار الاكتمال)
    - كل حجز مرتبط بمستخدم ومزرعة
    - تفاصيل الأشجار محفوظة في جدول منفصل
*/

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  farm_id integer NOT NULL,
  farm_name text NOT NULL,
  total_trees integer NOT NULL CHECK (total_trees > 0),
  total_price decimal(10,2) NOT NULL CHECK (total_price >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reservation_items table
CREATE TABLE IF NOT EXISTS reservation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  variety_name text NOT NULL,
  type_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_per_tree decimal(10,2) NOT NULL CHECK (price_per_tree >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_farm_id ON reservations(farm_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation_id ON reservation_items(reservation_id);

-- Enable RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;

-- Reservations policies
CREATE POLICY "Users can view their own reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reservation items policies
CREATE POLICY "Users can view their reservation items"
  ON reservation_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = reservation_items.reservation_id
      AND reservations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reservation items"
  ON reservation_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = reservation_items.reservation_id
      AND reservations.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
