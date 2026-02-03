import React, { useState } from 'react';
import { TreePine, DollarSign, Users, BarChart } from 'lucide-react';

type InvestmentTab = 'my-trees' | 'returns' | 'investors' | 'analytics';

const InvestmentSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InvestmentTab>('my-trees');

  const tabs = [
    { id: 'my-trees' as InvestmentTab, label: 'متابعة أشجاري', icon: TreePine },
    { id: 'returns' as InvestmentTab, label: 'العوائد', icon: DollarSign },
    { id: 'investors' as InvestmentTab, label: 'المستثمرين', icon: Users },
    { id: 'analytics' as InvestmentTab, label: 'التحليلات', icon: BarChart },
  ];

  const renderContent = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center max-w-md mx-auto py-8">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            {tabs.find(t => t.id === activeTab) && React.createElement(
              tabs.find(t => t.id === activeTab)!.icon,
              { className: 'w-10 h-10 text-blue-600' }
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <p className="text-gray-600">
            هذا التبويب جاهز للتطوير. سيتم إضافة المحتوى والوظائف في المراحل القادمة.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">محصولي الاستثماري</h1>
        <p className="text-gray-600">إدارة ومتابعة القسم الاستثماري</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-darkgreen text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default InvestmentSection;
