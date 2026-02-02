import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Package, AlertCircle, TrendingUp } from 'lucide-react';
import {
  investmentPackagesService,
  InvestmentPackage,
  CreateInvestmentPackageInput
} from '../../services/investmentPackagesService';

interface PackageFormData {
  contract_id: string;
  package_name: string;
  price_per_tree: string;
  base_duration_years: string;
  bonus_free_years: string;
  min_trees: string;
  tree_increment: string;
  quick_select_options: string;
  motivational_text: string;
  description: string;
  investment_duration_title: string;
  investor_rights: string;
  management_approach: string;
  returns_info: string;
  disclaimer: string;
  action_button_text: string;
  is_active: boolean;
  sort_order: string;
}

const InvestmentPackagesManager: React.FC = () => {
  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<InvestmentPackage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PackageFormData>({
    contract_id: '',
    package_name: '',
    price_per_tree: '',
    base_duration_years: '4',
    bonus_free_years: '0',
    min_trees: '50',
    tree_increment: '50',
    quick_select_options: '100, 200, 500, 1000',
    motivational_text: '',
    description: 'هذه الباقة تمثل عقد استثمار في أشجار مثمرة حقيقية تُدار بالكامل من المنصة طوال مدة العقد.',
    investment_duration_title: 'مدة الاستثمار',
    investor_rights: 'الثمار الموسمية\nالزيوت المستخرجة\nمخلفات التقليم (الحطب)\nأوراق الأشجار\nبقايا العصر والنواتج النباتية',
    management_approach: 'المنصة تتولى الزراعة، الري، الصيانة، والحصاد. إدارة بيع المنتجات والمخلفات. متابعة دورية عبر حساب المستثمر.',
    returns_info: 'العائد مرتبط بالإنتاج والموسم. لا توجد عوائد ثابتة أو مضمونة. تفاصيل العوائد تظهر داخل الحساب عند توفرها.',
    disclaimer: 'الاستثمار الزراعي يخضع لعوامل طبيعية ومناخية والمنصة تدير الاستثمار ولا تضمن نتائج مالية محددة.',
    action_button_text: 'اختيار هذه الباقة وبدء استثمار أشجاري',
    is_active: true,
    sort_order: '0'
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setIsLoading(true);
      const data = await investmentPackagesService.getAllPackages();
      setPackages(data);
    } catch (err) {
      setError('فشل تحميل الباقات');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (pkg: InvestmentPackage) => {
    setEditingPackage(pkg);
    setFormData({
      contract_id: pkg.contract_id,
      package_name: pkg.package_name,
      price_per_tree: pkg.price_per_tree.toString(),
      base_duration_years: pkg.base_duration_years.toString(),
      bonus_free_years: pkg.bonus_free_years.toString(),
      min_trees: pkg.min_trees.toString(),
      tree_increment: pkg.tree_increment.toString(),
      quick_select_options: pkg.quick_select_options.join(', '),
      motivational_text: pkg.motivational_text || '',
      description: pkg.description,
      investment_duration_title: pkg.investment_duration_title,
      investor_rights: pkg.investor_rights.join('\n'),
      management_approach: pkg.management_approach,
      returns_info: pkg.returns_info,
      disclaimer: pkg.disclaimer,
      action_button_text: pkg.action_button_text,
      is_active: pkg.is_active,
      sort_order: pkg.sort_order.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (packageId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;

    try {
      await investmentPackagesService.deletePackage(packageId);
      await loadPackages();
    } catch (err) {
      setError('فشل حذف الباقة');
      console.error(err);
    }
  };

  const handleToggleStatus = async (packageId: string, currentStatus: boolean) => {
    try {
      await investmentPackagesService.togglePackageStatus(packageId, !currentStatus);
      await loadPackages();
    } catch (err) {
      setError('فشل تغيير حالة الباقة');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const quickSelectOptions = formData.quick_select_options
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));

      const input: CreateInvestmentPackageInput = {
        contract_id: formData.contract_id,
        package_name: formData.package_name,
        price_per_tree: parseInt(formData.price_per_tree),
        base_duration_years: parseInt(formData.base_duration_years),
        bonus_free_years: parseInt(formData.bonus_free_years),
        min_trees: parseInt(formData.min_trees),
        tree_increment: parseInt(formData.tree_increment),
        quick_select_options: quickSelectOptions,
        motivational_text: formData.motivational_text || undefined,
        description: formData.description,
        investment_duration_title: formData.investment_duration_title,
        investor_rights: formData.investor_rights.split('\n').filter(Boolean),
        management_approach: formData.management_approach,
        returns_info: formData.returns_info,
        disclaimer: formData.disclaimer,
        action_button_text: formData.action_button_text,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order)
      };

      if (editingPackage) {
        await investmentPackagesService.updatePackage(editingPackage.id, input);
      } else {
        await investmentPackagesService.createPackage(input);
      }

      await loadPackages();
      handleCancelForm();
    } catch (err) {
      setError('فشل حفظ الباقة');
      console.error(err);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPackage(null);
    setFormData({
      contract_id: '',
      package_name: '',
      price_per_tree: '',
      base_duration_years: '4',
      bonus_free_years: '0',
      min_trees: '50',
      tree_increment: '50',
      quick_select_options: '100, 200, 500, 1000',
      motivational_text: '',
      description: 'هذه الباقة تمثل عقد استثمار في أشجار مثمرة حقيقية تُدار بالكامل من المنصة طوال مدة العقد.',
      investment_duration_title: 'مدة الاستثمار',
      investor_rights: 'الثمار الموسمية\nالزيوت المستخرجة\nمخلفات التقليم (الحطب)\nأوراق الأشجار\nبقايا العصر والنواتج النباتية',
      management_approach: 'المنصة تتولى الزراعة، الري، الصيانة، والحصاد. إدارة بيع المنتجات والمخلفات. متابعة دورية عبر حساب المستثمر.',
      returns_info: 'العائد مرتبط بالإنتاج والموسم. لا توجد عوائد ثابتة أو مضمونة. تفاصيل العوائد تظهر داخل الحساب عند توفرها.',
      disclaimer: 'الاستثمار الزراعي يخضع لعوامل طبيعية ومناخية والمنصة تدير الاستثمار ولا تضمن نتائج مالية محددة.',
      action_button_text: 'اختيار هذه الباقة وبدء استثمار أشجاري',
      is_active: true,
      sort_order: '0'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingPackage ? 'تعديل باقة' : 'إضافة باقة جديدة'}
          </h2>
          <p className="text-gray-600 mt-1">باقة استثمارية (عقد استثمار)</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* المعلومات الأساسية */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">المعلومات الأساسية</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الباقة (اسم العقد) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.package_name}
                  onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: عقد استثمار 4 سنوات"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سعر الشجرة الواحدة (ريال) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price_per_tree}
                  onChange={(e) => setFormData({ ...formData, price_per_tree: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="397"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مدة الاستثمار الأساسية (سنوات) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.base_duration_years}
                  onChange={(e) => setFormData({ ...formData, base_duration_years: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سنوات إضافية مجانية *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.bonus_free_years}
                  onChange={(e) => setFormData({ ...formData, bonus_free_years: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contract_id}
                  onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="UUID من جدول farm_contracts"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  النص التحفيزي
                </label>
                <input
                  type="text"
                  value={formData.motivational_text}
                  onChange={(e) => setFormData({ ...formData, motivational_text: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: أفضل عائد استثماري مع ضمان الإدارة"
                />
              </div>
            </div>
          </div>

          {/* قواعد عدد الأشجار */}
          <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">قواعد عدد الأشجار</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحد الأدنى للأشجار *
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  value={formData.min_trees}
                  onChange={(e) => setFormData({ ...formData, min_trees: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="50"
                />
                <p className="text-xs text-gray-600 mt-1">لا يقل عن 50 شجرة</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مضاعفات الأشجار *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.tree_increment}
                  onChange={(e) => setFormData({ ...formData, tree_increment: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="50"
                />
                <p className="text-xs text-gray-600 mt-1">50، 100، 150...</p>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  أزرار الاختيار السريع *
                </label>
                <input
                  type="text"
                  required
                  value={formData.quick_select_options}
                  onChange={(e) => setFormData({ ...formData, quick_select_options: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="100, 200, 500, 1000"
                />
                <p className="text-xs text-gray-600 mt-1">افصل بفواصل</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-amber-100 rounded-lg border border-amber-300">
              <p className="text-sm font-semibold text-amber-900 mb-2">القواعد المطبقة:</p>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>✓ الحد الأدنى: {formData.min_trees} شجرة</li>
                <li>✓ يجب أن يكون العدد من مضاعفات {formData.tree_increment}</li>
                <li>✓ أزرار سريعة: {formData.quick_select_options}</li>
              </ul>
            </div>
          </div>

          {/* مضمون الباقة الاستثمارية */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">مضمون الباقة الاستثمارية</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تعريف الباقة *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="وصف عقد الاستثمار..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان مدة الاستثمار *
                </label>
                <input
                  type="text"
                  required
                  value={formData.investment_duration_title}
                  onChange={(e) => setFormData({ ...formData, investment_duration_title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="مدة الاستثمار"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  حقوق المستثمر (سطر لكل حق) *
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.investor_rights}
                  onChange={(e) => setFormData({ ...formData, investor_rights: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="الثمار الموسمية&#10;الزيوت المستخرجة&#10;مخلفات التقليم&#10;..."
                />
                <p className="text-xs text-green-700 mt-1">
                  ✓ الثمار + الزيوت + جميع المخلفات
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  آلية الإدارة *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.management_approach}
                  onChange={(e) => setFormData({ ...formData, management_approach: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="كيف تدار الباقة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  معلومات العائد *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.returns_info}
                  onChange={(e) => setFormData({ ...formData, returns_info: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="معلومات عن العائد المتوقع..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التنويه والإخلاء *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.disclaimer}
                  onChange={(e) => setFormData({ ...formData, disclaimer: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="تنويه عن المخاطر..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نص زر الإجراء *
                </label>
                <input
                  type="text"
                  required
                  value={formData.action_button_text}
                  onChange={(e) => setFormData({ ...formData, action_button_text: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="اختيار هذه الباقة وبدء استثمار أشجاري"
                />
              </div>
            </div>
          </div>

          {/* إعدادات العرض */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">إعدادات العرض</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ترتيب الظهور *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  حالة الباقة
                </label>
                <div className="flex items-center gap-4 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.is_active}
                      onChange={() => setFormData({ ...formData, is_active: true })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">مفعلة</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!formData.is_active}
                      onChange={() => setFormData({ ...formData, is_active: false })}
                      className="w-4 h-4 text-gray-600 focus:ring-gray-500"
                    />
                    <span className="text-sm font-medium text-gray-700">مخفية</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ملاحظات مهمة */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              الباقة الاستثمارية
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ عقد استثمار في أشجار مثمرة</li>
              <li>✓ الحد الأدنى: 50 شجرة</li>
              <li>✓ مضاعفات 50 فقط</li>
              <li>✓ حقوق كاملة: الثمار + الزيوت + المخلفات</li>
              <li>✓ إدارة كاملة من المنصة</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {editingPackage ? 'حفظ التعديلات' : 'إضافة الباقة'}
            </button>
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">باقات محصولي الاستثماري</h2>
          <p className="text-gray-600 mt-1">إدارة باقات الاستثمار الزراعي</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          إضافة باقة جديدة
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Packages List */}
      {packages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد باقات</h3>
          <p className="text-gray-600 mb-6">ابدأ بإضافة باقة استثمارية جديدة</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            إضافة باقة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${
                pkg.is_active ? 'border-blue-200' : 'border-gray-200 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{pkg.package_name}</h3>
                    {pkg.is_active ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        مفعلة
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                        مخفية
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{pkg.price_per_tree} ريال</p>
                  <p className="text-sm text-gray-600 mt-1">للشجرة الواحدة</p>
                </div>
              </div>

              {/* Duration Info */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">مدة الاستثمار</p>
                    <p className="text-lg font-bold text-blue-600">{pkg.base_duration_years} سنة</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">سنوات مجانية</p>
                    <p className="text-lg font-bold text-green-600">+{pkg.bonus_free_years} سنوات</p>
                  </div>
                </div>
              </div>

              {/* Tree Rules */}
              <div className="mb-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-xs font-semibold text-amber-900 mb-2">قواعد عدد الأشجار:</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-600">الحد الأدنى</p>
                    <p className="text-sm font-bold text-amber-900">{pkg.min_trees}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">المضاعفات</p>
                    <p className="text-sm font-bold text-amber-900">{pkg.tree_increment}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">خيارات سريعة</p>
                    <p className="text-sm font-bold text-amber-900">{pkg.quick_select_options.length}</p>
                  </div>
                </div>
              </div>

              {/* Motivational Text */}
              {pkg.motivational_text && (
                <p className="text-sm text-blue-700 font-semibold mb-3 text-center bg-blue-50 py-2 px-3 rounded">
                  {pkg.motivational_text}
                </p>
              )}

              {/* Description */}
              <p className="text-sm text-gray-700 mb-4 line-clamp-2">{pkg.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">حقوق</p>
                  <p className="text-sm font-bold text-gray-900">{pkg.investor_rights.length}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">الإدارة</p>
                  <p className="text-sm font-bold text-gray-900">المنصة</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">الترتيب</p>
                  <p className="text-sm font-bold text-gray-900">{pkg.sort_order}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(pkg)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
                >
                  <Edit2 className="w-4 h-4" />
                  تعديل
                </button>
                <button
                  onClick={() => handleToggleStatus(pkg.id, pkg.is_active)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-semibold ${
                    pkg.is_active
                      ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {pkg.is_active ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      إخفاء
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      إظهار
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvestmentPackagesManager;
