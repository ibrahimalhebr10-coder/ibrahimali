import React, { useState } from 'react';
import { Leaf, Receipt, ArrowLeft, TrendingUp } from 'lucide-react';
import GreenTreesTab from './GreenTreesTab';
import MaintenancePaymentsTab from './MaintenancePaymentsTab';
import GoldenTreesInvestmentTab from './GoldenTreesInvestmentTab';

export default function OperationsSection() {
  const [activeSection, setActiveSection] = useState<'green-trees' | 'golden-trees' | 'payments'>('green-trees');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">قسم التشغيل</h2>
        <p className="text-gray-600 mt-1">إدارة الصيانة التشغيلية للمزارع</p>
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg border border-green-200">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>الصيانة (الأصل)</span>
          </div>
          <ArrowLeft className="w-4 h-4" />
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span>الرسوم والسداد (النتيجة)</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSection('green-trees')}
            className={`flex items-center justify-center gap-3 px-8 py-4 font-semibold transition-all relative ${
              activeSection === 'green-trees'
                ? 'bg-gradient-to-b from-green-50 to-white text-green-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Leaf className="w-5 h-5" />
            <div className="flex flex-col items-start">
              <span>أشجاري الخضراء</span>
              <span className="text-xs text-gray-500 font-normal">سجلات الصيانة التشغيلية</span>
            </div>
            {activeSection === 'green-trees' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveSection('golden-trees')}
            className={`flex items-center justify-center gap-3 px-8 py-4 font-semibold transition-all relative ${
              activeSection === 'golden-trees'
                ? 'bg-gradient-to-b from-amber-50 to-white text-amber-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <div className="flex flex-col items-start">
              <span>أشجاري الذهبية</span>
              <span className="text-xs text-gray-500 font-normal">دورات الاستثمار الذكية</span>
            </div>
            {activeSection === 'golden-trees' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveSection('payments')}
            className={`flex items-center justify-center gap-3 px-8 py-4 font-semibold transition-all relative ${
              activeSection === 'payments'
                ? 'bg-gradient-to-b from-blue-50 to-white text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <div className="flex flex-col items-start">
              <span>متابعة السداد</span>
              <span className="text-xs text-gray-500 font-normal">نتائج مالية مرتبطة بالصيانة</span>
            </div>
            {activeSection === 'payments' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
            )}
          </button>
        </div>

        <div className="p-6">
          {activeSection === 'green-trees' && <GreenTreesTab />}
          {activeSection === 'golden-trees' && <GoldenTreesInvestmentTab />}
          {activeSection === 'payments' && <MaintenancePaymentsTab />}
        </div>
      </div>
    </div>
  );
}
