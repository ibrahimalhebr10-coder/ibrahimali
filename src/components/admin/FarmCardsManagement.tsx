import React, { useState, useEffect } from 'react';
import { TreePine, Plus, MapPin, Loader2, RefreshCw, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AddFarmForm from './AddFarmForm';

interface Farm {
  id: string;
  name_ar: string;
  location: string;
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadFarms();
  }, [refreshTrigger]);

  const loadFarms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('id, name_ar, location, total_trees, available_trees, reserved_trees, card_description, coming_soon_label, is_open_for_booking, tree_types')
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

  const calculateProgress = (farm: Farm) => {
    if (farm.total_trees === 0) return 0;
    return Math.round((farm.reserved_trees / farm.total_trees) * 100);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">بطاقات المزارع المتاحة</h1>
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
            className="flex items-center justify-center gap-2 px-4 py-2 md:py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm md:text-base"
          >
            <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">تحديث</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm md:text-base whitespace-nowrap"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span>إضافة مزرعة جديدة</span>
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
              ابدأ بإضافة مزرعتك الأولى باستخدام زر "إضافة مزرعة جديدة" في الأعلى
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

      {/* Farms Grid */}
      {!isLoading && farms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {farms.map((farm) => {
            const progress = calculateProgress(farm);
            const treeTypesCount = farm.tree_types?.length || 0;

            return (
              <div
                key={farm.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all overflow-hidden"
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
                <div className="p-4 space-y-4">
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
                    <p className="text-sm text-gray-600 leading-relaxed">
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

                {/* Footer */}
                <div className="border-t border-gray-100 p-3 bg-gray-50">
                  <button className="w-full flex items-center justify-center gap-2 py-2 text-darkgreen hover:bg-green-50 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-semibold">عرض التفاصيل</span>
                  </button>
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
    </div>
  );
};

export default FarmCardsManagement;
