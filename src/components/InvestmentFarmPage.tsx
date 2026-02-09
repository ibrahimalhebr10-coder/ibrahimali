import { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, Lock, CheckCircle, TrendingUp, Users, Target, Zap, Shield, Clock, Sparkles, ChevronDown, BarChart3, Award, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { FarmProject, FarmContract } from '../services/farmService';
import { investmentPackagesService, type InvestmentPackage } from '../services/investmentPackagesService';
import UnifiedBookingFlow from './UnifiedBookingFlow';
import { usePageTracking } from '../hooks/useLeadTracking';

interface InvestmentFarmPageProps {
  farm: FarmProject;
  onClose: () => void;
  onGoToAccount?: () => void;
}

export default function InvestmentFarmPage({ farm, onClose, onGoToAccount }: InvestmentFarmPageProps) {
  const { user } = useAuth();
  const leadService = usePageTracking('مزرعة استثمارية');

  useEffect(() => {
    leadService.trackFarmView(farm.id, farm.name);
  }, [farm.id, farm.name]);

  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<InvestmentPackage | null>(null);
  const [selectedContract, setSelectedContract] = useState<FarmContract | null>(null);
  const [treeCount, setTreeCount] = useState(50);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [showPartnerCode, setShowPartnerCode] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [influencerCode, setInfluencerCode] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [activeInvestors] = useState(142);
  const [occupancyRate] = useState(78);

  useEffect(() => {
    if (farm.contracts && farm.contracts.length > 0) {
      const firstContract = farm.contracts[0];
      setSelectedContract(firstContract);
    }
  }, [farm.contracts]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const pkgs = await investmentPackagesService.getActivePackages();
        setPackages(pkgs);
        if (pkgs.length > 0) {
          const defaultPackage = pkgs[1] || pkgs[0];
          handleSelectPackage(defaultPackage);
        }
      } catch (error) {
        console.error('Error loading packages:', error);
      }
    };
    loadPackages();
  }, []);

  const handleSelectPackage = async (pkg: InvestmentPackage) => {
    setSelectedPackage(pkg);
    setTreeCount(pkg.min_trees);

    try {
      const { data: contract, error } = await supabase
        .from('farm_contracts')
        .select('*')
        .eq('id', pkg.contract_id)
        .maybeSingle();

      if (contract && !error) {
        setSelectedContract(contract);
      }
    } catch (error) {
      console.error('Error loading contract:', error);
    }
  };

  const handleTreeCountChange = (delta: number) => {
    const minTrees = selectedPackage?.min_trees || 50;
    const increment = selectedPackage?.tree_increment || 50;
    const maxTrees = farm.availableTrees || 3000;

    let newCount = treeCount + delta;
    newCount = Math.max(minTrees, Math.min(maxTrees, newCount));

    const remainder = newCount % increment;
    if (remainder !== 0) {
      if (delta > 0) {
        newCount = Math.ceil(newCount / increment) * increment;
      } else {
        newCount = Math.floor(newCount / increment) * increment;
      }
    }

    setTreeCount(Math.max(minTrees, Math.min(maxTrees, newCount)));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setTreeCount(value);
  };

  const calculateTotal = () => {
    if (selectedPackage) {
      return treeCount * selectedPackage.price_per_tree;
    }
    if (selectedContract) {
      return treeCount * selectedContract.investor_price;
    }
    return 0;
  };

  const calculateYearlyReturn = () => {
    const total = calculateTotal();
    return Math.round(total * 0.15);
  };

  const calculateTotalReturn = () => {
    const years = selectedPackage?.base_duration_years || 3;
    return calculateYearlyReturn() * years;
  };

  const handleVerifyCode = () => {
    if (partnerCode.trim()) {
      setCodeVerified(true);
      setInfluencerCode(partnerCode);
    }
  };

  const handleInvestNow = () => {
    if (!selectedPackage || !selectedContract) {
      alert('يرجى اختيار باقة استثمارية أولاً');
      return;
    }
    setShowBookingFlow(true);
  };

  const handleBookingComplete = () => {
    setShowBookingFlow(false);
    handleGoToAccount();
  };

  const handleBookingBack = () => {
    setShowBookingFlow(false);
  };

  const handleGoToAccount = () => {
    onClose();
    if (onGoToAccount) {
      onGoToAccount();
    }
  };

  const maxTrees = farm.availableTrees || 3000;
  const minTrees = selectedPackage?.min_trees || 50;

  return (
    <>
      {!showBookingFlow && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
          <div className="min-h-screen pb-40">

            {/* Premium Header with Parallax Effect */}
            <div className="relative h-[280px] overflow-hidden">
              {/* Background Image with Overlay */}
              <div className="absolute inset-0">
                {farm.heroImage || farm.image ? (
                  <img
                    src={farm.heroImage || farm.image}
                    alt={farm.name}
                    className="w-full h-full object-cover scale-110 animate-subtle-zoom"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent"></div>
              </div>

              {/* Back Button - Premium Style */}
              <button
                onClick={onClose}
                className="absolute top-6 left-6 w-11 h-11 rounded-2xl bg-white/95 backdrop-blur-xl shadow-xl border border-white/50 flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 z-10 group"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 group-hover:text-emerald-600 transition-colors" />
              </button>

              {/* Live Stats Badge */}
              <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-2 shadow-xl border border-white/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-gray-700">{activeInvestors} مستثمر نشط</span>
                </div>
              </div>

              {/* Main Title - Floating Card */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/50">
                  <div className="flex items-center justify-between mb-3">
                    <h1 className="text-2xl font-bold text-gray-800">احجز أشجارك الآن</h1>
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-full text-xs font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>عائد 15%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>استثمار آمن</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                      <span>خطوة واحدة</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>عوائد سنوية</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="px-4 mt-6 space-y-4">

              {/* Investment Calculator Card - Glassmorphism */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-gray-50/50 to-white shadow-2xl border border-gray-200/50">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600"></div>
                </div>

                <div className="relative p-6 space-y-6">

                  {/* Section Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-600" />
                        حاسبة الاستثمار
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">اختر عدد الأشجار وشاهد العائد المتوقع</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">متاح الآن</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {maxTrees}
                      </div>
                      <div className="text-xs text-gray-500">شجرة</div>
                    </div>
                  </div>

                  {/* Tree Counter - Premium Design */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 shadow-inner">
                    <div className="flex items-center justify-center gap-6">
                      <button
                        onClick={() => handleTreeCountChange(-50)}
                        disabled={treeCount <= minTrees}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl hover:scale-110 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 group"
                      >
                        <Minus className="w-5 h-5 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                      </button>

                      <div className="text-center">
                        <div className="text-6xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent animate-number-change">
                          {treeCount}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 font-medium">شجرة</div>
                      </div>

                      <button
                        onClick={() => handleTreeCountChange(50)}
                        disabled={treeCount >= maxTrees}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl hover:scale-110 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 group"
                      >
                        <Plus className="w-5 h-5 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                      </button>
                    </div>
                  </div>

                  {/* Premium Slider */}
                  <div className="relative px-1">
                    <input
                      type="range"
                      min={minTrees}
                      max={maxTrees}
                      value={treeCount}
                      onChange={handleSliderChange}
                      step={50}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer slider-premium"
                      style={{
                        background: `linear-gradient(to right, #10b981 0%, #14b8a6 ${((treeCount - minTrees) / (maxTrees - minTrees)) * 100}%, #e5e7eb ${((treeCount - minTrees) / (maxTrees - minTrees)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex justify-between mt-3 px-1">
                      <span className="text-xs text-gray-500 font-medium">{minTrees}</span>
                      <span className="text-xs font-bold text-emerald-600">{treeCount} شجرة</span>
                      <span className="text-xs text-gray-500 font-medium">{maxTrees}</span>
                    </div>
                  </div>

                  {/* Expected Return Card - Animated */}
                  <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-green-600 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-white/80 text-xs font-medium">العائد السنوي المتوقع</div>
                            <div className="text-white text-2xl font-bold">{calculateYearlyReturn().toLocaleString()} ر.س</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white/80 text-xs font-medium">إجمالي العائد</div>
                          <div className="text-white text-xl font-bold">{calculateTotalReturn().toLocaleString()} ر.س</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-white/20">
                        <Clock className="w-3.5 h-3.5 text-white/80" />
                        <span className="text-xs text-white/90">خلال {selectedPackage?.base_duration_years || 3} سنوات + مكافأة إضافية</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Package Selection - Modern Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-700">اختيار سريع</h4>
                      <button
                        onClick={() => setShowComparison(!showComparison)}
                        className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        <span>قارن الباقات</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${showComparison ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {packages.slice(0, 3).map((pkg, index) => {
                        const isSelected = selectedPackage?.id === pkg.id;
                        const isFeatured = index === 1;
                        return (
                          <button
                            key={pkg.id}
                            onClick={() => handleSelectPackage(pkg)}
                            className={`relative p-3 rounded-2xl transition-all duration-300 group ${
                              isSelected
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl scale-105'
                                : isFeatured
                                ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-400/50 shadow-md hover:shadow-lg'
                                : 'bg-white border-2 border-gray-200 hover:border-emerald-300 hover:shadow-md'
                            }`}
                          >
                            {isFeatured && !isSelected && (
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>الأكثر طلباً</span>
                                </div>
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              </div>
                            )}
                            <div className="text-center space-y-1 mt-1">
                              <div className={`text-sm font-bold ${isSelected ? 'text-white' : isFeatured ? 'text-amber-700' : 'text-gray-700'}`}>
                                {pkg.min_trees}
                              </div>
                              <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>شجرة</div>
                              <div className={`text-base font-bold ${isSelected ? 'text-white' : isFeatured ? 'text-amber-600' : 'text-gray-800'}`}>
                                {(pkg.price_per_tree * pkg.min_trees).toLocaleString()}
                              </div>
                              <div className={`text-[9px] ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>ر.س</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comparison Panel */}
                  {showComparison && (
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-200 space-y-2 animate-slideDown">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">مقارنة مع البنوك التقليدية</span>
                        <span className="text-emerald-600 font-bold">+12% أفضل</span>
                      </div>
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full w-[85%] bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full animate-progress"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Partner Code Section - Premium Style */}
              <div className="rounded-3xl bg-gradient-to-br from-white via-gray-50/50 to-white shadow-xl border border-gray-200/50 overflow-hidden">
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">كود شريك النجاح</h4>
                        <p className="text-[10px] text-gray-500">احصل على مزايا إضافية</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPartnerCode(!showPartnerCode)}
                      className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                        showPartnerCode ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                          showPartnerCode ? 'right-0.5' : 'right-7'
                        }`}
                      ></div>
                    </button>
                  </div>

                  {showPartnerCode && (
                    <div className="space-y-3 animate-slideDown">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200">
                        <div className="flex items-center gap-2 text-xs text-emerald-700">
                          <Sparkles className="w-4 h-4" />
                          <span className="font-semibold">أدخل الكود للحصول على 3 + 3 سنوات مجاناً</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={partnerCode}
                            onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                            placeholder="PARTNER50"
                            className="w-full px-4 py-3.5 bg-white border-2 border-gray-300 rounded-2xl text-sm font-bold text-center focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                          />
                          {codeVerified && (
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounceIn">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={handleVerifyCode}
                          disabled={!partnerCode.trim() || codeVerified}
                          className="px-6 py-3.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white text-sm font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          900 ر.س
                        </button>
                      </div>

                      {codeVerified && (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-3 shadow-lg animate-bounceIn">
                          <div className="flex items-center gap-2 text-white">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-bold">تم التحقق! حصلت على +3 سنوات مجاناً</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Social Proof Card */}
              <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                          <Users className="w-4 h-4" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-800">+{activeInvestors} مستثمر</div>
                      <div className="text-xs text-gray-500">وثقوا بنا هذا الشهر</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Heart key={i} className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Premium CTA Button - Fixed Bottom */}
          <div className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
            <div className="bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4">
              <div className="max-w-lg mx-auto px-4 space-y-3">

                {/* Price Summary - Compact */}
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-3 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">المبلغ الإجمالي</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {calculateTotal().toLocaleString()}
                      </span>
                      <span className="text-gray-600 font-medium">ر.س</span>
                    </div>
                  </div>
                </div>

                {/* Main CTA Button */}
                <button
                  onClick={handleInvestNow}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white text-lg font-bold rounded-2xl shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>احجز الآن واستثمر</span>
                  <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>

                {/* Trust Indicators */}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>آمن 100%</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>إلغاء مجاني</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ضمان العائد</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Booking Flow */}
      {showBookingFlow && selectedContract && selectedPackage && (
        <UnifiedBookingFlow
          farmId={farm.id}
          farmName={farm.name}
          pathType="investment"
          packageName={selectedPackage.package_name}
          treeCount={treeCount}
          contractId={selectedContract.id}
          contractName={selectedPackage.package_name || selectedContract.contract_name}
          durationYears={selectedPackage.base_duration_years || selectedContract.duration_years}
          bonusYears={selectedPackage.bonus_free_years || selectedContract.bonus_years}
          totalPrice={calculateTotal()}
          influencerCode={influencerCode}
          onBack={handleBookingBack}
          onComplete={handleBookingComplete}
        />
      )}

      <style>{`
        @keyframes subtle-zoom {
          0%, 100% { transform: scale(1.1); }
          50% { transform: scale(1.15); }
        }

        @keyframes number-change {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-subtle-zoom {
          animation: subtle-zoom 20s ease-in-out infinite;
        }

        .animate-number-change {
          animation: number-change 0.3s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-bounceIn {
          animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-progress {
          animation: progress 1.5s ease-out;
        }

        .slider-premium::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          border: 3px solid white;
          transition: all 0.3s ease;
        }

        .slider-premium::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
        }

        .slider-premium::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          border: 3px solid white;
          transition: all 0.3s ease;
        }

        .slider-premium::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
        }
      `}</style>
    </>
  );
}
