import React, { useState } from 'react';
import { Settings, Palette, Key, Database, CreditCard } from 'lucide-react';
import PaymentProvidersManager from './PaymentProvidersManager';

type SettingsTab = 'system' | 'branding' | 'payment-providers' | 'api-keys' | 'database';

const GeneralSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('system');

  const tabs = [
    { id: 'system' as SettingsTab, label: 'إعدادات النظام', icon: Settings },
    { id: 'branding' as SettingsTab, label: 'الهوية العامة', icon: Palette },
    { id: 'payment-providers' as SettingsTab, label: 'البطاقات المالية', icon: CreditCard },
    { id: 'api-keys' as SettingsTab, label: 'مفاتيح التشغيل', icon: Key },
    { id: 'database' as SettingsTab, label: 'قاعدة البيانات', icon: Database },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">الإعدادات العامة</h1>
        <p className="text-gray-600">إدارة إعدادات النظام والتكامل</p>
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
        {activeTab === 'payment-providers' ? (
          <PaymentProvidersManager />
        ) : (
          <div className="text-center max-w-md mx-auto py-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {tabs.find(t => t.id === activeTab) && React.createElement(
                tabs.find(t => t.id === activeTab)!.icon,
                { className: 'w-10 h-10 text-gray-600' }
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <p className="text-gray-600 mb-6">
              هذا التبويب جاهز للتطوير. سيتم إضافة المحتوى والوظائف في المراحل القادمة.
            </p>

            {/* Warning for sensitive settings */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 text-right">
              <p className="text-sm font-medium text-red-900 mb-2">تنبيه أمني</p>
              <p className="text-sm text-red-700">
                الإعدادات الحساسة مثل مفاتيح API وإعدادات قاعدة البيانات ستتطلب صلاحيات خاصة
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralSettings;
