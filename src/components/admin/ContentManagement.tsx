import React, { useState } from 'react';
import { FileText, MessageSquare, Star } from 'lucide-react';

type ContentTab = 'general-texts' | 'system-messages' | 'testimonials';

const ContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentTab>('general-texts');

  const tabs = [
    { id: 'general-texts' as ContentTab, label: 'النصوص العامة', icon: FileText },
    { id: 'system-messages' as ContentTab, label: 'رسائل النظام', icon: MessageSquare },
    { id: 'testimonials' as ContentTab, label: 'نصوص الشهادات', icon: Star },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">المحتوى والرسائل</h1>
        <p className="text-gray-600">إدارة النصوص والرسائل في المنصة</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
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
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            {tabs.find(t => t.id === activeTab) && React.createElement(
              tabs.find(t => t.id === activeTab)!.icon,
              { className: 'w-10 h-10 text-indigo-600' }
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <p className="text-gray-600 mb-6">
            هذا التبويب جاهز للتطوير. سيتم إضافة المحتوى والوظائف في المراحل القادمة.
          </p>

          {/* Tab-specific info */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 text-right">
            <p className="text-sm font-medium text-indigo-900 mb-2">
              {activeTab === 'general-texts' && 'النصوص العامة'}
              {activeTab === 'system-messages' && 'رسائل النظام'}
              {activeTab === 'testimonials' && 'نصوص الشهادات'}
            </p>
            <p className="text-sm text-indigo-700">
              {activeTab === 'general-texts' && 'إدارة وتحرير النصوص الثابتة في المنصة'}
              {activeTab === 'system-messages' && 'رسائل التأكيد والإشعارات التلقائية'}
              {activeTab === 'testimonials' && 'شهادات العملاء والمراجعات'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentManagement;
