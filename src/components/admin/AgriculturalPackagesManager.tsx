import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Package, AlertCircle } from 'lucide-react';
import {
  agriculturalPackagesService,
  AgriculturalPackage,
  CreateAgriculturalPackageInput
} from '../../services/agriculturalPackagesService';

interface PackageFormData {
  contract_id: string;
  package_name: string;
  price_per_tree: string;
  base_duration_years: string;
  bonus_free_years: string;
  motivational_text: string;
  description: string;
  what_is_included: string;
  base_duration_info: string;
  free_years_info: string;
  features: string;
  conditions: string;
  management_info: string;
  is_active: boolean;
  sort_order: string;
}

const AgriculturalPackagesManager: React.FC = () => {
  const [packages, setPackages] = useState<AgriculturalPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<AgriculturalPackage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PackageFormData>({
    contract_id: '',
    package_name: '',
    price_per_tree: '',
    base_duration_years: '1',
    bonus_free_years: '0',
    motivational_text: '',
    description: '',
    what_is_included: '',
    base_duration_info: '',
    free_years_info: '',
    features: '',
    conditions: '',
    management_info: '',
    is_active: true,
    sort_order: '0'
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setIsLoading(true);
      const data = await agriculturalPackagesService.getAllPackages();
      setPackages(data);
    } catch (err) {
      setError('فشل تحميل الباقات');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (pkg: AgriculturalPackage) => {
    setEditingPackage(pkg);
    setFormData({
      contract_id: pkg.contract_id,
      package_name: pkg.package_name,
      price_per_tree: pkg.price_per_tree.toString(),
      base_duration_years: pkg.base_duration_years.toString(),
      bonus_free_years: pkg.bonus_free_years.toString(),
      motivational_text: pkg.motivational_text || '',
      description: pkg.description,
      what_is_included: pkg.what_is_included.join('\n'),
      base_duration_info: pkg.base_duration_info || '',
      free_years_info: pkg.free_years_info || '',
      features: pkg.features.join('\n'),
      conditions: pkg.conditions.join('\n'),
      management_info: pkg.management_info || '',
      is_active: pkg.is_active,
      sort_order: pkg.sort_order.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (packageId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;

    try {
      await agriculturalPackagesService.deletePackage(packageId);
      await loadPackages();
    } catch (err) {
      setError('فشل حذف الباقة');
      console.error(err);
    }
  };

  const handleToggleStatus = async (packageId: string, currentStatus: boolean) => {
    try {
      await agriculturalPackagesService.togglePackageStatus(packageId, !currentStatus);
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
      const input: CreateAgriculturalPackageInput = {
        contract_id: formData.contract_id,
        package_name: formData.package_name,
        price_per_tree: parseInt(formData.price_per_tree),
        base_duration_years: parseInt(formData.base_duration_years),
        bonus_free_years: parseInt(formData.bonus_free_years),
        motivational_text: formData.motivational_text || null,
        description: formData.description,
        what_is_included: formData.what_is_included.split('\n').filter(Boolean),
        base_duration_info: formData.base_duration_info || null,
        free_years_info: formData.free_years_info || null,
        features: formData.features.split('\n').filter(Boolean),
        conditions: formData.conditions.split('\n').filter(Boolean),
        management_info: formData.management_info || null,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order)
      };

      if (editingPackage) {
        await agriculturalPackagesService.updatePackage(editingPackage.id, input);
      } else {
        await agriculturalPackagesService.createPackage(input);
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
      base_duration_years: '1',
      bonus_free_years: '0',
      motivational_text: '',
      description: '',
      what_is_included: '',
      base_duration_info: '',
      free_years_info: '',
      features: '',
      conditions: '',
      management_info: '',
      is_active: true,
      sort_order: '0'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-darkgreen mx-auto mb-4"></div>
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
          <p className="text-gray-600 mt-1">باقة زراعية (غير استثمارية)</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* المعلومات الأساسية */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">المعلومات الأساسية</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الباقة *
                </label>
                <input
                  type="text"
                  required
                  value={formData.package_name}
                  onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="مثال: باقة سنة واحدة"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="197"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مدة الانتفاع الأساسية (سنوات) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.base_duration_years}
                  onChange={(e) => setFormData({ ...formData, base_duration_years: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="1"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="3"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="مثال: إضافة 3 سنوات مجاناً"
                />
              </div>
            </div>
          </div>

          {/* مضمون الباقة الزراعية */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">مضمون الباقة الزراعية</h3>

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
                  placeholder="شرح الانتفاع المنزلي والاستخدام الشخصي..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مميزات الباقة (سطر لكل ميزة) *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="استلام المحصول&#10;إهداء للأحباب&#10;صدقة جارية&#10;متابعة المحصول..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  شروط الباقة (سطر لكل شرط) *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="غير استثماري&#10;لا عوائد مالية&#10;الالتزام بدفع رسوم الصيانة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ماذا يشمل السعر (سطر لكل نقطة)
                </label>
                <textarea
                  rows={4}
                  value={formData.what_is_included}
                  onChange={(e) => setFormData({ ...formData, what_is_included: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="ملكية الأشجار&#10;رعاية وصيانة&#10;استلام المحصول..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  معلومات المدة الأساسية
                </label>
                <input
                  type="text"
                  value={formData.base_duration_info}
                  onChange={(e) => setFormData({ ...formData, base_duration_info: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="مدة العقد الأساسية سنة واحدة من تاريخ التوقيع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  معلومات السنوات المجانية
                </label>
                <input
                  type="text"
                  value={formData.free_years_info}
                  onChange={(e) => setFormData({ ...formData, free_years_info: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="عند إتمام السنة الأولى، تحصل على 3 سنوات إضافية..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  معلومات الإدارة
                </label>
                <textarea
                  rows={2}
                  value={formData.management_info}
                  onChange={(e) => setFormData({ ...formData, management_info: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="تُدار هذه الباقة بالكامل عبر المنصة..."
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
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

          {/* قيود مهمة */}
          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              قيود مهمة - باقة زراعية
            </h3>
            <ul className="text-sm text-red-800 space-y-1">
              <li>❌ لا عوائد مالية</li>
              <li>❌ لا مخلفات استثمارية</li>
              <li>❌ لا عقود بيع أو تجارة</li>
              <li>❌ لا وعود مالية</li>
              <li>✅ انتفاع شخصي فقط</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-darkgreen text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold"
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
          <h2 className="text-2xl font-bold text-gray-900">باقات أشجاري الخضراء</h2>
          <p className="text-gray-600 mt-1">إدارة باقات الانتفاع الزراعي</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-darkgreen text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
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
          <p className="text-gray-600 mb-6">ابدأ بإضافة باقة زراعية جديدة</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-darkgreen text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
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
                pkg.is_active ? 'border-green-200' : 'border-gray-200 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{pkg.package_name}</h3>
                    {pkg.is_active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        مفعلة
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                        مخفية
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-darkgreen">{pkg.price_per_tree} ريال</p>
                  <p className="text-sm text-gray-600 mt-1">للشجرة الواحدة</p>
                </div>
              </div>

              {/* Duration Info */}
              <div className="mb-4 p-3 bg-green-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">المدة الأساسية</p>
                    <p className="text-lg font-bold text-darkgreen">{pkg.base_duration_years} سنة</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">سنوات مجانية</p>
                    <p className="text-lg font-bold text-green-600">+{pkg.bonus_free_years} سنوات</p>
                  </div>
                </div>
              </div>

              {/* Motivational Text */}
              {pkg.motivational_text && (
                <p className="text-sm text-green-700 font-semibold mb-3 text-center bg-green-50 py-2 px-3 rounded">
                  {pkg.motivational_text}
                </p>
              )}

              {/* Description */}
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">{pkg.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">المميزات</p>
                  <p className="text-sm font-bold text-gray-900">{pkg.features.length}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">الشروط</p>
                  <p className="text-sm font-bold text-gray-900">{pkg.conditions.length}</p>
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

export default AgriculturalPackagesManager;
