import React, { useState } from 'react';
import { Leaf, Receipt } from 'lucide-react';
import GreenTreesTab from './GreenTreesTab';
import MaintenancePaymentsTab from './MaintenancePaymentsTab';

export default function OperationsSection() {
  const [activeSection, setActiveSection] = useState<'green-trees' | 'payments'>('green-trees');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">قسم التشغيل</h2>
        <p className="text-gray-600 mt-1">إدارة الصيانة الزراعية ومتابعة السداد</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSection('green-trees')}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 font-semibold transition-all ${
              activeSection === 'green-trees'
                ? 'bg-green-50 text-green-700 border-b-3 border-green-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Leaf className="w-5 h-5" />
            أشجاري الخضراء
          </button>
          <button
            onClick={() => setActiveSection('payments')}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 font-semibold transition-all ${
              activeSection === 'payments'
                ? 'bg-blue-50 text-blue-700 border-b-3 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Receipt className="w-5 h-5" />
            متابعة السداد
          </button>
        </div>

        <div className="p-6">
          {activeSection === 'green-trees' && <GreenTreesTab />}
          {activeSection === 'payments' && <MaintenancePaymentsTab />}
        </div>
      </div>
    </div>
  );
}
