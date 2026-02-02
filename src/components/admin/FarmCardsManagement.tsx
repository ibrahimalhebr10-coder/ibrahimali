import React, { useState, useEffect } from 'react';
import { TreePine, Plus, MapPin, Loader2, RefreshCw, Eye, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AddFarmForm from './AddFarmForm';

interface Farm {
  id: string;
  name_ar: string;
  location: string;
  category_id: string;
  area_size?: string;
  internal_cost_per_tree?: number;
  total_trees: number;
  available_trees: number;
  reserved_trees: number;
  card_description: string;
  coming_soon_label: string;
  is_open_for_booking: boolean;
  tree_types: any[];
}

const FarmCardsManagement: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadFarms();
  }, [refreshTrigger]);

  const loadFarms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('id, name_ar, location, category_id, area_size, internal_cost_per_tree, total_trees, available_trees, reserved_trees, card_description, coming_soon_label, is_open_for_booking, tree_types')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading farms:', error);
        return;
      }

      setFarms(data || []);
    } catch (err) {
      console.error('Unexpected error loading farms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditClick = (farm: Farm) => {
    setSelectedFarm(farm);
    setShowEditForm(true);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setSelectedFarm(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleViewDetails = (farm: Farm) => {
    setSelectedFarm(farm);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (farm: Farm) => {
    setSelectedFarm(farm);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFarm) return;

    setIsDeleting(true);
    try {
      const { count: reservationsCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('farm_id', selectedFarm.id);

      if (reservationsCount && reservationsCount > 0) {
        alert(
          `لا يمكن حذف المزرعة "${selectedFarm.name_ar}" لأنها تحتوي على ${reservationsCount} حجز.\n\n` +
          'يجب حذف جميع الحجوزات المرتبطة بالمزرعة أولاً.'
        );
        setIsDeleting(false);
        return;
      }

      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', selectedFarm.id);

      if (error) {
        console.error('Error deleting farm:', error);
        if (error.code === '23503') {
          alert(
            'لا يمكن حذف هذه المزرعة لأنها مرتبطة ببيانات أخرى في النظام.\n\n' +
            'الرجاء حذف جميع البيانات المرتبطة أولاً (الحجوزات، المهام، الرسائل، إلخ).'
          );
        } else {
          alert('حدث خطأ أثناء حذف المزرعة');
        }
        setIsDeleting(false);
        return;
      }

      setShowDeleteConfirm(false);
      setSelectedFarm(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Unexpected error deleting farm:', err);
      alert('حدث خطأ غير متوقع');
      setIsDeleting(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const calculateProgress = (farm: Farm) => {
    if (farm.total_trees === 0) return 0;
    return Math.round((farm.reserved_trees / farm.total_trees) * 100);
  };

  return (
    <div className="h-full">
      {/* Header - Fixed at top */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            بطاقات المزارع المتاحة
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            إدارة المزارع كوحدات هجينة - خزان أشجار
            {farms.length > 0 && (
              <span className="mr-2 text-darkgreen font-semibold">
                ({farms.length} {farms.length === 1 ? 'مزرعة' : 'مزارع'})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">تحديث</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مزرعة</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-darkgreen animate-spin mb-4" />
            <p className="text-gray-600">جارٍ تحميل المزارع...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && farms.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <TreePine className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">لا توجد مزارع مضافة</h3>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              ابدأ بإضافة مزرعتك الأولى باستخدام زر "إضافة مزرعة" في الأعلى
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-right">
              <p className="text-xs md:text-sm text-blue-900 font-medium mb-2">المزرعة الهجينة تشمل:</p>
              <ul className="text-xs md:text-sm text-blue-700 space-y-1">
                <li>• خزان أشجار مركزي</li>
                <li>• توزيع تلقائي للباقات</li>
                <li>• دعم الوضعين: الزراعي والاستثماري</li>
                <li>• تتبع حالة الأشجار لحظيًا</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Farms Grid - Scrollable */}
      {!isLoading && farms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6 pb-6">
          {farms.map((farm) => {
            const progress = calculateProgress(farm);
            const treeTypesCount = farm.tree_types?.length || 0;

            return (
              <div
                key={farm.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-darkgreen to-green-700 text-white p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold">{farm.name_ar}</h3>
                    {farm.is_open_for_booking ? (
                      <span className="px-2 py-1 bg-green-400 text-green-900 text-xs font-semibold rounded">
                        متاحة
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-400 text-gray-900 text-xs font-semibold rounded">
                        مغلقة
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-green-100 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{farm.location}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 flex-1">
                  {/* Coming Soon Label */}
                  {farm.coming_soon_label && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                      <span className="text-sm font-semibold text-amber-900">
                        {farm.coming_soon_label}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {farm.card_description && (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                      {farm.card_description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-darkgreen">{farm.total_trees}</p>
                      <p className="text-xs text-gray-600 mt-1">إجمالي الأشجار</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{treeTypesCount}</p>
                      <p className="text-xs text-gray-600 mt-1">أنواع الأشجار</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">نسبة الحجز</span>
                      <span className="text-xs font-bold text-darkgreen">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-darkgreen to-green-600 h-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        متاح: {farm.available_trees}
                      </span>
                      <span className="text-xs text-gray-500">
                        محجوز: {farm.reserved_trees}
                      </span>
                    </div>
                  </div>

                  {/* Tree Types */}
                  {treeTypesCount > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">أنواع الأشجار:</p>
                      <div className="flex flex-wrap gap-2">
                        {farm.tree_types.slice(0, 3).map((type: any, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200"
                          >
                            {type.name} ({type.count})
                          </span>
                        ))}
                        {treeTypesCount > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{treeTypesCount - 3} المزيد
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer - Action Buttons */}
                <div className="border-t border-gray-100 p-3 bg-gray-50">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleViewDetails(farm)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-semibold">عرض</span>
                    </button>
                    <button
                      onClick={() => handleEditClick(farm)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-xs font-semibold">تعديل</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(farm)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs font-semibold">حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Farm Modal */}
      {showAddForm && (
        <AddFarmForm
          onClose={() => setShowAddForm(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Edit Farm Modal */}
      {showEditForm && selectedFarm && (
        <AddFarmForm
          onClose={() => {
            setShowEditForm(false);
            setSelectedFarm(null);
          }}
          onSuccess={handleEditSuccess}
          editMode={true}
          farmData={{
            id: selectedFarm.id,
            name_ar: selectedFarm.name_ar,
            location: selectedFarm.location,
            category_id: selectedFarm.category_id,
            area_size: selectedFarm.area_size,
            internal_cost_per_tree: selectedFarm.internal_cost_per_tree,
            total_trees: selectedFarm.total_trees,
            coming_soon_label: selectedFarm.coming_soon_label,
            card_description: selectedFarm.card_description,
            tree_types: selectedFarm.tree_types
          }}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedFarm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-darkgreen to-green-700 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">{selectedFarm.name_ar}</h2>
                <div className="flex items-center gap-2 text-green-100 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedFarm.location}</span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">حالة المزرعة:</span>
                {selectedFarm.is_open_for_booking ? (
                  <span className="px-3 py-1.5 bg-green-100 text-green-800 text-sm font-semibold rounded-lg">
                    متاحة للحجز
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg">
                    مغلقة حالياً
                  </span>
                )}
              </div>

              {/* Coming Soon */}
              {selectedFarm.coming_soon_label && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-900 font-semibold">{selectedFarm.coming_soon_label}</p>
                </div>
              )}

              {/* Description */}
              {selectedFarm.card_description && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">الوصف</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedFarm.card_description}</p>
                </div>
              )}

              {/* Statistics */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">الإحصائيات</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-100">
                    <p className="text-3xl font-bold text-darkgreen">{selectedFarm.total_trees}</p>
                    <p className="text-xs text-gray-600 mt-1">إجمالي الأشجار</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border border-blue-100">
                    <p className="text-3xl font-bold text-blue-600">{selectedFarm.available_trees}</p>
                    <p className="text-xs text-gray-600 mt-1">متاحة</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center border border-purple-100">
                    <p className="text-3xl font-bold text-purple-600">{selectedFarm.reserved_trees}</p>
                    <p className="text-xs text-gray-600 mt-1">محجوزة</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 text-center border border-orange-100">
                    <p className="text-3xl font-bold text-orange-600">{calculateProgress(selectedFarm)}%</p>
                    <p className="text-xs text-gray-600 mt-1">نسبة الحجز</p>
                  </div>
                </div>
              </div>

              {/* Tree Types */}
              {selectedFarm.tree_types && selectedFarm.tree_types.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">أنواع الأشجار</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedFarm.tree_types.map((type: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                      >
                        <span className="text-sm font-semibold text-green-900">{type.name}</span>
                        <span className="px-2 py-1 bg-white text-green-700 text-xs font-bold rounded-full">
                          {type.count} شجرة
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">نسبة الحجز</h3>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-darkgreen to-green-600 h-full transition-all duration-500 flex items-center justify-center"
                      style={{ width: `${calculateProgress(selectedFarm)}%` }}
                    >
                      <span className="text-xs font-bold text-white">
                        {calculateProgress(selectedFarm)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-6 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEditClick(selectedFarm!);
                }}
                className="flex-1 px-4 py-3 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                تعديل المزرعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedFarm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !isDeleting && setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                تأكيد الحذف
              </h3>
              <p className="text-gray-600 text-center mb-6">
                هل أنت متأكد من حذف مزرعة <span className="font-bold text-gray-900">{selectedFarm.name_ar}</span>؟
                <br />
                <span className="text-sm text-red-600 font-semibold mt-2 block">
                  لا يمكن التراجع عن هذا الإجراء
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جارٍ الحذف...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>حذف نهائياً</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmCardsManagement;
