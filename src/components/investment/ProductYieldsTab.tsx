import { useState, useEffect } from 'react';
import { Package, TrendingUp, Loader2, Apple, Droplet, Box } from 'lucide-react';
import {
  getProductYields,
  getProductYieldsSummary,
  getProductTypeLabel,
  type ProductYield,
  type ProductYieldsSummary
} from '../../services/productYieldsService';

const productTypeIcons = {
  fruits: Apple,
  oil: Droplet,
  secondary: Box
};

const productTypeColors = {
  fruits: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  oil: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  secondary: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
};

export default function ProductYieldsTab() {
  const [loading, setLoading] = useState(true);
  const [yields, setYields] = useState<ProductYield[]>([]);
  const [summary, setSummary] = useState<ProductYieldsSummary>({
    totalProducts: 0,
    totalProduced: 0,
    totalSold: 0,
    totalValue: 0,
    byType: { fruits: 0, oil: 0, secondary: 0 }
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [yieldsData, summaryData] = await Promise.all([
        getProductYields(),
        getProductYieldsSummary()
      ]);
      setYields(yieldsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading product yields:', error);
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

  if (yields.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-amber-700" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">لا توجد عوائد منتجات بعد</h3>
        <p className="text-gray-600">ستظهر عوائد منتجاتك من الثمار والزيوت هنا</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100">
          <Package className="w-8 h-8 text-amber-700 mb-2" />
          <div className="text-3xl font-bold text-gray-900">{summary.totalProducts}</div>
          <div className="text-sm text-gray-600 mt-1">إجمالي المنتجات</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
          <div className="text-3xl font-bold text-gray-900">{summary.totalProduced.toFixed(0)}</div>
          <div className="text-sm text-gray-600 mt-1">ما تم إنتاجه</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
          <div className="text-3xl font-bold text-gray-900">{summary.totalSold.toFixed(0)}</div>
          <div className="text-sm text-gray-600 mt-1">ما تم بيعه</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
          <div className="text-3xl font-bold text-gray-900">{summary.totalValue.toFixed(0)}</div>
          <div className="text-sm text-gray-600 mt-1">القيمة المحققة</div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-bold text-gray-900">ملخصات تشغيلية</h3>

        {yields.map(item => {
          const Icon = productTypeIcons[item.productType];
          const colors = productTypeColors[item.productType];

          return (
            <div
              key={item.id}
              className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold text-gray-900">{item.productName}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                      {getProductTypeLabel(item.productType)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">{item.farmName}</div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">الكمية المنتجة</div>
                      <div className="text-lg font-bold text-gray-900 mt-1">
                        {item.quantityProduced.toFixed(1)} {item.unit}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">الكمية المباعة</div>
                      <div className="text-lg font-bold text-gray-900 mt-1">
                        {item.quantitySold.toFixed(1)} {item.unit}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">القيمة</div>
                      <div className="text-lg font-bold text-gray-900 mt-1">
                        {item.valueGenerated > 0 ? `${item.valueGenerated.toFixed(0)} ريال` : '-'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">الموسم</div>
                      <div className="text-lg font-bold text-gray-900 mt-1">
                        {item.season || '-'}
                      </div>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-700">{item.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
