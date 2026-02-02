import React from 'react';
import { TreePine, Plus } from 'lucide-react';

const FarmCardsManagement: React.FC = () => {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">بطاقات المزارع المتاحة</h1>
          <p className="text-sm md:text-base text-gray-600">إدارة المزارع كوحدات هجينة - خزان أشجار</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm md:text-base whitespace-nowrap">
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span>إضافة مزرعة جديدة</span>
        </button>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <TreePine className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">لا توجد مزارع محملة</h3>
          <p className="text-sm md:text-base text-gray-600 mb-6">
            هذه الصفحة جاهزة لعرض وإدارة المزارع كوحدات هجينة.
            سيتم إضافة المنطق التشغيلي في المراحل القادمة.
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
    </div>
  );
};

export default FarmCardsManagement;
