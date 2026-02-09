import { useState, useEffect } from 'react';
import { ArrowRight, Minus, Plus } from 'lucide-react';
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
    if ((!selectedContract && !selectedPackage) || treeCount === 0) {
      alert('يرجى اختيار باقة وعدد الأشجار');
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

  if (showBookingFlow && selectedContract) {
    return (
      <UnifiedBookingFlow
        farmId={farm.id}
        farmName={farm.name}
        farmLocation={farm.location}
        pathType="agricultural"
        packageName={selectedPackage?.package_name || selectedContract.contract_name}
        treeCount={treeCount}
        contractId={selectedContract.id}
        contractName={selectedContract.contract_name}
        durationYears={selectedPackage?.contract_years || selectedContract.duration_years}
        bonusYears={bonusYears || selectedPackage?.bonus_years || selectedContract.bonus_years}
        totalPrice={calculateTotal()}
        pricePerTree={selectedPackage?.price_per_tree || selectedContract.farmer_price || selectedContract.investor_price || 0}
        influencerCode={isCodeVerified ? partnerCode : null}
        onBack={() => setShowBookingFlow(false)}
        onComplete={() => {
          setShowBookingFlow(false);
          handleGoToAccount();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-[#f5f5f5] z-50 overflow-y-auto" dir="rtl">
      <div className="min-h-screen pb-32">

        {/* === HEADER === */}
        <div className="bg-[#f5f5f5] pt-4 px-4 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[22px] font-bold text-gray-800 leading-tight">احجز أشجارك الآن</h1>
              <p className="text-[13px] text-gray-500 mt-1 flex items-center gap-1">
                <span className="text-gray-300">|</span>
                <span>خطوة واحدة • إدارة احترافية • عوائد سنوية</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowRight className="w-4 h-4 text-gray-600" style={{ transform: 'scaleX(-1)' }} />
            </button>
          </div>
        </div>

        <div className="px-4 mt-4">

          {/* === 1. TREE COUNTER CARD === */}
          <div className="bg-white rounded-[20px] shadow-sm p-5 mb-4">
            <h2 className="text-[17px] font-bold text-center text-gray-800 mb-1">اختر عدد الأشجار</h2>
            <p className="text-[12px] text-gray-400 text-center mb-5">اختر عدد عدد الأشجار التي تريد حجزها</p>

            {/* Counter with +/- buttons */}
            <div className="flex items-center justify-center gap-3 mb-5">
              <button
                onClick={() => handleTreeCountChange(-1)}
                disabled={treeCount <= 1}
                className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-all active:scale-95"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>

              <div className="text-center min-w-[80px]">
                <div className="text-[48px] font-bold text-gray-800 leading-none">{treeCount}</div>
                <div className="text-[13px] text-gray-500 mt-1">شجرة</div>
              </div>

              <button
                onClick={() => handleTreeCountChange(1)}
                disabled={treeCount >= maxTrees}
                className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Slider */}
            <div className="relative mb-1 px-1">
              <div className="relative h-[6px] bg-gray-200 rounded-full overflow-visible">
                <div
                  className="absolute top-0 right-0 h-full bg-[#4a7c59] rounded-full"
                  style={{ width: `${(treeCount / maxTrees) * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-[3px] border-gray-300 shadow-md cursor-pointer"
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
              <span>1-50</span>
              <span>مجلجلة شجرة {maxTrees.toLocaleString()}-</span>
            </div>

            {/* === 2. PARTNER CODE SECTION (قبل الباقات) === */}
            <div className="mt-5 mb-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full border border-gray-300 flex items-center justify-center text-[8px] text-gray-400">i</span>
                  <span className="text-[10px] text-gray-400">يمنحك مدة إضافية</span>
                </div>
                <span className="text-[12px] font-semibold text-gray-600">كود شريك نجاح (اختياري)</span>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg py-1.5 px-2 border border-gray-200">
                <input
                  type="text"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                  placeholder="أدخل الكود هنا"
                  disabled={isCodeVerified}
                  className="flex-1 bg-transparent text-center text-[12px] focus:outline-none text-gray-600 placeholder-gray-400 disabled:text-[#4a7c59] font-medium"
                  dir="ltr"
                />
                <button
                  onClick={handleVerifyPartnerCode}
                  disabled={!partnerCode.trim() || isCodeVerified}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                    isCodeVerified
                      ? 'bg-[#4a7c59] text-white'
                      : partnerCode.trim()
                        ? 'bg-gray-700 text-white hover:bg-gray-800'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <span className="text-[11px]">✓</span>
                </button>
              </div>

              {isCodeVerified && (
                <div className="mt-1.5 text-[10px] text-[#4a7c59] text-center font-medium">
                  تم التحقق +{bonusYears} سنوات مجاناً
                </div>
              )}
            </div>

            {/* === 3. PACKAGE CARDS === */}
            <div className="grid grid-cols-3 gap-2">
              {packages.slice(0, 3).map((pkg, index) => {
                const isMiddle = index === 1;
                const isSelected = selectedPackage?.id === pkg.id;
                const totalPrice = pkg.price_per_tree * pkg.min_trees;

                return (
                  <button
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`relative py-3 px-2 rounded-xl transition-all ${
                      isMiddle
                        ? 'bg-white border-2 border-gray-300 shadow-md'
                        : isSelected
                          ? 'bg-gray-50 border border-gray-300'
                          : 'bg-white border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isMiddle && (
                      <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-gray-500 text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-0.5 whitespace-nowrap">
                        <span className="text-[9px]">★</span>
                        <span>عقد سنة</span>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-[13px] font-semibold text-gray-700">شجرة {pkg.min_trees}</div>
                      <div className="text-[14px] font-bold text-gray-800 mt-1">
                        {totalPrice.toLocaleString()} ر.س
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">عقد سنة</div>
                      {isMiddle && (
                        <div className="text-[10px] text-gray-500 mt-1">• + سنتين مجاناً •</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-1 mt-4">
              {[0, 1, 2, 3, 4].map((dot) => (
                <div
                  key={dot}
                  className={`w-[5px] h-[5px] rounded-full ${dot === 1 ? 'bg-gray-400' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </div>

          {/* === 3. BOOKING SUMMARY === */}
          <div className="mb-4">
            <h3 className="text-[15px] font-bold text-center text-gray-800 mb-2">ملخص الحجز</h3>
            <div className="bg-gray-100 rounded-xl py-3 px-4 text-center border border-gray-200">
              <p className="text-[13px] text-gray-600">
                ـ {treeCount} • عقد سنة • عقد سنة
                {(bonusYears > 0 || (selectedPackage?.bonus_years || 0) > 0) &&
                  ` + ${bonusYears || selectedPackage?.bonus_years || 0} سنتين مجاناً`
                }
              </p>
            </div>
          </div>

          {/* === 4. BOOK NOW BUTTON === */}
          <div className="mb-4">
            <button
              onClick={handleBuyNow}
              disabled={!selectedContract || treeCount === 0}
              className="w-full py-3.5 bg-white border-2 border-gray-700 rounded-full font-bold text-[18px] text-gray-800 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2"/>
              </svg>
              <span>{calculateTotal().toLocaleString()} احجز الآن</span>
            </button>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <span className="text-[#4a7c59] text-sm">✓</span>
              <span className="text-[11px] text-gray-400">آمن يمكنك الإلغاء حسب الشروط.</span>
            </div>
          </div>

        </div>

        {/* SPACER FOR FOOTER */}
        <div className="h-24"></div>

      </div>
    </div>
  );
}
