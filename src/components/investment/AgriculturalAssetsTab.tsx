import { useState, useEffect } from 'react';
import { TreePine, TrendingUp, FileText, Loader2 } from 'lucide-react';
import {
  getInvestorAssets,
  getAssetsSummary,
  syncAssetsFromReservations,
  type InvestorAsset,
  type AssetsSummary
} from '../../services/investorAssetsService';

export default function AgriculturalAssetsTab() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<InvestorAsset[]>([]);
  const [summary, setSummary] = useState<AssetsSummary>({
    totalTrees: 0,
    totalTreeTypes: 0,
    activeContracts: 0,
    expandingAssets: 0,
    completedAssets: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      await syncAssetsFromReservations();
      const [assetsData, summaryData] = await Promise.all([
        getInvestorAssets(),
        getAssetsSummary()
      ]);
      setAssets(assetsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  }

  const statusColors = {
    active: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    expanding: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    completed: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
  };

  const statusLabels = {
    active: 'نشطة',
    expanding: 'في توسعة',
    completed: 'مكتملة'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-darkgreen animate-spin" />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TreePine className="w-10 h-10 text-darkgreen" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">لا توجد أصول حالياً</h3>
        <p className="text-gray-600">ابدأ استثمارك الأول لتظهر أصولك هنا</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
          <TreePine className="w-8 h-8 text-darkgreen mb-2" />
          <div className="text-3xl font-bold text-gray-900">{summary.totalTrees}</div>
          <div className="text-sm text-gray-600 mt-1">إجمالي الأشجار</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
          <div className="text-3xl font-bold text-gray-900">{summary.totalTreeTypes}</div>
          <div className="text-sm text-gray-600 mt-1">أنواع الأشجار</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <FileText className="w-8 h-8 text-purple-600 mb-2" />
          <div className="text-3xl font-bold text-gray-900">{summary.activeContracts}</div>
          <div className="text-sm text-gray-600 mt-1">العقود النشطة</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <TrendingUp className="w-8 h-8 text-amber-600 mb-2" />
          <div className="text-3xl font-bold text-gray-900">{summary.expandingAssets}</div>
          <div className="text-sm text-gray-600 mt-1">أصول في توسعة</div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-bold text-gray-900">توزيع الأصول حسب النوع</h3>

        {assets.map(asset => {
          const colors = statusColors[asset.assetStatus] || statusColors.active;

          return (
            <div
              key={asset.id}
              className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <TreePine className="w-6 h-6 text-darkgreen" />
                    <h4 className="text-xl font-bold text-gray-900">{asset.treeType}</h4>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-gray-600">عدد الوحدات</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {asset.totalTrees}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600">العقود المرتبطة</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {asset.activeContracts}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600">حالة الأصول</div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${colors.bg} ${colors.text} ${colors.border} border`}>
                        {statusLabels[asset.assetStatus]}
                      </div>
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
