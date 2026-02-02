import React, { useState } from 'react';
import { Megaphone, Tag, Gift, MessageCircle } from 'lucide-react';

type MarketingTab = 'campaigns' | 'promotions' | 'referrals' | 'messages';

const MarketingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MarketingTab>('campaigns');

  const tabs = [
    { id: 'campaigns' as MarketingTab, label: 'الحملات التسويقية', icon: Megaphone },
    { id: 'promotions' as MarketingTab, label: 'العروض الترويجية', icon: Tag },
    { id: 'referrals' as MarketingTab, label: 'الإحالات والمكافآت', icon: Gift },
    { id: 'messages' as MarketingTab, label: 'الرسائل التسويقية', icon: MessageCircle },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة التسويق</h1>
        <p className="text-gray-600">إدارة الحملات والعروض والرسائل التسويقية</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center max-w-md mx-auto py-8">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            {tabs.find(t => t.id === activeTab) && React.createElement(
              tabs.find(t => t.id === activeTab)!.icon,
              { className: 'w-10 h-10 text-purple-600' }
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <p className="text-gray-600 mb-6">
            هذا التبويب جاهز للتطوير. سيتم إضافة المحتوى والوظائف في المراحل القادمة.
          </p>

          {/* Tab-specific info */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-right">
            <p className="text-sm font-medium text-purple-900 mb-2">
              {activeTab === 'campaigns' && 'الحملات التسويقية'}
              {activeTab === 'promotions' && 'العروض الترويجية'}
              {activeTab === 'referrals' && 'الإحالات والمكافآت'}
              {activeTab === 'messages' && 'الرسائل التسويقية'}
            </p>
            <p className="text-sm text-purple-700">
              {activeTab === 'campaigns' && 'إنشاء ومتابعة الحملات التسويقية عبر قنوات متعددة'}
              {activeTab === 'promotions' && 'إدارة الخصومات والعروض الخاصة للمستخدمين'}
              {activeTab === 'referrals' && 'برنامج الإحالة ونظام المكافآت'}
              {activeTab === 'messages' && 'إرسال الرسائل الترويجية للمستخدمين'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingManagement;
