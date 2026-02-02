import { useState, useEffect } from 'react';
import { Recycle, TrendingUp, Loader2, Leaf, Scissors, Droplets, Box } from 'lucide-react';
import {
  getWasteYields,
  getWasteYieldsSummary,
  getWasteTypeLabel,
  getUtilizationLabel,
  type WasteYield,
  type WasteYieldsSummary
} from '../../services/wasteYieldsService';

const wasteTypeIcons = {
  pruning: Scissors,
  leaves: Leaf,
  pressing_residue: Droplets,
  other: Box
};

const wasteTypeColors = {
  pruning: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  leaves: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  pressing_residue: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  other: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
};

const utilizationColors = {
  sale: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  conversion: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  composting: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
};

export default function WasteYieldsTab() {
  const [loading, setLoading] = useState(true);
  const [wastes, setWastes] = useState<WasteYield[]>([]);
  const [summary, setSummary] = useState<WasteYieldsSummary>({
    totalWasteTypes: 0,
    totalQuantity: 0,
    totalValueAdded: 0,
    byUtilization: { sale: 0, conversion: 0, composting: 0 }
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [wastesData, summaryData] = await Promise.all([
        getWasteYields(),
        getWasteYieldsSummary()
      ]);
      setWastes(wastesData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading waste yields:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-darkgreen animate-spin" />
      </div>
    );
  }

  if (wastes.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Recycle className="w-10 h-10 text-green-700" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">لا توجد عوائد مخلفات بعد</h3>
        <p className="text-gray-600">ستظهر عوائد المخلفات والاستفادة منها هنا</p>
        <div className="mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl inline-block">
          <p className="text-green-800 font-medium">ولا شيء يضيع</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 p-6 rounded-2xl border border-green-100">
        <div className="flex items-center gap-3 mb-2">
          <Recycle className="w-8 h-8 text-green-700" />
          <h3 className="text-2xl font-bold text-gray-900">ولا شيء يضيع</h3>
        </div>
        <p className="text-gray-700">كل ناتج من مزرعتك له قيمة وفائدة</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <Recycle className="w-8 h-8 text-green-600 mb-2" />
          <div className="text-3xl font-bold text-gray-900">{summary.totalWasteTypes}</div>
          <div className="text-sm text-gray-600 mt-1">أنواع المخلفات</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
          <div className="text-3xl font-bold text-gray-900">{summary.totalQuantity.toFixed(0)}</div>
          <div className="text-sm text-gray-600 mt-1">إجمالي الكمية</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100">
          <TrendingUp className="w-8 h-8 text-amber-700 mb-2" />
          <div className="text-3xl font-bold text-gray-900">{summary.totalValueAdded.toFixed(0)}</div>
          <div className="text-sm text-gray-600 mt-1">القيمة المضافة</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
          <div className="text-3xl font-bold text-gray-900">
            {summary.byUtilization.sale + summary.byUtilization.conversion + summary.byUtilization.composting}
          </div>
          <div className="text-sm text-gray-600 mt-1">طرق الاستفادة</div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-bold text-gray-900">تفاصيل المخلفات والاستفادة</h3>

        {wastes.map(item => {
          const Icon = wasteTypeIcons[item.wasteType] || Box;
          const typeColors = wasteTypeColors[item.wasteType] || wasteTypeColors.other;
          const utilColors = utilizationColors[item.utilizationMethod];

          return (
            <div
              key={item.id}
              className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${typeColors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${typeColors.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold text-gray-900">{item.wasteName}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeColors.bg} ${typeColors.text} ${typeColors.border} border`}>
                      {getWasteTypeLabel(item.wasteType)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">{item.farmName}</div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">الكمية</div>
                      <div className="text-lg font-bold text-gray-900 mt-1">
                        {item.quantity.toFixed(1)} {item.unit}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">طريقة الاستفادة</div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-1 ${utilColors.bg} ${utilColors.text} ${utilColors.border} border`}>
                        {getUtilizationLabel(item.utilizationMethod)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">القيمة المضافة</div>
                      <div className="text-lg font-bold text-gray-900 mt-1">
                        {item.valueAdded > 0 ? `${item.valueAdded.toFixed(0)} ريال` : '-'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">تاريخ الجمع</div>
                      <div className="text-sm text-gray-900 mt-1">
                        {new Date(item.collectionDate).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="text-sm text-green-800 font-medium text-center">
                      {item.psychologicalMessage}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
