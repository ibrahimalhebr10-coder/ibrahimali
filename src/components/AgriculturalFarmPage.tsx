import { useState, useEffect } from 'react';
import { X, Video, HelpCircle, MapPin, Minus, Plus, Sprout, Clock, Gift, ShoppingCart, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { FarmProject, FarmContract } from '../services/farmService';
import AgriculturalReviewScreen from './AgriculturalReviewScreen';
import PaymentMethodSelector from './PaymentMethodSelector';
import PrePaymentRegistration from './PrePaymentRegistration';
import PaymentSuccessScreen from './PaymentSuccessScreen';

interface AgriculturalFarmPageProps {
  farm: FarmProject;
  onClose: () => void;
  onGoToAccount?: () => void;
}

export default function AgriculturalFarmPage({ farm, onClose, onGoToAccount }: AgriculturalFarmPageProps) {
  const { user } = useAuth();
  const [selectedContract, setSelectedContract] = useState<FarmContract | null>(null);
  const [treeCount, setTreeCount] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [showPrePaymentRegistration, setShowPrePaymentRegistration] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const [reservationData, setReservationData] = useState<any>(null);
  const [registeredUserName, setRegisteredUserName] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mada' | 'bank_transfer' | null>(null);

  useEffect(() => {
    if (farm.contracts && farm.contracts.length > 0) {
      setSelectedContract(farm.contracts[0]);
    }
  }, [farm.contracts]);

  const maxTrees = farm.availableTrees || 0;

  const calculateTotal = () => {
    if (!selectedContract || treeCount === 0) return 0;
    const price = selectedContract.farmer_price || selectedContract.investor_price || 0;
    return treeCount * price;
  };

  const handleTreeCountChange = (delta: number) => {
    const newCount = Math.max(0, Math.min(maxTrees, treeCount + delta));
    setTreeCount(newCount);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTreeCount(parseInt(e.target.value));
  };

  const handleBuyNow = () => {
    if (!selectedContract || treeCount === 0) {
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
        })
        .select()
        .single();

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
    <div className="fixed inset-0 bg-gradient-to-br from-green-50/95 via-emerald-50/90 to-teal-50/95 z-50 overflow-y-auto">
      <div className="min-h-screen pb-32">
        {/* Header with Back Button */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-green-200/50">
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
              <Sprout className="w-16 h-16 text-darkgreen/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Farm Name & Location */}
        <div className="px-4 py-4 bg-white/60 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-darkgreen mb-2">{farm.name}</h2>
          {farm.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-darkgreen" />
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
              <Video className="w-5 h-5 text-darkgreen" />
              <span className="text-sm font-bold text-darkgreen">عرض فيديو</span>
            </button>

            <button
              onClick={() => setShowInfoModal(true)}
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-green-100/50 to-emerald-100/50 rounded-xl border-2 border-darkgreen/30 hover:border-darkgreen/50 transition-all active:scale-95"
            >
              <HelpCircle className="w-5 h-5 text-darkgreen" />
              <span className="text-sm font-bold text-darkgreen">اعرف المزرعة</span>
            </button>
          </div>
        </div>

        {/* Farm Packages Slider */}
        <div className="px-4 py-3">
          <h3 className="text-base font-bold text-darkgreen mb-3">اختر باقة الأشجار</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {farm.contracts?.map((contract) => {
              const isSelected = selectedContract?.id === contract.id;
              return (
                <button
                  key={contract.id}
                  onClick={() => setSelectedContract(contract)}
                  className={`flex-shrink-0 w-44 p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-green-100/60 to-emerald-100/50 border-darkgreen shadow-lg scale-105'
                      : 'bg-white/80 border-green-200 hover:border-darkgreen/50'
                  }`}
                >
                  <div className="text-center space-y-2">
                    <h4 className="font-bold text-darkgreen text-sm">{contract.contract_name}</h4>

                    <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>{contract.duration_years} سنوات</span>
                    </div>

                    {contract.bonus_years > 0 && (
                      <div className="flex items-center justify-center gap-1 text-xs text-green-600 bg-green-50 rounded-lg py-1 px-2">
                        <Gift className="w-3 h-3" />
                        <span>+{contract.bonus_years} مجاني</span>
                      </div>
                    )}

                    <div className="text-lg font-bold text-darkgreen">
                      {(contract.farmer_price || contract.investor_price || 0).toLocaleString()} ر.س
                    </div>
                    <div className="text-[10px] text-gray-500">للشجرة الواحدة</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tree Slider */}
        <div className="px-4 py-4 bg-white/60 backdrop-blur-sm mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-darkgreen">عدد الأشجار</h3>
            <div className="text-sm text-gray-600">
              متاح: <span className="font-bold text-darkgreen">{maxTrees}</span> شجرة
            </div>
          </div>

          {/* Counter Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => handleTreeCountChange(-1)}
              disabled={treeCount === 0}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-darkgreen/30 flex items-center justify-center hover:border-darkgreen transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              <Minus className="w-5 h-5 text-darkgreen" />
            </button>

            <div className="text-4xl font-bold text-darkgreen min-w-[100px] text-center">
              {treeCount}
            </div>

            <button
              onClick={() => handleTreeCountChange(1)}
              disabled={treeCount >= maxTrees}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-darkgreen/30 flex items-center justify-center hover:border-darkgreen transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              <Plus className="w-5 h-5 text-darkgreen" />
            </button>
          </div>

          {/* Slider */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max={maxTrees}
              value={treeCount}
              onChange={handleSliderChange}
              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider-thumb-green"
              style={{
                background: `linear-gradient(to right, #3AA17E 0%, #3AA17E ${(treeCount / maxTrees) * 100}%, #86EFAC ${(treeCount / maxTrees) * 100}%, #86EFAC 100%)`
              }}
            />
          </div>

          {/* Quick Selectors */}
          <div className="flex gap-2 mt-4">
            {[10, 25, 50, 100].filter(num => num <= maxTrees).map((num) => (
              <button
                key={num}
                onClick={() => setTreeCount(num)}
                className="flex-1 py-2 px-3 rounded-lg bg-green-50 border border-green-300 text-sm font-bold text-darkgreen hover:bg-green-100 hover:border-darkgreen transition-all active:scale-95"
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Purchase Summary - Fixed Bottom */}
        {treeCount > 0 && selectedContract && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-2 border-darkgreen/30 shadow-2xl p-4 z-20">
            <div className="max-w-lg mx-auto space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-50/50 rounded-lg p-2">
                  <div className="text-gray-600 text-xs mb-1">عدد الأشجار</div>
                  <div className="font-bold text-darkgreen">{treeCount} شجرة</div>
                </div>

                <div className="bg-green-50/50 rounded-lg p-2">
                  <div className="text-gray-600 text-xs mb-1">مدة العقد</div>
                  <div className="font-bold text-darkgreen">
                    {selectedContract.duration_years} سنوات
                    {selectedContract.bonus_years > 0 && (
                      <span className="text-green-600 mr-1">+{selectedContract.bonus_years}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-center mb-2">
                <p className="text-sm font-bold text-darkgreen">
                  أنت على بعد خطوة من امتلاك أشجارك الخاصة
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  سيتم تسجيل أشجارك مباشرة باسمك بعد إتمام الدفع
                </p>
              </div>

              <div className="flex items-center justify-between bg-gradient-to-r from-green-100/60 to-emerald-100/50 rounded-xl p-4 border-2 border-darkgreen/40">
                <div>
                  <div className="text-xs text-gray-600 mb-1">الإجمالي</div>
                  <div className="text-2xl font-bold text-darkgreen">
                    {calculateTotal().toLocaleString()} ر.س
                  </div>
                </div>

                <button
                  onClick={handleBuyNow}
                  disabled={isCreatingReservation}
                  className="px-6 py-3 bg-gradient-to-r from-darkgreen to-[#2F8266] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingReservation ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري التأكيد...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>احجز أشجارك الآن</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
                  <Sprout className="w-5 h-5 text-darkgreen" />
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
          contractName={selectedContract.contract_name}
          durationYears={selectedContract.duration_years}
          bonusYears={selectedContract.bonus_years}
          treeCount={treeCount}
          totalPrice={calculateTotal()}
          pricePerTree={selectedContract.farmer_price || selectedContract.investor_price || 0}
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
    </div>
  );
}
