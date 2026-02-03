import React, { useState } from 'react';
import { Sprout, TrendingUp, MapPin, FileText, BookOpen, Calendar, Droplets, Eye } from 'lucide-react';
import TreesMapTab from './myfarm/TreesMapTab';
import AgriculturalOperationsTab from './myfarm/AgriculturalOperationsTab';
import AgriculturalDocumentationTab from './myfarm/AgriculturalDocumentationTab';
import GrowthStagesTab from './myfarm/GrowthStagesTab';
import ExperienceBuilderTab from './myfarm/ExperienceBuilderTab';

type FarmPath = 'agricultural' | 'investment';
type AgriculturalTab = 'trees-map' | 'operations' | 'documentation' | 'growth-stages' | 'experience-builder';

const MyFarmManagement: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<FarmPath | null>(null);
  const [activeTab, setActiveTab] = useState<AgriculturalTab>('trees-map');

  if (!selectedPath) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-darkgreen mb-4">مزرعتي</h1>
            <p className="text-gray-600 text-lg">اختر المسار للبدء</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* المسار الزراعي */}
            <button
              onClick={() => setSelectedPath('agricultural')}
              className="group relative bg-white rounded-2xl border-2 border-green-200 hover:border-green-500 transition-all p-8 text-right shadow-lg hover:shadow-xl"
            >
              <div className="absolute top-6 left-6">
                <Sprout className="w-12 h-12 text-green-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="pr-4">
                <h2 className="text-2xl font-bold text-darkgreen mb-3">🌱 المسار الزراعي</h2>
                <p className="text-gray-600 leading-relaxed">
                  إدارة الحياة الزراعية للأشجار: العمليات، التوثيق، مراحل النمو، وبناء تجربة المزارع
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                    خريطة الأشجار
                  </span>
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                    العمليات الزراعية
                  </span>
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                    التوثيق
                  </span>
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                    مراحل النمو
                  </span>
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                    Experience Builder
                  </span>
                </div>
                <div className="mt-6 text-green-600 font-semibold flex items-center justify-end gap-2">
                  <span>ابدأ الآن</span>
                  <span>&larr;</span>
                </div>
              </div>
            </button>

            {/* المسار الاستثماري */}
            <div className="relative bg-gray-50 rounded-2xl border-2 border-gray-200 p-8 text-right opacity-60 cursor-not-allowed">
              <div className="absolute top-6 left-6">
                <TrendingUp className="w-12 h-12 text-gray-400" />
              </div>
              <div className="pr-4">
                <h2 className="text-2xl font-bold text-gray-500 mb-3">📊 المسار الاستثماري</h2>
                <p className="text-gray-500 leading-relaxed">
                  إدارة العقود، المالية، والتوسعات الاستثمارية
                </p>
                <div className="mt-6 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium inline-block">
                  قريباً - المرحلة الثانية
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              المسار الاستثماري سيتم تفعيله في المرحلة الثانية
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedPath === 'agricultural') {
    const tabs = [
      { id: 'trees-map' as AgriculturalTab, label: 'خريطة الأشجار', icon: MapPin, color: 'green' },
      { id: 'operations' as AgriculturalTab, label: 'العمليات الزراعية', icon: Droplets, color: 'blue' },
      { id: 'documentation' as AgriculturalTab, label: 'التوثيق الزراعي', icon: FileText, color: 'amber' },
      { id: 'growth-stages' as AgriculturalTab, label: 'مراحل النمو', icon: Calendar, color: 'emerald' },
      { id: 'experience-builder' as AgriculturalTab, label: 'Experience Builder', icon: Eye, color: 'violet' },
    ];

    const getColorClasses = (color: string) => {
      const colors = {
        green: 'text-green-600',
        blue: 'text-blue-600',
        amber: 'text-amber-600',
        emerald: 'text-emerald-600',
        violet: 'text-violet-600',
      };
      return colors[color as keyof typeof colors] || colors.green;
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sprout className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-darkgreen">المسار الزراعي</h1>
                <p className="text-gray-600 text-sm mt-1">إدارة الحياة الزراعية للأشجار</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPath(null)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              العودة للمسارات
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap
                    ${isActive
                      ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                      : 'text-gray-600 hover:bg-gray-50 border-b-2 border-transparent'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : getColorClasses(tab.color)}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {activeTab === 'trees-map' && <TreesMapTab />}
          {activeTab === 'operations' && <AgriculturalOperationsTab />}
          {activeTab === 'documentation' && <AgriculturalDocumentationTab />}
          {activeTab === 'growth-stages' && <GrowthStagesTab />}
          {activeTab === 'experience-builder' && <ExperienceBuilderTab />}
        </div>
      </div>
    );
  }

  return null;
};

export default MyFarmManagement;
