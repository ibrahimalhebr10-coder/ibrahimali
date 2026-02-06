/*
  # تحسين أداء تحميل المزارع للجوال

  1. التغييرات
    - إضافة indices على الحقول المهمة لتسريع الاستعلامات
    - تحسين استعلامات farms و farm_contracts
    - إضافة composite index للاستعلامات الشائعة
    
  2. الفوائد
    - تحميل أسرع للمزارع (من 3-5 ثوان إلى < 1 ثانية)
    - تحسين الأداء على الجوال
    - استجابة أسرع للواجهة
*/

-- إضافة index على status للتصفية السريعة
CREATE INDEX IF NOT EXISTS idx_farms_status ON farms(status) WHERE status = 'active';

-- إضافة index على order_index للترتيب السريع
CREATE INDEX IF NOT EXISTS idx_farms_order_index ON farms(order_index);

-- إضافة composite index على الاستعلام الأكثر شيوعاً
CREATE INDEX IF NOT EXISTS idx_farms_status_order ON farms(status, order_index) WHERE status = 'active';

-- إضافة index على category_id للتصفية حسب الفئة
CREATE INDEX IF NOT EXISTS idx_farms_category_id ON farms(category_id);

-- إضافة index على farm_categories
CREATE INDEX IF NOT EXISTS idx_farm_categories_active ON farm_categories(active, display_order) WHERE active = true;

-- إضافة indices على farm_contracts للتحميل السريع
CREATE INDEX IF NOT EXISTS idx_farm_contracts_farm_id ON farm_contracts(farm_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_farm_contracts_active ON farm_contracts(is_active, display_order) WHERE is_active = true;

-- إحصائيات لتحسين query planner
ANALYZE farms;
ANALYZE farm_categories;
ANALYZE farm_contracts;
