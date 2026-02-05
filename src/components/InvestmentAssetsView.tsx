import React, { useState, useEffect } from 'react';
import { TrendingUp, Shield, Sprout, ArrowRight, Lock, Package, Sparkles } from 'lucide-react';
import { getDemoGoldenTreesData } from '../services/demoDataService';
import { useDemoMode } from '../contexts/DemoModeContext';
import { useAuth } from '../contexts/AuthContext';
import DemoActionModal from './DemoActionModal';
import {
  determineGoldenTreesMode,
  getGoldenTreeAssets,
  type GoldenTreesMode
} from '../services/goldenTreesService';
import { clientMaintenanceService, type ClientMaintenanceRecord } from '../services/clientMaintenanceService';

interface InvestmentAssetsViewProps {
  onShowAuth?: (mode: 'login' | 'register') => void;
}

export default function InvestmentAssetsView({ onShowAuth }: InvestmentAssetsViewProps) {
  const { isDemoMode } = useDemoMode();
  const { user } = useAuth();
  const [showDemoActionModal, setShowDemoActionModal] = useState(false);
  const [mode, setMode] = useState<GoldenTreesMode>('demo');
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<ClientMaintenanceRecord[]>([]);
  const data = getDemoGoldenTreesData();

  useEffect(() => {
    loadGoldenTreesData();
  }, [user]);

  const loadGoldenTreesData = async () => {
    setLoading(true);
    try {
      const userId = user?.id;

      if (!userId) {
        console.log('[InvestmentAssetsView] No user ID, using demo mode');
        setMode('demo');
        setLoading(false);
        return;
      }

      console.log(`[InvestmentAssetsView] Loading data for user ${userId}`);

      const context = await determineGoldenTreesMode(userId);
      setMode(context.mode);

      if (context.mode === 'active' && userId) {
        console.log(`[InvestmentAssetsView] User ${userId} has active assets, loading details`);

        const [assetsData, maintenanceData] = await Promise.all([
          getGoldenTreeAssets(userId),
          clientMaintenanceService.getClientMaintenanceRecords('investment')
        ]);

        console.log(`[InvestmentAssetsView] Loaded ${assetsData.length} assets and ${maintenanceData.length} maintenance records for user ${userId}`);

        setAssets(assetsData);
        setMaintenanceRecords(maintenanceData);
      }
    } catch (error) {
      console.error('[InvestmentAssetsView] Error loading golden trees data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvestmentAction = () => {
    if (mode === 'demo') {
      setShowDemoActionModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pb-32">
      {showDemoActionModal && (
        <DemoActionModal
          onClose={() => setShowDemoActionModal(false)}
          onLogin={() => {
            setShowDemoActionModal(false);
            if (onShowAuth) {
              onShowAuth('login');
            }
          }}
          onRegister={() => {
            setShowDemoActionModal(false);
            if (onShowAuth) {
              onShowAuth('register');
            }
          }}
        />
      )}

      {mode === 'demo' && (
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <Sparkles className="w-7 h-7 text-amber-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-200 mb-2">
                  وضع العرض التوضيحي
                </h3>
                <p className="text-amber-100/80 mb-4">
                  هذه نظرة عامة على التجربة. للوصول الكامل والسداد، يرجى تسجيل الدخول
                </p>
                <button
                  onClick={handleInvestmentAction}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'no-assets' && (
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <Package className="w-7 h-7 text-slate-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-200 mb-2">
                  لا توجد أصول استثمارية
                </h3>
                <p className="text-slate-400 mb-4">
                  أنت مسجل دخول لكن لا تملك أشجار ذهبية حالياً. ابدأ رحلتك الاستثمارية الآن
                </p>
                <button
                  onClick={handleInvestmentAction}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all"
                >
                  <Sprout className="w-4 h-4" />
                  <span>ابدأ الاستثمار</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'demo' && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent"></div>

          <div className="relative max-w-6xl mx-auto px-4 py-24 text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-2xl">
                <Sprout className="w-12 h-12 text-white" />
              </div>
            </div>

            <div className="space-y-6 mb-12">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                {data.heroMessage.title}
              </h1>
              <p className="text-3xl text-amber-200/90 font-light">
                {data.heroMessage.subtitle}
              </p>
            </div>

            <button
              onClick={handleInvestmentAction}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl text-lg font-medium transition-all duration-300 border border-white/20"
            >
              <span>{data.heroMessage.cta}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {mode === 'demo' && (
        <div className="max-w-7xl mx-auto px-4 space-y-16">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-3xl"></div>
            <div className="relative h-96 rounded-3xl overflow-hidden">
            <img
              src="https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg"
              alt="أصل زراعي"
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent flex items-end p-12">
              <p className="text-2xl font-light text-white/90">
                أصل زراعي يعمل بصمت… وينمو مع الوقت
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl p-10 border border-white/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-3xl font-bold">أصلك الاستثماري</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <span className="text-slate-400">النوع</span>
                <span className="text-xl font-semibold">{data.treeType}</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <span className="text-slate-400">الموقع</span>
                <span className="text-xl font-semibold">{data.farmName}</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <span className="text-slate-400">المدة</span>
                <span className="text-xl font-semibold">{data.contractDuration} سنوات</span>
              </div>
              <div className="flex items-center justify-between py-4">
                <span className="text-slate-400">الحالة</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xl font-semibold text-green-400">{data.assetStatus.condition}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-900/20 to-slate-900/50 backdrop-blur-sm rounded-3xl p-10 border border-amber-500/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-3xl font-bold">مؤشرات القيمة</h2>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-2xl">
                <p className="text-lg text-amber-200/80 mb-4 font-light italic">
                  "{data.valueInsights.statement}"
                </p>
              </div>

              {data.valueInsights.sources.map((source, index) => (
                <div key={index} className="flex items-start justify-between py-3">
                  <span className="text-slate-300">{source.name}</span>
                  <span className="text-amber-400 font-medium">{source.contribution}</span>
                </div>
              ))}

              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">النمو</span>
                  <span className="text-lg text-green-400">{data.assetStatus.performance}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">التنويع</span>
                  <span className="text-lg text-blue-400">{data.assetStatus.diversification}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-3xl p-12 border border-white/5 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-3xl font-bold mb-4">السجل التاريخي</h3>
            <p className="text-xl text-slate-300 font-light leading-relaxed">
              {data.historicalNote}
            </p>
            <p className="text-sm text-slate-500 italic">
              العوائد السابقة لا تضمن النتائج المستقبلية
            </p>
          </div>
        </div>

          <div className="text-center space-y-6">
            <button
              onClick={handleInvestmentAction}
              className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 rounded-2xl text-lg font-semibold transition-all duration-300 shadow-2xl shadow-amber-500/20"
            >
              <span>ابدأ رحلتك الاستثمارية</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-slate-500 text-sm">
              التسجيل يفتح لك التفاصيل الكاملة والتنفيذ الفعلي
            </p>
          </div>
        </div>
      )}

      {mode === 'active' && assets.length > 0 && (
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
