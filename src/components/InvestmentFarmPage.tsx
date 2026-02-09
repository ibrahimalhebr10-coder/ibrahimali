import { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, Lock, CheckCircle, Gift } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{
          background: 'linear-gradient(135deg, #f5f3f0 0%, #e8e4df 100%)'
        }}>
          <div className="min-h-screen pb-32">
            {/* Header با صورة خلفية المزرعة */}
            <div className="relative h-80 overflow-hidden">
              {/* صورة الخلفية */}
              {farm.heroImage || farm.image ? (
                <img
                  src={farm.heroImage || farm.image}
                  alt={farm.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-200 via-green-300 to-green-400"></div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent"></div>

              {/* زر الرجوع */}
              <button
                onClick={onClose}
                className="absolute top-6 left-6 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-all z-10"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>

              {/* العنوان */}
              <div className="absolute top-20 left-0 right-0 text-center px-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">احجز أشجارك الآن</h1>
                <p className="text-sm text-gray-700">خطوة واحدة - عائد سنوي 15%</p>
              </div>
            </div>

            {/* الكارد الرئيسية البيضاء */}
            <div className="px-4 -mt-24 relative z-10">
              <div className="bg-gradient-to-br from-[#f5f3f0] to-[#ede9e4] rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">

                {/* قسم العداد */}
                <div className="p-6 space-y-6">
                  <h3 className="text-center text-base font-bold text-gray-800">
                    اختر عدد الأشجار للاستثمار
                  </h3>

                  {/* العداد */}
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => handleTreeCountChange(-50)}
                      disabled={treeCount <= minTrees}
                      className="w-16 h-16 rounded-full bg-white/80 shadow-md flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      <Minus className="w-6 h-6 text-gray-700" />
                    </button>

                    <div className="text-center">
                      <div className="text-6xl font-bold text-gray-800">
                        {treeCount}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">شجرة</div>
                    </div>

                    <button
                      onClick={() => handleTreeCountChange(50)}
                      disabled={treeCount >= maxTrees}
                      className="w-16 h-16 rounded-full bg-white/80 shadow-md flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      <Plus className="w-6 h-6 text-gray-700" />
                    </button>
                  </div>

                  {/* السلايدر */}
                  <div className="relative px-3">
                    <input
                      type="range"
                      min={minTrees}
                      max={maxTrees}
                      value={treeCount}
                      onChange={handleSliderChange}
                      step={50}
                      className="w-full h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full appearance-none cursor-pointer slider-investment"
                    />
                    <div className="flex justify-between mt-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="text-xs text-gray-600">
                        ملكت شجرة {maxTrees.toLocaleString()}-
                      </div>
                    </div>
                  </div>

                  {/* بطاقات الباقات الثلاثة */}
                  <div className="grid grid-cols-3 gap-2 px-1">
                    {packages.slice(0, 3).map((pkg, index) => {
                      const isSelected = selectedPackage?.id === pkg.id;
                      const isFeatured = index === 1;
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => handleSelectPackage(pkg)}
                          className={`relative p-3 rounded-2xl transition-all ${
                            isFeatured
                              ? 'bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-400 shadow-lg'
                              : 'bg-white/60 border-2 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {isFeatured && (
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap">
                              <span>★</span>
                              <span>أكثر طلباً</span>
                            </div>
                          )}
                          <div className="text-center space-y-1 mt-1">
                            <div className="text-base font-bold text-gray-800">
                              {pkg.min_trees} شجرة
                            </div>
                            <div className="text-lg font-bold text-gray-800">
                              {pkg.price_per_tree * pkg.min_trees} ر.س
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* قسم كود شريك النجاح */}
                  <div className="bg-white/60 rounded-2xl p-4 space-y-3 border border-gray-200">
                    {/* السؤال مع Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">
                        لديك كود شريك نجاح؟
                      </span>
                      <button
                        onClick={() => setShowPartnerCode(!showPartnerCode)}
                        className={`relative w-14 h-7 rounded-full transition-all ${
                          showPartnerCode ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                            showPartnerCode ? 'right-1' : 'right-8'
                          }`}
                        ></div>
                      </button>
                    </div>

                    {/* النص التحفيزي */}
                    {showPartnerCode && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-green-50 p-2 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>أدخل الكود للحصول الان 3 + 3 سنوات</span>
                        </div>

                        {/* حقل الإدخال */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={partnerCode}
                              onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                              placeholder="PARTNER50"
                              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-sm font-semibold text-center focus:outline-none focus:border-green-500"
                            />
                            {codeVerified && (
                              <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <button
                            onClick={handleVerifyCode}
                            disabled={!partnerCode.trim() || codeVerified}
                            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            900 ريس
                          </button>
                        </div>

                        {/* رسالة النجاح */}
                        {codeVerified && (
                          <div className="text-xs text-gray-600 text-center bg-green-50 p-2 rounded-lg">
                            تم تحصيل الكود بنجاح معه الان + 3 سنوات
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* زر الحجز الرئيسي */}
                  <button
                    onClick={handleInvestNow}
                    className="w-full py-4 bg-gradient-to-r from-green-700 to-green-800 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 border-2 border-amber-500/50"
                  >
                    <Lock className="w-5 h-5" />
                    <span>احجز الآن {calculateTotal().toLocaleString()}</span>
                  </button>

                  {/* رسالة الأمان */}
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>آمن يمكنك الإلغاء حسب الشروط</span>
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
        .slider-investment::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.5);
          border: 3px solid white;
        }
        .slider-investment::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.5);
          border: 3px solid white;
        }
      `}</style>
    </>
  );
}
