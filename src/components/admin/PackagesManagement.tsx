import React, { useState } from 'react';
import { Sprout, TrendingUp } from 'lucide-react';
import AgriculturalPackagesManager from './AgriculturalPackagesManager';
import InvestmentPackagesManager from './InvestmentPackagesManager';

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
      {activeTab === 'agricultural' ? (
        <AgriculturalPackagesManager />
      ) : (
        <InvestmentPackagesManager />
      )}
    </div>
  );
};

export default PackagesManagement;
