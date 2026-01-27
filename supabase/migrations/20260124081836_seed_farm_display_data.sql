/*
  # إضافة بيانات تجريبية لنظام عرض المزارع

  1. البيانات المضافة
    - 4 أقسام مزارع
    - 8 مزارع (مزرعتان لكل قسم)
    - أنواع وأصناف الأشجار للمزرعة الأولى

  2. ملاحظات
    - البيانات التجريبية من التصميم الحالي
    - قابلة للتعديل والتوسيع من قاعدة البيانات
*/

-- Insert farm display categories
INSERT INTO farm_display_categories (slug, name, icon, order_index) VALUES
  ('olive', 'أشجار زيتون', 'Leaf', 0),
  ('wheat', 'أشجار نخيل', 'Wheat', 1),
  ('grape', 'أشجار الموز', 'Grape', 2),
  ('palm', 'أشجار المنجا', 'Apple', 3)
ON CONFLICT (slug) DO NOTHING;

-- Insert olive farms
INSERT INTO farm_display_projects (
  category_slug, name, description, image, video, location, map_url, 
  return_rate, available_trees, reserved_trees, marketing_message, order_index
) VALUES
  (
    'olive',
    'مزرعة الزيتون الأولى',
    'استثمار طويل الأمد في زراعة الزيتون العضوي مع ضمان الحد الأدنى للعائد',
    'https://images.pexels.com/photos/4505166/pexels-photo-4505166.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://example.com/video.mp4',
    'الجوف، السعودية',
    '#',
    '12%',
    250,
    750,
    '🎯 فرصة استثمارية مميزة | عوائد مضمونة',
    0
  ),
  (
    'olive',
    'مزرعة الزيتون الثانية',
    'مزرعة زيتون متطورة بتقنيات ري حديثة وعائد مرتفع',
    'https://images.pexels.com/photos/6129007/pexels-photo-6129007.jpeg?auto=compress&cs=tinysrgb&w=400',
    NULL,
    NULL,
    '#',
    '13%',
    180,
    320,
    '⚡ احجز نصيبك الآن | العرض ينتهي قريباً',
    1
  );

-- Insert wheat (palm) farms
INSERT INTO farm_display_projects (
  category_slug, name, description, image, return_rate, 
  available_trees, reserved_trees, marketing_message, order_index
) VALUES
  (
    'wheat',
    'مزرعة القمح الأولى',
    'زراعة موسمية للقمح عالي الجودة مع عقود توريد مضمونة',
    'https://images.pexels.com/photos/533982/pexels-photo-533982.jpeg?auto=compress&cs=tinysrgb&w=400',
    '10%',
    450,
    550,
    '💰 استثمر بذكاء | محصول موسمي مضمون',
    0
  ),
  (
    'wheat',
    'مزرعة القمح الثانية',
    'زراعة قمح عضوي بمساحات واسعة وإدارة احترافية',
    'https://images.pexels.com/photos/2253934/pexels-photo-2253934.jpeg?auto=compress&cs=tinysrgb&w=400',
    '11%',
    120,
    880,
    '🔥 الأكثر طلباً | فرصة محدودة',
    1
  );

-- Insert grape farms
INSERT INTO farm_display_projects (
  category_slug, name, description, image, return_rate, 
  available_trees, reserved_trees, marketing_message, order_index
) VALUES
  (
    'grape',
    'مزرعة العنب الأولى',
    'إنتاج عنب فاخر للتصدير مع شراكات دولية مضمونة',
    'https://images.pexels.com/photos/39511/organic-fruit-fruit-growing-grapes-39511.jpeg?auto=compress&cs=tinysrgb&w=400',
    '15%',
    90,
    410,
    '✨ جودة عالمية | شراكات دولية',
    0
  ),
  (
    'grape',
    'مزرعة العنب الثانية',
    'كروم عنب حديثة بأعلى معايير الجودة العالمية',
    'https://images.pexels.com/photos/1407846/pexels-photo-1407846.jpeg?auto=compress&cs=tinysrgb&w=400',
    '16%',
    200,
    300,
    '🌟 أعلى عائد | تقنيات متطورة',
    1
  );

-- Insert palm farms
INSERT INTO farm_display_projects (
  category_slug, name, description, image, return_rate, 
  available_trees, reserved_trees, marketing_message, order_index
) VALUES
  (
    'palm',
    'مزرعة النخيل الأولى',
    'زراعة نخيل فاخر بإنتاج تمور عالية الجودة',
    'https://images.pexels.com/photos/5966820/pexels-photo-5966820.jpeg?auto=compress&cs=tinysrgb&w=400',
    '14%',
    350,
    650,
    '🏆 تمور فاخرة | جودة استثنائية',
    0
  ),
  (
    'palm',
    'مزرعة النخيل الثانية',
    'مزارع نخيل واسعة مع تقنيات ري متطورة',
    'https://images.pexels.com/photos/3566187/pexels-photo-3566187.jpeg?auto=compress&cs=tinysrgb&w=400',
    '15%',
    80,
    920,
    '⏰ آخر الفرص | سارع بالحجز',
    1
  );

-- Insert tree types for the first olive farm (id = 1)
INSERT INTO farm_tree_types (farm_id, slug, name, order_index) VALUES
  (1, 'olive', 'الزيتون', 0),
  (1, 'palm', 'النخيل', 1),
  (1, 'grape', 'العنب', 2);

-- Get tree type IDs (we need to use a DO block to insert varieties)
DO $$
DECLARE
  olive_type_id uuid;
  palm_type_id uuid;
  grape_type_id uuid;
BEGIN
  -- Get olive type id
  SELECT id INTO olive_type_id FROM farm_tree_types WHERE farm_id = 1 AND slug = 'olive';
  
  -- Insert olive varieties
  IF olive_type_id IS NOT NULL THEN
    INSERT INTO farm_tree_varieties (tree_type_id, name, price, icon, available, order_index) VALUES
      (olive_type_id, 'زيتون مكثف', 15.00, '🫒', 100, 0),
      (olive_type_id, 'زيتون مخلل', 20.00, '🫒', 80, 1),
      (olive_type_id, 'زيتون زيتي', 10.00, '🫒', 70, 2);
  END IF;
  
  -- Get palm type id
  SELECT id INTO palm_type_id FROM farm_tree_types WHERE farm_id = 1 AND slug = 'palm';
  
  -- Insert palm varieties
  IF palm_type_id IS NOT NULL THEN
    INSERT INTO farm_tree_varieties (tree_type_id, name, price, icon, available, order_index) VALUES
      (palm_type_id, 'نخل سكري', 25.00, '🌴', 50, 0),
      (palm_type_id, 'نخل خلاص', 30.00, '🌴', 40, 1),
      (palm_type_id, 'نخل برحي', 20.00, '🌴', 60, 2);
  END IF;
  
  -- Get grape type id
  SELECT id INTO grape_type_id FROM farm_tree_types WHERE farm_id = 1 AND slug = 'grape';
  
  -- Insert grape varieties
  IF grape_type_id IS NOT NULL THEN
    INSERT INTO farm_tree_varieties (tree_type_id, name, price, icon, available, order_index) VALUES
      (grape_type_id, 'عنب أحمر', 18.00, '🍇', 90, 0),
      (grape_type_id, 'عنب أخضر', 16.00, '🍇', 100, 1);
  END IF;
END $$;
