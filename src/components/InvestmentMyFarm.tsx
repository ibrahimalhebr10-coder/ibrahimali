import { useState, useEffect } from 'react';
import { TrendingUp, TreeDeciduous, Clock, DollarSign, Recycle, ArrowRight, Target, Droplets, Leaf, Plus, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { investorMyFarmService, InvestorMyFarmData } from '../services/investorMyFarmService';

interface VisitorOverlayProps {
  onClose: () => void;
  onStartInvestment: () => void;
  onRegister: () => void;
}

function VisitorOverlay({ onClose, onStartInvestment, onRegister }: VisitorOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            هذه مزرعة استثمارية حقيقية
          </h2>

          <p className="text-gray-600 mb-8 leading-relaxed">
            أنشئ حسابك وابدأ استثمارك الزراعي الآن
          </p>

          <div className="space-y-3">
            <button
              onClick={onStartInvestment}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              ابدأ الاستثمار
            </button>

            <button
              onClick={onRegister}
              className="w-full py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              إنشاء حساب
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
            <TreeDeciduous className="w-12 h-12 text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            لا توجد استثمارات حالياً
          </h2>

          <p className="text-gray-600 mb-8">
            ابدأ استثمارك الزراعي الأول واحصل على أصول حقيقية تعمل لصالحك
          </p>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            ابدأ الاستثمار الآن
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvestmentMyFarm() {
  const { user } = useAuth();
  const isVisitor = !user;
  const [showOverlay, setShowOverlay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [farmData, setFarmData] = useState<InvestorMyFarmData | null>(null);

  useEffect(() => {
    if (user) {
      loadFarmData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadFarmData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await investorMyFarmService.getInvestorFarmData(user.id);
      setFarmData(data);
    } catch (error) {
      console.error('Error loading farm data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = () => {
    if (isVisitor) {
      setShowOverlay(true);
    }
  };

  const handleStartInvestment = () => {
    setShowOverlay(false);
    window.location.href = '/';
  };

  const handleRegister = () => {
    setShowOverlay(false);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل مزرعتك...</p>
        </div>
      </div>
    );
  }

  if (!isVisitor && farmData && farmData.assets.length === 0) {
    return <EmptyState />;
  }

  const assetsByType = farmData ? investorMyFarmService.groupAssetsByType(farmData.assets) : {};
  const activeContract = farmData?.contracts[0];
  const contractProgress = activeContract ? investorMyFarmService.calculateContractProgress(activeContract) : null;

  const contractPhases = [
    { label: 'نمو', emoji: '🌱', isActive: contractProgress && contractProgress.currentYear === 1 },
    { label: 'مؤسسة', emoji: '🌿', isActive: contractProgress && contractProgress.currentYear === 2 },
    { label: 'حصاد', emoji: '🌾', isActive: contractProgress && contractProgress.currentYear >= 3 && contractProgress.currentYear <= 4 },
    { label: 'امتياز', emoji: '🔵', isActive: contractProgress && contractProgress.currentYear >= 5 }
  ];

  const getTreeIcon = (treeType: string) => {
    return TreeDeciduous;
  };

  const getTreeColor = (treeType: string) => {
    const colors: Record<string, { text: string; bg: string; border: string }> = {
      'زيتون': { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
      'لوز': { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
      'تين': { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
      'نخيل': { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
      'رمان': { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    };
    return colors[treeType] || { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {showOverlay && (
        <VisitorOverlay
          onClose={() => setShowOverlay(false)}
          onStartInvestment={handleStartInvestment}
          onRegister={handleRegister}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 pb-48 space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">محصولي الاستثماري</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            مزرعتي الاستثمارية
          </h1>

          <p className="text-lg text-gray-600">
            أصول زراعية حقيقية تعمل لصالحك
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">أصولي الزراعية</h2>
            {isVisitor && (
              <span className="text-xs text-gray-400 px-3 py-1 bg-gray-50 rounded-full">
                مثال توضيحي
              </span>
            )}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الأشجار</p>
                <p className="text-4xl font-bold text-gray-800">
                  {isVisitor ? '100' : farmData?.totalTrees || 0}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <TreeDeciduous className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {isVisitor ? (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'زيتون', count: 50 },
                { label: 'لوز', count: 30 },
                { label: 'تين', count: 20 }
              ].map((asset) => {
                const colors = getTreeColor(asset.label);
                const Icon = getTreeIcon(asset.label);
                return (
                  <div
                    key={asset.label}
                    className={`${colors.bg} rounded-2xl p-4 text-center border ${colors.border}`}
                  >
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-white flex items-center justify-center shadow-md border ${colors.border}`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <p className={`font-bold ${colors.text} text-lg mb-1`}>{asset.count}</p>
                    <p className="text-sm text-gray-600">{asset.label}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(assetsByType).map(([treeType, count]) => {
                const colors = getTreeColor(treeType);
                const Icon = getTreeIcon(treeType);
                return (
                  <div
                    key={treeType}
                    className={`${colors.bg} rounded-2xl p-4 text-center border ${colors.border}`}
                  >
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-white flex items-center justify-center shadow-md border ${colors.border}`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <p className={`font-bold ${colors.text} text-lg mb-1`}>{count}</p>
                    <p className="text-sm text-gray-600">{treeType}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {(isVisitor || activeContract) && (
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-cyan-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">نبض الاستثمار</h2>
                <p className="text-sm text-gray-500">مرحلة العقد الحالية</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              {contractPhases.map((phase, index) => {
                return (
                  <div key={index} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-full ${phase.isActive ? 'bg-blue-50' : 'bg-gray-50'} flex items-center justify-center border-2 ${phase.isActive ? 'border-blue-500' : 'border-gray-200'} transition-all`}>
                        <span className="text-2xl">{phase.emoji}</span>
                      </div>
                      <p className={`text-sm font-medium mt-2 ${phase.isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                        {phase.label}
                      </p>
                    </div>

                    {index < contractPhases.length - 1 && (
                      <div className={`w-8 h-1 ${phase.isActive ? 'bg-blue-500' : 'bg-gray-200'} mx-1`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100 text-center">
              <Clock className="w-10 h-10 text-cyan-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-gray-800 mb-2">
                <span className="font-bold text-blue-600">
                  سنة {contractProgress?.currentYear || 1}
                </span> من <span className="font-bold">{contractProgress?.totalYears || 5}</span>
              </p>
              <p className="text-gray-600 text-sm">
                المتبقي: <span className="font-semibold">
                  {contractProgress?.remainingYears || 4} سنوات و {contractProgress?.remainingMonths || 8} أشهر
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-green-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">عوائد الإنتاج</h2>
          <p className="text-gray-600 text-sm mb-6">ما تم إنتاجه حتى الآن</p>

          {isVisitor || (farmData?.productYields.length || 0) === 0 ? (
            <div className="grid gap-4">
              {[
                { icon: TreeDeciduous, label: 'ثمار', amount: 'موسم 2025', color: 'from-green-500 to-emerald-500' },
                { icon: Droplets, label: 'زيوت', amount: 'قريباً', color: 'from-amber-500 to-orange-500' },
                { icon: Target, label: 'منتجات ثانوية', amount: 'قيد التجهيز', color: 'from-purple-500 to-violet-500' }
              ].map((product) => {
                const ProductIcon = product.icon;
                return (
                  <button
                    key={product.label}
                    onClick={handleActionClick}
                    className="group w-full bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border-2 border-gray-200 hover:border-transparent hover:shadow-xl transition-all text-right"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <ProductIcon className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{product.label}</p>
                        <p className="text-sm text-gray-500">{product.amount}</p>
                      </div>

                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {farmData?.productYields.map((product) => (
                <div
                  key={product.id}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-800">{product.product_type}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(product.harvest_date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{product.description}</p>
                  <p className="text-green-700 font-semibold">
                    {product.value} {product.value_unit}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-emerald-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">عوائد المخلفات</h2>
              <p className="text-sm text-emerald-600 font-medium mt-1">ولا شيء يضيع ♻️</p>
            </div>
            <Recycle className="w-10 h-10 text-emerald-500" />
          </div>

          {isVisitor || (farmData?.wasteYields.length || 0) === 0 ? (
            <div className="space-y-3">
              {[
                { icon: Leaf, label: 'مخلفات التقليم', status: 'متاح' },
                { icon: TreeDeciduous, label: 'أوراق الأشجار', status: 'متاح' },
                { icon: Recycle, label: 'تفل العصر', status: 'موسمي' }
              ].map((waste) => {
                const WasteIcon = waste.icon;
                return (
                  <button
                    key={waste.label}
                    onClick={handleActionClick}
                    className="group w-full bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200 hover:shadow-lg transition-all text-right"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-emerald-200">
                        <WasteIcon className="w-5 h-5 text-emerald-600" />
                      </div>

                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">{waste.label}</p>
                        <p className="text-xs text-emerald-600">{waste.status}</p>
                      </div>

                      <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {farmData?.wasteYields.map((waste) => (
                <div
                  key={waste.id}
                  className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-800 text-sm">{waste.waste_type}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(waste.collection_date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <p className="text-gray-700 text-xs mb-2">{waste.description}</p>
                  <p className="text-emerald-700 font-semibold text-sm">
                    {waste.value} {waste.value_unit}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100">
          <h2 className="text-xl font-bold text-gray-800 mb-2">فرص التوسعة</h2>
          <p className="text-gray-600 text-sm mb-6">وسّع استثمارك بهدوء</p>

          {isVisitor || (farmData?.expansionOpportunities.length || 0) === 0 ? (
            <div className="grid gap-3">
              <button
                onClick={handleActionClick}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-50 to-cyan-50 text-gray-800 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-blue-200"
              >
                <Plus className="w-5 h-5 text-blue-600" />
                أضف 50 شجرة
              </button>

              <button
                onClick={handleActionClick}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-50 to-violet-50 text-gray-800 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-purple-200"
              >
                <TreeDeciduous className="w-5 h-5 text-purple-600" />
                ادخل مزرعة أخرى
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {farmData?.expansionOpportunities.map((opportunity) => (
                <button
                  key={opportunity.id}
                  className="w-full p-5 bg-gradient-to-r from-purple-50 to-violet-50 text-gray-800 rounded-xl hover:shadow-lg transition-all border border-purple-200 text-right"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      {opportunity.opportunity_type === 'إضافة أشجار' ? (
                        <Plus className="w-6 h-6 text-white" />
                      ) : (
                        <TreeDeciduous className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-1">{opportunity.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{opportunity.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-purple-700 font-semibold">
                          {opportunity.estimated_investment.toLocaleString('ar-SA')} ريال
                        </span>
                        <span className="text-gray-500">
                          {opportunity.potential_trees} شجرة
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {isVisitor && (
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl shadow-xl p-8 text-center text-white">
            <TrendingUp className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">
              جاهز لتبدأ استثمارك الزراعي؟
            </h3>
            <p className="text-blue-50 mb-6">
              ابدأ باستثمار حقيقي وشاهد أصولك تنمو
            </p>
            <button
              onClick={handleStartInvestment}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              ابدأ الاستثمار الآن
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
