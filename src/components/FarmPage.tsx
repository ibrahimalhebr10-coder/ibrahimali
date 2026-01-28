import { useState, useEffect, useRef } from 'react';
import { X, Play, TreePine, Plus, Minus, CheckCircle2, Gift, Award, Sparkles, MapPin, Sprout } from 'lucide-react';
import { farmService, type FarmProject, type TreeVariety, type FarmContract } from '../services/farmService';
import PreAuthReservation from './PreAuthReservation';
import LoadingTransition from './LoadingTransition';

interface FarmPageProps {
  farmId: string;
  onClose: () => void;
  onComplete: (reservationData: any) => void;
}

interface TreeSelection {
  [varietyId: string]: {
    variety: TreeVariety;
    typeName: string;
    quantity: number;
  };
}

export default function FarmPage({ farmId, onClose, onComplete }: FarmPageProps) {
  const [farm, setFarm] = useState<FarmProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [treeSelections, setTreeSelections] = useState<TreeSelection>({});
  const [selectedContract, setSelectedContract] = useState<FarmContract | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [priceUpdateAnimation, setPriceUpdateAnimation] = useState(false);
  const [showPreAuthReservation, setShowPreAuthReservation] = useState(false);
  const [reservationData, setReservationData] = useState<any>(null);
  const [showBookingMessage, setShowBookingMessage] = useState(false);
  const [showLoadingTransition, setShowLoadingTransition] = useState(false);
  const contractsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFarmData();
  }, [farmId]);

  useEffect(() => {
    if (farm?.contracts && farm.contracts.length > 0 && !selectedContract) {
      const recommendedIndex = Math.floor(farm.contracts.length / 2);
      setSelectedContract(farm.contracts[recommendedIndex]);
    }
  }, [farm, selectedContract]);

  useEffect(() => {
    if (selectedContract || Object.keys(treeSelections).length > 0) {
      setPriceUpdateAnimation(true);
      const timer = setTimeout(() => setPriceUpdateAnimation(false), 600);
      return () => clearTimeout(timer);
    }
  }, [selectedContract, treeSelections]);

  async function loadFarmData() {
    try {
      setLoading(true);
      const farmData = await farmService.getFarmProjectById(farmId);
      if (farmData) {
        setFarm(farmData);
      }
    } catch (error) {
      console.error('Error loading farm:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleTreeQuantityChange = (variety: TreeVariety, typeName: string, change: number) => {
    setTreeSelections(prev => {
      const current = prev[variety.id] || { variety, typeName, quantity: 0 };
      const newQuantity = Math.max(0, Math.min(variety.available, current.quantity + change));

      if (newQuantity === 0) {
        const { [variety.id]: removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [variety.id]: { ...current, quantity: newQuantity }
      };
    });
  };

  const handleCompleteBooking = () => {
    if (Object.keys(treeSelections).length === 0) {
      alert('الرجاء اختيار الأشجار أولاً');
      return;
    }

    if (!selectedContract) {
      alert('الرجاء اختيار العقد');
      return;
    }

    // عرض الرسالة الخفيفة
    setShowBookingMessage(true);

    setTimeout(() => {
      setShowBookingMessage(false);
      setShowLoadingTransition(true);

      setTimeout(() => {
        const totalTrees = Object.values(treeSelections).reduce((sum, sel) => sum + sel.quantity, 0);
        const totalCost = totalTrees * selectedContract.investor_price;

        const cart: Record<string, any> = {};
        Object.entries(treeSelections).forEach(([varietyId, selection]) => {
          cart[varietyId] = {
            varietyName: selection.variety.name,
            typeName: selection.typeName,
            quantity: selection.quantity,
            pricePerTree: selectedContract.investor_price
          };
        });

        const data = {
          farmId: farm!.id,
          farmName: farm!.name,
          contractId: selectedContract.id,
          contractYears: selectedContract.duration_years,
          bonusYears: selectedContract.bonus_years,
          totalYears: selectedContract.duration_years + selectedContract.bonus_years,
          totalTrees,
          totalCost,
          pricePerTree: selectedContract.investor_price,
          cart,
          contractName: `عقد ${selectedContract.duration_years} ${selectedContract.duration_years === 1 ? 'سنة' : 'سنوات'}${selectedContract.bonus_years > 0 ? ` + ${selectedContract.bonus_years} ${selectedContract.bonus_years === 1 ? 'سنة' : 'سنوات'} هدية` : ''}`
        };

        setReservationData(data);
        setShowLoadingTransition(false);
        setShowPreAuthReservation(true);
      }, 1500);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-green-50 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-bold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-green-50 z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 font-bold mb-4">لم يتم العثور على المزرعة</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  if (showPreAuthReservation && reservationData) {
    return (
      <PreAuthReservation
        farmName={reservationData.farmName}
        totalTrees={reservationData.totalTrees}
        totalPrice={reservationData.totalCost}
        contractName={reservationData.contractName}
        onContinue={() => {
          setShowPreAuthReservation(false);
          onComplete(reservationData);
        }}
      />
    );
  }

  const totalTrees = Object.values(treeSelections).reduce((sum, sel) => sum + sel.quantity, 0);
  const totalCost = selectedContract && totalTrees > 0 ? totalTrees * selectedContract.investor_price : 0;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-50 z-50 overflow-y-auto">
      {/* HEADER */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-xl z-20 border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-red-50 hover:to-red-100 flex items-center justify-center transition-all duration-300 shadow-md active:scale-95"
          >
            <X className="w-5 h-5 text-gray-700 hover:text-red-600 transition-colors" />
          </button>

          <h2 className="text-base sm:text-lg md:text-xl font-black bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent truncate max-w-[60%]">
            {farm.name}
          </h2>

          <div className="w-9 sm:w-10"></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5 pb-36">

        {/* VIDEO - Mobile First (16:9 aspect ratio) */}
        {farm.video && (
          <section>
            <button
              onClick={() => setShowVideoModal(true)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
            >
              <div className="aspect-video relative">
                <img
                  src={farm.image || 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg'}
                  alt={farm.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border-4 border-white/50 shadow-xl">
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 mr-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4">
                  <p className="text-white font-bold text-sm sm:text-base">{farm.videoTitle || 'شاهد جولة المزرعة'}</p>
                </div>
              </div>
            </button>
          </section>
        )}

        {/* FARM INFO */}
        <section className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{farm.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{farm.location}</p>
            </div>
          </div>

          {farm.marketingText && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{farm.marketingText}</p>
            </div>
          )}
        </section>

        {/* CONTRACT SLIDER - Compact Mobile First */}
        {farm.contracts && farm.contracts.length > 0 && (
          <section>
            <div className="text-center mb-3 sm:mb-4">
              <div className="inline-flex items-center gap-2 bg-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 border-green-200 shadow-sm">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
                <span className="font-bold text-sm sm:text-base text-gray-900">اختر مدة العقد</span>
              </div>
            </div>

            <div className="relative">
              <div
                ref={contractsScrollRef}
                className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-3 px-1 snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {farm.contracts.map((contract, index) => {
                  const isSelected = selectedContract?.id === contract.id;
                  const isRecommended = index === Math.floor(farm.contracts!.length / 2);
                  const totalYears = contract.duration_years + contract.bonus_years;

                  return (
                    <div key={contract.id} className="flex-shrink-0 snap-center w-24 sm:w-28">
                      <div className="relative">
                        {isRecommended && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
                            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold shadow-lg flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span className="hidden sm:inline">الأكثر شعبية</span>
                              <span className="sm:hidden">شائع</span>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedContract(contract)}
                          className={`w-full aspect-[3/4] rounded-xl sm:rounded-2xl flex flex-col transition-all duration-300 active:scale-95 overflow-hidden relative shadow-lg ${
                            isSelected
                              ? 'shadow-green-300/50 border-2 border-green-400'
                              : isRecommended
                              ? 'shadow-amber-300/50 border-2 border-amber-400'
                              : 'shadow-gray-200 border-2 border-gray-200'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 z-10">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                              </div>
                            </div>
                          )}

                          {/* القسم الأول: مدة العقد الأساسية */}
                          <div className={`flex-1 flex flex-col items-center justify-center relative ${
                            isSelected
                              ? 'bg-gradient-to-br from-green-600 via-green-500 to-green-600'
                              : isRecommended
                              ? 'bg-gradient-to-br from-amber-600 via-amber-500 to-amber-600'
                              : 'bg-gradient-to-br from-green-50 via-white to-green-50'
                          }`}>
                            <div className="text-center">
                              <p className={`text-5xl sm:text-6xl font-black leading-none tracking-tight ${
                                isSelected || isRecommended ? 'text-white drop-shadow-lg' : 'text-green-700'
                              }`}>
                                {contract.duration_years}
                              </p>
                              <p className={`text-sm sm:text-base font-bold mt-1.5 ${
                                isSelected || isRecommended ? 'text-white/95' : 'text-gray-600'
                              }`}>
                                {contract.duration_years === 1 ? 'سنة' : 'سنوات'}
                              </p>
                            </div>
                          </div>

                          {/* فاصل مبتكر بتدرج */}
                          <div className="relative h-1">
                            <div className={`absolute inset-0 ${
                              isSelected || isRecommended
                                ? 'bg-gradient-to-r from-transparent via-white/40 to-transparent'
                                : 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'
                            }`} />
                          </div>

                          {/* القسم الثاني: السنوات المجانية */}
                          <div className={`flex-1 flex flex-col items-center justify-center relative ${
                            isSelected
                              ? 'bg-gradient-to-br from-emerald-600 via-emerald-500 to-green-500'
                              : isRecommended
                              ? 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500'
                              : contract.bonus_years > 0
                              ? 'bg-gradient-to-br from-emerald-100 via-green-50 to-emerald-100'
                              : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
                          }`}>
                            {contract.bonus_years > 0 ? (
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                  <Gift className={`w-5 h-5 sm:w-6 sm:h-6 ${
                                    isSelected || isRecommended ? 'text-white drop-shadow-md' : 'text-emerald-600'
                                  }`} />
                                  <p className={`text-3xl sm:text-4xl font-black leading-none ${
                                    isSelected || isRecommended ? 'text-white drop-shadow-lg' : 'text-emerald-600'
                                  }`}>
                                    +{contract.bonus_years}
                                  </p>
                                </div>
                                <p className={`text-xs sm:text-sm font-bold px-2 ${
                                  isSelected || isRecommended ? 'text-white/95' : 'text-emerald-700'
                                }`}>
                                  {contract.bonus_years === 1 ? 'سنة' : 'سنوات'} مجاناً
                                </p>
                              </div>
                            ) : (
                              <div className="text-center opacity-30">
                                <Award className={`w-6 h-6 sm:w-7 sm:h-7 mx-auto ${
                                  isSelected || isRecommended ? 'text-white' : 'text-gray-400'
                                }`} />
                                <p className={`text-[10px] sm:text-xs font-semibold mt-1 ${
                                  isSelected || isRecommended ? 'text-white' : 'text-gray-400'
                                }`}>
                                  لا توجد سنوات إضافية
                                </p>
                              </div>
                            )}
                          </div>

                          {/* فاصل مبتكر بتدرج */}
                          <div className="relative h-1">
                            <div className={`absolute inset-0 ${
                              isSelected || isRecommended
                                ? 'bg-gradient-to-r from-transparent via-white/40 to-transparent'
                                : 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'
                            }`} />
                          </div>

                          {/* القسم الثالث: السعر */}
                          <div className={`flex-1 flex flex-col items-center justify-center relative ${
                            isSelected
                              ? 'bg-gradient-to-br from-green-700 via-green-600 to-green-700'
                              : isRecommended
                              ? 'bg-gradient-to-br from-amber-700 via-amber-600 to-amber-700'
                              : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
                          }`}>
                            <div className="text-center">
                              <p className={`text-3xl sm:text-4xl font-black leading-none ${
                                isSelected || isRecommended ? 'text-white drop-shadow-lg' : 'text-green-700'
                              }`}>
                                {contract.investor_price}
                              </p>
                              <p className={`text-xs sm:text-sm font-bold mt-1 ${
                                isSelected || isRecommended ? 'text-white/90' : 'text-gray-500'
                              }`}>
                                ريال/شجرة
                              </p>
                            </div>
                          </div>
                        </button>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* رسالة تحفيزية */}
            <div className="mt-4 text-center animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border border-green-200">
                <Sprout className="w-4 h-4 text-green-600" />
                <p className="text-sm font-semibold text-green-700">
                  اختر عقدك وابدأ بتأسيس مزرعتك خطوة بخطوة
                </p>
              </div>
            </div>
          </section>
        )}

        {/* TREE SELECTION - شريط حجز واضح وبارز */}
        {farm.treeTypes && farm.treeTypes.length > 0 && (
          <section className="space-y-3 sm:space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 border-green-200 shadow-sm">
                <TreePine className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
                <span className="font-bold text-sm sm:text-base text-gray-900">احجز أشجارك</span>
              </div>
            </div>

            {farm.treeTypes.map((treeType) => (
              <div key={treeType.id} className="space-y-2.5 sm:space-y-3">
                {treeType.varieties.map((variety) => {
                  const selection = treeSelections[variety.id];
                  const quantity = selection?.quantity || 0;

                  return (
                    <div
                      key={variety.id}
                      className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border-2 border-gray-200 hover:border-green-300 transition-all"
                    >
                      {/* معلومات الشجرة */}
                      <div className="flex items-center gap-3 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md flex-shrink-0">
                          <TreePine className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-bold text-gray-900 truncate">{variety.name}</h4>
                          <p className="text-xs text-gray-500">{treeType.name} • متاح: {variety.available} شجرة</p>
                        </div>
                      </div>

                      {/* شريط Counter - واضح وبارز */}
                      <div className="bg-gradient-to-br from-gray-50 to-stone-50 rounded-xl p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center justify-between gap-3 sm:gap-4">
                          {/* زر النقصان */}
                          <button
                            onClick={() => handleTreeQuantityChange(variety, treeType.name, -1)}
                            disabled={quantity === 0}
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ${
                              quantity === 0
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-red-600 hover:bg-red-50 border-2 border-red-300 hover:border-red-400'
                            }`}
                          >
                            <Minus className="w-5 h-5 sm:w-6 sm:h-6 font-bold" strokeWidth={3} />
                          </button>

                          {/* العدد في المنتصف - كبير وواضح */}
                          <div className="flex-1 text-center">
                            <div className="bg-white rounded-xl px-4 py-2 sm:py-3 border-2 border-gray-200 shadow-sm">
                              <p className="text-2xl sm:text-3xl font-black text-gray-900">{quantity}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500 font-semibold mt-0.5">شجرة</p>
                            </div>
                          </div>

                          {/* زر الزيادة */}
                          <button
                            onClick={() => handleTreeQuantityChange(variety, treeType.name, 1)}
                            disabled={quantity >= variety.available}
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ${
                              quantity >= variety.available
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-green-300/50'
                            }`}
                          >
                            <Plus className="w-5 h-5 sm:w-6 sm:h-6 font-bold" strokeWidth={3} />
                          </button>
                        </div>

                        {/* رسالة عند الوصول للحد الأقصى */}
                        {quantity >= variety.available && variety.available > 0 && (
                          <div className="mt-2 text-center">
                            <p className="text-xs text-amber-600 font-semibold">وصلت للحد الأقصى المتاح</p>
                          </div>
                        )}

                        {/* السعر الإجمالي لهذا النوع */}
                        {quantity > 0 && selectedContract && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm text-gray-600 font-semibold">الإجمالي</span>
                              <span className="text-base sm:text-lg font-black text-green-700">
                                {(quantity * selectedContract.investor_price).toLocaleString('ar-SA')} ريال
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </section>
        )}
      </div>

      {/* STICKY BOTTOM BAR */}
      {selectedContract && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-30">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="flex-1 bg-gradient-to-br from-gray-50 to-stone-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-600 font-semibold">إجمالي الأشجار</p>
                    <p className="text-base sm:text-lg font-black text-gray-900">{totalTrees} شجرة</p>
                  </div>
                  <TreePine className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>

              <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-green-700 font-semibold">المبلغ الإجمالي</p>
                    <p className={`text-base sm:text-lg font-black text-green-700 transition-all duration-300 ${priceUpdateAnimation ? 'scale-110' : 'scale-100'}`}>
                      {totalCost.toLocaleString('ar-SA')} ريال
                    </p>
                  </div>
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </div>

            <button
              onClick={handleCompleteBooking}
              disabled={totalTrees === 0}
              className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all shadow-lg active:scale-95 ${
                totalTrees > 0
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {totalTrees > 0 ? 'تابع في تأسيس مزرعتك' : 'اختر الأشجار للمتابعة'}
            </button>
          </div>
        </div>
      )}

      {/* BOOKING MESSAGE - رسالة خفيفة */}
      {showBookingMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm mx-4 text-center animate-scale-in">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black text-green-700 mb-2">خطوة جميلة!</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              أنت الآن تؤسس مزرعتك ونحفظ اختيارك مؤقتاً
            </p>
          </div>
        </div>
      )}

      {/* LOADING TRANSITION */}
      {showLoadingTransition && (
        <LoadingTransition message="نجهز مزرعتك..." />
      )}

      {/* VIDEO MODAL */}
      {showVideoModal && farm.video && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-4xl">
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setShowVideoModal(false)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            </div>
            <div className="aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
              <video
                src={farm.video}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
