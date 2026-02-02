import { useState, useEffect, useRef } from 'react';
import { X, Video, HelpCircle, MapPin, Minus, Plus, Sprout, Clock, Gift, ShoppingCart, ArrowLeft, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { FarmProject, FarmContract } from '../services/farmService';
import { agriculturalPackagesService, type AgriculturalPackage } from '../services/agriculturalPackagesService';
import AgriculturalReviewScreen from './AgriculturalReviewScreen';
import PaymentMethodSelector from './PaymentMethodSelector';
import PrePaymentRegistration from './PrePaymentRegistration';
import PaymentSuccessScreen from './PaymentSuccessScreen';
import PackageDetailsModal from './PackageDetailsModal';

interface AgriculturalFarmPageProps {
  farm: FarmProject;
  onClose: () => void;
  onGoToAccount?: () => void;
}

export default function AgriculturalFarmPage({ farm, onClose, onGoToAccount }: AgriculturalFarmPageProps) {
  const { user } = useAuth();
  const [packages, setPackages] = useState<AgriculturalPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<AgriculturalPackage | null>(null);
  const [selectedContract, setSelectedContract] = useState<FarmContract | null>(null);
  const [treeCount, setTreeCount] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPackageDetailsModal, setShowPackageDetailsModal] = useState(false);
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [showPrePaymentRegistration, setShowPrePaymentRegistration] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const [reservationData, setReservationData] = useState<any>(null);
  const [registeredUserName, setRegisteredUserName] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mada' | 'bank_transfer' | null>(null);
  const [currentPackageIndex, setCurrentPackageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const packagesScrollRef = useRef<HTMLDivElement>(null);

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
      } catch (error) {
        console.error('Error loading packages:', error);
      }
    };
    loadPackages();
  }, []);

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
    setSelectedPackage(pkg);
    setShowPackageDetailsModal(true);
  };

  const handleSelectPackage = (pkg: AgriculturalPackage) => {
    setSelectedPackage(pkg);
    const contract = farm.contracts?.find(c => c.id === pkg.contract_id);
    if (contract) {
      setSelectedContract(contract);
    }
    setShowPackageDetailsModal(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
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
    setShowReviewScreen(true);
  };

  const handleConfirmReview = () => {
    setShowReviewScreen(false);

    if (user) {
      setShowPaymentSelector(true);
    } else {
      setShowPrePaymentRegistration(true);
    }
  };

  const handleRegistrationSuccess = (userId: string, userName: string) => {
    setRegisteredUserName(userName);
    setShowPrePaymentRegistration(false);
    setShowPaymentSelector(true);
  };

  const handlePaymentMethodSelected = async (method: 'mada' | 'bank_transfer') => {
    if (!selectedContract || treeCount === 0) {
      return;
    }

    setSelectedPaymentMethod(method);
    setIsCreatingReservation(true);

    try {
      if (!user) {
        alert('الرجاء تسجيل الدخول أولاً');
        setIsCreatingReservation(false);
        return;
      }

      const totalPrice = calculateTotal();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          farm_id: farm.id,
          farm_name: farm.name,
          contract_id: selectedContract.id,
          contract_name: selectedContract.contract_name,
          duration_years: selectedContract.duration_years,
          bonus_years: selectedContract.bonus_years,
          total_trees: treeCount,
          total_price: totalPrice,
          status: 'pending',
          payment_method: method
        } as any)
        .select()
        .single() as any;

      if (reservationError) {
        console.error('Reservation error:', reservationError);
        alert('حدث خطأ في إنشاء الحجز. يرجى المحاولة مرة أخرى');
        setIsCreatingReservation(false);
        return;
      }

      setReservationData({
        id: reservation.id,
        farmName: farm.name,
        contractName: selectedContract.contract_name,
        treeCount,
        durationYears: selectedContract.duration_years,
        bonusYears: selectedContract.bonus_years,
        totalPrice,
        investmentNumber: reservation.id.substring(0, 8).toUpperCase(),
        createdAt: reservation.created_at
      });

      setIsCreatingReservation(false);
      handlePaymentSuccess();
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('حدث خطأ غير متوقع');
      setIsCreatingReservation(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentSelector(false);
    setShowPaymentSuccess(true);
  };

  const handleGoToAccount = () => {
    onClose();
    if (onGoToAccount) {
      onGoToAccount();
    }
  };

  return (
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
          <h1 className="text-lg font-bold text-darkgreen">محصولي الزراعي</h1>
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

        {/* Action Icons Row */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowVideoModal(true)}
              disabled={!farm.video}
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-green-100/50 to-emerald-100/50 rounded-xl border-2 border-darkgreen/30 hover:border-darkgreen/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <Video className="w-3 h-3 text-darkgreen" />
              <span className="text-sm font-bold text-darkgreen">عرض فيديو</span>
            </button>

            <button
              onClick={() => setShowInfoModal(true)}
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-green-100/50 to-emerald-100/50 rounded-xl border-2 border-darkgreen/30 hover:border-darkgreen/50 transition-all active:scale-95"
            >
              <HelpCircle className="w-3 h-3 text-darkgreen" />
              <span className="text-sm font-bold text-darkgreen">اعرف المزرعة</span>
            </button>
          </div>
        </div>

        {/* Agricultural Packages Slider */}
        <div className="mt-3 bg-gradient-to-br from-green-50/95 via-emerald-50/90 to-teal-50/95 rounded-2xl border border-green-200/50 shadow-md py-4 mx-4">
          <div className="px-4 mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-darkgreen">باقات محصولي الزراعي</h3>
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

          {/* Packages Slider */}
          <div
            ref={packagesScrollRef}
            onScroll={handlePackageScroll}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4"
            style={{ scrollPaddingLeft: '1rem' }}
          >
            {packages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => handleSelectPackage(pkg)}
                  className={`relative flex-shrink-0 w-[85%] snap-center p-4 rounded-xl border-2 transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-br from-green-100/60 to-emerald-100/50 border-darkgreen shadow-lg'
                      : 'bg-white/80 border-green-200 hover:border-green-400 hover:shadow-md'
                  }`}
                >
                  {/* Info Button - Top Right Corner */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePackageDetailsClick(pkg);
                    }}
                    className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border-2 border-green-200 hover:border-darkgreen hover:bg-green-50 transition-all flex items-center justify-center shadow-sm active:scale-90 z-10"
                    aria-label="اقرأ المزيد عن الباقة"
                  >
                    <HelpCircle className="w-4 h-4 text-darkgreen" />
                  </button>

                  {/* Selected Badge - Top Left Corner */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-darkgreen text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <span>✓</span>
                      <span>مختارة</span>
                    </div>
                  )}

                  <div className="text-center space-y-2.5 pt-6">
                    <h4 className="font-bold text-darkgreen text-sm">{pkg.package_name}</h4>

                    <div className="bg-green-600 text-white rounded-lg py-2 px-3">
                      <div className="text-xl font-bold">{pkg.price_per_tree} ر.س</div>
                      <div className="text-[10px] opacity-90">للشجرة الواحدة</div>
                    </div>

                    {pkg.motivational_text && (
                      <div className="text-xs text-green-700 font-semibold bg-green-50 rounded-lg py-1.5 px-2">
                        {pkg.motivational_text}
                      </div>
                    )}

                    {/* Selection Indicator */}
                    <div className={`text-xs font-medium transition-all ${
                      isSelected ? 'text-darkgreen' : 'text-gray-400'
                    }`}>
                      {isSelected ? '← الباقة المختارة' : 'اضغط للاختيار'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          {packages.length > 1 && (
            <div className="flex justify-center gap-2 mt-3">
              {packages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToPackage(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentPackageIndex
                      ? 'w-6 bg-darkgreen'
                      : 'w-2 bg-green-300 hover:bg-green-400'
                  }`}
                  aria-label={`الانتقال للباقة ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tree Slider - احجز أشجارك */}
        <div className="px-4 py-6 mt-4 bg-white rounded-2xl shadow-lg border border-green-100 mx-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-darkgreen flex items-center gap-2">
                <Sprout className="w-5 h-5" />
                احجز أشجارك
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">اختر عدد الأشجار التي تريد حجزها</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">متاح الآن</div>
              <div className="text-lg font-bold text-darkgreen">{maxTrees}</div>
              <div className="text-xs text-gray-500">شجرة</div>
            </div>
          </div>

          {/* Counter Controls */}
          <div className="flex items-center justify-center gap-6 mb-6 py-4 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-xl">
            <button
              onClick={() => handleTreeCountChange(-1)}
              disabled={treeCount === 0}
              className="w-14 h-14 rounded-full bg-white border-2 border-darkgreen/40 flex items-center justify-center hover:border-darkgreen hover:bg-green-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
            >
              <Minus className="w-6 h-6 text-darkgreen" />
            </button>

            <div className="text-center">
              <div className="text-5xl font-bold text-darkgreen min-w-[120px]">
                {treeCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">شجرة</div>
            </div>

            <button
              onClick={() => handleTreeCountChange(1)}
              disabled={treeCount >= maxTrees}
              className="w-14 h-14 rounded-full bg-white border-2 border-darkgreen/40 flex items-center justify-center hover:border-darkgreen hover:bg-green-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
            >
              <Plus className="w-6 h-6 text-darkgreen" />
            </button>
          </div>

          {/* Slider */}
          <div className="relative mb-6">
            <input
              type="range"
              min="0"
              max={maxTrees}
              value={treeCount}
              onChange={handleSliderChange}
              className="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer slider-thumb-green"
              style={{
                background: `linear-gradient(to right, #3AA17E 0%, #3AA17E ${(treeCount / maxTrees) * 100}%, #86EFAC ${(treeCount / maxTrees) * 100}%, #86EFAC 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0</span>
              <span>{maxTrees}</span>
            </div>
          </div>

          {/* Quick Selectors */}
          <div className="space-y-2">
            <p className="text-xs text-gray-600 font-semibold">اختيار سريع:</p>
            <div className="flex gap-2">
              {[10, 25, 50, 100].filter(num => num <= maxTrees).map((num) => (
                <button
                  key={num}
                  onClick={() => setTreeCount(num)}
                  className={`flex-1 py-3 px-3 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 ${
                    treeCount === num
                      ? 'bg-darkgreen text-white border-darkgreen shadow-md'
                      : 'bg-white text-darkgreen border-green-300 hover:bg-green-50 hover:border-darkgreen'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        </div>
      </div>

      {/* Purchase Summary - Fixed Bottom - Compact Design */}
      {treeCount > 0 && selectedContract && !showReviewScreen && !showPrePaymentRegistration && !showPaymentSelector && !showPaymentSuccess && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-white/95 backdrop-blur-xl border-t-2 border-darkgreen/40 shadow-2xl z-[100000]"
          style={{ paddingBottom: 'max(4rem, env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-lg mx-auto px-4 pt-5 pb-4">
            {/* Compact Info Row */}
            <div className="flex items-center justify-between text-xs mb-3 px-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-darkgreen"></div>
                  <span className="text-gray-600">{treeCount} شجرة</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">
                    {selectedContract.duration_years} سنوات
                    {selectedContract.bonus_years > 0 && (
                      <span className="text-green-600 font-bold"> +{selectedContract.bonus_years}</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="text-gray-500 font-semibold">خطوة واحدة ✓</div>
            </div>

            {/* Total and Action Button - Prominent */}
            <div className="bg-gradient-to-br from-darkgreen to-emerald-700 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                {/* Total Section */}
                <div className="flex-1">
                  <div className="text-green-100 text-xs mb-1 font-medium">الإجمالي الكلي</div>
                  <div className="text-white text-3xl font-bold tracking-tight">
                    {calculateTotal().toLocaleString()}
                    <span className="text-lg mr-1.5">ر.س</span>
                  </div>
                  <div className="text-green-100/80 text-[10px] mt-0.5">
                    {selectedPackage?.package_name}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleBuyNow}
                  disabled={isCreatingReservation}
                  className="px-6 py-4 bg-white text-darkgreen font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isCreatingReservation ? (
                    <>
                      <div className="w-5 h-5 border-2 border-darkgreen border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">جاري...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span className="text-sm">احجز الآن</span>
                    </>
                  )}
                </button>
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
                  ما هو محصولي الزراعي؟
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

      {/* Review Screen */}
      {showReviewScreen && selectedContract && (
        <AgriculturalReviewScreen
          farmName={farm.name}
          farmLocation={farm.location}
          contractName={selectedPackage?.package_name || selectedContract.contract_name}
          durationYears={selectedContract.duration_years}
          bonusYears={selectedContract.bonus_years}
          treeCount={treeCount}
          totalPrice={calculateTotal()}
          pricePerTree={selectedPackage?.price_per_tree || selectedContract.farmer_price || selectedContract.investor_price || 0}
          onConfirm={handleConfirmReview}
          onBack={() => setShowReviewScreen(false)}
        />
      )}

      {/* Pre-Payment Registration */}
      {showPrePaymentRegistration && (
        <PrePaymentRegistration
          farmName={farm.name}
          treeCount={treeCount}
          onSuccess={handleRegistrationSuccess}
          onBack={() => setShowPrePaymentRegistration(false)}
        />
      )}

      {/* Payment Method Selector */}
      {showPaymentSelector && (
        <PaymentMethodSelector
          totalAmount={calculateTotal()}
          onSelectMethod={handlePaymentMethodSelected}
          onBack={() => {
            setShowPaymentSelector(false);
            setShowPrePaymentRegistration(true);
          }}
          isLoading={isCreatingReservation}
        />
      )}

      {/* Payment Success Screen */}
      {showPaymentSuccess && reservationData && (
        <PaymentSuccessScreen
          reservationId={reservationData.id}
          farmName={reservationData.farmName}
          treeCount={reservationData.treeCount}
          durationYears={reservationData.durationYears}
          bonusYears={reservationData.bonusYears}
          totalPrice={reservationData.totalPrice}
          investmentNumber={reservationData.investmentNumber}
          onGoToAccount={handleGoToAccount}
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
