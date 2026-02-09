import { useState, useEffect } from 'react';
import { ArrowRight, Minus, Plus, MapPin, TreePine, Star, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { FarmProject, FarmContract } from '../services/farmService';
import { investmentPackagesService, type InvestmentPackage } from '../services/investmentPackagesService';
import UnifiedBookingFlow from './UnifiedBookingFlow';
import { usePageTracking } from '../hooks/useLeadTracking';
import { influencerMarketingService, type FeaturedPackageSettings } from '../services/influencerMarketingService';
import FeaturedPackageOverlay from './FeaturedPackageOverlay';

interface InvestmentFarmPageProps {
  farm: FarmProject;
  onClose: () => void;
  onGoToAccount?: () => void;
}

export default function InvestmentFarmPage({ farm, onClose, onGoToAccount }: InvestmentFarmPageProps) {
  const leadService = usePageTracking('مزرعة استثمارية');

  useEffect(() => {
    leadService.trackFarmView(farm.id, farm.name);
  }, [farm.id, farm.name]);

  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<InvestmentPackage | null>(null);
  const [selectedContract, setSelectedContract] = useState<FarmContract | null>(null);
  const [treeCount, setTreeCount] = useState(50);
  const [showBookingFlow, setShowBookingFlow] = useState(false);

  const [partnerCode, setPartnerCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [bonusYears, setBonusYears] = useState(0);
  const [verifiedPartnerName, setVerifiedPartnerName] = useState('');
  const [featuredPackageSettings, setFeaturedPackageSettings] = useState<FeaturedPackageSettings | null>(null);

  useEffect(() => {
    if (farm.contracts && farm.contracts.length > 0) {
      setSelectedContract(farm.contracts[0]);
    }
  }, [farm.contracts]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const pkgs = await investmentPackagesService.getActivePackages();
        setPackages(pkgs);

        if (pkgs.length >= 2) {
          const middlePackage = pkgs[1];
          setSelectedPackage(middlePackage);
          setTreeCount(middlePackage.min_trees);

          const { data: contract } = await supabase
            .from('farm_contracts')
            .select('*')
            .eq('id', middlePackage.contract_id)
            .maybeSingle();

          if (contract) {
            setSelectedContract(contract);
          }
        } else if (pkgs.length > 0) {
          const defaultPackage = pkgs[0];
          setSelectedPackage(defaultPackage);
          setTreeCount(defaultPackage.min_trees);

          const { data: contract } = await supabase
            .from('farm_contracts')
            .select('*')
            .eq('id', defaultPackage.contract_id)
            .maybeSingle();

          if (contract) {
            setSelectedContract(contract);
          }
        }
      } catch (error) {
        console.error('Error loading packages:', error);
      }
    };
    loadPackages();
  }, []);

  const maxTrees = farm.availableTrees || 3000;

  const calculateTotal = () => {
    if (treeCount === 0) return 0;
    if (selectedPackage) {
      return treeCount * selectedPackage.price_per_tree;
    }
    if (selectedContract) {
      const price = selectedContract.investor_price || 0;
      return treeCount * price;
    }
    return 0;
  };

  const handleTreeCountChange = (delta: number) => {
    const increment = selectedPackage?.tree_increment || 50;
    const minTrees = selectedPackage?.min_trees || 50;
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
    setTreeCount(parseInt(e.target.value));
  };

  const handleSelectPackage = async (pkg: InvestmentPackage) => {
    setSelectedPackage(pkg);
    setTreeCount(pkg.min_trees);

    try {
      const { data: contract } = await supabase
        .from('farm_contracts')
        .select('*')
        .eq('id', pkg.contract_id)
        .maybeSingle();

      if (contract) {
        setSelectedContract(contract);
      }
    } catch (error) {
      console.error('Error loading contract:', error);
    }
  };

  const handleVerifyPartnerCode = async () => {
    if (!partnerCode.trim()) return;

    try {
      const result = await influencerMarketingService.verifyInfluencerCode(partnerCode);

      if (result.isValid && result.partner) {
        setIsCodeVerified(true);
        setBonusYears(3);
        setVerifiedPartnerName(result.partner.display_name || result.partner.name);
        sessionStorage.setItem('influencer_code', result.partner.partner_code);

        // تحميل إعدادات الباقة المميزة
        const settings = await influencerMarketingService.getFeaturedPackageSettings();
        if (settings) {
          setFeaturedPackageSettings(settings);
          sessionStorage.setItem('featured_package_active', 'true');
        }
      }
    } catch (error) {
      console.error('Error verifying code:', error);
    }
  };

  const handleBuyNow = () => {
    if (!selectedPackage || treeCount === 0) {
      alert('يرجى اختيار باقة وعدد الأشجار');
      return;
    }
    if (!selectedContract) {
      alert('جاري تحميل بيانات العقد، يرجى الانتظار...');
      return;
    }
    setShowBookingFlow(true);
  };

  const handleGoToAccount = () => {
    onClose();
    if (onGoToAccount) {
      onGoToAccount();
    }
  };

  if (showBookingFlow && selectedPackage && selectedContract) {
    return (
      <UnifiedBookingFlow
        farmId={farm.id}
        farmName={farm.name}
        farmLocation={farm.location}
        pathType="investment"
        packageName={selectedPackage.package_name}
        treeCount={treeCount}
        contractId={selectedContract.id}
        contractName={selectedContract.contract_name}
        durationYears={selectedPackage.base_duration_years || selectedContract.duration_years}
        bonusYears={(bonusYears || 0) + (selectedPackage.bonus_free_years || selectedContract.bonus_years || 0)}
        totalPrice={calculateTotal()}
        pricePerTree={selectedPackage.price_per_tree}
        influencerCode={isCodeVerified ? sessionStorage.getItem('influencer_code') : null}
        onBack={() => setShowBookingFlow(false)}
        onComplete={() => {
          setShowBookingFlow(false);
          handleGoToAccount();
        }}
      />
    );
  }

  const farmImage = farm.heroImage || farm.images?.[0] || 'https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <div className="fixed inset-0 bg-[#fffbf5] z-50 overflow-y-auto" dir="rtl">
      <div className="min-h-screen pb-32">

        {/* === HERO IMAGE SECTION === */}
        <div className="relative h-[130px] overflow-hidden">
          <img
            src={farmImage}
            alt={farm.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Back Button */}
          <button
            onClick={onClose}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all duration-300"
          >
            <ArrowRight className="w-4 h-4 text-white" style={{ transform: 'scaleX(-1)' }} />
          </button>

          {/* Farm Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="px-2 py-0.5 rounded-full bg-amber-500/90 backdrop-blur-sm flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-white" />
                <span className="text-[10px] font-semibold text-white">استثمار ذهبي</span>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm flex items-center gap-1">
                <TreePine className="w-2.5 h-2.5 text-white" />
                <span className="text-[10px] font-medium text-white">{farm.availableTrees?.toLocaleString() || '1,000'} شجرة</span>
              </div>
            </div>
            <h1 className="text-[18px] font-bold text-white leading-tight drop-shadow-lg">{farm.name}</h1>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-white/80" />
              <span className="text-[10px] text-white/90">{farm.location}</span>
            </div>
          </div>
        </div>

        {/* === BOOKING HEADER === */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#78350f]">استثمر في أشجارك الذهبية</h2>
            <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>متاح للاستثمار</span>
            </div>
          </div>
        </div>

        <div className="px-4 mt-1">

          {/* === 1. PARTNER CODE SECTION (أولاً - تحت الهيدر مباشرة) === */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-amber-100 p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center text-[9px] text-amber-600">!</span>
                <span className="text-[10px] text-amber-600 font-medium">يمنحك مدة إضافية</span>
              </div>
              <span className="text-[13px] font-bold text-[#78350f]">كود شريك نجاح (اختياري)</span>
            </div>

            <div className={`flex items-center gap-2 rounded-xl py-2.5 px-3 border-2 transition-all duration-300 ${
              isCodeVerified
                ? 'bg-amber-50 border-amber-500'
                : 'bg-gray-50 border-gray-200 focus-within:border-amber-500 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(245,158,11,0.1)]'
            }`}>
              <input
                type="text"
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                placeholder="أدخل الكود هنا..."
                disabled={isCodeVerified}
                className="flex-1 bg-transparent text-center text-[13px] focus:outline-none text-[#78350f] placeholder-gray-400 disabled:text-amber-600 font-semibold"
                dir="ltr"
              />
              <button
                onClick={handleVerifyPartnerCode}
                disabled={!partnerCode.trim() || isCodeVerified}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                  isCodeVerified
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : partnerCode.trim()
                      ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-white hover:shadow-lg hover:shadow-amber-500/30'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                <span className="text-[14px] font-bold">✓</span>
              </button>
            </div>

            {isCodeVerified && (
              <div className="mt-3 py-2 px-3 rounded-lg bg-gradient-to-l from-amber-50 to-amber-100 border border-amber-200">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-[13px] text-amber-700 font-bold">تم تفعيل كود: {verifiedPartnerName}</span>
                </div>
                <div className="text-center">
                  <span className="text-[12px] text-amber-600 font-semibold">مبروك! حصلت على +{bonusYears} سنوات مجاناً</span>
                </div>
              </div>
            )}
          </div>

          {/* === 2. PACKAGE CARDS (ثانياً - بعد كود الشريك) === */}
          <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-amber-100 p-3 mb-3">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
              <h2 className="text-[14px] font-bold text-[#78350f]">اختر الباقة الاستثمارية</h2>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {packages.slice(0, 3).map((pkg, index) => {
                const isPopular = index === 1;
                const isSelected = selectedPackage?.id === pkg.id;
                const totalPrice = pkg.price_per_tree * pkg.min_trees;

                return (
                  <button
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`relative py-2.5 px-1.5 rounded-xl transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500 to-amber-600 border-2 border-amber-500 shadow-lg shadow-amber-500/25 scale-[1.03] -mt-0.5'
                        : 'bg-white border border-gray-200 hover:border-amber-400/50 hover:shadow-md active:scale-95'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-amber-400 text-amber-900 text-[8px] px-2 py-0.5 rounded-full flex items-center gap-0.5 whitespace-nowrap shadow-md font-bold">
                        <Star className="w-2 h-2 fill-current" />
                        <span>الأكثر طلباً</span>
                      </div>
                    )}
                    <div className="text-center">
                      <div className={`text-[12px] font-bold ${isSelected ? 'text-white' : 'text-[#78350f]'}`}>{pkg.min_trees} شجرة</div>
                      <div className={`text-[14px] font-black mt-1 ${isSelected ? 'text-white' : 'text-amber-600'}`}>
                        {totalPrice.toLocaleString()}
                      </div>
                      <div className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>ر.س / سنة</div>
                      {(pkg.bonus_free_years || 0) > 0 && (
                        <div className={`mt-1 py-0.5 px-1.5 rounded-md ${isSelected ? 'bg-white/20 backdrop-blur-sm' : 'bg-amber-100'}`}>
                          <span className={`text-[8px] font-semibold ${isSelected ? 'text-white' : 'text-amber-600'}`}>+ {pkg.bonus_free_years} سنة مجاناً</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-1.5 mt-3">
              {packages.slice(0, 3).map((pkg) => {
                const isActive = selectedPackage?.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${isActive ? 'w-5 h-1.5 bg-amber-500' : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'}`}
                  />
                );
              })}
            </div>
          </div>

          {/* === 2.5. FEATURED PACKAGE (الباقة المميزة لشركاء النجاح) === */}
          {isCodeVerified && featuredPackageSettings && (
            <div className="mb-3 px-1">
              <FeaturedPackageOverlay
                settings={featuredPackageSettings}
                onDismiss={() => {
                  // لا نفعل شيء - الباقة ستبقى ظاهرة طالما الكود مفعّل
                }}
              />
            </div>
          )}

          {/* === 3. TREE COUNTER CARD (ثالثاً - بعد الباقات) === */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-amber-100 p-5 mb-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <TreePine className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-[17px] font-bold text-[#78350f]">حدد عدد الأشجار</h2>
            </div>

            {/* Live Price Display */}
            {selectedPackage && (
              <div className="text-center mb-4 py-2 px-4 rounded-xl bg-gradient-to-l from-amber-100 to-amber-50 border border-amber-200">
                <span className="text-[12px] text-amber-700">السعر الحالي: </span>
                <span className="text-[16px] font-black text-amber-600">{calculateTotal().toLocaleString()}</span>
                <span className="text-[11px] text-amber-600 mr-1">ر.س</span>
              </div>
            )}

            {/* Counter with +/- buttons */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <button
                onClick={() => handleTreeCountChange(-50)}
                disabled={treeCount <= (selectedPackage?.min_trees || 50)}
                className="w-12 h-12 rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:from-gray-100 hover:to-gray-150 hover:shadow-md transition-all duration-300 active:scale-95"
              >
                <Minus className="w-5 h-5 text-gray-600" />
              </button>

              <div className="text-center min-w-[100px] py-3 px-5 rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100 border border-amber-200">
                <div className="text-[48px] font-black text-amber-600 leading-none">{treeCount}</div>
                <div className="text-[12px] text-amber-700 mt-1 font-semibold">شجرة</div>
              </div>

              <button
                onClick={() => handleTreeCountChange(50)}
                disabled={treeCount >= maxTrees}
                className="w-12 h-12 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 flex items-center justify-center disabled:opacity-30 hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 active:scale-95"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Slider */}
            <div className="relative mb-1 px-1">
              <div className="relative h-[10px] bg-gradient-to-l from-gray-100 to-gray-200 rounded-full overflow-visible">
                <div
                  className="absolute top-0 right-0 h-full bg-gradient-to-l from-amber-500 to-amber-400 rounded-full transition-all duration-200 shadow-sm"
                  style={{ width: `${(treeCount / maxTrees) * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full border-[3px] border-amber-500 shadow-[0_2px_10px_rgba(245,158,11,0.4)] cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-[0_4px_15px_rgba(245,158,11,0.5)]"
                  style={{ left: `${(treeCount / maxTrees) * 100}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>
              <input
                type="range"
                min={selectedPackage?.min_trees || 50}
                max={maxTrees}
                value={treeCount}
                onChange={handleSliderChange}
                step={selectedPackage?.tree_increment || 50}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 px-1 mt-2">
              <span>الحد الأدنى: {selectedPackage?.min_trees || 50}</span>
              <span>الحد الأقصى: {maxTrees.toLocaleString()}</span>
            </div>
          </div>

          {/* === 4. BOOKING SUMMARY === */}
          <div className="mb-4 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-amber-100 p-4">
            <h3 className="text-[14px] font-bold text-[#78350f] mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-amber-100 flex items-center justify-center text-[10px] text-amber-600">✓</span>
              ملخص الاستثمار
            </h3>
            <div className="space-y-2">
              {selectedPackage && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500">الباقة المختارة</span>
                  <span className="text-[14px] font-bold text-amber-600">{selectedPackage.package_name}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-[13px] text-gray-500">عدد الأشجار</span>
                <span className="text-[14px] font-bold text-[#78350f]">{treeCount} شجرة</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-[13px] text-gray-500">سعر الشجرة</span>
                <span className="text-[14px] font-bold text-[#78350f]">{(selectedPackage?.price_per_tree || 0).toLocaleString()} ر.س</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-[13px] text-gray-500">مدة العقد الأساسية</span>
                <span className="text-[14px] font-bold text-[#78350f]">{selectedPackage?.base_duration_years || 1} سنة</span>
              </div>
              {(selectedPackage?.bonus_free_years || 0) > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    مدة مجانية من الباقة
                  </span>
                  <span className="text-[14px] font-bold text-amber-600">+{selectedPackage?.bonus_free_years} سنة</span>
                </div>
              )}
              {(bonusYears || 0) > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    مدة مجانية من كود الشريك
                  </span>
                  <span className="text-[14px] font-bold text-emerald-600">+{bonusYears} سنة</span>
                </div>
              )}
              {((bonusYears || 0) + (selectedPackage?.bonus_free_years || 0) > 0) && (
                <div className="flex items-center justify-between py-2.5 mt-2 pt-2.5 border-t-2 border-dashed border-amber-300/40">
                  <span className="text-[13px] font-bold text-[#78350f]">المجموع الكلي للسنوات</span>
                  <span className="text-[15px] font-extrabold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
                    {(selectedPackage?.base_duration_years || 1) + (bonusYears || 0) + (selectedPackage?.bonus_free_years || 0)} سنة
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-amber-200">
                <span className="text-[15px] font-bold text-[#78350f]">الإجمالي</span>
                <div className="text-left">
                  <span className="text-[22px] font-black text-amber-600">{calculateTotal().toLocaleString()}</span>
                  <span className="text-[12px] text-gray-500 mr-1">ر.س</span>
                </div>
              </div>
            </div>
          </div>

          {/* === 5. INVEST NOW BUTTON === */}
          <div className="mb-4">
            <button
              onClick={handleBuyNow}
              disabled={!selectedPackage || treeCount === 0}
              className="w-full py-4 bg-gradient-to-l from-amber-600 via-amber-500 to-amber-600 rounded-2xl font-bold text-[18px] text-white shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-transparent animate-shimmer"></div>
              <TrendingUp className="w-5 h-5" />
              <span>استثمر الآن</span>
            </button>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-[10px]">✓</span>
                <span className="text-[11px] text-gray-500">عوائد مضمونة</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-[10px]">✓</span>
                <span className="text-[11px] text-gray-500">استثمار آمن</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-[10px]">✓</span>
                <span className="text-[11px] text-gray-500">دعم 24/7</span>
              </div>
            </div>
          </div>

        </div>

        {/* SPACER FOR FOOTER */}
        <div className="h-24"></div>

      </div>
    </div>
  );
}
