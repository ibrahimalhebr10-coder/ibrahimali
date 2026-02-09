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
    <div className="fixed inset-0 bg-gradient-to-b from-gray-50 to-white z-50 overflow-y-auto">
      <div className="min-h-screen pb-32">

        {/* HEADER */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="p-4">
            <button
              onClick={onClose}
              className="mb-4 w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-center text-gray-900">احجز أشجارك الآن</h1>
            <p className="text-center text-sm text-gray-600 mt-1">
              خطوة واحدة • إدارة احترافية • عوائد سنوية
            </p>
          </div>
        </div>

        <div className="px-4 mt-6">

          {/* 1. TREE COUNTER SECTION */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-5 border border-gray-100">
            <h2 className="text-xl font-bold text-center mb-2 text-gray-900">اختر عدد الأشجار</h2>
            <p className="text-sm text-gray-500 text-center mb-6">اختر عدد عدد الأشجار التي نريد حجزها</p>

            {/* Counter Display */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => handleTreeCountChange(-1)}
                disabled={treeCount <= 1}
                className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-all active:scale-95"
              >
                <Minus className="w-5 h-5 text-gray-700" />
              </button>

              <div className="text-center min-w-[100px]">
                <div className="text-5xl font-bold text-gray-900">{treeCount}</div>
                <div className="text-sm text-gray-500 mt-1">شجرة</div>
              </div>

              <button
                onClick={() => handleTreeCountChange(1)}
                disabled={treeCount >= maxTrees}
                className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Slider */}
            <div className="relative mb-2">
              <input
                type="range"
                min="1"
                max={maxTrees}
                value={treeCount}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-green-600 [&::-webkit-slider-thumb]:shadow-lg"
                style={{
                  background: `linear-gradient(to right, #16a34a 0%, #16a34a ${(treeCount / maxTrees) * 100}%, #e5e7eb ${(treeCount / maxTrees) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 px-1">
              <span>1-50</span>
              <span>متاحة شجرة {maxTrees.toLocaleString()}-</span>
            </div>

            {/* Quick Package Selection Cards */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {packages.slice(0, 3).map((pkg, index) => {
                const isMiddle = index === 1;
                const isSelected = selectedPackage?.id === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`relative p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-green-600 bg-green-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${isMiddle ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
                  >
                    {isMiddle && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-amber-400 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                        <span>★</span>
                        <span>عقد بستة</span>
                      </div>
                    )}
                    <div className="text-center mt-1">
                      <div className="text-base font-bold text-gray-900">{pkg.min_trees} شجرة</div>
                      <div className="text-sm font-semibold text-green-700 mt-1">
                        {pkg.price_per_tree.toLocaleString()} ر.س
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">عقد سنة</div>
                      {isMiddle && (
                        <div className="text-[10px] text-amber-600 font-semibold mt-1">+ ستتين مجاناً</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Package dots indicator */}
            <div className="flex justify-center gap-1.5 mt-4">
              {[0, 1, 2, 3, 4].map((dot) => (
                <div
                  key={dot}
                  className={`w-1.5 h-1.5 rounded-full ${dot === 1 ? 'bg-gray-400' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </div>

          {/* 2. PARTNER CODE SECTION */}
          <div className="bg-white rounded-3xl shadow-lg p-5 mb-5 border border-gray-100">
            <h3 className="text-base font-bold text-center text-gray-900 mb-1">
              هل لديك كود شريك نجاح (اختياري)
            </h3>
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-4">
              <span className="inline-block w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">ℹ</span>
              <span>الخبر الحضحت مدة إضافية فقط</span>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-200">
              <input
                type="text"
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                placeholder="أدخل الكود هنا"
                disabled={isCodeVerified}
                className="flex-1 bg-transparent text-center text-sm focus:outline-none text-gray-700 placeholder-gray-400 disabled:text-green-700"
              />
              <button
                onClick={handleVerifyPartnerCode}
                disabled={!partnerCode.trim() || isCodeVerified}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isCodeVerified
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                } disabled:opacity-50`}
              >
                {isCodeVerified ? '✓' : '→'}
              </button>
            </div>

            {isCodeVerified && (
              <div className="mt-3 text-xs text-green-600 text-center font-semibold bg-green-50 py-2 rounded-xl">
                تم التحقق بنجاح - حصلت على +{bonusYears} سنوات مجاناً
              </div>
            )}
          </div>

          {/* 3. BOOKING SUMMARY */}
          <div className="mb-5">
            <h3 className="text-lg font-bold text-center text-gray-900 mb-3">ملخص الحجز</h3>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 text-center border border-gray-200">
              <p className="text-sm text-gray-600">
                ـ {treeCount} • عقد سنة • {selectedPackage?.contract_years || selectedContract?.duration_years || 0} سنة
                {bonusYears > 0 && ` + ${bonusYears} ستتين مجاناً`}
              </p>
            </div>
          </div>

          {/* 4. BOOK NOW BUTTON */}
          <div className="mb-6">
            <button
              onClick={handleBuyNow}
              disabled={!selectedContract || treeCount === 0}
              className="w-full py-4 bg-gradient-to-l from-green-600 to-green-700 text-white rounded-3xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-green-800/20"
            >
              <span className="text-2xl">🔒</span>
              <span>احجز الآن {calculateTotal().toLocaleString()}</span>
            </button>
            <div className="flex items-center justify-center gap-1 mt-3">
              <span className="text-lg">✓</span>
              <span className="text-xs text-gray-500">أمن يمكنك الإلغاء حسب الشروط.</span>
            </div>
          </div>

        </div>

        {/* SPACER FOR FOOTER */}
        <div className="h-20"></div>

      </div>
    </div>
  );
}
