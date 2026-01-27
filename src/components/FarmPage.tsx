import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Play, Map, Plus, Minus, TreePine, CheckCircle2, AlertCircle, Gift, Calendar, Award, TrendingUp, Shield, Clock, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { farmService, type FarmProject, type TreeVariety, type FarmContract } from '../services/farmService';
import { reservationService } from '../services/reservationService';

interface FarmPageProps {
  farmId: string;
  onClose: () => void;
  onOpenAuth: () => void;
  onNavigateToReservations: () => void;
}

interface TreeSelection {
  [varietyId: string]: {
    variety: TreeVariety;
    typeName: string;
    quantity: number;
  };
}

export default function FarmPage({ farmId, onClose, onOpenAuth, onNavigateToReservations }: FarmPageProps) {
  const { user } = useAuth();
  const [farm, setFarm] = useState<FarmProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [treeSelections, setTreeSelections] = useState<TreeSelection>({});
  const [selectedContract, setSelectedContract] = useState<FarmContract | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [priceUpdateAnimation, setPriceUpdateAnimation] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
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
      } else {
        console.error('Farm not found');
        setFarm(null);
      }
    } catch (error) {
      console.error('Error loading farm:', error);
      setFarm(null);
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

  const handleSaveReservation = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (Object.keys(treeSelections).length === 0) {
      alert('الرجاء اختيار الأشجار أولاً');
      return;
    }

    if (!selectedContract) {
      alert('الرجاء اختيار العقد');
      return;
    }

    try {
      setSaving(true);

      const totalTrees = Object.values(treeSelections).reduce((sum, sel) => sum + sel.quantity, 0);
      const totalCost = totalTrees * selectedContract.investor_price;

      const mainVariety = Object.values(treeSelections)[0].variety;

      const result = await reservationService.createReservation({
        userId: user.id,
        farmId,
        varietyId: mainVariety.id,
        treeCount: totalTrees,
        totalCost,
        contractId: selectedContract.id,
        contractYears: selectedContract.duration_years,
        bonusYears: selectedContract.bonus_years,
        totalYears: selectedContract.duration_years + selectedContract.bonus_years,
        monthlyPayment: 0
      });

      if (result) {
        onNavigateToReservations();
      } else {
        alert('حدث خطأ أثناء حفظ الحجز. الرجاء المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error('Error saving reservation:', error);
      alert('حدث خطأ أثناء حفظ الحجز. الرجاء المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const getContractBenefitText = (years: number, bonusYears: number): string => {
    if (years <= 5) return 'مثالي للمبتدئين';
    if (years <= 10) return 'الخيار الأكثر شعبية';
    return 'عائد استثماري طويل الأمد';
  };

  const getContractHighlight = (years: number): string => {
    if (years <= 5) return 'دخول سريع';
    if (years <= 10) return 'توازن مثالي';
    return 'استثمار استراتيجي';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-pearl z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-darkgreen"></div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="fixed inset-0 bg-pearl z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-darkgreen font-bold mb-4">لم يتم العثور على المزرعة</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-darkgreen text-white rounded-lg"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  const totalTrees = Object.values(treeSelections).reduce((sum, sel) => sum + sel.quantity, 0);
  const totalCost = selectedContract && totalTrees > 0
    ? totalTrees * selectedContract.investor_price
    : 0;
  const maintenanceFee = totalTrees > 0 && farm?.treeTypes?.[0]?.varieties?.[0]?.maintenance_fee
    ? totalTrees * farm.treeTypes[0].varieties[0].maintenance_fee
    : 0;

  const scrollContracts = (direction: 'left' | 'right') => {
    if (contractsScrollRef.current) {
      const scrollAmount = 138;
      const currentScroll = contractsScrollRef.current.scrollLeft;
      contractsScrollRef.current.scrollTo({
        left: direction === 'right'
          ? currentScroll + scrollAmount
          : currentScroll - scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-green-50/20 to-gray-50 z-50 overflow-y-auto">
      {/* HEADER */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-xl z-20 border-b border-gray-200/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="group w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:from-red-50 hover:to-red-100 transition-all duration-300 hover:scale-105 shadow-md"
          >
            <X className="w-5 h-5 text-gray-700 group-hover:text-red-600 transition-colors" />
          </button>

          <div className="text-center">
            <h2 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-green-700 via-green-600 to-green-700 bg-clip-text text-transparent">
              {farm?.name || 'مزرعة'}
            </h2>
            {farm?.location && (
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-green-600" />
                <span className="text-xs text-gray-600">{farm.location}</span>
              </div>
            )}
          </div>

          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 lg:px-4 py-4 lg:py-6 space-y-5 lg:space-y-8 pb-48">

        {/* HERO IMAGE + INTEGRATED VIDEO BUTTON */}
        <section className="relative group">
          <div className="relative h-56 lg:h-80 rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl">
            <img
              src={farm?.image || ''}
              alt={farm?.name || 'مزرعة'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1200';
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div className="flex-1">
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-1 drop-shadow-lg">{farm?.name || 'مزرعة'}</h3>
                <p className="text-xs lg:text-sm text-white/90 leading-relaxed line-clamp-2 drop-shadow-md">{farm?.description || ''}</p>
              </div>

              {farm?.video && (
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="group/play ml-4 flex-shrink-0"
                >
                  <div className="relative">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl transition-all duration-300 group-hover/play:bg-white group-hover/play:scale-110">
                      <Play className="w-6 h-6 lg:w-7 lg:h-7 text-green-600" fill="currentColor" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping"></div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* MAP BUTTON */}
        {farm.mapUrl && farm.mapUrl !== '#' && (
          <section>
            <button
              onClick={() => window.open(farm.mapUrl, '_blank')}
              className="w-full group relative bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl p-5 lg:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>

              <div className="relative flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <div className="text-right flex-1">
                  <p className="text-lg font-bold mb-0.5">عرض موقع المزرعة</p>
                  <p className="text-sm text-white/90">اكتشف الموقع الجغرافي على الخريطة</p>
                </div>
              </div>
            </button>
          </section>
        )}

        {/* CONTRACT SLIDER - MOVED TO TOP FOR BETTER UX */}
        {farm.contracts && farm.contracts.length > 0 && (
          <section id="contracts-section">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full border-2 border-gray-200 shadow-md mb-2">
                <Award className="w-4 h-4 text-gray-700" />
                <span className="font-bold text-gray-900 text-sm">اختر مدة عقد الانتفاع</span>
              </div>
              <p className="text-xs text-gray-600 max-w-md mx-auto">مرر يميناً ويساراً لرؤية جميع الخيارات المتاحة</p>
            </div>

            <div className="relative">
              <button
                onClick={() => scrollContracts('right')}
                className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white hover:bg-gray-50 rounded-full shadow-lg border-2 border-gray-200 items-center justify-center transition-all duration-300 hover:scale-110 -mr-5"
                aria-label="Previous contracts"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>

              <button
                onClick={() => scrollContracts('left')}
                className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white hover:bg-gray-50 rounded-full shadow-lg border-2 border-gray-200 items-center justify-center transition-all duration-300 hover:scale-110 -ml-5"
                aria-label="Next contracts"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              <div
                ref={contractsScrollRef}
                className="flex gap-3 lg:gap-4 overflow-x-auto pb-3 px-1 snap-x snap-mandatory scrollbar-hide"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {farm.contracts.map((contract, index) => {
                  const isSelected = selectedContract?.id === contract.id;
                  const isRecommended = index === Math.floor(farm.contracts!.length / 2);
                  const totalYears = contract.duration_years + contract.bonus_years;
                  const priceForSelected = totalTrees * contract.investor_price;

                  const getContractColors = () => {
                    if (isSelected) {
                      return {
                        iconGradient: 'linear-gradient(145deg, #10b981 0%, #059669 100%)',
                        shadow: 'rgba(16, 185, 129, 0.3)',
                        border: '#10b981',
                      };
                    }
                    if (isRecommended) {
                      return {
                        iconGradient: 'linear-gradient(145deg, #f59e0b 0%, #d97706 100%)',
                        shadow: 'rgba(245, 158, 11, 0.25)',
                        border: '#f59e0b',
                      };
                    }
                    return {
                      iconGradient: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(249,249,249,0.8) 100%)',
                      shadow: 'rgba(0,0,0,0.1)',
                      border: 'rgba(229, 231, 235, 0.7)',
                    };
                  };

                  const colors = getContractColors();

                  return (
                    <div key={contract.id} className="flex-shrink-0 snap-center w-36 lg:w-40">
                      <div className="relative pt-4 pb-1">
                        {/* Badge "الأكثر شعبية" - فوق البطاقة تماماً بدون تداخل */}
                        {isRecommended && (
                          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-20">
                            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-[9px] lg:text-[10px] font-bold shadow-xl flex items-center gap-1 border-2 border-amber-300">
                              <Sparkles className="w-3 h-3" />
                              <span>الأكثر شعبية</span>
                            </div>
                          </div>
                        )}

                        {/* البطاقة الرئيسية */}
                        <button
                          onClick={() => setSelectedContract(contract)}
                          className="w-full rounded-2xl flex flex-col bg-white transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-lg relative overflow-hidden"
                          style={{
                            boxShadow: isSelected
                              ? `0 8px 24px ${colors.shadow}, 0 16px 48px ${colors.shadow}`
                              : `0 4px 12px ${colors.shadow}`,
                            border: `3px solid ${colors.border}`,
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)'
                          }}
                        >
                          {/* علامة الاختيار - في الزاوية فقط */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 z-10">
                              <div className="w-6 h-6 lg:w-7 lg:h-7 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-green-500">
                                <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
                              </div>
                            </div>
                          )}

                          {/* قسم العنوان */}
                          <div
                            className="px-3 py-2 rounded-t-2xl text-center"
                            style={{
                              background: colors.iconGradient
                            }}
                          >
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <Award className={`w-3.5 h-3.5 ${
                                isSelected || isRecommended ? 'text-white' : 'text-green-700'
                              }`} />
                              <p className={`text-[10px] lg:text-[11px] font-bold ${
                                isSelected || isRecommended ? 'text-white' : 'text-green-900'
                              }`}>
                                عقد انتفاع
                              </p>
                            </div>
                            <div className={`w-12 h-0.5 rounded-full mx-auto ${
                              isSelected || isRecommended ? 'bg-white/40' : 'bg-green-300'
                            }`} />
                          </div>

                          {/* قسم المحتوى */}
                          <div className="px-4 py-4 bg-gradient-to-b from-white to-gray-50">
                            {/* مدة العقد */}
                            <div className="text-center mb-3">
                              <p className="text-[10px] font-medium text-gray-600 mb-1">مدة العقد</p>
                              <p className="text-5xl lg:text-6xl font-black text-green-700 leading-none">
                                {contract.duration_years}
                              </p>
                              <p className="text-[11px] font-bold text-gray-600 mt-1">
                                {contract.duration_years === 1 ? 'سنة' : 'سنوات'}
                              </p>
                            </div>

                            {/* السنوات المجانية */}
                            {contract.bonus_years > 0 && (
                              <>
                                <div className="flex items-center justify-center gap-2 mb-3">
                                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                                </div>

                                <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-3 shadow-lg border-2 border-emerald-300 mb-3">
                                  <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <Gift className="w-3.5 h-3.5 text-white" />
                                    <p className="text-[10px] font-bold text-white">هدية مجانية</p>
                                  </div>
                                  <p className="text-center text-2xl lg:text-3xl font-black text-white leading-none">
                                    {contract.bonus_years}
                                  </p>
                                  <p className="text-center text-[11px] font-bold text-white/90 mt-1">
                                    {contract.bonus_years === 1 ? 'سنة إضافية' : 'سنوات إضافية'}
                                  </p>
                                </div>
                              </>
                            )}

                            {/* الإجمالي */}
                            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-3 border-2 border-gray-300">
                              <p className="text-[10px] font-medium text-gray-600 text-center mb-1">الإجمالي الكلي</p>
                              <p className="text-3xl lg:text-4xl font-black text-gray-800 text-center leading-none">
                                {totalYears}
                              </p>
                              <p className="text-[11px] font-bold text-gray-600 text-center mt-1">
                                {totalYears === 1 ? 'سنة' : 'سنوات'}
                              </p>
                            </div>
                          </div>

                          {/* قسم السعر */}
                          <div
                            className="px-3 py-3 rounded-b-2xl text-center border-t-2"
                            style={{
                              background: isSelected
                                ? 'linear-gradient(to bottom, #dcfce7, #bbf7d0)'
                                : isRecommended
                                  ? 'linear-gradient(to bottom, #fef3c7, #fde68a)'
                                  : 'linear-gradient(to bottom, #f9fafb, #f3f4f6)',
                              borderTopColor: isSelected ? '#86efac' : isRecommended ? '#fcd34d' : '#e5e7eb'
                            }}
                          >
                            <p className={`text-base lg:text-lg font-black leading-none ${
                              isSelected ? 'text-green-700' : isRecommended ? 'text-amber-700' : 'text-gray-800'
                            }`}>
                              {contract.investor_price} ریال
                            </p>
                            <p className="text-[9px] lg:text-[10px] font-medium text-gray-600 mt-1">
                              للشجرة الواحدة
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* TREE SELECTOR */}
        <section>
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border-2 border-green-200 mb-2">
              <TreePine className="w-4 h-4 text-green-600" />
              <span className="font-bold text-green-900 text-sm">اختر أشجارك</span>
            </div>
            <p className="text-xs text-gray-600">حدد نوع وعدد الأشجار التي ترغب بالاستثمار فيها</p>
          </div>

          <div className="space-y-2 lg:space-y-2.5">
            {farm.treeTypes && farm.treeTypes.length > 0 ? (
              farm.treeTypes.map(type =>
                type.varieties.map(variety => {
                const selection = treeSelections[variety.id];
                const quantity = selection?.quantity || 0;
                const isSelected = quantity > 0;

                return (
                  <div key={variety.id} className="relative">
                    <div
                      className={`relative bg-white rounded-xl p-3 transition-all duration-300 ${
                        isSelected ? 'shadow-lg' : 'shadow-md hover:shadow-lg'
                      }`}
                      style={{
                        boxShadow: isSelected
                          ? '0 4px 16px rgba(16, 185, 129, 0.2), 0 0 0 2px #10b981, inset 0 1px 0 rgba(255,255,255,0.8)'
                          : '0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5)',
                        border: isSelected ? '2px solid #10b981' : '1px solid #e5e7eb'
                      }}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md flex-shrink-0">
                          <TreePine className="w-4 h-4 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{variety.name}</h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                            <span>{type.name}</span>
                            <span>•</span>
                            <span className="text-green-600 font-semibold">{variety.available} متاح</span>
                            {variety.maintenance_fee && (
                              <>
                                <span>•</span>
                                <span className="text-amber-600 font-semibold">{variety.maintenance_fee} ر.س/سنة</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div
                          className={`rounded-lg px-2 py-1 flex-shrink-0 ${
                            selectedContract ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                          style={{
                            border: selectedContract ? '1.5px solid #10b981' : '1px solid #e5e7eb'
                          }}
                        >
                          {selectedContract ? (
                            <p className="text-sm font-black text-green-700 tabular-nums">{selectedContract.investor_price}</p>
                          ) : (
                            <p className="text-[10px] font-bold text-gray-500">اختر عقد</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleTreeQuantityChange(variety, type.name, -1)}
                            disabled={quantity === 0}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                              background: 'linear-gradient(145deg, #fef2f2, #fee2e2)',
                              boxShadow: quantity > 0 ? '0 2px 4px rgba(239, 68, 68, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                              border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}
                          >
                            <Minus className="w-3.5 h-3.5 text-red-600" />
                          </button>

                          <div
                            className="rounded-lg px-2.5 py-1 min-w-[50px] text-center"
                            style={{
                              background: isSelected
                                ? 'linear-gradient(145deg, #d1fae5, #a7f3d0)'
                                : 'linear-gradient(145deg, #f9fafb, #f3f4f6)',
                              boxShadow: isSelected ? '0 2px 8px rgba(16, 185, 129, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                              border: isSelected ? '2px solid #10b981' : '1px solid #e5e7eb'
                            }}
                          >
                            <p className="text-lg font-black bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent tabular-nums leading-tight">
                              {quantity}
                            </p>
                          </div>

                          <button
                            onClick={() => handleTreeQuantityChange(variety, type.name, 1)}
                            disabled={quantity >= variety.available}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                              background: 'linear-gradient(145deg, #10b981, #059669)',
                              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                              border: '1px solid rgba(5, 150, 105, 0.5)'
                            }}
                          >
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )
            ) : (
              <div className="text-center py-8 bg-white rounded-xl">
                <p className="text-gray-600">لا توجد أشجار متاحة حالياً</p>
              </div>
            )}
          </div>

          {Object.keys(treeSelections).length > 0 && (
            <div
              className="mt-3 bg-white rounded-xl overflow-hidden"
              style={{
                boxShadow: selectedContract
                  ? '0 4px 16px rgba(16, 185, 129, 0.2), 0 0 0 2px #10b981'
                  : '0 2px 8px rgba(0,0,0,0.08)',
                border: selectedContract ? '2px solid #10b981' : '1px solid #e5e7eb'
              }}
            >
              {selectedContract ? (
                <div className="p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-600">الأشجار</p>
                        <p className="text-base font-black text-green-700">{totalTrees}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-600">السعر</p>
                        <p className="text-base font-black text-blue-700">{selectedContract.investor_price}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-white bg-green-600 rounded-t-lg px-1">الإجمالي</p>
                        <p className="text-base font-black text-green-700">{totalCost.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">اختر العقد أولاً</p>
                    <p className="text-[10px] text-gray-600">لعرض التكلفة الإجمالية</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

      </div>

      {/* STICKY BOTTOM SUMMARY BAR - ADVANCED UX */}
      {totalTrees > 0 && (
        <>
          {/* Overlay للخلفية عند التوسع */}
          {isBottomSheetExpanded && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
              onClick={() => setIsBottomSheetExpanded(false)}
            />
          )}

          {/* الشريط السفلي الثابت */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
              isBottomSheetExpanded ? 'translate-y-0' : 'translate-y-0'
            }`}
            style={{
              maxHeight: isBottomSheetExpanded ? '85vh' : 'auto'
            }}
          >
            {/* المحتوى */}
            <div className="bg-white shadow-2xl">
              {/* الحالة الموسعة - التفاصيل الكاملة */}
              {isBottomSheetExpanded && (
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                  <div className="p-5 pb-6 space-y-4">
                    {/* رأس التفاصيل */}
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <h3 className="text-lg font-bold text-gray-900">ملخص الاستثمار</h3>
                      <button
                        onClick={() => setIsBottomSheetExpanded(false)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* تفاصيل الأشجار */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TreePine className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-bold text-gray-900">الأشجار المختارة</p>
                      </div>
                      <p className="text-2xl font-black text-green-700">{totalTrees} شجرة</p>
                    </div>

                    {/* تفاصيل العقد */}
                    {selectedContract ? (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-bold text-gray-900">العقد المختار</p>
                        </div>
                        <p className="text-base font-bold text-gray-900 mb-2">{selectedContract.contract_name}</p>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-white/60 rounded-lg p-2">
                            <p className="text-xs text-gray-600">المدة</p>
                            <p className="font-bold text-gray-900">{selectedContract.duration_years} سنوات</p>
                          </div>
                          {selectedContract.bonus_years > 0 ? (
                            <div className="bg-white/60 rounded-lg p-2">
                              <p className="text-xs text-gray-600">مجاني</p>
                              <p className="font-bold text-emerald-600">+{selectedContract.bonus_years} سنوات</p>
                            </div>
                          ) : (
                            <div className="bg-white/60 rounded-lg p-2">
                              <p className="text-xs text-gray-600">النوع</p>
                              <p className="font-bold text-gray-900">إيجار سنوي</p>
                            </div>
                          )}
                        </div>

                        {selectedContract.bonus_years > 0 && (
                          <div className="mt-2 bg-emerald-100 border border-emerald-300 rounded-lg p-2">
                            <p className="text-xs text-emerald-800 leading-relaxed">
                              🎁 يشمل <span className="font-bold">{selectedContract.bonus_years} سنوات مجانية</span> كميزة عرض
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-300">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <p className="text-sm font-bold text-gray-900">اختر العقد</p>
                        </div>
                        <p className="text-xs text-gray-600">يرجى اختيار أحد العقود لإكمال الحجز</p>
                      </div>
                    )}

                    {/* السعر الإجمالي */}
                    <div className={`bg-gradient-to-r from-green-600 via-green-500 to-green-600 rounded-xl p-5 shadow-xl transition-transform duration-300 ${
                      priceUpdateAnimation ? 'scale-105' : 'scale-100'
                    }`}>
                      <p className="text-xs text-white/80 text-center mb-1">التكلفة الإجمالية</p>
                      <p className={`text-4xl font-black text-white text-center mb-1 transition-all duration-300 ${
                        priceUpdateAnimation ? 'scale-110' : 'scale-100'
                      }`}>
                        {selectedContract ? totalCost.toLocaleString() : '---'}
                      </p>
                      <p className="text-xs text-white/80 text-center">ريال سعودي</p>

                      {selectedContract && (
                        <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                          <p className="text-xs text-white/90">
                            {totalTrees} شجرة × {selectedContract.investor_price} ريال
                          </p>
                        </div>
                      )}
                    </div>

                    {/* رسوم الصيانة */}
                    {maintenanceFee > 0 && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-300">
                        <div className="flex items-start gap-2">
                          <Shield className="w-4 h-4 text-amber-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 mb-1">رسوم التشغيل والصيانة</p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {maintenanceFee.toLocaleString()} ريال سنوياً ({farm.treeTypes[0]?.varieties[0]?.maintenance_fee} ريال لكل شجرة)
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              رسوم مستقلة ولا تدخل في سعر الحجز
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* الشريط المختصر - دائماً ظاهر */}
              <div className="border-t border-gray-200 bg-white">
                <div className="p-3">
                  {/* زر الحجز */}
                  {selectedContract ? (
                    <button
                      onClick={handleSaveReservation}
                      disabled={saving}
                      className="w-full bg-gradient-to-r from-green-600 via-green-500 to-green-600 hover:from-green-700 hover:via-green-600 hover:to-green-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>جاري الحفظ...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>تأكيد الحجز • {totalCost.toLocaleString()} ريال</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const contractSection = document.getElementById('contracts-section');
                        if (contractSection) {
                          contractSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-5 h-5" />
                      <span>اختر العقد لإكمال الحجز</span>
                    </button>
                  )}
                </div>

                {/* شريط الملخص السريع */}
                {!isBottomSheetExpanded && (
                  <button
                    onClick={() => setIsBottomSheetExpanded(true)}
                    className="w-full border-t border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors py-2.5 flex items-center justify-center gap-2 text-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <TreePine className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-gray-900">{totalTrees}</span>
                      </div>
                      {selectedContract && (
                        <>
                          <div className="w-px h-4 bg-gray-300" />
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-medium transition-all duration-300 ${
                              priceUpdateAnimation ? 'text-green-600 scale-110' : 'text-gray-600'
                            }`}>
                              {totalCost.toLocaleString()} ريال
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <Sparkles className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIDEO MODAL */}
      {showVideoModal && farm?.video && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setShowVideoModal(false)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div ref={videoRef} className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <video
              src={farm.video}
              controls
              autoPlay
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
