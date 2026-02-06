import { useState, useEffect, useRef } from 'react';
import { X, Video, HelpCircle, MapPin, Minus, Plus, TrendingUp, Clock, Gift, DollarSign, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { FarmProject, FarmContract } from '../services/farmService';
import { investmentPackagesService, type InvestmentPackage } from '../services/investmentPackagesService';
import InvestmentReviewScreen from './InvestmentReviewScreen';
import InvestmentPackageDetailsModal from './InvestmentPackageDetailsModal';
import PaymentPage from './PaymentPage';
import { usePageTracking } from '../hooks/useLeadTracking';
import InfluencerCodeInput from './InfluencerCodeInput';
import FeaturedPackageOverlay from './FeaturedPackageOverlay';
import { influencerMarketingService, type FeaturedPackageSettings } from '../services/influencerMarketingService';

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

  useEffect(() => {
    const loadFeaturedPackageSettings = async () => {
      try {
        const settings = await influencerMarketingService.getFeaturedPackageSettings();
        if (settings) {
          setFeaturedPackageSettings(settings);
        }
      } catch (error) {
        console.error('خطأ في تحميل إعدادات الباقة المميزة:', error);
      }
    };

    loadFeaturedPackageSettings();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('influencer_code');
      sessionStorage.removeItem('influencer_activated_at');
      sessionStorage.removeItem('featured_package_active');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);
  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<InvestmentPackage | null>(null);
  const [selectedContract, setSelectedContract] = useState<FarmContract | null>(null);
  const [treeCount, setTreeCount] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPackageDetailsModal, setShowPackageDetailsModal] = useState(false);
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [reservationId, setReservationId] = useState<string>('');
  const [currentPackageIndex, setCurrentPackageIndex] = useState(0);
  const [isLoadingContract, setIsLoadingContract] = useState(false);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const packagesScrollRef = useRef<HTMLDivElement>(null);
  const [influencerCode, setInfluencerCode] = useState<string | null>(null);
  const [featuredColor] = useState('#FFD700');
  const [showFeaturedPackage, setShowFeaturedPackage] = useState(false);
  const [featuredPackageSettings, setFeaturedPackageSettings] = useState<FeaturedPackageSettings | null>(null);

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
      } catch (error) {
        console.error('Error loading packages:', error);
      }
    };
    loadPackages();
  }, []);

  useEffect(() => {
    if (selectedContract) {
      console.log('🔄 selectedContract تم تحديثه:', {
        name: selectedContract.contract_name,
        duration: selectedContract.duration_years,
        bonus: selectedContract.bonus_years,
        id: selectedContract.id
      });
    }
  }, [selectedContract]);

  useEffect(() => {
    console.log('📊 [State Change] showReviewScreen:', showReviewScreen, 'reservationId:', reservationId);
  }, [showReviewScreen, reservationId]);

  useEffect(() => {
    const slider = packagesScrollRef.current;
    if (!slider || packages.length <= 1) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      if (window.innerWidth >= 768) {
        e.preventDefault();

        if (e.deltaY > 0 && currentPackageIndex < packages.length - 1) {
          scrollToPackage(currentPackageIndex + 1);
        } else if (e.deltaY < 0 && currentPackageIndex > 0) {
          scrollToPackage(currentPackageIndex - 1);
        }
      }
    };

    slider.addEventListener('wheel', handleWheel, { passive: false });
    return () => slider.removeEventListener('wheel', handleWheel);
  }, [currentPackageIndex, packages.length]);

  const maxTrees = farm.availableTrees || 0;

  const getMinTrees = () => selectedPackage?.min_trees || 50;
  const getTreeIncrement = () => selectedPackage?.tree_increment || 50;

  const getEffectiveMaxTrees = () => {
    const farmMax = maxTrees;
    return farmMax;
  };

  const calculateTotal = () => {
    if (treeCount === 0) return 0;
    if (selectedPackage) {
      return treeCount * selectedPackage.price_per_tree;
    }
    if (selectedContract) {
      return treeCount * selectedContract.investor_price;
    }
    return 0;
  };

  const handleTreeCountChange = (delta: number) => {
    const minTrees = getMinTrees();
    const increment = getTreeIncrement();
    const effectiveMax = getEffectiveMaxTrees();

    let newCount = treeCount + delta;

    if (newCount < minTrees) {
      newCount = minTrees;
    } else if (newCount > effectiveMax) {
      newCount = effectiveMax;
    }

    const remainder = newCount % increment;
    if (remainder !== 0) {
      if (delta > 0) {
        newCount = Math.ceil(newCount / increment) * increment;
      } else {
        newCount = Math.floor(newCount / increment) * increment;
      }
    }

    newCount = Math.max(minTrees, Math.min(effectiveMax, newCount));
    setTreeCount(newCount);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const increment = getTreeIncrement();
    const minTrees = getMinTrees();

    const steps = Math.round((value - minTrees) / increment);
    const alignedValue = minTrees + (steps * increment);

    setTreeCount(alignedValue);
  };

  const handleQuickSelect = (count: number) => {
    const minTrees = getMinTrees();
    const effectiveMax = getEffectiveMaxTrees();
    const finalCount = Math.max(minTrees, Math.min(effectiveMax, count));
    setTreeCount(finalCount);
  };

  const handlePackageDetailsClick = (pkg: InvestmentPackage) => {
    console.log('📦 [Investment Farm] Package details clicked:', pkg.name);
    leadService.trackPackageView(pkg.id, pkg.name);
    setSelectedPackage(pkg);
    setShowPackageDetailsModal(true);
  };

  const handleSelectPackage = async (pkg: InvestmentPackage) => {
    console.log('🎯 [Investment Farm] Package selected for reservation:', pkg.name);
    leadService.trackReservationStart(farm.id, pkg.min_trees);

    setIsLoadingContract(true);
    setSelectedPackage(pkg);

    setTreeCount(pkg.min_trees);

    try {
      const { data: contract, error } = await supabase
        .from('farm_contracts')
        .select('*')
        .eq('id', pkg.contract_id)
        .maybeSingle();

      if (contract && !error) {
        setTimeout(() => {
          setSelectedContract(contract);
          setIsLoadingContract(false);
        }, 0);
      } else {
        console.error('❌ خطأ في تحميل العقد:', error);
        const fallbackContract = farm.contracts?.find(c => c.id === pkg.contract_id);
        if (fallbackContract) {
          setSelectedContract(fallbackContract);
        }
        setIsLoadingContract(false);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب العقد:', error);
      setIsLoadingContract(false);
    }

    setShowPackageDetailsModal(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleInfluencerCodeEntered = (code: string) => {
    setInfluencerCode(code);
    setShowFeaturedPackage(true);
    sessionStorage.setItem('featured_package_active', 'true');
    console.log('كود المؤثر تم إدخاله:', code);
  };

  const handleDismissFeaturedPackage = () => {
    setShowFeaturedPackage(false);
    sessionStorage.removeItem('featured_package_active');
  };

  const scrollToPackage = (index: number) => {
    if (packagesScrollRef.current) {
      const scrollWidth = packagesScrollRef.current.scrollWidth;
      const containerWidth = packagesScrollRef.current.clientWidth;
      const scrollPosition = (scrollWidth / packages.length) * index;
      packagesScrollRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  };

  const handlePackageScroll = () => {
    if (packagesScrollRef.current && packages.length > 0) {
      const scrollLeft = packagesScrollRef.current.scrollLeft;
      const containerWidth = packagesScrollRef.current.clientWidth;
      const index = Math.round(scrollLeft / containerWidth);
      setCurrentPackageIndex(Math.min(index, packages.length - 1));
    }
  };

  const handleInvestNow = () => {
    if (!selectedPackage || !selectedContract) {
      alert('يرجى اختيار باقة استثمارية أولاً');
      return;
    }

    if (treeCount === 0 || treeCount < getMinTrees()) {
      alert(`الحد الأدنى للاستثمار هو ${getMinTrees()} شجرة`);
      return;
    }

    if (treeCount % getTreeIncrement() !== 0) {
      alert(`عدد الأشجار يجب أن يكون من مضاعفات ${getTreeIncrement()}`);
      return;
    }

    if (treeCount > getEffectiveMaxTrees()) {
      alert(`الحد الأقصى المتاح هو ${getEffectiveMaxTrees()} شجرة`);
      return;
    }

    setShowReviewScreen(true);
  };

  const handleConfirmReview = async () => {
    if (isCreatingReservation) {
      console.log('⚠️ [INVESTMENT] جاري إنشاء الحجز بالفعل، تم تجاهل الضغطة');
      return;
    }

    if (!selectedContract || treeCount === 0) {
      alert('يرجى اختيار باقة وعدد الأشجار');
      return;
    }

    setIsCreatingReservation(true);

    try {
      const totalPrice = calculateTotal();

      console.log('💰 [INVESTMENT] بدء إنشاء الحجز...');
      console.log('💰 [INVESTMENT] User ID:', user?.id || 'غير مسجل');
      console.log('💰 [INVESTMENT] Trees:', treeCount, 'Price:', totalPrice);
      console.log('💰 [INVESTMENT] Path Type: investment (أشجاري الذهبية)');
      if (influencerCode) {
        console.log('🎁 [INVESTMENT] Influencer Code:', influencerCode);
      }

      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          user_id: user?.id || null,
          farm_id: farm.id,
          farm_name: farm.name,
          contract_id: selectedContract.id,
          contract_name: selectedPackage?.package_name || selectedContract.contract_name,
          duration_years: selectedPackage?.base_duration_years || selectedContract.duration_years,
          bonus_years: selectedPackage?.bonus_free_years || selectedContract.bonus_years,
          total_trees: treeCount,
          total_price: totalPrice,
          path_type: 'investment',
          status: 'pending',
          influencer_code: influencerCode || null
        } as any)
        .select()
        .single() as any;

      if (reservationError) {
        console.error('❌ [INVESTMENT] خطأ في إنشاء الحجز:', reservationError);
        alert('حدث خطأ في إنشاء الحجز. يرجى المحاولة مرة أخرى');
        setIsCreatingReservation(false);
        return;
      }

      console.log('✅ [INVESTMENT] تم إنشاء الحجز! ID:', reservation.id);
      console.log('✅ [INVESTMENT] Path Type المُحفوظ:', reservation.path_type);

      setReservationId(reservation.id);
      setShowReviewScreen(false);
      setShowPaymentPage(true);
      console.log('💳 [INVESTMENT] فتح صفحة الدفع');
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('حدث خطأ غير متوقع');
      setIsCreatingReservation(false);
    }
  };

  const handleGoToAccount = () => {
    onClose();
    if (onGoToAccount) {
      onGoToAccount();
    }
  };

  return (
    <>
    {!showReviewScreen && (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50/95 via-yellow-50/90 to-orange-50/95 z-50 overflow-y-auto">
      <div className={`min-h-screen ${treeCount > 0 ? 'pb-96' : 'pb-32'}`}>
        {/* Header with Back Button */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-amber-200/50">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/80 hover:bg-white shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-[#B8942F]" />
            </button>
            <h1 className="text-lg font-bold text-[#B8942F]">الاستثمار الزراعي</h1>
            <div className="w-9 h-9"></div>
          </div>
        </div>

        {/* Hero Image 3D */}
        <div className="w-full h-48 bg-gradient-to-br from-amber-100 to-yellow-100 relative overflow-hidden">
          {farm.heroImage || farm.image ? (
            <img
              src={farm.heroImage || farm.image}
              alt={farm.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-[#D4AF37]/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Farm Name & Location */}
        <div className="px-4 py-4 bg-white/60 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-[#B8942F] mb-2">{farm.name}</h2>
          {farm.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-2.5 h-2.5 text-[#D4AF37]" />
              <span>{farm.location}</span>
            </div>
          )}
        </div>

        {/* Action Icons Row */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowVideoModal(true)}
              disabled={!farm.video}
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-[#D4AF37]/10 to-[#B8942F]/5 rounded-xl border-2 border-[#D4AF37]/30 hover:border-[#D4AF37]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <Video className="w-3 h-3 text-[#D4AF37]" />
              <span className="text-sm font-bold text-[#B8942F]">عرض فيديو</span>
            </button>

            <button
              onClick={() => setShowInfoModal(true)}
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-[#D4AF37]/10 to-[#B8942F]/5 rounded-xl border-2 border-[#D4AF37]/30 hover:border-[#D4AF37]/50 transition-all active:scale-95"
            >
              <HelpCircle className="w-3 h-3 text-[#D4AF37]" />
              <span className="text-sm font-bold text-[#B8942F]">اعرف الاستثمار</span>
            </button>
          </div>
        </div>

        {/* Influencer Code Input - Always Visible */}
        <div className="mt-3 mx-4">
          <InfluencerCodeInput
            onCodeEntered={handleInfluencerCodeEntered}
            featuredColor={featuredColor}
          />
        </div>

        {/* Featured Package Overlay - Temporary Marketing Element */}
        {showFeaturedPackage && featuredPackageSettings && (
          <div className="mt-3 mx-4">
            <FeaturedPackageOverlay
              settings={featuredPackageSettings}
              onDismiss={handleDismissFeaturedPackage}
            />
          </div>
        )}

        {/* Investment Packages Slider - Scrollable with Page */}
        {packages.length > 0 && (
          <div className="mt-3 bg-gradient-to-br from-amber-50/95 via-yellow-50/90 to-orange-50/95 rounded-2xl border border-amber-200/50 shadow-md py-4 mx-4">
            <div className="px-4 mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#B8942F]">باقات الاستثمار</h3>
              {packages.length > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollToPackage(Math.max(0, currentPackageIndex - 1))}
                    disabled={currentPackageIndex === 0}
                    className="w-8 h-8 rounded-full bg-white/80 border-2 border-amber-200 flex items-center justify-center hover:border-[#D4AF37] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-[#B8942F]" />
                  </button>
                  <button
                    onClick={() => scrollToPackage(Math.min(packages.length - 1, currentPackageIndex + 1))}
                    disabled={currentPackageIndex === packages.length - 1}
                    className="w-8 h-8 rounded-full bg-white/80 border-2 border-amber-200 flex items-center justify-center hover:border-[#D4AF37] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#B8942F]" />
                  </button>
                </div>
              )}
            </div>

            <div
              ref={packagesScrollRef}
              onScroll={handlePackageScroll}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4"
              style={{ scrollPaddingLeft: '1rem' }}
            >
              {packages.map((pkg, index) => {
                const isSelected = selectedPackage?.id === pkg.id;
                const isFeatured = influencerCode && index === 0;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`relative flex-shrink-0 w-[85%] md:w-[48%] lg:w-[45%] xl:w-[30%] snap-center p-4 rounded-xl border-2 transition-all cursor-pointer active:scale-95 ${
                      isFeatured
                        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-400 shadow-xl ring-2 ring-amber-400/50'
                        : isSelected
                        ? 'bg-gradient-to-br from-amber-100/60 to-yellow-100/50 border-[#D4AF37] shadow-lg'
                        : 'bg-white/80 border-amber-200 hover:border-amber-400 hover:shadow-md'
                    }`}
                    style={isFeatured ? {
                      boxShadow: `0 0 30px ${featuredColor}40`
                    } : {}}
                  >
                    {/* Featured Badge */}
                    {isFeatured && (
                      <div
                        className="absolute -top-3 right-1/2 transform translate-x-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse"
                        style={{ backgroundColor: featuredColor }}
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>الباقة المميزة</span>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePackageDetailsClick(pkg);
                      }}
                      className="absolute top-2 left-2 bg-gradient-to-l from-white/95 via-white/90 to-white/80 backdrop-blur-sm border border-amber-300/60 hover:border-[#D4AF37]/80 hover:from-amber-50/95 hover:via-amber-50/90 hover:to-amber-50/80 transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 z-10 rounded-full px-3 py-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="text-[10px] font-semibold text-[#B8942F]/90 tracking-wide">
                        اقرأ عن الباقة
                      </span>
                    </button>

                    {isSelected && !isFeatured && (
                      <div className="absolute top-2 right-2 bg-[#D4AF37] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <span>✓</span>
                        <span>مختارة</span>
                      </div>
                    )}

                    <div className="text-center space-y-2.5 pt-6">
                      <h4 className={`font-bold text-sm ${isFeatured ? 'text-amber-700' : 'text-[#B8942F]'}`}>
                        {pkg.package_name}
                      </h4>

                      <div className={`${isFeatured ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-br from-[#D4AF37] to-[#B8942F]'} text-white rounded-lg py-2 px-3`}>
                        <div className="text-xl font-bold">{pkg.price_per_tree} ر.س</div>
                        <div className="text-[10px] opacity-90">للشجرة الواحدة</div>
                      </div>

                      {isFeatured && featuredPackageSettings && (
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg py-2 px-3 animate-bounce">
                          <div className="flex items-center justify-center gap-2 text-amber-700">
                            <Clock className="w-4 h-4" />
                            <span className="font-bold text-sm">{featuredPackageSettings.highlightText}</span>
                          </div>
                        </div>
                      )}

                      {pkg.motivational_text && (
                        <div className={`text-xs font-semibold rounded-lg py-1.5 px-2 ${
                          isFeatured
                            ? 'text-amber-700 bg-amber-50 border border-amber-200'
                            : 'text-amber-700 bg-amber-50'
                        }`}>
                          {pkg.motivational_text}
                        </div>
                      )}

                      <div className="text-[10px] text-gray-600 pt-1">
                        انقر لاختيار هذه الباقة
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {packages.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {packages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToPackage(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentPackageIndex
                        ? 'w-6 bg-[#D4AF37]'
                        : 'w-1.5 bg-amber-300/50 hover:bg-amber-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tree Slider - احجز أشجارك */}
        <div className="px-4 py-6 mt-4 bg-white rounded-2xl shadow-lg border border-amber-100 mx-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#B8942F] flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                احجز استثمارك
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedPackage ? (
                  <>الحد الأدنى {selectedPackage.min_trees} شجرة، بمضاعفات {selectedPackage.tree_increment}</>
                ) : (
                  'اختر باقة أولاً لرؤية القواعد'
                )}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">متاح الآن</div>
              <div className="text-lg font-bold text-[#D4AF37]">{maxTrees}</div>
              <div className="text-xs text-gray-500">شجرة</div>
            </div>
          </div>

          {selectedPackage ? (
            <>
              {/* Counter Controls */}
              <div className="flex items-center justify-center gap-6 mb-6 py-4 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 rounded-xl">
                <button
                  onClick={() => handleTreeCountChange(-getTreeIncrement())}
                  disabled={treeCount <= getMinTrees()}
                  className="w-14 h-14 rounded-full bg-white border-2 border-[#D4AF37]/40 flex items-center justify-center hover:border-[#D4AF37] hover:bg-amber-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
                >
                  <Minus className="w-6 h-6 text-[#B8942F]" />
                </button>

                <div className="text-center">
                  <div className="text-5xl font-bold text-[#D4AF37] min-w-[120px]">
                    {treeCount}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">شجرة</div>
                </div>

                <button
                  onClick={() => handleTreeCountChange(getTreeIncrement())}
                  disabled={treeCount >= getEffectiveMaxTrees()}
                  className="w-14 h-14 rounded-full bg-white border-2 border-[#D4AF37]/40 flex items-center justify-center hover:border-[#D4AF37] hover:bg-amber-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
                >
                  <Plus className="w-6 h-6 text-[#B8942F]" />
                </button>
              </div>

              {/* Slider */}
              <div className="relative mb-6">
                <input
                  type="range"
                  min={getMinTrees()}
                  max={getEffectiveMaxTrees()}
                  value={treeCount || getMinTrees()}
                  onChange={handleSliderChange}
                  step={getTreeIncrement()}
                  className="w-full h-3 bg-amber-200 rounded-lg appearance-none cursor-pointer slider-thumb-gold"
                  style={{
                    background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${((treeCount - getMinTrees()) / (getEffectiveMaxTrees() - getMinTrees())) * 100}%, #FCD34D ${((treeCount - getMinTrees()) / (getEffectiveMaxTrees() - getMinTrees())) * 100}%, #FCD34D 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{getMinTrees()}</span>
                  <span>{getEffectiveMaxTrees()}</span>
                </div>
              </div>

              {/* Quick Selectors */}
              <div className="space-y-2">
                <p className="text-xs text-gray-600 font-semibold">اختيار سريع:</p>
                <div className="grid grid-cols-4 gap-2">
                  {selectedPackage.quick_select_options
                    .filter(num => num >= getMinTrees() && num <= getEffectiveMaxTrees())
                    .map((num) => (
                      <button
                        key={num}
                        onClick={() => handleQuickSelect(num)}
                        className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 ${
                          treeCount === num
                            ? 'bg-[#D4AF37] text-white border-[#D4AF37] shadow-md'
                            : 'bg-white text-[#B8942F] border-amber-300 hover:bg-amber-50 hover:border-[#D4AF37]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">اختر باقة استثمارية أولاً</p>
            </div>
          )}
        </div>
      </div>

      {/* Investment Summary - Fixed Bottom - Compact Design */}
      {treeCount > 0 && selectedContract && !showReviewScreen && (
          <div
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-white/95 backdrop-blur-xl border-t-2 border-[#D4AF37]/40 shadow-2xl z-[100000]"
            style={{ paddingBottom: 'max(4rem, env(safe-area-inset-bottom))' }}
          >
            <div className="max-w-lg mx-auto px-4 pt-5 pb-4">

              {/* Compact Info Row */}
              <div className="flex items-center justify-between text-xs mb-3 px-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                    <span className="text-gray-600">{treeCount} شجرة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-gray-600">
                      {selectedPackage ? (
                        <>
                          {selectedPackage.base_duration_years} {selectedPackage.base_duration_years === 1 ? 'سنة' : 'سنوات'}
                          {selectedPackage.bonus_free_years > 0 && (
                            <span className="text-green-600 font-bold"> +{selectedPackage.bonus_free_years}</span>
                          )}
                        </>
                      ) : (
                        <>
                          {selectedContract.duration_years} {selectedContract.duration_years === 1 ? 'سنة' : 'سنوات'}
                          {selectedContract.bonus_years > 0 && (
                            <span className="text-green-600 font-bold"> +{selectedContract.bonus_years}</span>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <div className="text-gray-500 font-semibold">خطوة واحدة ✓</div>
              </div>

              {/* Total and Action Button - Prominent */}
              <div className="bg-gradient-to-br from-[#D4AF37] to-[#B8942F] rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between gap-4">
                  {/* Total Section */}
                  <div className="flex-1">
                    <div className="text-amber-100 text-xs mb-1 font-medium">الإجمالي الكلي</div>
                    <div className="text-white text-3xl font-bold tracking-tight">
                      {calculateTotal().toLocaleString()}
                      <span className="text-lg mr-1.5">ر.س</span>
                    </div>
                    <div className="text-amber-100/80 text-[10px] mt-0.5">
                      {selectedPackage?.package_name || selectedContract.contract_name}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleInvestNow}
                    className="px-6 py-4 bg-white text-[#B8942F] font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm">استثمر الآن</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

      {/* Video Modal */}
      {showVideoModal && farm.video && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-[#B8942F]">{farm.videoTitle || 'جولة المزرعة'}</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video">
              <video
                src={farm.video}
                controls
                className="w-full h-full"
                autoPlay
              />
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-[#B8942F]">الاستثمار الزراعي</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h4 className="font-bold text-[#B8942F] mb-2 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-[#D4AF37]" />
                  ما هو الاستثمار الزراعي؟
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {farm.description || 'الاستثمار الزراعي هو شراء أشجار مثمرة والاستفادة من عوائدها السنوية دون الحاجة للإدارة أو الصيانة.'}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-[#B8942F]">المزايا:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37] mt-1">•</span>
                    <span>عوائد سنوية مجزية من {farm.returnRate}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37] mt-1">•</span>
                    <span>لا حاجة للصيانة أو المتابعة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37] mt-1">•</span>
                    <span>استثمار آمن في الزراعة</span>
                  </li>
                  {farm.firstYearMaintenanceFree && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-green-700 font-semibold">السنة الأولى صيانة مجانية</span>
                    </li>
                  )}
                </ul>
              </div>

              {farm.marketingMessage && (
                <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#B8942F]/5 rounded-xl p-4 border-2 border-[#D4AF37]/30">
                  <p className="text-sm text-[#B8942F] font-semibold text-center">
                    {farm.marketingMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Investment Review Screen */}
      {showReviewScreen && selectedContract && (
        <InvestmentReviewScreen
          farmName={farm.name}
          farmLocation={farm.location}
          contractName={selectedPackage?.package_name || selectedContract.contract_name}
          durationYears={selectedContract.duration_years}
          bonusYears={selectedContract.bonus_years}
          treeCount={treeCount}
          totalPrice={calculateTotal()}
          pricePerTree={selectedPackage?.price_per_tree || selectedContract.investor_price}
          onConfirm={handleConfirmReview}
          onBack={() => setShowReviewScreen(false)}
          isLoading={isCreatingReservation}
        />
      )}

      {/* Payment Page */}
      {showPaymentPage && reservationId && (
        <div className="fixed inset-0 z-[60]">
          <PaymentPage
            reservationId={reservationId}
            amount={calculateTotal()}
            onSuccess={() => {
              console.log('✅ [INVESTMENT] تم الدفع بنجاح!');
              setShowPaymentPage(false);
              handleGoToAccount();
            }}
            onBack={() => {
              setShowPaymentPage(false);
              setShowReviewScreen(true);
            }}
          />
        </div>
      )}

      {/* Package Details Modal */}
      {showPackageDetailsModal && selectedPackage && (
        <InvestmentPackageDetailsModal
          package={selectedPackage}
          onClose={() => setShowPackageDetailsModal(false)}
          onSelectPackage={handleSelectPackage}
        />
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .slider-thumb-gold::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D4AF37 0%, #B8942F 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
          border: 3px solid white;
        }
        .slider-thumb-gold::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D4AF37 0%, #B8942F 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
          border: 3px solid white;
        }
      `}</style>
    </>
  );
}
