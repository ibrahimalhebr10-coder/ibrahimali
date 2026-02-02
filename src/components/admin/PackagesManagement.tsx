import React, { useState } from 'react';
import { Package, Sprout, TrendingUp, Plus } from 'lucide-react';

type PackageType = 'agricultural' | 'investment';

const PackagesManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PackageType>('agricultural');

  return (
    <div>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">الباقات والعروض</h1>
        <p className="text-sm md:text-base text-gray-600">إدارة باقات محصولي الزراعي والاستثماري</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('agricultural')}
          className={`
            flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all text-sm md:text-base whitespace-nowrap
            ${activeTab === 'agricultural'
              ? 'bg-darkgreen text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }
          `}
        >
          <Sprout className="w-4 h-4 md:w-5 md:h-5" />
          <span>باقات محصولي الزراعي</span>
        </button>

        <button
          onClick={() => setActiveTab('investment')}
          className={`
            flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all text-sm md:text-base whitespace-nowrap
            ${activeTab === 'investment'
              ? 'bg-darkgreen text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }
          `}
        >
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
          <span>باقات محصولي الاستثماري</span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-8">
        {/* Add Button */}
        <div className="flex justify-end mb-6">
          <button className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm md:text-base">
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span>إضافة باقة جديدة</span>
          </button>
        </div>

        {/* Empty State */}
        <div className="text-center max-w-md mx-auto py-8">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">لا توجد باقات محملة</h3>
          <p className="text-sm md:text-base text-gray-600">
            {activeTab === 'agricultural'
              ? 'هنا سيتم عرض وإدارة باقات محصولي الزراعي'
              : 'هنا سيتم عرض وإدارة باقات محصولي الاستثماري'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default PackagesManagement;
