import { useState } from 'react';
import { TreePine, Droplets, Gift } from 'lucide-react';
import TreeOperationsManager from './TreeOperationsManager';
import HarvestPreferencesManager from './HarvestPreferencesManager';

type TabType = 'operations' | 'preferences';

export default function MyTreesSection() {
  const [activeTab, setActiveTab] = useState<TabType>('operations');

  const tabs = [
    { id: 'operations' as TabType, label: 'متابعة العمليات الزراعية', icon: Droplets, color: 'blue' },
    { id: 'preferences' as TabType, label: 'اختيارات المحصول', icon: Gift, color: 'pink' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8942F] text-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <TreePine className="w-10 h-10" />
          <div>
            <h1 className="text-3xl font-bold">محصولي الزراعي - متابعة أشجاري</h1>
            <p className="text-white/90 mt-1">إدارة شاملة للعمليات الزراعية واختيارات المحصول</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 font-semibold transition-all ${
                  activeTab === tab.id
                    ? `border-b-4 border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50/50`
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'operations' && <TreeOperationsManager />}
          {activeTab === 'preferences' && <HarvestPreferencesManager />}
        </div>
      </div>
    </div>
  );
}
