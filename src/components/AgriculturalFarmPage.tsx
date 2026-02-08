import { useState, useEffect, useRef } from 'react';
import { X, Video, HelpCircle, MapPin, Minus, Plus, Sprout, Clock, Gift, ShoppingCart, ArrowLeft, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { FarmProject, FarmContract } from '../services/farmService';
import { agriculturalPackagesService, type AgriculturalPackage } from '../services/agriculturalPackagesService';
import PackageDetailsModal from './PackageDetailsModal';
import UnifiedBookingFlow from './UnifiedBookingFlow';
import { usePageTracking } from '../hooks/useLeadTracking';
import InfluencerCodeInput from './InfluencerCodeInput';
import FeaturedPackageOverlay from './FeaturedPackageOverlay';
import { influencerMarketingService, type FeaturedPackageSettings } from '../services/influencerMarketingService';

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
  const [packages, setPackages] = useState<AgriculturalPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<AgriculturalPackage | null>(null);
  const [selectedContract, setSelectedContract] = useState<FarmContract | null>(null);
  const [treeCount, setTreeCount] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPackageDetailsModal, setShowPackageDetailsModal] = useState(false);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [currentPackageIndex, setCurrentPackageIndex] = useState(0);
  const [isLoadingContract, setIsLoadingContract] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const packagesScrollRef = useRef<HTMLDivElement>(null);
  const [influencerCode, setInfluencerCode] = useState<string | null>(null);
  const [featuredColor] = useState('#FFD700');
  const [showFeaturedPackage, setShowFeaturedPackage] = useState(false);
  const [featuredPackageSettings, setFeaturedPackageSettings] = useState<FeaturedPackageSettings | null>(null);

  useEffect(() => {
    console.log('🏢 عقود المزرعة المُحمّلة:', farm.contracts?.map(c => ({
      name: c.contract_name,
      duration: c.duration_years,
      bonus: c.bonus_years,
      id: c.id
    })));

    if (farm.contracts && farm.contracts.length > 0) {
      const firstContract = farm.contracts[0];
      setSelectedContract(firstContract);
      console.log('📋 تم تعيين العقد الافتراضي:', firstContract.contract_name, firstContract.duration_years, 'سنوات');
    }
  }, [farm.contracts]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const pkgs = await agriculturalPackagesService.getActivePackages();
        console.log('📦 تم تحميل الباقات:', pkgs.map(p => ({
          name: p.package_name,
          contract_id: p.contract_id,
          price: p.price_per_tree
        })));
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
    const newCount = Math.max(0, Math.min(maxTrees, treeCount + delta));
    setTreeCount(newCount);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTreeCount(parseInt(e.target.value));
  };

  const handlePackageDetailsClick = (pkg: AgriculturalPackage) => {
    console.log('📦 [Agricultural Farm] Package details clicked:', pkg.package_name);
    leadService.trackPackageView(pkg.id, pkg.package_name);
    setSelectedPackage(pkg);
    setShowPackageDetailsModal(true);
  };

  const handleSelectPackage = async (pkg: AgriculturalPackage) => {
    console.log('🎯 تم اختيار الباقة:', pkg.package_name, '- contract_id:', pkg.contract_id);
    leadService.trackReservationStart(farm.id, pkg.min_trees);

    setIsLoadingContract(true);
    setSelectedPackage(pkg);

    try {
      const { data: contract, error } = await supabase
        .from('farm_contracts')
        .select('*')
        .eq('id', pkg.contract_id)
        .maybeSingle();

      if (contract && !error) {
        console.log('✅ تم تحميل العقد من قاعدة البيانات:', {
          name: contract.contract_name,
          duration: contract.duration_years,
          bonus: contract.bonus_years,
          id: contract.id
        });

        setTimeout(() => {
          setSelectedContract(contract);
          setIsLoadingContract(false);
          console.log('🔄 تم تحديث selectedContract في الـ state');
        }, 0);
      } else {
        console.error('❌ خطأ في تحميل العقد:', error);
        console.log('⚠️ البحث عن العقد في farm.contracts...');
        const fallbackContract = farm.contracts?.find(c => c.id === pkg.contract_id);
        if (fallbackContract) {
          console.log('✅ تم العثور على العقد في farm.contracts:', fallbackContract);
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

  const handleBuyNow = () => {
    if ((!selectedContract && !selectedPackage) || treeCount === 0) {
      alert('يرجى اختيار باقة وعدد الأشجار');
      return;
    }
    console.log('🚀 [AGRICULTURAL] بدء تدفق الحجز الموحد...');
    setShowBookingFlow(true);
  };


  const handleGoToAccount = () => {
    onClose();
    if (onGoToAccount) {
      onGoToAccount();
    }
  };

  return (
    <>
      {!showBookingFlow && (
      <>
      {/* Header - Fixed to viewport */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-white/80 backdrop-blur-lg border-b border-green-200/50">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/80 hover:bg-white shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-darkgreen" />
          </button>
          <h1 className="text-lg font-bold text-darkgreen">أشجاري الخضراء</h1>
          <div className="w-9 h-9"></div>
        </div>
      </div>

      {/* Main Content */}
      <div
        ref={scrollContainerRef}
        className="fixed inset-0 bg-gradient-to-br from-green-50/95 via-emerald-50/90 to-teal-50/95 z-50 overflow-y-auto pt-[73px]"
      >
        <div className={`min-h-screen ${treeCount > 0 ? 'pb-[32rem]' : 'pb-32'}`}>
          {/* Hero Image 3D */}
        <div className="w-full h-48 bg-gradient-to-br from-green-100 to-emerald-100 relative overflow-hidden">
          {farm.heroImage || farm.image ? (
            <img
              src={farm.heroImage || farm.image}
              alt={farm.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sprout className="w-10 h-10 text-darkgreen/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Farm Name & Location */}
        <div className="px-4 py-4 bg-white/60 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-darkgreen mb-2">{farm.name}</h2>
          {farm.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-2.5 h-2.5 text-darkgreen" />
              <span>{farm.location}</span>
            </div>
          )}
        </div>

        {/* Action Icons Row - Enhanced 3D Design */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowVideoModal(true)}
              disabled={!farm.video}
              className="group relative flex items-center justify-center gap-2 p-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Video className="w-5 h-5 text-white relative z-10" />
              <span className="text-sm font-bold text-white relative z-10">عرض فيديو</span>
              <div className="absolute -top-1 -right-1 w-16 h-16 bg-white/10 rounded-full blur-2xl"></div>
            </button>

            <button
              onClick={() => setShowInfoModal(true)}
              className="group relative flex items-center justify-center gap-2 p-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <HelpCircle className="w-5 h-5 text-white relative z-10" />
              <span className="text-sm font-bold text-white relative z-10">اعرف المزرعة</span>
              <div className="absolute -bottom-1 -left-1 w-16 h-16 bg-white/10 rounded-full blur-2xl"></div>
            </button>
          </div>
        </div>

        {/* Influencer Code Input - Enhanced Design */}
        <div className="mt-4 mx-4">
          <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border-2 border-amber-300 shadow-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tl from-orange-400/20 to-transparent rounded-full -ml-12 -mb-12"></div>
            <InfluencerCodeInput
              onCodeEntered={handleInfluencerCodeEntered}
              featuredColor={featuredColor}
            />
          </div>
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

        {/* Agricultural Packages Slider - Premium 3D Design */}
        <div className="mt-6 mx-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border-2 border-green-200/80 shadow-2xl py-6 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-green-400/10 to-transparent rounded-full -ml-32 -mt-32"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-emerald-400/10 to-transparent rounded-full -mr-24 -mb-24"></div>

            <div className="px-4 mb-4 flex items-center justify-between relative z-10">
              <div>
                <h3 className="text-lg font-bold text-darkgreen mb-1">باقات أشجاري الخضراء</h3>
                <p className="text-xs text-gray-600">اختر الباقة المناسبة لك</p>
              </div>
            {packages.length > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={() => scrollToPackage(Math.max(0, currentPackageIndex - 1))}
                  disabled={currentPackageIndex === 0}
                  className="w-8 h-8 rounded-full bg-white/80 border-2 border-green-200 flex items-center justify-center hover:border-darkgreen transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-darkgreen" />
                </button>
                <button
                  onClick={() => scrollToPackage(Math.min(packages.length - 1, currentPackageIndex + 1))}
                  disabled={currentPackageIndex === packages.length - 1}
                  className="w-8 h-8 rounded-full bg-white/80 border-2 border-green-200 flex items-center justify-center hover:border-darkgreen transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-darkgreen" />
                </button>
              </div>
            )}
          </div>

          {/* Packages Slider - Enhanced 3D Cards */}
          <div
            ref={packagesScrollRef}
            onScroll={handlePackageScroll}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 relative z-10"
            style={{ scrollPaddingLeft: '1rem' }}
          >
            {packages.map((pkg, index) => {
              const isSelected = selectedPackage?.id === pkg.id;
              const isFeatured = influencerCode && index === 0;
              return (
                <div
                  key={pkg.id}
                  onClick={() => handleSelectPackage(pkg)}
                  className={`group relative flex-shrink-0 w-[85%] md:w-[48%] lg:w-[45%] xl:w-[30%] snap-center rounded-2xl transition-all duration-300 cursor-pointer ${
                    isFeatured
                      ? 'hover:scale-[1.02]'
                      : 'hover:scale-[1.03]'
                  }`}
                  style={isFeatured ? {
                    filter: `drop-shadow(0 0 20px ${featuredColor}60)`
                  } : {}}
                >
                  {/* Inner Card with 3D Effect */}
                  <div className={`relative h-full p-5 rounded-2xl border-3 transition-all duration-300 ${
                    isFeatured
                      ? 'bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 border-amber-500 shadow-2xl'
                      : isSelected
                      ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 border-green-600 shadow-2xl'
                      : 'bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 border-green-300 shadow-lg group-hover:shadow-2xl group-hover:border-green-500'
                  }`}
                  >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                    {/* Info Button - Enhanced */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePackageDetailsClick(pkg);
                      }}
                      className={`absolute top-3 left-3 backdrop-blur-md border-2 transition-all flex items-center gap-1.5 shadow-lg hover:shadow-2xl active:scale-90 z-20 rounded-full px-3 py-2 ${
                        isFeatured || isSelected
                          ? 'bg-white/90 border-white/50 hover:bg-white text-darkgreen'
                          : 'bg-white/80 border-green-200 hover:bg-white hover:border-green-400 text-darkgreen'
                      }`}
                      aria-label="اقرأ المزيد عن الباقة"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span className="text-xs font-bold">
                        التفاصيل
                      </span>
                    </button>

                    {/* Featured Badge - Glowing */}
                    {isFeatured && (
                      <div className="absolute -top-4 right-1/2 transform translate-x-1/2 z-30">
                        <div className="relative">
                          <div className="absolute inset-0 bg-white blur-md animate-pulse"></div>
                          <div className="relative bg-white text-amber-700 text-xs font-black px-5 py-2 rounded-full flex items-center gap-2 shadow-2xl border-2 border-amber-300">
                            <Gift className="w-4 h-4 animate-bounce" />
                            <span>الباقة المميزة</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Selected Badge - Enhanced */}
                    {isSelected && !isFeatured && (
                      <div className="absolute top-3 right-3 bg-white text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border-2 border-white/50 z-20">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[10px]">✓</span>
                        </div>
                        <span>محددة</span>
                      </div>
                    )}

                    {/* Card Content - Enhanced */}
                    <div className="text-center space-y-3 pt-8 relative z-10">
                      {/* Package Name */}
                      <h4 className={`font-black text-base tracking-tight ${
                        isFeatured
                          ? 'text-white drop-shadow-md'
                          : isSelected
                          ? 'text-white drop-shadow-md'
                          : 'text-darkgreen'
                      }`}>
                        {pkg.package_name}
                      </h4>

                      {/* Price Badge - Premium Design */}
                      <div className="relative inline-block">
                        <div className={`absolute inset-0 blur-xl ${
                          isFeatured
                            ? 'bg-white/50'
                            : isSelected
                            ? 'bg-white/40'
                            : 'bg-green-500/30'
                        }`}></div>
                        <div className={`relative ${
                          isFeatured
                            ? 'bg-white border-2 border-white/50'
                            : isSelected
                            ? 'bg-white border-2 border-white/50'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-green-500'
                        } rounded-2xl py-3 px-5 shadow-2xl`}>
                          <div className={`text-2xl font-black ${
                            isFeatured || isSelected ? 'text-green-700' : 'text-white'
                          }`}>
                            {pkg.price_per_tree}
                            <span className="text-base mr-1">ر.س</span>
                          </div>
                          <div className={`text-[11px] font-bold ${
                            isFeatured || isSelected ? 'text-green-600' : 'text-white/90'
                          }`}>
                            للشجرة الواحدة
                          </div>
                        </div>
                      </div>

                      {/* Featured Highlight */}
                      {isFeatured && featuredPackageSettings && (
                        <div className="relative">
                          <div className="absolute inset-0 bg-white/30 blur-lg animate-pulse"></div>
                          <div className="relative bg-white rounded-2xl py-3 px-4 border-2 border-white/50 shadow-xl">
                            <div className="flex items-center justify-center gap-2 text-amber-700">
                              <Clock className="w-5 h-5 animate-pulse" />
                              <span className="font-black text-sm">{featuredPackageSettings.highlightText}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Motivational Text */}
                      {pkg.motivational_text && (
                        <div className={`text-xs font-bold rounded-xl py-2 px-3 shadow-md ${
                          isFeatured
                            ? 'text-white bg-white/20 border border-white/30'
                            : isSelected
                            ? 'text-white bg-white/20 border border-white/30'
                            : 'text-green-700 bg-white/80 border border-green-200'
                        }`}>
                          {pkg.motivational_text}
                        </div>
                      )}

                      {/* Selection Indicator - Enhanced */}
                      <div className={`text-sm font-black transition-all pt-2 ${
                        isSelected
                          ? isFeatured
                            ? 'text-white'
                            : 'text-white'
                          : 'text-gray-500 group-hover:text-green-600'
                      }`}>
                        {isSelected ? '✓ محددة الآن' : 'اضغط للتحديد'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator - Enhanced */}
          {packages.length > 1 && (
            <div className="flex justify-center gap-2 mt-5 relative z-10">
              {packages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToPackage(index)}
                  className={`h-2.5 rounded-full transition-all shadow-md ${
                    index === currentPackageIndex
                      ? 'w-8 bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg'
                      : 'w-2.5 bg-green-300 hover:bg-green-500 hover:w-4'
                  }`}
                  aria-label={`الانتقال للباقة ${index + 1}`}
                />
              ))}
            </div>
          )}
          </div>
        </div>

        {/* Tree Counter - Premium 3D Design */}
        <div className="mt-6 mx-4">
          <div className="bg-gradient-to-br from-white via-green-50/20 to-emerald-50/20 rounded-3xl shadow-2xl border-2 border-green-200/80 p-6 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-green-400/10 to-transparent rounded-full -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tl from-emerald-400/10 to-transparent rounded-full -ml-20 -mb-20"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h3 className="text-xl font-black text-darkgreen flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sprout className="w-5 h-5 text-white" />
                  </div>
                  احجز أشجارك
                </h3>
                <p className="text-sm text-gray-600 mt-1.5 mr-12">حدد عدد الأشجار المطلوبة</p>
              </div>
              <div className="text-center bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl px-4 py-3 shadow-xl">
                <div className="text-xs text-white/90 font-bold mb-0.5">متوفر</div>
                <div className="text-2xl font-black text-white">{maxTrees}</div>
                <div className="text-xs text-white/90 font-bold">شجرة</div>
              </div>
            </div>

            {/* Counter Controls - Premium 3D */}
            <div className="flex items-center justify-center gap-8 mb-6 py-6 bg-gradient-to-br from-green-50/60 to-emerald-50/60 rounded-2xl relative z-10 border-2 border-green-100/50">
              <button
                onClick={() => handleTreeCountChange(-1)}
                disabled={treeCount === 0}
                className="group relative w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-green-50 border-3 border-green-300 flex items-center justify-center hover:from-green-500 hover:to-emerald-600 hover:border-green-600 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 shadow-xl hover:shadow-2xl disabled:hover:from-white disabled:hover:to-green-50"
              >
                <Minus className="w-7 h-7 text-darkgreen group-hover:text-white transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
              </button>

              <div className="text-center px-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full"></div>
                  <div className="relative text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-emerald-700 min-w-[140px] drop-shadow-lg">
                    {treeCount}
                  </div>
                </div>
                <div className="text-base font-bold text-gray-700 mt-2">شجرة</div>
              </div>

              <button
                onClick={() => handleTreeCountChange(1)}
                disabled={treeCount >= maxTrees}
                className="group relative w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-green-50 border-3 border-green-300 flex items-center justify-center hover:from-green-500 hover:to-emerald-600 hover:border-green-600 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 shadow-xl hover:shadow-2xl disabled:hover:from-white disabled:hover:to-green-50"
              >
                <Plus className="w-7 h-7 text-darkgreen group-hover:text-white transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
              </button>
            </div>

            {/* Slider - Enhanced */}
            <div className="relative mb-8 px-2 relative z-10">
              <input
                type="range"
                min="0"
                max={maxTrees}
                value={treeCount}
                onChange={handleSliderChange}
                className="w-full h-4 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full appearance-none cursor-pointer slider-thumb-green shadow-inner"
                style={{
                  background: `linear-gradient(to right, #10B981 0%, #059669 ${(treeCount / maxTrees) * 100}%, #D1FAE5 ${(treeCount / maxTrees) * 100}%, #F0FDF4 100%)`
                }}
              />
              <div className="flex justify-between text-sm font-bold text-gray-600 mt-3 px-1">
                <span className="bg-white px-3 py-1 rounded-lg shadow-sm border border-green-200">0</span>
                <span className="bg-white px-3 py-1 rounded-lg shadow-sm border border-green-200">{maxTrees}</span>
              </div>
            </div>

            {/* Quick Selectors - Premium Cards */}
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent to-green-200"></div>
                <p className="text-sm text-gray-700 font-bold px-3">اختيار سريع</p>
                <div className="flex-1 h-0.5 bg-gradient-to-l from-transparent to-green-200"></div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[10, 25, 50, 100].filter(num => num <= maxTrees).map((num) => (
                  <button
                    key={num}
                    onClick={() => setTreeCount(num)}
                    className={`group relative py-4 px-2 rounded-2xl border-2 text-sm font-black transition-all duration-300 active:scale-90 overflow-hidden ${
                      treeCount === num
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-600 shadow-2xl scale-105'
                        : 'bg-white text-darkgreen border-green-300 hover:bg-green-50 hover:border-green-500 shadow-md hover:shadow-xl'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                    <span className="relative z-10">{num}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        </div>
      </div>
      </>
      )}

      {/* Checkout Bar - Premium 3D Floating Design */}
      {treeCount > 0 && selectedContract && !showBookingFlow && (() => {
        console.log('📊 عرض الشريط السفلي - العقد المختار:', {
          name: selectedContract.contract_name,
          duration: selectedContract.duration_years,
          bonus: selectedContract.bonus_years
        });
        return true;
      })() && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[100000] animate-in slide-in-from-bottom duration-500"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Backdrop Blur Layer */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent backdrop-blur-xl"></div>

          <div className="max-w-lg mx-auto px-4 pb-4 relative">
            {/* Info Badges - Floating Above */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="bg-white/95 backdrop-blur-md rounded-full px-4 py-2 shadow-2xl border-2 border-green-200 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse"></div>
                <span className="text-sm font-bold text-darkgreen">{treeCount} شجرة</span>
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-full px-4 py-2 shadow-2xl border-2 border-green-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-darkgreen" />
                <span className="text-sm font-bold text-darkgreen">
                  {selectedContract.duration_years} {selectedContract.duration_years === 1 ? 'سنة' : 'سنوات'}
                  {selectedContract.bonus_years > 0 && (
                    <span className="text-green-600"> +{selectedContract.bonus_years}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Main Checkout Card - 3D Floating */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 blur-2xl opacity-60 rounded-3xl"></div>

              {/* Card Content */}
              <div className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-5 shadow-2xl border-2 border-white/20 overflow-hidden">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>

                <div className="flex items-center justify-between gap-4 relative z-10">
                  {/* Total Section */}
                  <div className="flex-1">
                    <div className="text-white/80 text-xs mb-1.5 font-bold">المبلغ الإجمالي</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-white text-4xl font-black tracking-tight drop-shadow-lg">
                        {calculateTotal().toLocaleString()}
                      </div>
                      <div className="text-white/90 text-xl font-bold">ر.س</div>
                    </div>
                    {selectedPackage && (
                      <div className="text-white/70 text-xs mt-1.5 font-bold bg-white/10 rounded-full px-3 py-1 inline-block">
                        {selectedPackage.package_name}
                      </div>
                    )}
                  </div>

                  {/* Action Button - Pulsing */}
                  <button
                    onClick={handleBuyNow}
                    className="group relative px-7 py-5 bg-white rounded-2xl shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300 active:scale-95 overflow-hidden"
                  >
                    {/* Button Glow on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/20 to-green-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    <div className="relative flex items-center gap-2.5">
                      <ShoppingCart className="w-6 h-6 text-green-600 group-hover:animate-bounce" />
                      <div className="text-right">
                        <div className="text-sm font-black text-darkgreen leading-tight">احجز الآن</div>
                        <div className="text-[10px] font-bold text-green-600">خطوة واحدة ✓</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Video Modal */}
      {showVideoModal && farm.video && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-darkgreen">{farm.videoTitle || 'جولة المزرعة'}</h3>
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
              <h3 className="font-bold text-darkgreen">الملكية الزراعية</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-bold text-darkgreen mb-2 flex items-center gap-2">
                  <Sprout className="w-3 h-3 text-darkgreen" />
                  ما هي أشجاري الخضراء؟
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {farm.description || 'امتلك أشجارك الخاصة في مزرعة حقيقية واستفد من محاصيلها السنوية. نحن نهتم بالزراعة والصيانة، وأنت تتمتع بثمار أشجارك.'}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-darkgreen">المزايا:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-darkgreen mt-1">•</span>
                    <span>ملكية حقيقية لأشجارك في مزرعة معتمدة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-darkgreen mt-1">•</span>
                    <span>نحن نهتم بالزراعة والصيانة نيابة عنك</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-darkgreen mt-1">•</span>
                    <span>استلم محصولك السنوي مباشرة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-darkgreen mt-1">•</span>
                    <span>تابع نمو أشجارك عبر التطبيق</span>
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
                <div className="bg-gradient-to-br from-green-100/60 to-emerald-100/50 rounded-xl p-4 border-2 border-darkgreen/30">
                  <p className="text-sm text-darkgreen font-semibold text-center">
                    {farm.marketingMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unified Booking Flow - Review → Registration → Payment */}
      {showBookingFlow && selectedContract && (
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
          bonusYears={selectedPackage?.bonus_years || selectedContract.bonus_years}
          totalPrice={calculateTotal()}
          pricePerTree={selectedPackage?.price_per_tree || selectedContract.farmer_price || selectedContract.investor_price || 0}
          influencerCode={influencerCode}
          onBack={() => {
            console.log('🔙 [AGRICULTURAL] العودة من تدفق الحجز');
            setShowBookingFlow(false);
          }}
          onComplete={() => {
            console.log('✅ [AGRICULTURAL] اكتمل تدفق الحجز بنجاح!');
            setShowBookingFlow(false);
            handleGoToAccount();
          }}
        />
      )}

      {/* Package Details Modal */}
      {showPackageDetailsModal && selectedPackage && (
        <PackageDetailsModal
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
        .slider-thumb-green::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3AA17E 0%, #2F8266 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(58, 161, 126, 0.4);
          border: 3px solid white;
        }
        .slider-thumb-green::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3AA17E 0%, #2F8266 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(58, 161, 126, 0.4);
          border: 3px solid white;
        }
      `}</style>
    </>
  );
}
