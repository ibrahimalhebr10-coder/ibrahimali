import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Minus, Plus, Sprout, Gift, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { agriculturalPackagesService, type AgriculturalPackage } from '../services/agriculturalPackagesService';
import { influencerMarketingService } from '../services/influencerMarketingService';

interface AgriculturalReviewScreenProps {
  farmName: string;
  farmLocation?: string;
  contractName: string;
  durationYears: number;
  bonusYears: number;
  treeCount: number;
  totalPrice: number;
  pricePerTree?: number;
  onConfirm: (data: {
    treeCount: number;
    totalPrice: number;
    selectedPackage: any;
    influencerCode: string | null;
    bonusYears: number;
  }) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function AgriculturalReviewScreen({
  farmName,
  onConfirm,
  onBack,
  isLoading = false
}: AgriculturalReviewScreenProps) {
  console.log('🟢 صفحة الحجز الجديدة (التصميم المطور) - 2026-02-09');

  // State Management
  const [treeCount, setTreeCount] = useState(50);
  const [packages, setPackages] = useState<AgriculturalPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<AgriculturalPackage | null>(null);
  const [influencerCode, setInfluencerCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [bonusMonths, setBonusMonths] = useState(0);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const maxTrees = 3000;
  const baseYears = 3;

  // Load packages on mount
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const pkgs = await agriculturalPackagesService.getActivePackages();
        setPackages(pkgs);

        // Select middle package by default (featured)
        if (pkgs.length > 0) {
          const middleIndex = Math.floor(pkgs.length / 2);
          setSelectedPackage(pkgs[middleIndex]);
          setTreeCount(pkgs[middleIndex].min_trees);
        }
      } catch (error) {
        console.error('Error loading packages:', error);
      }
    };
    loadPackages();
  }, []);

  // Calculate total price
  const calculateTotal = () => {
    if (selectedPackage) {
      return treeCount * selectedPackage.price_per_tree;
    }
    return 0;
  };

  // Handle tree count change
  const handleTreeCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(maxTrees, treeCount + delta));
    setTreeCount(newCount);
  };

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTreeCount(parseInt(e.target.value));
  };

  // Handle package selection
  const handlePackageSelect = (pkg: AgriculturalPackage) => {
    setSelectedPackage(pkg);
    setTreeCount(pkg.min_trees);
  };

  // Handle code verification
  const handleVerifyCode = async () => {
    if (!influencerCode.trim()) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const result = await influencerMarketingService.verifyInfluencerCode(influencerCode.trim());

      if (!result.isValid) {
        setErrorMessage(result.message);
        setIsVerifying(false);
        return;
      }

      // Code is valid
      setIsCodeVerified(true);
      setBonusMonths(6); // 6 months bonus = 3 years + 6 months
      sessionStorage.setItem('influencer_code', influencerCode.trim());
    } catch (err) {
      setErrorMessage('حدث خطأ أثناء التحقق من الكود');
    } finally {
      setIsVerifying(false);
    }
  };

  // Scroll packages
  const scrollPackages = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 300;
      sliderRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const totalYears = baseYears;
  const totalMonths = bonusMonths;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Hero Background Image */}
      <div className="absolute top-0 left-0 right-0 h-48 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/1263986/pexels-photo-1263986.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Farm Background"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pt-2">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-gray-800 mb-1">
            احجز أشجارك الآن
          </h1>
          <p className="text-sm text-gray-600">
            خطوة واحدة - عائد سنوي 15%
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-gray-50/80 via-green-50/60 to-gray-50/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-gray-200/50">

          {/* Tree Counter Section */}
          <div className="mb-6">
            <h3 className="text-center text-lg font-bold text-gray-800 mb-4">
              اختر عدد الأشجار للاستثمار
            </h3>

            {/* Counter Controls */}
            <div className="flex items-center justify-center gap-6 mb-4">
              <button
                onClick={() => handleTreeCountChange(-1)}
                disabled={treeCount <= 1}
                className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 hover:border-green-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md active:scale-95"
              >
                <Minus className="w-5 h-5 text-gray-700" />
              </button>

              <div className="text-center">
                <div className="text-5xl font-black text-gray-800">
                  {treeCount}
                </div>
                <div className="text-sm text-gray-600 font-medium mt-1">شجرة</div>
              </div>

              <button
                onClick={() => handleTreeCountChange(1)}
                disabled={treeCount >= maxTrees}
                className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 hover:border-green-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md active:scale-95"
              >
                <Plus className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Slider */}
            <div className="mb-3 px-4">
              <input
                type="range"
                min="1"
                max={maxTrees}
                value={treeCount}
                onChange={handleSliderChange}
                className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, #10B981 0%, #10B981 ${(treeCount / maxTrees) * 100}%, #E5E7EB ${(treeCount / maxTrees) * 100}%, #E5E7EB 100%)`
                }}
              />
            </div>

            <div className="text-center text-sm text-gray-500">
              تملك شجرة {maxTrees.toLocaleString()}-
            </div>
          </div>

          {/* Packages Section */}
          <div className="mb-6">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" ref={sliderRef}>
              {packages.map((pkg, index) => {
                const isSelected = selectedPackage?.id === pkg.id;
                const isFeatured = index === Math.floor(packages.length / 2);

                return (
                  <button
                    key={pkg.id}
                    onClick={() => handlePackageSelect(pkg)}
                    className={`relative flex-shrink-0 w-32 rounded-2xl p-4 transition-all border-2 ${
                      isSelected
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-400 border-amber-500 shadow-xl scale-105'
                        : 'bg-white border-gray-200 hover:border-green-400 shadow-md'
                    }`}
                  >
                    {isFeatured && !isSelected && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        الأكثر طلباً ⭐
                      </div>
                    )}

                    <div className="text-center">
                      <div className={`text-xs font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                        شجرة {pkg.min_trees}
                      </div>
                      <div className={`text-xl font-black ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                        {pkg.price_per_tree * pkg.min_trees}
                      </div>
                      <div className={`text-[10px] ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                        ر.س
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Partner Code Section */}
          <div className="mb-6">
            <button
              onClick={() => setShowCodeInput(!showCodeInput)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isCodeVerified ? 'bg-green-500' : 'bg-gray-200'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${isCodeVerified ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <span className="text-sm font-bold text-gray-800">
                  لدي كود شريك نجاح؟
                </span>
              </div>
            </button>

            {showCodeInput && (
              <div className="mt-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 text-xs text-green-700 mb-3">
                  <Sprout className="w-4 h-4" />
                  <span>أدخل الكود للحصول الان {baseYears} + 3 سنوات</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={influencerCode}
                    onChange={(e) => {
                      setInfluencerCode(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="أدخل الكود هنا"
                    disabled={isCodeVerified}
                    className={`flex-1 px-4 py-2 border-2 rounded-lg text-sm ${
                      isCodeVerified
                        ? 'bg-white border-green-400 text-gray-800'
                        : errorMessage
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-green-500'
                    }`}
                    dir="ltr"
                  />
                  {!isCodeVerified && (
                    <button
                      onClick={handleVerifyCode}
                      disabled={!influencerCode.trim() || isVerifying}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isVerifying ? '...' : 'تحقق'}
                    </button>
                  )}
                  {isCodeVerified && (
                    <div className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="mt-2 text-xs text-red-600">
                    {errorMessage}
                  </div>
                )}

                {isCodeVerified && (
                  <div className="mt-3 text-xs text-green-700 font-medium">
                    ✓ تم تحصيل الكود بنجاح صحه الان {totalYears} + {totalMonths / 12} سنوات
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="mb-4">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-4 text-center shadow-lg">
              <div className="text-3xl font-black text-white">
                {calculateTotal().toLocaleString()} ر.س
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => {
              if (selectedPackage) {
                onConfirm({
                  treeCount,
                  totalPrice: calculateTotal(),
                  selectedPackage,
                  influencerCode: isCodeVerified ? influencerCode : null,
                  bonusYears: isCodeVerified ? Math.floor(bonusMonths / 12) : 0
                });
              }
            }}
            disabled={isLoading || !selectedPackage}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black text-lg py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-98"
          >
            <Lock className="w-5 h-5" />
            <span>احجز الآن {calculateTotal().toLocaleString()}</span>
          </button>

          {/* Security Note */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>أمن يمكنك الإلغاء حسب الشروط</span>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(16, 185, 129, 0.4);
          border: 4px solid white;
        }

        .slider-thumb::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(16, 185, 129, 0.4);
          border: 4px solid white;
        }
      `}</style>
    </div>
  );
}
