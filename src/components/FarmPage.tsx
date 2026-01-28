import { useState, useEffect, useRef } from 'react';
import { X, Play, TreePine, Plus, Minus, CheckCircle2, Gift, Award, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { farmService, type FarmProject, type TreeVariety, type FarmContract } from '../services/farmService';
import PreAuthReservation from './PreAuthReservation';

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

    const totalTrees = Object.values(treeSelections).reduce((sum, sel) => sum + sel.quantity, 0);
    const totalCost = totalTrees * selectedContract.investor_price;

    const cart: Record<string, any> = {};
    Object.entries(treeSelections).forEach(([varietyId, selection]) => {
      cart[varietyId] = {
        varietyName: selection.variety.name,
        typeName: selection.typeName,
        quantity: selection.quantity,
        price: selectedContract.investor_price
      };
    });

    const treeDetails = Object.values(treeSelections).map(sel => ({
      varietyName: sel.variety.name,
      typeName: sel.typeName,
      quantity: sel.quantity,
      pricePerTree: selectedContract.investor_price
    }));

    const tempReservationData = {
      farmId: farm!.id,
      farmName: farm!.name,
      cart,
      totalTrees,
      totalPrice: totalCost,
      contractId: selectedContract.id,
      contractName: `عقد ${selectedContract.duration_years} ${selectedContract.duration_years === 1 ? 'سنة' : 'سنوات'}`,
      durationYears: selectedContract.duration_years,
      bonusYears: selectedContract.bonus_years,
      treeDetails
    };

    localStorage.setItem('pendingReservation', JSON.stringify(tempReservationData));
    setReservationData(tempReservationData);
    setShowPreAuthReservation(true);
  };

  const scrollContracts = (direction: 'left' | 'right') => {
    if (contractsScrollRef.current) {
      const scrollAmount = 140;
      const currentScroll = contractsScrollRef.current.scrollLeft;
      contractsScrollRef.current.scrollTo({
        left: direction === 'right' ? currentScroll + scrollAmount : currentScroll - scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-green-50 z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
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

  const totalTrees = Object.values(treeSelections).reduce((sum, sel) => sum + sel.quantity, 0);
  const totalCost = selectedContract && totalTrees > 0 ? totalTrees * selectedContract.investor_price : 0;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 z-50 overflow-y-auto">
      {/* HEADER */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-xl z-20 border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-red-50 hover:to-red-100 flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-md"
          >
            <X className="w-5 h-5 text-gray-700 hover:text-red-600 transition-colors" />
          </button>

          <h2 className="text-xl font-black bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
            {farm.name}
          </h2>

          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-48">

        {/* HERO IMAGE - صورة المزرعة */}
        <section className="relative rounded-2xl overflow-hidden shadow-xl">
          <img
            src={farm.image || 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg'}
            alt={farm.name}
            className="w-full h-64 lg:h-80 object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        </section>

        {/* VIDEO BUTTON - فيديو المزرعة */}
        {farm.video && (
          <section>
            <button
              onClick={() => setShowVideoModal(true)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                  <Play className="w-6 h-6 text-white" fill="currentColor" />
                </div>
                <div className="text-right">
                  <p className="text-base font-black">{farm.videoTitle || 'شاهد جولة المزرعة'}</p>
                  <p className="text-sm text-white/90 mt-1">فيديو تعريفي شامل عن المزرعة</p>
                </div>
              </div>
            </button>
          </section>
        )}

        {/* MARKETING TEXT - النص الدعائي */}
        {farm.marketingText && (
          <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-900 mb-2">لماذا تستثمر هنا؟</h3>
                <p className="text-gray-700 leading-relaxed text-base">{farm.marketingText}</p>
              </div>
            </div>
          </section>
        )}

        {/* CONTRACT SLIDER - اختيار العقد */}
        {farm.contracts && farm.contracts.length > 0 && (
          <section>
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full border-2 border-green-200 shadow-md">
                <Award className="w-5 h-5 text-green-700" />
                <span className="font-black text-gray-900">اختر مدة عقد الانتفاع</span>
              </div>
              <p className="text-sm text-gray-600 mt-3 max-w-md mx-auto">مرر لرؤية جميع الخيارات المتاحة</p>
            </div>

            <div className="relative">
              <button
                onClick={() => scrollContracts('right')}
                className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white hover:bg-gray-50 rounded-full shadow-xl border-2 border-gray-200 items-center justify-center transition-all duration-300 hover:scale-110 -mr-6"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>

              <button
                onClick={() => scrollContracts('left')}
                className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white hover:bg-gray-50 rounded-full shadow-xl border-2 border-gray-200 items-center justify-center transition-all duration-300 hover:scale-110 -ml-6"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>

              <div
                ref={contractsScrollRef}
                className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {farm.contracts.map((contract, index) => {
                  const isSelected = selectedContract?.id === contract.id;
                  const isRecommended = index === Math.floor(farm.contracts!.length / 2);
                  const totalYears = contract.duration_years + contract.bonus_years;

                  return (
                    <div key={contract.id} className="flex-shrink-0 snap-center w-40">
                      <div className="relative pt-4">
                        {isRecommended && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
                            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3" />
                              الأكثر شعبية
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedContract(contract)}
                          className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 p-4 ${
                            isSelected
                              ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-2xl shadow-green-300'
                              : isRecommended
                              ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-xl shadow-amber-300'
                              : 'bg-white shadow-lg border-2 border-gray-200'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col items-center gap-2 w-full">
                            <div className="flex items-center gap-1">
                              <Award className={`w-3 h-3 ${isSelected || isRecommended ? 'text-white/90' : 'text-green-700'}`} />
                              <p className={`text-xs font-bold ${isSelected || isRecommended ? 'text-white/90' : 'text-gray-600'}`}>
                                عقد انتفاع
                              </p>
                            </div>

                            <div className="text-center">
                              <p className={`text-5xl font-black ${isSelected || isRecommended ? 'text-white' : 'text-green-700'}`}>
                                {contract.duration_years}
                              </p>
                              <p className={`text-xs font-bold mt-1 ${isSelected || isRecommended ? 'text-white/90' : 'text-gray-600'}`}>
                                {contract.duration_years === 1 ? 'سنة' : 'سنوات'}
                              </p>
                            </div>

                            {contract.bonus_years > 0 && (
                              <>
                                <div className={`w-12 h-px ${isSelected || isRecommended ? 'bg-white/30' : 'bg-gray-300'}`} />
                                <div className={`px-2.5 py-1.5 rounded-lg ${
                                  isSelected || isRecommended
                                    ? 'bg-white/20 border border-white/40'
                                    : 'bg-gradient-to-br from-emerald-500 to-green-600 border border-emerald-400'
                                }`}>
                                  <div className="flex items-center gap-1">
                                    <Gift className="w-3 h-3 text-white" />
                                    <p className="text-xs font-bold text-white">+{contract.bonus_years} مجاناً</p>
                                  </div>
                                </div>
                                <div className={`w-12 h-px ${isSelected || isRecommended ? 'bg-white/30' : 'bg-gray-300'}`} />
                              </>
                            )}

                            <div className="text-center">
                              <p className={`text-xs ${isSelected || isRecommended ? 'text-white/70' : 'text-gray-500'}`}>
                                الإجمالي
                              </p>
                              <p className={`text-3xl font-black ${isSelected || isRecommended ? 'text-white' : 'text-gray-700'}`}>
                                {totalYears}
                              </p>
                              <p className={`text-xs font-bold ${isSelected || isRecommended ? 'text-white/90' : 'text-gray-600'}`}>
                                {totalYears === 1 ? 'سنة' : 'سنوات'}
                              </p>
                            </div>
                          </div>
                        </button>

                        <div className="mt-2 text-center">
                          <p className={`text-lg font-black ${
                            isSelected ? 'text-green-700' : isRecommended ? 'text-amber-700' : 'text-gray-700'
                          }`}>
                            {contract.investor_price} ريال
                          </p>
                          <p className="text-xs text-gray-500">للشجرة الواحدة</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* TREE SELECTOR - عداد حجز الأشجار */}
        <section>
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 rounded-full border-2 border-green-200">
              <TreePine className="w-5 h-5 text-green-600" />
              <span className="font-black text-green-900">اختر أشجارك</span>
            </div>
            <p className="text-sm text-gray-600 mt-3">حدد نوع وعدد الأشجار التي ترغب بالاستثمار فيها</p>
          </div>

          <div className="space-y-3">
            {farm.treeTypes && farm.treeTypes.length > 0 ? (
              farm.treeTypes.map(type =>
                type.varieties.map(variety => {
                  const selection = treeSelections[variety.id];
                  const quantity = selection?.quantity || 0;
                  const isSelected = quantity > 0;

                  return (
                    <div
                      key={variety.id}
                      className={`bg-white rounded-2xl p-5 transition-all duration-300 ${
                        isSelected ? 'shadow-2xl border-2 border-green-500' : 'shadow-lg border border-gray-200'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg flex-shrink-0">
                          <TreePine className="w-7 h-7 text-white" />
                        </div>

                        <div className="flex-1 space-y-3">
                          <div>
                            <h4 className="text-lg font-black text-gray-900">{variety.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <span className="font-semibold">{type.name}</span>
                              <span>•</span>
                              <span className="text-green-600 font-bold">{variety.available} متاح</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className={`rounded-xl px-4 py-2 ${selectedContract ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-100 border border-gray-300'}`}>
                              {selectedContract ? (
                                <p className="text-lg font-black text-green-700">{selectedContract.investor_price} ر.س</p>
                              ) : (
                                <p className="text-sm font-bold text-gray-500">اختر عقد</p>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleTreeQuantityChange(variety, type.name, -1)}
                                disabled={quantity === 0}
                                className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-30 border border-red-200 shadow-md"
                              >
                                <Minus className="w-5 h-5 text-red-600" />
                              </button>

                              <div className={`rounded-xl px-4 py-2 min-w-[60px] text-center ${
                                isSelected
                                  ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-500 shadow-lg'
                                  : 'bg-gray-100 border border-gray-300'
                              }`}>
                                <p className="text-2xl font-black text-green-700">{quantity}</p>
                              </div>

                              <button
                                onClick={() => handleTreeQuantityChange(variety, type.name, 1)}
                                disabled={quantity >= variety.available}
                                className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-30 shadow-lg"
                              >
                                <Plus className="w-5 h-5 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                <p className="text-gray-600 text-lg">لا توجد أشجار متاحة حالياً</p>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* STICKY BOTTOM BAR - ملخص فوري للحجز */}
      {totalTrees > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-2xl">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* ملخص سريع */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <TreePine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">الأشجار المختارة</p>
                  <p className="text-xl font-black text-gray-900">{totalTrees}</p>
                </div>
              </div>

              {selectedContract && (
                <div className="text-left">
                  <p className="text-xs text-gray-500 font-medium">الإجمالي</p>
                  <p className={`text-2xl font-black bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent ${
                    priceUpdateAnimation ? 'scale-110' : 'scale-100'
                  } transition-all duration-300`}>
                    {totalCost.toLocaleString()} <span className="text-lg">ر.س</span>
                  </p>
                </div>
              )}
            </div>

            {/* زر الإجراء الرئيسي */}
            {selectedContract ? (
              <button
                onClick={handleCompleteBooking}
                className="w-full bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 hover:from-green-700 hover:via-green-600 hover:to-emerald-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-green-300 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 text-lg"
              >
                <CheckCircle2 className="w-6 h-6" />
                أكمل حجز أشجار مزرعتك
              </button>
            ) : (
              <button
                onClick={() => {
                  const contractsSection = document.querySelector('section');
                  contractsSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-orange-300 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 text-lg"
              >
                <Award className="w-6 h-6" />
                اختر العقد أولاً
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIDEO MODAL */}
      {showVideoModal && farm.video && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
          <button
            onClick={() => setShowVideoModal(false)}
            className="absolute top-6 right-6 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
          >
            <X className="w-7 h-7 text-white" />
          </button>

          <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl">
            <video
              src={farm.video}
              controls
              autoPlay
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* PRE-AUTH RESERVATION SCREEN */}
      {showPreAuthReservation && reservationData && (
        <PreAuthReservation
          farmName={reservationData.farmName}
          totalTrees={reservationData.totalTrees}
          totalPrice={reservationData.totalPrice}
          contractName={reservationData.contractName}
          onContinue={() => {
            setShowPreAuthReservation(false);
            onComplete(reservationData);
          }}
        />
      )}
    </div>
  );
}
