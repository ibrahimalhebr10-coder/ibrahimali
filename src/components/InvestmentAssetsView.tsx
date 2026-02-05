import React, { useState, useEffect } from 'react';
import { TrendingUp, Sprout, ArrowRight, Sparkles, X } from 'lucide-react';
import { getDemoGoldenTreesData } from '../services/demoDataService';
import { useAuth } from '../contexts/AuthContext';
import {
  determineGoldenTreesMode,
  getGoldenTreeAssets
} from '../services/goldenTreesService';
import { clientMaintenanceService, type ClientMaintenanceRecord } from '../services/clientMaintenanceService';

interface InvestmentAssetsViewProps {
  onShowAuth?: (mode: 'login' | 'register') => void;
  onClose?: () => void;
}

export default function InvestmentAssetsView({ onClose }: InvestmentAssetsViewProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<ClientMaintenanceRecord[]>([]);
  const data = getDemoGoldenTreesData();

  useEffect(() => {
    loadGoldenTreesData();
  }, [user]);

  const loadGoldenTreesData = async () => {
    try {
      const userId = user?.id;

      if (!userId) {
        console.log('[InvestmentAssetsView] No user ID, showing demo data');
        setAssets([{
          id: 'demo-1',
          tree_type: data.treeType,
          farm_name: data.farmName,
          trees_count: 10,
          contract_duration: data.contractDuration,
          total_price: 50000,
          contract_start_date: new Date().toISOString()
        }]);
        return;
      }

      console.log(`[InvestmentAssetsView] Loading data for user ${userId}`);

      const context = await determineGoldenTreesMode(userId);

      if (context.mode === 'active' && userId) {
        console.log(`[InvestmentAssetsView] User ${userId} has active assets, loading details`);

        const [assetsData, maintenanceData] = await Promise.all([
          getGoldenTreeAssets(userId),
          clientMaintenanceService.getClientMaintenanceRecords('investment')
        ]);

        console.log(`[InvestmentAssetsView] Loaded ${assetsData.length} assets and ${maintenanceData.length} maintenance records for user ${userId}`);

        setAssets(assetsData);
        setMaintenanceRecords(maintenanceData);
      } else {
        setAssets([{
          id: 'demo-1',
          tree_type: data.treeType,
          farm_name: data.farmName,
          trees_count: 10,
          contract_duration: data.contractDuration,
          total_price: 50000,
          contract_start_date: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('[InvestmentAssetsView] Error loading golden trees data:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" style={{ paddingBottom: '200px', minHeight: '100%' }}>
      {onClose && (
        <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl font-bold text-amber-200">أشجاري الذهبية</h1>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      )}

      {assets.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-16 space-y-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-amber-200 mb-4">أصولك الاستثمارية</h2>
            <p className="text-xl text-slate-400">أشجارك الذهبية النشطة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-amber-200">{asset.tree_type}</h3>
                  <div className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full">
                    <span className="text-sm font-bold text-green-400">نشط</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">المزرعة</span>
                    <span className="text-white font-medium">{asset.farm_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">عدد الأشجار</span>
                    <span className="text-amber-200 font-bold">{asset.trees_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المدة</span>
                    <span className="text-white font-medium">{asset.contract_duration} سنوات</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الاستثمار</span>
                    <span className="text-amber-300 font-bold">{asset.total_price.toLocaleString()} ر.س</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-slate-700">
                    <span className="text-slate-500">تاريخ البداية</span>
                    <span className="text-slate-400">{new Date(asset.contract_start_date).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-amber-200 mb-2">سجلات الصيانة</h3>
              <p className="text-slate-400">الصيانة والرسوم المستحقة لأشجارك الذهبية</p>
            </div>

            {maintenanceRecords.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-12 text-center border border-slate-700">
                <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sprout className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-200 mb-3">لا توجد تحديثات حالياً</h3>
                <p className="text-slate-400 text-lg">
                  سيتم عرض تحديثات الصيانة والعناية بأشجارك هنا
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {maintenanceRecords.map((record) => (
                  <div
                    key={record.maintenance_id}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-amber-200 mb-1">{record.farm_name}</h4>
                        <p className="text-sm text-slate-400 mb-2">{clientMaintenanceService.getMaintenanceTypeLabel(record.maintenance_type)}</p>
                        <p className="text-2xl font-black text-amber-400">{(record.client_due_amount || 0).toLocaleString()} ر.س</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {record.client_tree_count} {record.client_tree_count === 1 ? 'شجرة' : record.client_tree_count === 2 ? 'شجرتان' : 'أشجار'}
                          {record.cost_per_tree && ` × ${record.cost_per_tree.toLocaleString()} ر.س`}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full ${
                          record.payment_status === 'paid'
                            ? 'bg-green-500/20 border border-green-500/40'
                            : 'bg-amber-500/20 border border-amber-500/40'
                        }`}
                      >
                        <span className={`text-sm font-bold ${
                          record.payment_status === 'paid' ? 'text-green-400' : 'text-amber-300'
                        }`}>
                          {record.payment_status === 'paid' ? 'مسدد' : 'معلق'}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-slate-400 mb-4">
                      تاريخ الصيانة: {new Date(record.maintenance_date).toLocaleDateString('ar-SA')}
                    </div>

                    {record.payment_status === 'pending' && record.client_due_amount && (
                      <button
                        onClick={() => alert('سيتم توجيهك إلى صفحة السداد')}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2"
                      >
                        <span>سداد الآن</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
