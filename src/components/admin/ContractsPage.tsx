import React from 'react';
import { FileText, Search } from 'lucide-react';

const ContractsPage: React.FC = () => {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">العقود</h1>
        <p className="text-gray-600">عرض ومتابعة العقود الاستثمارية</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="البحث عن عقد..."
            className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-darkgreen text-right"
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد عقود محملة</h3>
          <p className="text-gray-600 mb-6">
            هذه الصفحة مخصصة لعرض ومتابعة العقود الاستثمارية فقط.
          </p>
          <div className="bg-amber-50 rounded-lg p-4 text-right">
            <p className="text-sm text-amber-900 font-medium mb-2">ملاحظة:</p>
            <p className="text-sm text-amber-700">
              عرض فقط - بدون صلاحيات تعديل أو حذف في هذه المرحلة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractsPage;
