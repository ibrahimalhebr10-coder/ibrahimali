import { useState, useEffect } from 'react';
import { ArrowRight, Minus, Plus, MapPin, TreePine, Star, Coins, Apple, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { FarmProject, FarmContract } from '../services/farmService';
import { agriculturalPackagesService, type AgriculturalPackage } from '../services/agriculturalPackagesService';
import { investmentPackagesService, type InvestmentPackage } from '../services/investmentPackagesService';
import UnifiedBookingFlow from './UnifiedBookingFlow';
import { usePageTracking } from '../hooks/useLeadTracking';
import { influencerMarketingService } from '../services/influencerMarketingService';

type UsageType = 'personal' | 'investment';

interface UnifiedFarmPageProps {
  farm: FarmProject;
  onClose: () => void;
  onGoToAccount?: () => void;
}

export default function UnifiedFarmPage({ farm, onClose, onGoToAccount }: UnifiedFarmPageProps) {
  const { user } = useAuth();
  const leadService = usePageTracking('صفحة المزرعة الموحدة');

  useEffect(() => {
    leadService.trackFarmView(farm.id, farm.name);
  }, [farm.id, farm.name]);

  const [usageType, setUsageType] = useState<UsageType | null>(null);
  const [agriculturalPackages, setAgriculturalPackages] = useState<AgriculturalPackage[]>([]);
  const [investmentPackages, setInvestmentPackages] = useState<InvestmentPackage[]>([]);
  const [selectedAgriculturalPackage, setSelectedAgriculturalPackage] = useState<AgriculturalPackage | null>(null);
  const [selectedInvestmentPackage, setSelectedInvestmentPackage] = useState<InvestmentPackage | null>(null);
  const [selectedContract, setSelectedContract] = useState<FarmContract | null>(null);
  const [treeCount, setTreeCount] = useState(50);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [bonusYears, setBonusYears] = useState(0);

  useEffect(() => {
    const loadAllPackages = async () => {
      try {
        const [agriPkgs, investPkgs] = await Promise.all([
          agriculturalPackagesService.getActivePackages(),
          investmentPackagesService.getActivePackages()
        ]);
        setAgriculturalPackages(agriPkgs);
        setInvestmentPackages(investPkgs);
      } catch (error) {
        console.error('Error loading packages:', error);
      }
    };
    loadAllPackages();
  }, []);

  const maxTrees = farm.availableTrees || 1000;

  const handleUsageTypeSelect = async (type: UsageType) => {
    setUsageType(type);
    setSelectedAgriculturalPackage(null);
    setSelectedInvestmentPackage(null);
    setSelectedContract(null);

    if (type === 'personal' && agriculturalPackages.length >= 2) {
      const middlePackage = agriculturalPackages[1];
      await handleSelectAgriculturalPackage(middlePackage);
    } else if (type === 'investment' && investmentPackages.length >= 2) {
      const middlePackage = investmentPackages[1] || investmentPackages[0];
      await handleSelectInvestmentPackage(middlePackage);
    }
  };

  const handleSelectAgriculturalPackage = async (pkg: AgriculturalPackage) => {
    setSelectedAgriculturalPackage(pkg);
    setSelectedInvestmentPackage(null);
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

  const handleSelectInvestmentPackage = async (pkg: InvestmentPackage) => {
    setSelectedInvestmentPackage(pkg);
    setSelectedAgriculturalPackage(null);
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

  const handleTreeCountChange = (delta: number) => {
    const minTrees = usageType === 'personal'
      ? (selectedAgriculturalPackage?.min_trees || 1)
      : (selectedInvestmentPackage?.min_trees || 50);
    const newCount = Math.max(minTrees, Math.min(maxTrees, treeCount + delta));
    setTreeCount(newCount);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTreeCount(parseInt(e.target.value));
  };

  const calculateTotal = () => {
    if (treeCount === 0) return 0;
    if (usageType === 'personal' && selectedAgriculturalPackage) {
      return treeCount * selectedAgriculturalPackage.price_per_tree;
    }
    if (usageType === 'investment' && selectedInvestmentPackage) {
      return treeCount * selectedInvestmentPackage.price_per_tree;
    }
    return 0;
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
    if (!usageType) {
      alert('يرجى اختيار نوع الاستفادة أولاً');
      return;
    }
    if (usageType === 'personal' && !selectedAgriculturalPackage) {
      alert('يرجى اختيار باقة');
      return;
    }
    if (usageType === 'investment' && !selectedInvestmentPackage) {
      alert('يرجى اختيار باقة استثمارية');
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

  const getBookingFlowProps = () => {
    if (usageType === 'personal' && selectedAgriculturalPackage && selectedContract) {
      return {
        pathType: 'agricultural' as const,
        packageName: selectedAgriculturalPackage.package_name,
        durationYears: selectedAgriculturalPackage.contract_years || selectedContract.duration_years,
        bonusYears: bonusYears || selectedAgriculturalPackage.bonus_years || selectedContract.bonus_years,
        pricePerTree: selectedAgriculturalPackage.price_per_tree,
      };
    }
    if (usageType === 'investment' && selectedInvestmentPackage && selectedContract) {
      return {
        pathType: 'investment' as const,
        packageName: selectedInvestmentPackage.package_name,
        durationYears: selectedInvestmentPackage.base_duration_years || selectedContract.duration_years,
        bonusYears: bonusYears || selectedInvestmentPackage.bonus_free_years || selectedContract.bonus_years,
        pricePerTree: selectedInvestmentPackage.price_per_tree,
      };
    }
    return null;
  };

  const bookingProps = getBookingFlowProps();

  if (showBookingFlow && bookingProps && selectedContract) {
    return (
      <UnifiedBookingFlow
        farmId={farm.id}
        farmName={farm.name}
        farmLocation={farm.location}
        pathType={bookingProps.pathType}
        packageName={bookingProps.packageName}
        treeCount={treeCount}
        contractId={selectedContract.id}
        contractName={selectedContract.contract_name}
        durationYears={bookingProps.durationYears}
        bonusYears={bookingProps.bonusYears}
        totalPrice={calculateTotal()}
        pricePerTree={bookingProps.pricePerTree}
        influencerCode={isCodeVerified ? partnerCode : null}
        usageType={usageType}
        onBack={() => setShowBookingFlow(false)}
        onComplete={() => {
          setShowBookingFlow(false);
          handleGoToAccount();
        }}
      />
    );
  }

  const farmImage = farm.heroImage || farm.images?.[0] || 'https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=800';

  const currentPackages = usageType === 'personal' ? agriculturalPackages : investmentPackages;
  const selectedPackage = usageType === 'personal' ? selectedAgriculturalPackage : selectedInvestmentPackage;

  return (
    <div className="fixed inset-0 bg-[#f5f7f6] z-50 overflow-y-auto" dir="rtl">
      <div className="min-h-screen pb-32">

        {/* Hero Image Section */}
        <div className="relative h-[140px] overflow-hidden">
          <img
            src={farmImage}
            alt={farm.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all duration-300"
          >
            <ArrowRight className="w-4 h-4 text-white" style={{ transform: 'scaleX(-1)' }} />
          </button>

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

        <div className="px-4 mt-4">

          {/* Usage Type Selection - The Smart Question */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-5 mb-4">
            <h2 className="text-[16px] font-bold text-center text-[#1a3d2a] mb-4">
              كيف تريد الاستفادة من أشجارك؟
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {/* Personal Use Option */}
              <button
                onClick={() => handleUsageTypeSelect('personal')}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
                  usageType === 'personal'
                    ? 'border-[#22c55e] bg-gradient-to-b from-[#f0fdf4] to-[#dcfce7] shadow-lg shadow-green-500/20 scale-[1.02]'
                    : 'border-gray-200 bg-white hover:border-[#22c55e]/50 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
                  usageType === 'personal'
                    ? 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] shadow-lg shadow-green-500/30'
                    : 'bg-gradient-to-br from-green-100 to-green-200'
                }`}>
                  <Apple className={`w-6 h-6 ${usageType === 'personal' ? 'text-white' : 'text-[#16a34a]'}`} />
                </div>
                <h3 className={`text-[14px] font-bold mb-1 ${usageType === 'personal' ? 'text-[#16a34a]' : 'text-[#1a3d2a]'}`}>
                  استعمال شخصي
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  احصل على التمر أو الزيت من أشجارك مباشرة
                </p>
                {usageType === 'personal' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center shadow-md">
                    <span className="text-white text-[12px] font-bold">✓</span>
                  </div>
                )}
              </button>

              {/* Investment Option */}
              <button
                onClick={() => handleUsageTypeSelect('investment')}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
                  usageType === 'investment'
                    ? 'border-amber-400 bg-gradient-to-b from-[#fffbeb] to-[#fef3c7] shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : 'border-gray-200 bg-white hover:border-amber-400/50 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
                  usageType === 'investment'
                    ? 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/30'
                    : 'bg-gradient-to-br from-amber-100 to-amber-200'
                }`}>
                  <Coins className={`w-6 h-6 ${usageType === 'investment' ? 'text-white' : 'text-amber-600'}`} />
                </div>
                <h3 className={`text-[14px] font-bold mb-1 ${usageType === 'investment' ? 'text-amber-600' : 'text-[#1a3d2a]'}`}>
                  استثمار
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  احصل على عائد مالي سنوي من استثمارك
                </p>
                {usageType === 'investment' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
                    <span className="text-white text-[12px] font-bold">✓</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Package Selection - Only show after usage type is selected */}
          {usageType && currentPackages.length > 0 && (
            <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100 p-3 mb-3 animate-fadeIn">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
                  usageType === 'personal'
                    ? 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] shadow-green-500/20'
                    : 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/20'
                }`}>
                  <Star className="w-3 h-3 text-white fill-white" />
                </div>
                <h2 className="text-[14px] font-bold text-[#1a3d2a]">اختر الباقة</h2>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {currentPackages.slice(0, 3).map((pkg, index) => {
                  const isPopular = index === 1;
                  const isSelected = usageType === 'personal'
                    ? selectedAgriculturalPackage?.id === pkg.id
                    : selectedInvestmentPackage?.id === pkg.id;
                  const totalPrice = pkg.price_per_tree * pkg.min_trees;
                  const accentColor = usageType === 'personal' ? '#22c55e' : '#f59e0b';
                  const accentColorDark = usageType === 'personal' ? '#16a34a' : '#d97706';

                  return (
                    <button
                      key={pkg.id}
                      onClick={() => usageType === 'personal'
                        ? handleSelectAgriculturalPackage(pkg as AgriculturalPackage)
                        : handleSelectInvestmentPackage(pkg as InvestmentPackage)
                      }
                      className={`relative py-2.5 px-1.5 rounded-xl transition-all duration-300 ${
                        isSelected
                          ? `border-2 shadow-lg scale-[1.03] -mt-0.5`
                          : 'bg-white border border-gray-200 hover:shadow-md active:scale-95'
                      }`}
                      style={{
                        background: isSelected
                          ? `linear-gradient(to bottom, ${accentColor}, ${accentColorDark})`
                          : undefined,
                        borderColor: isSelected ? accentColor : undefined,
                        boxShadow: isSelected
                          ? `0 10px 25px -5px ${accentColor}40`
                          : undefined
                      }}
                    >
                      {isPopular && (
                        <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-amber-400 text-amber-900 text-[8px] px-2 py-0.5 rounded-full flex items-center gap-0.5 whitespace-nowrap shadow-md font-bold">
                          <Star className="w-2 h-2 fill-current" />
                          <span>الأكثر طلباً</span>
                        </div>
                      )}
                      <div className="text-center">
                        <div className={`text-[12px] font-bold ${isSelected ? 'text-white' : 'text-[#1a3d2a]'}`}>
                          {pkg.min_trees} شجرة
                        </div>
                        <div className={`text-[14px] font-black mt-1 ${isSelected ? 'text-white' : ''}`}
                          style={{ color: isSelected ? undefined : accentColor }}
                        >
                          {totalPrice.toLocaleString()}
                        </div>
                        <div className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>ر.س / سنة</div>
                        {(pkg as any).bonus_years > 0 && (
                          <div className={`mt-1 py-0.5 px-1.5 rounded-md ${isSelected ? 'bg-white/20 backdrop-blur-sm' : 'bg-green-50'}`}>
                            <span className={`text-[8px] font-semibold ${isSelected ? 'text-white' : 'text-[#16a34a]'}`}>
                              + {(pkg as any).bonus_years} سنة مجاناً
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-center gap-1.5 mt-3">
                {currentPackages.slice(0, 3).map((pkg) => {
                  const isActive = usageType === 'personal'
                    ? selectedAgriculturalPackage?.id === pkg.id
                    : selectedInvestmentPackage?.id === pkg.id;
                  const accentColor = usageType === 'personal' ? '#22c55e' : '#f59e0b';
                  return (
                    <div
                      key={pkg.id}
                      className={`rounded-full transition-all duration-300 cursor-pointer ${
                        isActive ? 'w-5 h-1.5' : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                      }`}
                      style={{ backgroundColor: isActive ? accentColor : undefined }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Partner Code Section - Only show after package selected */}
          {usageType && selectedPackage && (
            <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 p-5 mb-4 animate-fadeIn">
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
          )}

          {/* Tree Counter - Only show after package selected */}
          {usageType && selectedPackage && (
            <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 p-5 mb-4 animate-fadeIn">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                  usageType === 'personal'
                    ? 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] shadow-green-500/20'
                    : 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/20'
                }`}>
                  <TreePine className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-[17px] font-bold text-[#1a3d2a]">حدد عدد الأشجار</h2>
              </div>

              <div className="text-center mb-4 py-2 px-4 rounded-xl bg-gradient-to-l from-[#fef3c7] to-[#fef9c3] border border-amber-200">
                <span className="text-[12px] text-amber-700">السعر الحالي: </span>
                <span className="text-[16px] font-black text-amber-600">{calculateTotal().toLocaleString()}</span>
                <span className="text-[11px] text-amber-600 mr-1">ر.س</span>
              </div>

              <div className="flex items-center justify-center gap-4 mb-5">
                <button
                  onClick={() => handleTreeCountChange(-1)}
                  disabled={treeCount <= 1}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:from-gray-100 hover:to-gray-150 hover:shadow-md transition-all duration-300 active:scale-95"
                >
                  <Minus className="w-5 h-5 text-gray-600" />
                </button>

                <div className={`text-center min-w-[100px] py-3 px-5 rounded-2xl border ${
                  usageType === 'personal'
                    ? 'bg-gradient-to-b from-[#f0fdf4] to-[#dcfce7] border-[#bbf7d0]'
                    : 'bg-gradient-to-b from-[#fffbeb] to-[#fef3c7] border-amber-200'
                }`}>
                  <div className={`text-[48px] font-black leading-none ${
                    usageType === 'personal' ? 'text-[#16a34a]' : 'text-amber-600'
                  }`}>{treeCount}</div>
                  <div className={`text-[12px] mt-1 font-semibold ${
                    usageType === 'personal' ? 'text-[#15803d]' : 'text-amber-700'
                  }`}>شجرة</div>
                </div>

                <button
                  onClick={() => handleTreeCountChange(1)}
                  disabled={treeCount >= maxTrees}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-30 hover:shadow-lg transition-all duration-300 active:scale-95 ${
                    usageType === 'personal'
                      ? 'bg-gradient-to-b from-[#22c55e] to-[#16a34a] hover:shadow-green-500/30'
                      : 'bg-gradient-to-b from-amber-400 to-amber-500 hover:shadow-amber-500/30'
                  }`}
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="relative mb-1 px-1">
                <div className="relative h-[10px] bg-gradient-to-l from-gray-100 to-gray-200 rounded-full overflow-visible">
                  <div
                    className={`absolute top-0 right-0 h-full rounded-full transition-all duration-200 shadow-sm ${
                      usageType === 'personal'
                        ? 'bg-gradient-to-l from-[#22c55e] to-[#4ade80]'
                        : 'bg-gradient-to-l from-amber-400 to-amber-300'
                    }`}
                    style={{ width: `${(treeCount / maxTrees) * 100}%` }}
                  />
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full border-[3px] shadow-lg cursor-pointer transition-all duration-200 hover:scale-110 ${
                      usageType === 'personal'
                        ? 'border-[#22c55e] shadow-green-500/40'
                        : 'border-amber-400 shadow-amber-500/40'
                    }`}
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
          )}

          {/* Booking Summary */}
          {usageType && selectedPackage && (
            <div className="mb-4 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 p-4 animate-fadeIn">
              <h3 className="text-[14px] font-bold text-[#1a3d2a] mb-3 flex items-center gap-2">
                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] text-white ${
                  usageType === 'personal' ? 'bg-[#22c55e]' : 'bg-amber-500'
                }`}>✓</span>
                ملخص الحجز
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500">نوع الاستفادة</span>
                  <span className={`text-[14px] font-bold ${usageType === 'personal' ? 'text-[#16a34a]' : 'text-amber-600'}`}>
                    {usageType === 'personal' ? 'استعمال شخصي' : 'استثمار'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500">الباقة المختارة</span>
                  <span className={`text-[14px] font-bold ${usageType === 'personal' ? 'text-[#16a34a]' : 'text-amber-600'}`}>
                    {selectedPackage.package_name}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500">عدد الأشجار</span>
                  <span className="text-[14px] font-bold text-[#1a3d2a]">{treeCount} شجرة</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-[13px] text-gray-500">سعر الشجرة</span>
                  <span className="text-[14px] font-bold text-[#1a3d2a]">{selectedPackage.price_per_tree.toLocaleString()} ر.س</span>
                </div>
                {bonusYears > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-[13px] text-gray-500">مدة إضافية مجانية</span>
                    <span className="text-[14px] font-bold text-[#16a34a]">+{bonusYears} سنة</span>
                  </div>
                )}
                <div className={`flex items-center justify-between pt-3 mt-1 border-t-2 ${
                  usageType === 'personal' ? 'border-[#22c55e]/20' : 'border-amber-400/20'
                }`}>
                  <span className="text-[15px] font-bold text-[#1a3d2a]">الإجمالي</span>
                  <div className="text-left">
                    <span className={`text-[22px] font-black ${usageType === 'personal' ? 'text-[#16a34a]' : 'text-amber-600'}`}>
                      {calculateTotal().toLocaleString()}
                    </span>
                    <span className="text-[12px] text-gray-500 mr-1">ر.س</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Book Now Button */}
          {usageType && selectedPackage && (
            <div className="mb-4 animate-fadeIn">
              <button
                onClick={handleBuyNow}
                disabled={!selectedPackage || treeCount === 0}
                className={`w-full py-4 rounded-2xl font-bold text-[18px] text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 relative overflow-hidden ${
                  usageType === 'personal'
                    ? 'bg-gradient-to-l from-[#16a34a] via-[#22c55e] to-[#16a34a] shadow-green-500/30 hover:shadow-green-500/40'
                    : 'bg-gradient-to-l from-amber-500 via-amber-400 to-amber-500 shadow-amber-500/30 hover:shadow-amber-500/40'
                }`}
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
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    usageType === 'personal' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-amber-50 text-amber-600'
                  }`}>✓</span>
                  <span className="text-[11px] text-gray-500">دفع آمن</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    usageType === 'personal' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-amber-50 text-amber-600'
                  }`}>✓</span>
                  <span className="text-[11px] text-gray-500">إلغاء مرن</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    usageType === 'personal' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-amber-50 text-amber-600'
                  }`}>✓</span>
                  <span className="text-[11px] text-gray-500">دعم 24/7</span>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="h-24"></div>

      </div>
    </div>
  );
}
