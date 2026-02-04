/*
  # حذف نظام مزرعتي بالكامل

  ## الملخص
  حذف كامل ونهائي لنظام مزرعتي الإدارية بكلا المسارين (الزراعي والاستثماري)

  ## الجداول المحذوفة

  ### المسار الزراعي
  - agricultural_tree_inventory
  - agricultural_operations
  - agricultural_documentation
  - agricultural_growth_stages
  - agricultural_experience_content

  ### المسار الاستثماري
  - investment_agricultural_assets
  - investment_status_tracking
  - investment_products_yields
  - investment_waste_yields
  - investment_expansion_opportunities
  - investment_experience_content

  ## ملاحظة
  جميع البيانات سيتم حذفها بشكل نهائي
*/

-- حذف جداول المسار الزراعي
DROP TABLE IF EXISTS agricultural_experience_content CASCADE;
DROP TABLE IF EXISTS agricultural_growth_stages CASCADE;
DROP TABLE IF EXISTS agricultural_documentation CASCADE;
DROP TABLE IF EXISTS agricultural_operations CASCADE;
DROP TABLE IF EXISTS agricultural_tree_inventory CASCADE;

-- حذف جداول المسار الاستثماري
DROP TABLE IF EXISTS investment_experience_content CASCADE;
DROP TABLE IF EXISTS investment_expansion_opportunities CASCADE;
DROP TABLE IF EXISTS investment_waste_yields CASCADE;
DROP TABLE IF EXISTS investment_products_yields CASCADE;
DROP TABLE IF EXISTS investment_status_tracking CASCADE;
DROP TABLE IF EXISTS investment_agricultural_assets CASCADE;