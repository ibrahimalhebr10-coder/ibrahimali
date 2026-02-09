import { useState, useEffect } from 'react';
import { ArrowRight, Minus, Plus, Check } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background Image */}
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/30"></div>
      </div>

      {/* Content */}
      <div className="relative h-full overflow-y-auto">
        <div className="min-h-full flex flex-col px-4 pt-6 pb-8">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-all mb-8"
          >
            <ArrowRight className="w-5 h-5 text-gray-700" />
          </button>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] mb-1.5">
              احجز أشجارك الآن
            </h1>
            <p className="text-white/95 text-sm font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
              خطوة واحدة - عائد سنوي 15%
            </p>
          </div>

          {/* Main Card */}
          <div
            className="bg-[#f0ebe3]/95 backdrop-blur-xl rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/30 p-5 space-y-5"
            style={{
              boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 3px rgba(255,255,255,0.4)'
            }}
          >
            {/* Tree Counter Title */}
            <h2 className="text-center text-[#3a4f45] font-bold text-base mb-1">
              اختر عدد الأشجار للاستثمار
            </h2>

            {/* Counter Controls */}
            <div className="flex items-center justify-center gap-5 py-2">
              <button
                onClick={() => handleTreeCountChange(-1)}
                disabled={treeCount <= 1}
                className="w-[52px] h-[52px] rounded-[18px] bg-gradient-to-b from-[#e8e3db] to-[#ddd7ce] border-2 border-[#c5bfb5]/40 flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                style={{
                  boxShadow: '0 3px 8px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.6)'
                }}
              >
                <Minus className="w-5 h-5 text-[#3a4f45]" />
              </button>

              <div className="text-center min-w-[100px]">
                <div className="text-[72px] font-black text-[#2d3e35] leading-none tracking-tight">
                  {treeCount}
                </div>
                <div className="text-sm font-bold text-[#5a6b62] mt-0.5">شجرة</div>
              </div>

              <button
                onClick={() => handleTreeCountChange(1)}
                disabled={treeCount >= maxTrees}
                className="w-[52px] h-[52px] rounded-[18px] bg-gradient-to-b from-[#e8e3db] to-[#ddd7ce] border-2 border-[#c5bfb5]/40 flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                style={{
                  boxShadow: '0 3px 8px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.6)'
                }}
              >
                <Plus className="w-5 h-5 text-[#3a4f45]" />
              </button>
            </div>

            {/* Slider */}
            <div className="px-1 space-y-2 py-2">
              <input
                type="range"
                min="1"
                max={maxTrees}
                value={treeCount}
                onChange={handleSliderChange}
                className="w-full h-[11px] rounded-full appearance-none cursor-pointer custom-slider"
                style={{
                  background: `linear-gradient(to right, #7a9587 0%, #7a9587 ${(treeCount / maxTrees) * 100}%, #c9bfb1 ${(treeCount / maxTrees) * 100}%, #c9bfb1 100%)`,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)'
                }}
              />
              <div className="flex items-center text-[13px] text-[#5a6b62] font-semibold px-0.5">
                <span className="mr-1">📊</span>
                <span>ملكتك شجرة {maxTrees.toLocaleString()}-</span>
              </div>
            </div>

            {/* Quick Selection Cards */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {packages.slice(0, 3).map((pkg, index) => {
                const isSelected = selectedPackage?.id === pkg.id;
                const isFeatured = index === 1;

                return (
                  <button
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`relative rounded-[18px] transition-all ${
                      isFeatured
                        ? 'bg-gradient-to-b from-[#d4a574] to-[#b8894f] border-2 border-[#a37a45] shadow-[0_4px_12px_rgba(180,140,70,0.4)]'
                        : 'bg-gradient-to-b from-white/90 to-[#f5f0e8]/80 border-2 border-[#d5cfc5]/50 shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
                    }`}
                    style={{
                      padding: isFeatured ? '20px 12px 16px' : '16px 12px',
                      boxShadow: isFeatured
                        ? '0 4px 12px rgba(180,140,70,0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
                        : '0 2px 8px rgba(0,0,0,0.12), inset 0 1px 2px rgba(255,255,255,0.5)'
                    }}
                  >
                    {isFeatured && (
                      <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white rounded-full px-3 py-1 shadow-lg border border-[#e0d5c5]">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px]">⭐</span>
                            <span className="text-[10px] font-black text-[#b8894f] whitespace-nowrap">أكثر طلباً</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-center space-y-1.5">
                      <div className={`text-sm font-bold ${isFeatured ? 'text-white' : 'text-[#3a4f45]'}`}>
                        {pkg.min_trees} شجرة
                      </div>
                      <div className={`text-[22px] font-black leading-none ${isFeatured ? 'text-white' : 'text-[#2d3e35]'}`}>
                        {(pkg.min_trees * pkg.price_per_tree).toLocaleString()}
                        <span className="text-xs font-bold mr-0.5">ريس</span>
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
                <span className="text-[#3a4f45] font-bold text-[15px]">لديك كود شريك نجاح؟</span>
                <button
                  onClick={() => setShowPartnerInput(!showPartnerInput)}
                  className={`w-[54px] h-7 rounded-full transition-all relative ${
                    showPartnerInput ? 'bg-gradient-to-r from-[#6d8a76] to-[#5a7563]' : 'bg-[#c9c0b5]'
                  }`}
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  <div
                    className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      showPartnerInput ? 'right-0.5' : 'right-[26px]'
                    }`}
                  ></div>
                </button>
              </div>

              {/* Partner Code Input */}
              {showPartnerInput && (
                <div className="space-y-2.5 animate-in slide-in-from-top duration-300">
                  <p className="text-[13px] text-[#5a6b62] font-semibold flex items-center gap-1.5">
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
                        className={`w-full px-4 py-3 rounded-[16px] border-2 font-bold text-[15px] text-center ${
                          isCodeVerified
                            ? 'bg-white/90 border-[#6d8a76] text-[#3a4f45]'
                            : 'bg-white/80 border-[#d5cfc5] text-[#3a4f45] placeholder:text-[#a39a8f] focus:border-[#6d8a76] focus:outline-none'
                        }`}
                        style={{
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      />
                      {isCodeVerified && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#6d8a76] flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleVerifyPartnerCode}
                      disabled={!partnerCode.trim() || isCodeVerified}
                      className="px-5 py-3 rounded-[16px] bg-gradient-to-b from-[#9d8760] to-[#8a7550] text-white font-black text-[15px] shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      style={{
                        boxShadow: '0 3px 8px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.2)'
                      }}
                    >
                      {calculateTotal().toLocaleString()} ريس
                    </button>
                  </div>

                  {isCodeVerified && (
                    <p className="text-[13px] text-[#5a6b62] font-semibold text-center animate-in fade-in duration-500">
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
              className="w-full py-[18px] rounded-[18px] bg-gradient-to-b from-[#4a5f52] via-[#3e5246] to-[#344539] text-white font-black text-lg shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2.5"
              style={{
                boxShadow: '0 6px 20px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.15)'
              }}
            >
              <span className="text-xl">🔒</span>
              <span>احجز الآن</span>
              <span>{calculateTotal().toLocaleString()}</span>
            </button>

            {/* Safety Message */}
            <p className="text-center text-[13px] text-[#5a6b62] font-semibold flex items-center justify-center gap-2">
              <span>✅</span>
              <span>آمن يمكنك الإلغاء حسب الشروط</span>
            </p>
          </div>
        </div>
      </div>

      {/* Custom Slider Styles */}
      <style>{`
        .custom-slider::-webkit-slider-thumb {
          appearance: none;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(145deg, #f0ebe3, #e3ddd5);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.6);
          border: 3px solid #7a9587;
        }

        .custom-slider::-moz-range-thumb {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(145deg, #f0ebe3, #e3ddd5);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.6);
          border: 3px solid #7a9587;
        }

        .custom-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 3px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.6);
        }

        .custom-slider::-moz-range-thumb:hover {
          box-shadow: 0 3px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.6);
        }
      `}</style>
    </div>
  );
}
