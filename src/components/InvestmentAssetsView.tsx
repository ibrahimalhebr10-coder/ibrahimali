import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sprout,
  ArrowRight,
  Sparkles,
  X,
  Scissors,
  Droplets,
  Sun,
  CheckCircle2,
  Clock,
  Recycle,
  Factory,
  TreePine,
  Wallet
} from 'lucide-react';
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
        <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">
          {/* 1️⃣ رحلة الشجرة - العنوان التمهيدي */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-400/30 rounded-full">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-bold text-amber-200">رحلة أشجارك في هذه الدورة</h2>
            </div>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              نعرض لك ما تم على أشجارك قبل أي التزام مالي
            </p>
          </div>

          {/* 2️⃣ Timeline الصيانة */}
          {maintenanceRecords.length > 0 && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-amber-200 mb-2">مراحل العناية بأشجارك</h3>
                <p className="text-slate-400">كل ما تم من صيانة ورعاية</p>
              </div>

              <div className="space-y-6">
                {maintenanceRecords.map((record, index) => (
                  <div key={record.maintenance_id} className="relative">
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-amber-500/20">
                      <div className="flex items-start gap-6">
                        {/* أيقونة المرحلة */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-2 border-amber-400/40 rounded-2xl flex items-center justify-center">
                            {record.maintenance_type === 'periodic' ? (
                              <Scissors className="w-8 h-8 text-amber-400" />
                            ) : record.maintenance_type === 'seasonal' ? (
                              <Droplets className="w-8 h-8 text-amber-400" />
                            ) : (
                              <Sun className="w-8 h-8 text-amber-400" />
                            )}
                          </div>
                        </div>

                        {/* تفاصيل المرحلة */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-2xl font-bold text-amber-200">
                              {clientMaintenanceService.getMaintenanceTypeLabel(record.maintenance_type)}
                            </h4>
                            <div className={`px-3 py-1 rounded-full ${
                              record.payment_status === 'paid'
                                ? 'bg-green-500/20 border border-green-500/40'
                                : 'bg-slate-700/50 border border-slate-600'
                            }`}>
                              {record.payment_status === 'paid' ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                  <span className="text-sm font-bold text-green-400">مكتملة</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-slate-400" />
                                  <span className="text-sm font-bold text-slate-400">قيد التنفيذ</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <p className="text-slate-300">
                              <span className="text-slate-500">المزرعة:</span> {record.farm_name}
                            </p>
                            <p className="text-slate-300">
                              <span className="text-slate-500">التاريخ:</span> {new Date(record.maintenance_date).toLocaleDateString('ar-SA')}
                            </p>
                            {record.visible_media_count > 0 && (
                              <p className="text-amber-400">
                                <span className="text-slate-500">التوثيق:</span> {record.visible_media_count} {record.visible_media_count === 1 ? 'صورة' : record.visible_media_count === 2 ? 'صورتان' : 'صور'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* خط الوصل بين المراحل */}
                    {index < maintenanceRecords.length - 1 && (
                      <div className="absolute right-[7.5rem] top-full w-0.5 h-6 bg-gradient-to-b from-amber-400/40 to-transparent" style={{ transform: 'translateX(50%)' }}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3️⃣ القيمة المضافة - المخلفات */}
          <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm rounded-3xl p-8 border border-green-500/30">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-400/40 rounded-2xl flex items-center justify-center">
                  <Recycle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-green-200 mb-3">استثمار المخلفات</h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  مخلفات التقليم والعناية بأشجارك دخلت ضمن دورة قيمة مستدامة ولم تُهدر، مما يعزز من العائد البيئي والاقتصادي لاستثمارك.
                </p>
              </div>
            </div>
          </div>

          {/* 4️⃣ قسم المصنع */}
          <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 backdrop-blur-sm rounded-3xl p-8 border border-blue-500/30">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-2 border-blue-400/40 rounded-2xl flex items-center justify-center">
                  <Factory className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-blue-200 mb-2">حالة المعالجة</h3>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-400/30 rounded-full mb-3">
                  <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
                  <span className="text-blue-300 font-semibold">قيد المعالجة</span>
                </div>
                <p className="text-slate-300 text-lg leading-relaxed">
                  المحصول في مرحلة التحويل إلى قيمة فعلية في المصنع. سيتم تحديث البيانات عند اكتمال المعالجة.
                </p>
              </div>
            </div>
          </div>

          {/* 5️⃣ ملخص الملكية */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-amber-500/30">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-400/30 rounded-full">
                <TreePine className="w-6 h-6 text-amber-400" />
                <h3 className="text-2xl font-bold text-amber-200">ملكيتك في هذا المسار</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl p-6 border border-amber-400/20"
                  >
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                      </div>
                      <h4 className="text-lg font-bold text-amber-200 text-center">{asset.tree_type}</h4>
                      <div className="text-center">
                        <p className="text-4xl font-black text-amber-300 mb-1">{asset.trees_count}</p>
                        <p className="text-sm text-slate-400">شجرة</p>
                      </div>
                      <div className="pt-3 border-t border-slate-700">
                        <p className="text-xs text-slate-500 text-center">{asset.farm_name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6️⃣ الرسوم والسداد - المرحلة الأخيرة */}
          {maintenanceRecords.some(r => r.payment_status === 'pending' && r.client_due_amount) && (
            <div className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 backdrop-blur-sm rounded-3xl p-8 border border-amber-500/40">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-400/30 rounded-full">
                  <Wallet className="w-6 h-6 text-amber-400" />
                  <h3 className="text-2xl font-bold text-amber-200">رسوم الصيانة المستحقة</h3>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  {maintenanceRecords
                    .filter(r => r.payment_status === 'pending' && r.client_due_amount)
                    .map((record) => (
                      <div
                        key={record.maintenance_id}
                        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/30"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-right">
                            <p className="text-slate-400 text-sm mb-1">{record.farm_name}</p>
                            <p className="text-3xl font-black text-amber-300">{(record.client_due_amount || 0).toLocaleString()} ر.س</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {record.client_tree_count} {record.client_tree_count === 1 ? 'شجرة' : record.client_tree_count === 2 ? 'شجرتان' : 'أشجار'}
                              {record.cost_per_tree && ` × ${record.cost_per_tree.toLocaleString()} ر.س`}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => alert('سيتم توجيهك إلى صفحة السداد')}
                          className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                        >
                          <span className="text-lg">سداد الرسوم</span>
                          <ArrowRight className="w-6 h-6" />
                        </button>

                        <p className="text-center text-slate-400 text-sm mt-4 leading-relaxed">
                          الرسوم موزعة حسب عدد أشجارك فقط وتشمل صيانة هذه الدورة
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* رسالة إذا لم توجد صيانة */}
          {maintenanceRecords.length === 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-12 text-center border border-slate-700">
              <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sprout className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-200 mb-3">لا توجد تحديثات حالياً</h3>
              <p className="text-slate-400 text-lg">
                سيتم عرض تحديثات الصيانة والعناية بأشجارك هنا
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
