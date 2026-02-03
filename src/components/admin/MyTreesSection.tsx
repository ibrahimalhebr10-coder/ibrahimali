import { useState } from 'react';
import { TreePine, Droplets, Gift, Package, Recycle, Rocket, FileText } from 'lucide-react';
import TreeOperationsManager from './TreeOperationsManager';
import HarvestPreferencesManager from './HarvestPreferencesManager';
import InvestorAssetsManager from './InvestorAssetsManager';
import ProductYieldsManager from './ProductYieldsManager';
import WasteYieldsManager from './WasteYieldsManager';
import ExpansionOpportunitiesManager from './ExpansionOpportunitiesManager';
import SmartReportsManager from './SmartReportsManager';

type TabType = 'operations' | 'preferences' | 'assets' | 'products' | 'waste' | 'expansion' | 'reports';

export default function MyTreesSection() {
  const [activeTab, setActiveTab] = useState<TabType>('assets');

  const tabs = [
    { id: 'assets' as TabType, label: 'أصول المستثمرين', icon: TreePine, color: 'green' },
    { id: 'products' as TabType, label: 'عوائد المنتجات', icon: Package, color: 'amber' },
    { id: 'waste' as TabType, label: 'عوائد المخلفات', icon: Recycle, color: 'emerald' },
    { id: 'expansion' as TabType, label: 'فرص التوسعة', icon: Rocket, color: 'blue' },
    { id: 'reports' as TabType, label: 'التقارير الذكية', icon: FileText, color: 'purple' },
    { id: 'operations' as TabType, label: 'العمليات الزراعية', icon: Droplets, color: 'sky' },
    { id: 'preferences' as TabType, label: 'اختيارات المحصول', icon: Gift, color: 'pink' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8942F] text-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <TreePine className="w-10 h-10" />
          <div>
            <h1 className="text-3xl font-bold">متابعة أشجاري - النظام الاستثماري</h1>
            <p className="text-white/90 mt-1">إدارة شاملة للأصول والعوائد والتقارير</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-b-4 border-darkgreen text-darkgreen bg-green-50/50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'assets' && <InvestorAssetsManager />}
          {activeTab === 'products' && <ProductYieldsManager />}
          {activeTab === 'waste' && <WasteYieldsManager />}
          {activeTab === 'expansion' && <ExpansionOpportunitiesManager />}
          {activeTab === 'reports' && <SmartReportsManager />}
          {activeTab === 'operations' && <TreeOperationsManager />}
          {activeTab === 'preferences' && <HarvestPreferencesManager />}
        </div>
      </div>
    </div>
  );
}
