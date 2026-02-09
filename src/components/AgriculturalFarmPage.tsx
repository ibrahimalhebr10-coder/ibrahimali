import { useState, useEffect } from 'react';
import { ArrowRight, Minus, Plus, MapPin, TreePine, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { FarmProject, FarmContract } from '../services/farmService';
import { agriculturalPackagesService, type AgriculturalPackage } from '../services/agriculturalPackagesService';
import UnifiedBookingFlow from './UnifiedBookingFlow';
import { usePageTracking } from '../hooks/useLeadTracking';
import { influencerMarketingService } from '../services/influencerMarketingService';

interface AgriculturalFarmPageProps {
  farm: FarmProject;
  onClose: () => void;
  onGoToAccount?: () => void;
}

export default function AgriculturalFarmPage({ farm, onClose, onGoToAccount }: AgriculturalFarmPageProps) {
  const { user } = useAuth();
  const leadService = usePageTracking('مزرعة زراعية');

  useEffect(() => {
    leadService.trackFarmView(farm.id, farm.name);
  }, [farm.id, farm.name]);

  const [packages, setPackages] = useState<AgriculturalPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<AgriculturalPackage | null>(null);
  const [selectedContract, setSelectedContract] = useState<FarmContract | null>(null);
  const [treeCount, setTreeCount] = useState(50);
  const [showBookingFlow, setShowBookingFlow] = useState(false);

  const [showPartnerInput, setShowPartnerInput] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [bonusYears, setBonusYears] = useState(0);

  useEffect(() => {
    if (farm.contracts && farm.contracts.length > 0) {
      setSelectedContract(farm.contracts[0]);
    }
  }, [farm.contracts]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const pkgs = await agriculturalPackagesService.getActivePackages();
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
        }
      } catch (error) {
        console.error('Error loading packages:', error);
      }
    };
    loadPackages();
  }, []);

  const maxTrees = farm.availableTrees || 1000;

  const calculateTotal = () => {
    if (treeCount === 0) return 0;
    if (selectedPackage) {
      return treeCount * selectedPackage.price_per_tree;
    }
    if (selectedContract) {
      const price = selectedContract.farmer_price || selectedContract.investor_price || 0;
      return treeCount * price;
    }
    return 0;
  };

  const handleTreeCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(maxTrees, treeCount + delta));
    setTreeCount(newCount);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTreeCount(parseInt(e.target.value));
  };

  const handleSelectPackage = async (pkg: AgriculturalPackage) => {
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
      const isValid = await influencerMarketingService.verifyInfluencerCode(partnerCode);

      if (isValid) {
        setIsCodeVerified(true);
        setBonusYears(3);
        sessionStorage.setItem('influencer_code', partnerCode);
      } else {
        alert('الكود غير صحيح');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      alert('حدث خطأ في التحقق من الكود');
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
        pathType="agricultural"
        packageName={selectedPackage.package_name}
        treeCount={treeCount}
        contractId={selectedContract.id}
        contractName={selectedContract.contract_name}
        durationYears={selectedPackage.contract_years || selectedContract.duration_years}
        bonusYears={bonusYears || selectedPackage.bonus_years || selectedContract.bonus_years}
        totalPrice={calculateTotal()}
        pricePerTree={selectedPackage.price_per_tree}
        influencerCode={isCodeVerified ? partnerCode : null}
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
    <div className="fixed inset-0 bg-[#f5f7f6] z-50 overflow-y-auto" dir="rtl">
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
              <div className="px-2 py-0.5 rounded-full bg-[#22c55e]/90 backdrop-blur-sm flex items-center gap-1">
                <TreePine className="w-3 h-3 text-white" />
                <span className="text-[10px] font-semibold text-white">{farm.availableTrees?.toLocaleString() || '1,000'} شجرة</span>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm flex items-center gap-1">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-medium text-white">4.9</span>
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
            <h2 className="text-[15px] font-bold text-[#1a3d2a]">احجز أشجارك الآن</h2>
            <div className="flex items-center gap-1 text-[10px] text-[#16a34a] bg-[#dcfce7] px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse"></span>
              <span>متاح للحجز</span>
            </div>
          </div>
        </div>

        <div className="px-4 mt-1">

          {/* === 1. PACKAGE CARDS (أولاً) === */}
          <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100 p-3 mb-3">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
              <h2 className="text-[14px] font-bold text-[#1a3d2a]">اختر الباقة</h2>
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
                        ? 'bg-gradient-to-b from-[#22c55e] to-[#16a34a] border-2 border-[#22c55e] shadow-lg shadow-green-500/25 scale-[1.03] -mt-0.5'
                        : 'bg-white border border-gray-200 hover:border-[#22c55e]/50 hover:shadow-md active:scale-95'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-amber-400 text-amber-900 text-[8px] px-2 py-0.5 rounded-full flex items-center gap-0.5 whitespace-nowrap shadow-md font-bold">
                        <Star className="w-2 h-2 fill-current" />
                        <span>الأكثر طلباً</span>
                      </div>
                    )}
                    <div className="text-center">
                      <div className={`text-[12px] font-bold ${isSelected ? 'text-white' : 'text-[#1a3d2a]'}`}>{pkg.min_trees} شجرة</div>
                      <div className={`text-[14px] font-black mt-1 ${isSelected ? 'text-white' : 'text-[#16a34a]'}`}>
                        {totalPrice.toLocaleString()}
                      </div>
                      <div className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>ر.س / سنة</div>
                      {pkg.bonus_years > 0 && (
                        <div className={`mt-1 py-0.5 px-1.5 rounded-md ${isSelected ? 'bg-white/20 backdrop-blur-sm' : 'bg-[#dcfce7]'}`}>
                          <span className={`text-[8px] font-semibold ${isSelected ? 'text-white' : 'text-[#16a34a]'}`}>+ {pkg.bonus_years} سنة مجاناً</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dots indicator - shows selected package index */}
            <div className="flex justify-center gap-1.5 mt-3">
              {packages.slice(0, 3).map((pkg, index) => {
                const isActive = selectedPackage?.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${isActive ? 'w-5 h-1.5 bg-[#22c55e]' : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'}`}
                  />
                );
              })}
            </div>
          </div>

          {/* === 2. PARTNER CODE SECTION (ثانياً - تحت الباقات) === */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center text-[9px] text-amber-600">!</span>
                <span className="text-[10px] text-amber-600 font-medium">يمنحك مدة إضافية</span>
              </div>
              <span className="text-[13px] font-bold text-[#1a3d2a]">كود شريك نجاح (اختياري)</span>
            </div>

            <div className={`flex items-center gap-2 rounded-xl py-2.5 px-3 border-2 transition-all duration-300 ${
              isCodeVerified
                ? 'bg-[#f0fdf4] border-[#22c55e]'
                : 'bg-gray-50 border-gray-200 focus-within:border-[#22c55e] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(34,197,94,0.1)]'
            }`}>
              <input
                type="text"
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                placeholder="أدخل الكود هنا..."
                disabled={isCodeVerified}
                className="flex-1 bg-transparent text-center text-[13px] focus:outline-none text-[#1a3d2a] placeholder-gray-400 disabled:text-[#16a34a] font-semibold"
                dir="ltr"
              />
              <button
                onClick={handleVerifyPartnerCode}
                disabled={!partnerCode.trim() || isCodeVerified}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                  isCodeVerified
                    ? 'bg-[#22c55e] text-white shadow-md shadow-green-500/30'
                    : partnerCode.trim()
                      ? 'bg-gradient-to-b from-[#22c55e] to-[#16a34a] text-white hover:shadow-lg hover:shadow-green-500/30'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                <span className="text-[14px] font-bold">✓</span>
              </button>
            </div>

            {isCodeVerified && (
              <div className="mt-3 py-2 px-3 rounded-lg bg-gradient-to-l from-[#f0fdf4] to-[#dcfce7] border border-[#bbf7d0] flex items-center justify-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-[12px] text-[#15803d] font-bold">مبروك! حصلت على +{bonusYears} سنوات مجاناً</span>
              </div>
            )}
          </div>

          {/* === 3. TREE COUNTER CARD (ثالثاً - تحت كود الشريك) === */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 p-5 mb-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center shadow-lg shadow-green-500/20">
                <TreePine className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-[17px] font-bold text-[#1a3d2a]">حدد عدد الأشجار</h2>
            </div>

            {/* Live Price Display */}
            {selectedPackage && (
              <div className="text-center mb-4 py-2 px-4 rounded-xl bg-gradient-to-l from-[#fef3c7] to-[#fef9c3] border border-amber-200">
                <span className="text-[12px] text-amber-700">السعر الحالي: </span>
                <span className="text-[16px] font-black text-amber-600">{calculateTotal().toLocaleString()}</span>
                <span className="text-[11px] text-amber-600 mr-1">ر.س</span>
              </div>
            )}

            {/* Counter with +/- buttons */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <button
                onClick={() => handleTreeCountChange(-1)}
                disabled={treeCount <= 1}
                className="w-12 h-12 rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:from-gray-100 hover:to-gray-150 hover:shadow-md transition-all duration-300 active:scale-95"
              >
                <Minus className="w-5 h-5 text-gray-600" />
              </button>

              <div className="text-center min-w-[100px] py-3 px-5 rounded-2xl bg-gradient-to-b from-[#f0fdf4] to-[#dcfce7] border border-[#bbf7d0]">
                <div className="text-[48px] font-black text-[#16a34a] leading-none">{treeCount}</div>
                <div className="text-[12px] text-[#15803d] mt-1 font-semibold">شجرة</div>
              </div>

              <button
                onClick={() => handleTreeCountChange(1)}
                disabled={treeCount >= maxTrees}
                className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#22c55e] to-[#16a34a] flex items-center justify-center disabled:opacity-30 hover:from-[#16a34a] hover:to-[#15803d] hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 active:scale-95"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Slider */}
            <div className="relative mb-1 px-1">
              <div className="relative h-[10px] bg-gradient-to-l from-gray-100 to-gray-200 rounded-full overflow-visible">
                <div
                  className="absolute top-0 right-0 h-full bg-gradient-to-l from-[#22c55e] to-[#4ade80] rounded-full transition-all duration-200 shadow-sm"
                  style={{ width: `${(treeCount / maxTrees) * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full border-[3px] border-[#22c55e] shadow-[0_2px_10px_rgba(34,197,94,0.4)] cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-[0_4px_15px_rgba(34,197,94,0.5)]"
                  style={{ left: `${(treeCount / maxTrees) * 100}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>
              <input
                type="range"
                min="1"
                max={maxTrees}
                value={treeCount}
                onChange={handleSliderChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 px-1 mt-2">
              <span>الحد الأدنى: 1</span>
              <span>الحد الأقصى: {maxTrees.toLocaleString()}</span>
            </div>
          </div>

          {/* === 4. BOOKING SUMMARY === */}
          <div className="mb-4 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 p-4">
            <h3 className="text-[14px] font-bold text-[#1a3d2a] mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-[#f0fdf4] flex items-center justify-center text-[10px] text-[#16a34a]">✓</span>
              ملخص الحجز
            </h3>
            <div className="space-y-2">
              {selectedPackage && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500">الباقة المختارة</span>
                  <span className="text-[14px] font-bold text-[#16a34a]">{selectedPackage.package_name}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-[13px] text-gray-500">عدد الأشجار</span>
                <span className="text-[14px] font-bold text-[#1a3d2a]">{treeCount} شجرة</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-[13px] text-gray-500">سعر الشجرة</span>
                <span className="text-[14px] font-bold text-[#1a3d2a]">{(selectedPackage?.price_per_tree || 0).toLocaleString()} ر.س</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-[13px] text-gray-500">مدة العقد</span>
                <span className="text-[14px] font-bold text-[#1a3d2a]">{selectedPackage?.contract_years || 1} سنة</span>
              </div>
              {(bonusYears > 0 || (selectedPackage?.bonus_years || 0) > 0) && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500">مدة إضافية مجانية</span>
                  <span className="text-[14px] font-bold text-[#16a34a]">+{bonusYears || selectedPackage?.bonus_years || 0} سنة</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-[#22c55e]/20">
                <span className="text-[15px] font-bold text-[#1a3d2a]">الإجمالي</span>
                <div className="text-left">
                  <span className="text-[22px] font-black text-[#16a34a]">{calculateTotal().toLocaleString()}</span>
                  <span className="text-[12px] text-gray-500 mr-1">ر.س</span>
                </div>
              </div>
            </div>
          </div>

          {/* === 4. BOOK NOW BUTTON === */}
          <div className="mb-4">
            <button
              onClick={handleBuyNow}
              disabled={!selectedPackage || treeCount === 0}
              className="w-full py-4 bg-gradient-to-l from-[#16a34a] via-[#22c55e] to-[#16a34a] rounded-2xl font-bold text-[18px] text-white shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-transparent animate-shimmer"></div>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2"/>
              </svg>
              <span>احجز الآن</span>
            </button>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-[#f0fdf4] flex items-center justify-center text-[#16a34a] text-[10px]">✓</span>
                <span className="text-[11px] text-gray-500">دفع آمن</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-[#f0fdf4] flex items-center justify-center text-[#16a34a] text-[10px]">✓</span>
                <span className="text-[11px] text-gray-500">إلغاء مرن</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-[#f0fdf4] flex items-center justify-center text-[#16a34a] text-[10px]">✓</span>
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
