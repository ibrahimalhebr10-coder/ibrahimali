/*
  # إنشاء نظام عرض المزارع الديناميكي

  1. جداول جديدة
    - `farm_display_categories`
      - أقسام المزارع (زيتون، نخيل، عنب، إلخ)
    
    - `farm_display_projects`
      - المزارع الفعلية للعرض
    
    - `farm_tree_types`
      - أنواع الأشجار في كل مزرعة
    
    - `farm_tree_varieties`
      - أصناف الأشجار لكل نوع
  
  2. الأمان
    - جميع الجداول للقراءة العامة فقط
  
  3. ملاحظات مهمة
    - نظام ديناميكي كامل لإدارة عرض المزارع
    - سهولة الإضافة والتعديل
    - دعم ترتيب مخصص
*/

-- Create farm_display_categories table
CREATE TABLE IF NOT EXISTS farm_display_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  icon text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create farm_display_projects table
CREATE TABLE IF NOT EXISTS farm_display_projects (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_slug text REFERENCES farm_display_categories(slug) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  image text NOT NULL,
  video text,
  location text,
  map_url text DEFAULT '#',
  return_rate text NOT NULL,
  available_trees integer NOT NULL DEFAULT 0 CHECK (available_trees >= 0),
  reserved_trees integer NOT NULL DEFAULT 0 CHECK (reserved_trees >= 0),
  marketing_message text,
  active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create farm_tree_types table
CREATE TABLE IF NOT EXISTS farm_tree_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id integer REFERENCES farm_display_projects(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create farm_tree_varieties table
CREATE TABLE IF NOT EXISTS farm_tree_varieties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_type_id uuid REFERENCES farm_tree_types(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  icon text NOT NULL,
  available integer NOT NULL DEFAULT 0 CHECK (available >= 0),
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farm_display_categories_slug ON farm_display_categories(slug);
CREATE INDEX IF NOT EXISTS idx_farm_display_categories_active ON farm_display_categories(active);
CREATE INDEX IF NOT EXISTS idx_farm_display_projects_category_slug ON farm_display_projects(category_slug);
CREATE INDEX IF NOT EXISTS idx_farm_display_projects_active ON farm_display_projects(active);
CREATE INDEX IF NOT EXISTS idx_farm_tree_types_farm_id ON farm_tree_types(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_tree_varieties_tree_type_id ON farm_tree_varieties(tree_type_id);

-- Enable RLS
ALTER TABLE farm_display_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_display_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_tree_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_tree_varieties ENABLE ROW LEVEL SECURITY;

-- Public read-only policies
CREATE POLICY "Anyone can view active farm display categories"
  ON farm_display_categories FOR SELECT
  USING (active = true);

CREATE POLICY "Anyone can view active farm display projects"
  ON farm_display_projects FOR SELECT
  USING (active = true);

CREATE POLICY "Anyone can view farm tree types"
  ON farm_tree_types FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM farm_display_projects
      WHERE farm_display_projects.id = farm_tree_types.farm_id
      AND farm_display_projects.active = true
    )
  );

CREATE POLICY "Anyone can view farm tree varieties"
  ON farm_tree_varieties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM farm_tree_types
      INNER JOIN farm_display_projects ON farm_display_projects.id = farm_tree_types.farm_id
      WHERE farm_tree_types.id = farm_tree_varieties.tree_type_id
      AND farm_display_projects.active = true
    )
  );
