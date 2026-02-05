import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ArrowRight,
  Sparkles,
  X,
  Scissors,
  Recycle,
  Factory,
  TreePine,
  Wallet,
  Calendar,
  Image as ImageIcon,
  Video,
  Package
} from 'lucide-react';
import { getDemoGoldenTreesData } from '../services/demoDataService';
import { useAuth } from '../contexts/AuthContext';
import {
  determineGoldenTreesMode,
  getGoldenTreeAssets
} from '../services/goldenTreesService';
import { clientMaintenanceService, type ClientMaintenanceRecord } from '../services/clientMaintenanceService';
import { supabase } from '../lib/supabase';

interface InvestmentAssetsViewProps {
  onShowAuth?: (mode: 'login' | 'register') => void;
  onClose?: () => void;
}

export default function InvestmentAssetsView({ onClose }: InvestmentAssetsViewProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [investmentCycles, setInvestmentCycles] = useState<any[]>([]);
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

        const assetsData = await getGoldenTreeAssets(userId);
        const maintenanceData = await clientMaintenanceService.getClientMaintenanceRecords('investment');

        const farmIds = [...new Set(
          assetsData
            .map((a: any) => a.farm_id)
            .filter((id: any) => id && id !== 'undefined' && id !== 'null')
        )];
        let cyclesData: any[] = [];

        if (farmIds.length > 0) {
          const { data: cycles } = await supabase
            .from('investment_cycles')
            .select('*, farms(name_ar)')
            .in('farm_id', farmIds)
            .eq('status', 'published')
            .eq('visible_to_client', true)
            .order('cycle_date', { ascending: false });

          cyclesData = cycles || [];
        }

        console.log(`[InvestmentAssetsView] Loaded ${assetsData.length} assets, ${cyclesData.length} cycles, ${maintenanceData.length} maintenance records for user ${userId}`);

        setAssets(assetsData);
        setInvestmentCycles(cyclesData);
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
          {/* 1️⃣ ملخص الملكية */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-amber-500/30">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-400/30 rounded-full">
                <TreePine className="w-6 h-6 text-amber-400" />
                <h3 className="text-2xl font-bold text-amber-200">أشجارك في هذا المسار</h3>
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

          {/* 2️⃣ الدورات الاستثمارية من قاعدة البيانات */}
          {investmentCycles.length > 0 && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-amber-200 mb-2">دورات الاستثمار</h3>
                <p className="text-slate-400">ما تم على أشجارك من صيانة واستثمار</p>
              </div>

              {investmentCycles.map((cycle) => {
                const getCycleTypeLabels = (types: string[]) => {
                  const labels: Record<string, string> = {
                    maintenance: 'صيانة أشجار',
                    waste: 'مخلفات مزرعة',
                    factory: 'مصنع'
                  };
                  return types.map(t => labels[t] || t);
                };

                const cycleLabels = getCycleTypeLabels(cycle.cycle_types || []);
                const hasMaintenance = cycle.cycle_types?.includes('maintenance');
                const hasWaste = cycle.cycle_types?.includes('waste');
                const hasFactory = cycle.cycle_types?.includes('factory');

                return (
                  <div key={cycle.id} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-amber-500/20">
                    {/* رأس الدورة */}
                    <div className="mb-8 pb-6 border-b border-slate-700">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-2xl font-bold text-amber-200 mb-2">
                            {cycle.farms?.name_ar || 'مزرعة'}
                          </h4>
                          <p className="text-slate-300 leading-relaxed mb-3">{cycle.description}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(cycle.cycle_date).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </div>
                      </div>

                      {/* شارات أنواع الدورة */}
                      <div className="flex flex-wrap gap-2">
                        {cycleLabels.map((label, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-sm font-medium text-amber-300"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* محتوى الدورة */}
                    <div className="space-y-6">
                      {/* صيانة الأشجار */}
                      {hasMaintenance && (
                        <div className="bg-slate-700/30 rounded-2xl p-6 border border-amber-400/20">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                <Scissors className="w-6 h-6 text-amber-400" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h5 className="text-lg font-bold text-amber-200 mb-2">صيانة الأشجار</h5>
                              <p className="text-slate-300 text-sm">
                                تم إجراء صيانة شاملة للأشجار تشمل التقليم والتسميد والري والمتابعة الدورية
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* مخلفات المزرعة */}
                      {hasWaste && (
                        <div className="bg-green-900/20 rounded-2xl p-6 border border-green-500/30">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                <Recycle className="w-6 h-6 text-green-400" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h5 className="text-lg font-bold text-green-200 mb-2">استثمار المخلفات</h5>
                              <p className="text-slate-300 text-sm">
                                تم استثمار مخلفات التقليم والعناية ضمن دورة قيمة مستدامة
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* المصنع */}
                      {hasFactory && (
                        <div className="bg-blue-900/20 rounded-2xl p-6 border border-blue-500/30">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <Factory className="w-6 h-6 text-blue-400" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h5 className="text-lg font-bold text-blue-200 mb-2">معالجة في المصنع</h5>
                              <p className="text-slate-300 text-sm">
                                المحصول في مرحلة التحويل إلى منتجات نهائية ذات قيمة
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* التوثيق */}
                      {(cycle.images?.length > 0 || cycle.videos?.length > 0) && (
                        <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600">
                          <h5 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            التوثيق
                          </h5>
                          <div className="flex items-center gap-4 text-sm">
                            {cycle.images?.length > 0 && (
                              <div className="flex items-center gap-2 text-slate-400">
                                <ImageIcon className="w-4 h-4" />
                                <span>{cycle.images.length} {cycle.images.length === 1 ? 'صورة' : 'صور'}</span>
                              </div>
                            )}
                            {cycle.videos?.length > 0 && (
                              <div className="flex items-center gap-2 text-slate-400">
                                <Video className="w-4 h-4" />
                                <span>{cycle.videos.length} {cycle.videos.length === 1 ? 'فيديو' : 'فيديوهات'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3️⃣ الرسوم والسداد */}
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

          {/* رسالة إذا لم توجد دورات استثمارية */}
          {investmentCycles.length === 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-12 text-center border border-slate-700">
              <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-200 mb-3">لا توجد دورات استثمارية حالياً</h3>
              <p className="text-slate-400 text-lg">
                سيتم عرض دورات الاستثمار والصيانة الخاصة بأشجارك هنا عند تسجيلها من الإدارة
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
