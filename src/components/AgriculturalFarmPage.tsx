import { useState, useEffect } from 'react';
import { ArrowRight, Minus, Plus, Gift, Check } from 'lucide-react';
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
  const [isLoadingContract, setIsLoadingContract] = useState(false);

  // Partner code state
  const [showPartnerInput, setShowPartnerInput] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [bonusYears, setBonusYears] = useState(0);

  useEffect(() => {
    if (farm.contracts && farm.contracts.length > 0) {
      const firstContract = farm.contracts[0];
      setSelectedContract(firstContract);
    }
  }, [farm.contracts]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const pkgs = await agriculturalPackagesService.getActivePackages();
        setPackages(pkgs);

        // Auto select middle package if available
        if (pkgs.length >= 2) {
          const middlePackage = pkgs[1];
          setSelectedPackage(middlePackage);
          setTreeCount(middlePackage.min_trees);

          // Load contract for this package
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
    setIsLoadingContract(true);
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
    } finally {
      setIsLoadingContract(false);
    }
  };

  const handleVerifyPartnerCode = async () => {
    if (!partnerCode.trim()) return;

    try {
      const isValid = await influencerMarketingService.verifyInfluencerCode(partnerCode);

      if (isValid) {
        setIsCodeVerified(true);
        setBonusYears(3); // Add 3 bonus years
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {farm.heroImage || farm.image ? (
          <img
            src={farm.heroImage || farm.image}
            alt={farm.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
      </div>

      {/* Content Container - Scrollable */}
      <div className="relative h-full overflow-y-auto">
        <div className="min-h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 pt-8 pb-6 px-6">
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white transition-all mb-6"
            >
              <ArrowRight className="w-5 h-5 text-gray-800" />
            </button>

            <div className="text-center">
              <h1 className="text-3xl font-black text-white drop-shadow-2xl mb-2">
                احجز أشجارك الآن
              </h1>
              <p className="text-white/90 text-base font-semibold drop-shadow-lg">
                خطوة واحدة - عائد سنوي 15%
              </p>
            </div>
          </div>

          {/* Main Card - Glass Morphism */}
          <div className="flex-1 px-4 pb-8">
            <div
              className="bg-gradient-to-br from-[#f5f0e8]/95 via-[#ebe5db]/95 to-[#e8e0d5]/95 backdrop-blur-xl rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/40 p-6 space-y-6"
              style={{
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.5)'
              }}
            >
              {/* Tree Counter Section */}
              <div className="space-y-4">
                <h2 className="text-center text-[#2d4a3e] font-bold text-lg">
                  اختر عدد الأشجار للاستثمار
                </h2>

                {/* Counter Controls */}
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => handleTreeCountChange(-1)}
                    disabled={treeCount <= 1}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/80 to-[#e8e0d5]/60 border-2 border-[#d4c4b0]/50 flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  >
                    <Minus className="w-6 h-6 text-[#2d4a3e]" />
                  </button>

                  <div className="text-center min-w-[120px]">
                    <div className="text-7xl font-black text-[#2d4a3e] leading-none">
                      {treeCount}
                    </div>
                    <div className="text-base font-bold text-[#5a6d63] mt-1">شجرة</div>
                  </div>

                  <button
                    onClick={() => handleTreeCountChange(1)}
                    disabled={treeCount >= maxTrees}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/80 to-[#e8e0d5]/60 border-2 border-[#d4c4b0]/50 flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  >
                    <Plus className="w-6 h-6 text-[#2d4a3e]" />
                  </button>
                </div>

                {/* Slider */}
                <div className="px-2 space-y-2">
                  <input
                    type="range"
                    min="1"
                    max={maxTrees}
                    value={treeCount}
                    onChange={handleSliderChange}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #7c9885 0%, #7c9885 ${(treeCount / maxTrees) * 100}%, #d4c4b0 ${(treeCount / maxTrees) * 100}%, #d4c4b0 100%)`,
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <div className="flex items-center justify-between text-sm text-[#5a6d63] font-semibold px-1">
                    <span className="flex items-center gap-1">
                      <span className="text-xs">📊</span>
                      ملكتك شجرة {maxTrees.toLocaleString()}-
                    </span>
                  </div>
                </div>
              </div>

              {/* Packages Section */}
              <div className="grid grid-cols-3 gap-3">
                {packages.slice(0, 3).map((pkg, index) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  const isFeatured = index === 1; // Middle package

                  return (
                    <button
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`relative p-4 rounded-2xl border-2 transition-all ${
                        isFeatured
                          ? 'bg-gradient-to-br from-[#daa520] to-[#c89000] border-[#b8860b] shadow-xl'
                          : 'bg-gradient-to-br from-white/70 to-[#e8e0d5]/50 border-[#d4c4b0]/50 shadow-lg'
                      } ${isSelected && !isFeatured ? 'ring-2 ring-[#7c9885]' : ''}`}
                    >
                      {isFeatured && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white text-[#daa520] text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 whitespace-nowrap">
                          <span>⭐</span>
                          <span>أكثر طلباً</span>
                        </div>
                      )}

                      <div className={`text-center space-y-2 ${isFeatured ? 'pt-2' : ''}`}>
                        <div className={`text-base font-bold ${isFeatured ? 'text-white' : 'text-[#2d4a3e]'}`}>
                          {pkg.min_trees} شجرة
                        </div>
                        <div className={`text-2xl font-black ${isFeatured ? 'text-white' : 'text-[#2d4a3e]'}`}>
                          {(pkg.min_trees * pkg.price_per_tree).toLocaleString()}
                          <span className="text-sm mr-1">ريس</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Partner Code Section */}
              <div className="space-y-3 pt-2">
                {/* Toggle Question */}
                <div className="flex items-center justify-between">
                  <span className="text-[#2d4a3e] font-bold text-base">لديك كود شريك نجاح؟</span>
                  <button
                    onClick={() => setShowPartnerInput(!showPartnerInput)}
                    className={`w-14 h-7 rounded-full transition-all ${
                      showPartnerInput
                        ? 'bg-gradient-to-r from-[#7c9885] to-[#6a8573]'
                        : 'bg-gray-300'
                    } relative`}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                        showPartnerInput ? 'right-0.5' : 'right-7'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Partner Code Input (when enabled) */}
                {showPartnerInput && (
                  <div className="space-y-3 animate-in slide-in-from-top duration-300">
                    <p className="text-sm text-[#5a6d63] font-semibold flex items-center gap-2">
                      <span>🌱</span>
                      <span>أدخل الكود للحصول الان 3 + 3 سنوات</span>
                    </p>

                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={partnerCode}
                          onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                          placeholder="PARTNER50"
                          disabled={isCodeVerified}
                          className={`w-full px-4 py-3 rounded-2xl border-2 font-bold text-[#2d4a3e] placeholder:text-[#a89f8f] text-center ${
                            isCodeVerified
                              ? 'bg-white/80 border-[#7c9885] text-[#2d4a3e]'
                              : 'bg-white/60 border-[#d4c4b0]/50 focus:border-[#7c9885] focus:outline-none'
                          }`}
                        />
                        {isCodeVerified && (
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#7c9885] flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      {!isCodeVerified ? (
                        <button
                          onClick={handleVerifyPartnerCode}
                          disabled={!partnerCode.trim()}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-br from-[#9d8456] to-[#8b7240] text-white font-black shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {calculateTotal().toLocaleString()} ريس
                        </button>
                      ) : (
                        <div className="px-6 py-3 rounded-2xl bg-gradient-to-br from-[#9d8456] to-[#8b7240] text-white font-black shadow-lg flex items-center whitespace-nowrap">
                          {calculateTotal().toLocaleString()} ريس
                        </div>
                      )}
                    </div>

                    {isCodeVerified && (
                      <p className="text-sm text-[#5a6d63] font-semibold text-center animate-in fade-in duration-500">
                        تم تحصيل الكود بنجاح الان + 3 سنوات
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Book Now Button */}
              <button
                onClick={handleBuyNow}
                disabled={!selectedContract || treeCount === 0}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#4a6b56] via-[#3d5c49] to-[#2d4a3e] text-white font-black text-xl shadow-2xl hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <span>🔒</span>
                <span>احجز الآن</span>
                <span>{calculateTotal().toLocaleString()}</span>
              </button>

              {/* Safety Message */}
              <p className="text-center text-sm text-[#5a6d63] font-semibold flex items-center justify-center gap-2">
                <span>✅</span>
                <span>آمن يمكنك الإلغاء حسب الشروط</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e8e0d5 0%, #f5f0e8 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.8);
          border: 3px solid #7c9885;
        }

        input[type="range"]::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e8e0d5 0%, #f5f0e8 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.8);
          border: 3px solid #7c9885;
        }
      `}</style>
    </div>
  );
}
