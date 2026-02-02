import React from 'react';
import { MapPin, TreePine, Plus } from 'lucide-react';

const FarmCardsManagement: React.FC = () => {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">بطاقات المزارع المتاحة</h1>
          <p className="text-gray-600">إدارة المزارع كوحدات هجينة - خزان أشجار</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          <span>إضافة مزرعة جديدة</span>
        </button>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <TreePine className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد مزارع محملة</h3>
          <p className="text-gray-600 mb-6">
            هذه الصفحة جاهزة لعرض وإدارة المزارع كوحدات هجينة.
            سيتم إضافة المنطق التشغيلي في المراحل القادمة.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 text-right">
            <p className="text-sm text-blue-900 font-medium mb-2">المزرعة الهجينة تشمل:</p>
            <ul className="text-sm text-blue-700 space-y-1">
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
