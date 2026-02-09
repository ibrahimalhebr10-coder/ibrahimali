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
    <div className="fixed inset-0 z-50">
      {/* Background */}
      <div className="absolute inset-0">
        {farm.heroImage || farm.image ? (
          <img
            src={farm.heroImage || farm.image}
            alt={farm.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-200 via-emerald-200 to-teal-200"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30"></div>
      </div>

      {/* Content */}
      <div className="relative h-full overflow-y-auto">
        <div className="min-h-full flex flex-col">
          {/* Header */}
          <div className="px-5 pt-6 pb-4">
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg mb-6"
            >
              <ArrowRight className="w-5 h-5 text-gray-700" />
            </button>

            <div className="text-center mb-6">
              <h1 className="text-[28px] font-black text-white leading-tight mb-1.5"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                احجز أشجارك الآن
              </h1>
              <p className="text-white/95 text-sm font-semibold"
                style={{ textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>
                خطوة واحدة - عائد سنوي 15%
              </p>
            </div>
          </div>

          {/* Main Card */}
          <div className="flex-1 px-4 pb-8">
            <div
              className="rounded-[32px] p-6 space-y-5"
              style={{
                background: 'linear-gradient(to bottom, rgba(240,235,227,0.97), rgba(235,229,219,0.97))',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.05)',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              {/* Title */}
              <h2 className="text-center font-bold text-[17px] leading-tight mb-1"
                style={{ color: '#3a4f45' }}>
                اختر عدد الأشجار للاستثمار
              </h2>

              {/* Counter */}
              <div className="flex items-center justify-center gap-5 py-3">
                <button
                  onClick={() => handleTreeCountChange(-1)}
                  disabled={treeCount <= 1}
                  className="w-14 h-14 rounded-[20px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
                  style={{
                    background: 'linear-gradient(145deg, #e8e3db, #ddd7ce)',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.08)',
                    border: '2px solid rgba(197,191,181,0.4)'
                  }}
                >
                  <Minus className="w-5 h-5" style={{ color: '#3a4f45' }} />
                </button>

                <div className="text-center min-w-[110px]">
                  <div className="font-black leading-none tracking-tight"
                    style={{ fontSize: '76px', color: '#2d3e35' }}>
                    {treeCount}
                  </div>
                  <div className="text-sm font-bold mt-1" style={{ color: '#5a6b62' }}>
                    شجرة
                  </div>
                </div>

                <button
                  onClick={() => handleTreeCountChange(1)}
                  disabled={treeCount >= maxTrees}
                  className="w-14 h-14 rounded-[20px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
                  style={{
                    background: 'linear-gradient(145deg, #e8e3db, #ddd7ce)',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.08)',
                    border: '2px solid rgba(197,191,181,0.4)'
                  }}
                >
                  <Plus className="w-5 h-5" style={{ color: '#3a4f45' }} />
                </button>
              </div>

              {/* Slider */}
              <div className="px-2 space-y-2.5 py-1">
                <input
                  type="range"
                  min="1"
                  max={maxTrees}
                  value={treeCount}
                  onChange={handleSliderChange}
                  className="w-full appearance-none cursor-pointer booking-slider"
                  style={{
                    height: '12px',
                    borderRadius: '999px',
                    background: `linear-gradient(to right, #7a9587 0%, #7a9587 ${(treeCount / maxTrees) * 100}%, #c9bfb1 ${(treeCount / maxTrees) * 100}%, #c9bfb1 100%)`,
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)'
                  }}
                />
                <div className="flex items-center text-[13px] font-semibold" style={{ color: '#5a6b62' }}>
                  <span className="mr-1.5">📊</span>
                  <span>ملكتك شجرة {maxTrees.toLocaleString()}-</span>
                </div>
              </div>

              {/* Package Cards */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {packages.slice(0, 3).map((pkg, index) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  const isFeatured = index === 1;

                  return (
                    <button
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      className="relative rounded-[20px] transition-all active:scale-95"
                      style={{
                        padding: isFeatured ? '22px 10px 18px' : '18px 10px',
                        ...(isFeatured ? {
                          background: 'linear-gradient(to bottom, #d4a574, #b8894f)',
                          boxShadow: '0 4px 12px rgba(180,140,70,0.45), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.1)',
                          border: '2px solid #a37a45'
                        } : {
                          background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(245,240,232,0.85))',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.05)',
                          border: '2px solid rgba(213,207,197,0.5)'
                        })
                      }}
                    >
                      {isFeatured && (
                        <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                          <div className="bg-white rounded-full px-3 py-1 shadow-lg flex items-center gap-1"
                            style={{ border: '1px solid #e0d5c5' }}>
                            <span className="text-[10px]">⭐</span>
                            <span className="text-[10px] font-black whitespace-nowrap"
                              style={{ color: '#b8894f' }}>
                              أكثر طلباً
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="text-center space-y-1.5">
                        <div className="text-sm font-bold"
                          style={{ color: isFeatured ? '#ffffff' : '#3a4f45' }}>
                          {pkg.min_trees} شجرة
                        </div>
                        <div className="font-black leading-none"
                          style={{ fontSize: '23px', color: isFeatured ? '#ffffff' : '#2d3e35' }}>
                          {(pkg.min_trees * pkg.price_per_tree).toLocaleString()}
                          <span className="text-xs font-bold mr-1">ريس</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Partner Code Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[15px]" style={{ color: '#3a4f45' }}>
                    لديك كود شريك نجاح؟
                  </span>
                  <button
                    onClick={() => setShowPartnerInput(!showPartnerInput)}
                    className="relative transition-all"
                    style={{
                      width: '56px',
                      height: '30px',
                      borderRadius: '999px',
                      background: showPartnerInput
                        ? 'linear-gradient(to right, #6d8a76, #5a7563)'
                        : '#c9c0b5',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div
                      className="absolute top-1 bg-white rounded-full shadow-md transition-all duration-300"
                      style={{
                        width: '22px',
                        height: '22px',
                        right: showPartnerInput ? '4px' : '30px'
                      }}
                    ></div>
                  </button>
                </div>

                {showPartnerInput && (
                  <div className="space-y-3 animate-in slide-in-from-top duration-300">
                    <p className="text-[13px] font-semibold flex items-center gap-1.5"
                      style={{ color: '#5a6b62' }}>
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
                          className="w-full px-4 py-3 rounded-[18px] font-bold text-[15px] text-center transition-all"
                          style={{
                            background: isCodeVerified ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.8)',
                            border: isCodeVerified ? '2px solid #6d8a76' : '2px solid #d5cfc5',
                            color: '#3a4f45',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                            outline: 'none'
                          }}
                        />
                        {isCodeVerified && (
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                            style={{ background: '#6d8a76' }}>
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleVerifyPartnerCode}
                        disabled={!partnerCode.trim() || isCodeVerified}
                        className="px-5 py-3 rounded-[18px] font-black text-[15px] text-white whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'linear-gradient(to bottom, #9d8760, #8a7550)',
                          boxShadow: '0 3px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
                        }}
                      >
                        {calculateTotal().toLocaleString()} ريس
                      </button>
                    </div>

                    {isCodeVerified && (
                      <p className="text-[13px] font-semibold text-center animate-in fade-in duration-500"
                        style={{ color: '#5a6b62' }}>
                        تم تحصيل الكود بنجاح الان + 3 سنوات
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Book Button */}
              <button
                onClick={handleBuyNow}
                disabled={!selectedContract || treeCount === 0}
                className="w-full py-5 rounded-[20px] font-black text-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2.5"
                style={{
                  background: 'linear-gradient(to bottom, #4a5f52, #3e5246, #344539)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
                }}
              >
                <span className="text-xl">🔒</span>
                <span>احجز الآن</span>
                <span>{calculateTotal().toLocaleString()}</span>
              </button>

              {/* Safety Message */}
              <p className="text-center text-[13px] font-semibold flex items-center justify-center gap-2"
                style={{ color: '#5a6b62' }}>
                <span>✅</span>
                <span>آمن يمكنك الإلغاء حسب الشروط</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .booking-slider::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(145deg, #f0ebe3, #e3ddd5);
          cursor: pointer;
          border: 3px solid #7a9587;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.6);
        }

        .booking-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(145deg, #f0ebe3, #e3ddd5);
          cursor: pointer;
          border: 3px solid #7a9587;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.6);
        }

        .booking-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 3px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.6);
        }

        .booking-slider::-moz-range-thumb:hover {
          box-shadow: 0 3px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.6);
        }
      `}</style>
    </div>
  );
}
