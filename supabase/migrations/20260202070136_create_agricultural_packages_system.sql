/*
  # Create Agricultural Packages System
  
  1. New Tables
    - `agricultural_packages`
      - `id` (uuid, primary key)
      - `contract_id` (uuid, references farm_contracts)
      - `package_name` (text) - عنوان الباقة
      - `price_per_tree` (integer) - السعر للشجرة الواحدة
      - `motivational_text` (text) - النص التحفيزي
      - `description` (text) - تعريف الباقة
      - `what_is_included` (jsonb) - ماذا يشمل السعر (array of strings)
      - `base_duration_info` (text) - معلومات مدة الانتفاع
      - `free_years_info` (text) - كيف تعمل السنوات المجانية
      - `features` (jsonb) - مميزات الباقة (array of strings)
      - `conditions` (jsonb) - شروط الباقة (array of strings)
      - `management_info` (text) - كيفية الإدارة من المنصة
      - `is_active` (boolean) - هل الباقة مفعلة
      - `sort_order` (integer) - ترتيب العرض
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on `agricultural_packages` table
    - Add policies for public read access to active packages
    - Add policies for authenticated admins to manage packages
*/

CREATE TABLE IF NOT EXISTS agricultural_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES farm_contracts(id) ON DELETE CASCADE,
  package_name text NOT NULL,
  price_per_tree integer NOT NULL,
  motivational_text text,
  description text NOT NULL,
  what_is_included jsonb DEFAULT '[]'::jsonb,
  base_duration_info text,
  free_years_info text,
  features jsonb DEFAULT '[]'::jsonb,
  conditions jsonb DEFAULT '[]'::jsonb,
  management_info text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agricultural_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active agricultural packages"
  ON agricultural_packages FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can insert agricultural packages"
  ON agricultural_packages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update agricultural packages"
  ON agricultural_packages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete agricultural packages"
  ON agricultural_packages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- Seed default packages for the existing agricultural contracts
DO $$
DECLARE
  v_contract_1_year uuid;
  v_contract_4_years uuid;
BEGIN
  -- Get contract IDs for the test farm
  SELECT id INTO v_contract_1_year
  FROM farm_contracts
  WHERE contract_name = 'عقد سنة'
  LIMIT 1;
  
  SELECT id INTO v_contract_4_years
  FROM farm_contracts
  WHERE contract_name = 'عقد 4 سنوات'
  LIMIT 1;
  
  -- Insert package for 1-year contract
  IF v_contract_1_year IS NOT NULL THEN
    INSERT INTO agricultural_packages (
      contract_id,
      package_name,
      price_per_tree,
      motivational_text,
      description,
      what_is_included,
      base_duration_info,
      free_years_info,
      features,
      conditions,
      management_info,
      is_active,
      sort_order
    ) VALUES (
      v_contract_1_year,
      'عقد سنة',
      197,
      'إضافة 3 سنوات مجانًا',
      'باقة محصولي الزراعي لمدة سنة واحدة مع مكافأة 3 سنوات إضافية مجانية. امتلك أشجارك واستمتع بمحصولها السنوي.',
      '["ملكية الأشجار المختارة", "رعاية وصيانة كاملة", "استلام المحصول السنوي", "متابعة عبر التطبيق", "تقارير دورية عن أشجارك"]'::jsonb,
      'مدة العقد الأساسية سنة واحدة من تاريخ التوقيع والدفع',
      'عند إتمام السنة الأولى بنجاح، تحصل تلقائياً على 3 سنوات إضافية من الانتفاع بالمحصول دون أي رسوم صيانة للسنة الأولى',
      '["السنة الأولى صيانة مجانية", "استلام محصول سنوي", "تقارير مصورة عن أشجارك", "دعم فني مباشر", "إمكانية زيارة المزرعة"]'::jsonb,
      '["الالتزام بدفع رسوم الصيانة السنوية بعد السنة الأولى", "لا يمكن نقل ملكية الأشجار للغير", "استلام المحصول وفق جدول الموسم الزراعي", "الالتزام بسياسات المنصة"]'::jsonb,
      'تُدار هذه الباقة بالكامل عبر المنصة. يمكنك متابعة أشجارك، استلام إشعارات المحصول، والتواصل مع فريق المزرعة مباشرة من خلال حسابك الشخصي.',
      true,
      1
    );
  END IF;
  
  -- Insert package for 4-years contract
  IF v_contract_4_years IS NOT NULL THEN
    INSERT INTO agricultural_packages (
      contract_id,
      package_name,
      price_per_tree,
      motivational_text,
      description,
      what_is_included,
      base_duration_info,
      free_years_info,
      features,
      conditions,
      management_info,
      is_active,
      sort_order
    ) VALUES (
      v_contract_4_years,
      'عقد 4 سنوات',
      750,
      'خطة طويلة الأمد مع مزايا إضافية',
      'باقة محصولي الزراعي لمدة 4 سنوات كاملة. استثمر في مستقبلك الزراعي واحصل على محصول مستمر لأربع سنوات.',
      '["ملكية الأشجار لمدة 4 سنوات", "رعاية وصيانة شاملة", "استلام المحصول السنوي لـ 4 مواسم", "متابعة مستمرة عبر التطبيق", "تقارير تفصيلية ربع سنوية"]'::jsonb,
      'مدة العقد 4 سنوات كاملة من تاريخ التوقيع والدفع',
      'هذه الباقة لا تشمل سنوات مجانية إضافية، لكنها توفر لك استقراراً طويل الأمد وأولوية في الخدمات',
      '["السنة الأولى صيانة مجانية", "استلام محصول سنوي لـ 4 مواسم", "تقارير ربع سنوية مصورة", "دعم فني مخصص", "أولوية في زيارات المزرعة", "خصم على الباقات المستقبلية"]'::jsonb,
      '["الالتزام بدفع رسوم الصيانة السنوية بعد السنة الأولى", "العقد ملزم لمدة 4 سنوات", "لا يمكن الانسحاب قبل انتهاء المدة", "استلام المحصول وفق جدول الموسم الزراعي", "الالتزام بسياسات المنصة"]'::jsonb,
      'تُدار هذه الباقة بالكامل عبر المنصة. يمكنك متابعة أشجارك، استلام إشعارات المحصول، والتواصل مع فريق المزرعة مباشرة من خلال حسابك الشخصي. ستحصل على اهتمام خاص كعميل طويل الأمد.',
      true,
      2
    );
  END IF;
END $$;
