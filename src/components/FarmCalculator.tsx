import { useState, useMemo } from 'react';
import { X, ChevronLeft, Check, Calendar, Gift, Handshake, ShoppingBasket, Info, Plus, Minus } from 'lucide-react';
import { treeTypes, durationOptions, TreeType } from '../data/treeTypes';

interface SelectedTree {
  treeType: TreeType;
  quantity: number;
}

interface FarmCalculatorProps {
  onClose: () => void;
  onComplete: (data: {
    duration: number;
    trees: SelectedTree[];
    totalPrice: number;
    freeDuration: number;
    totalDuration: number;
  }) => void;
}

export default function FarmCalculator({ onClose, onComplete }: FarmCalculatorProps) {
  const [duration, setDuration] = useState(3);
  const [selectedTrees, setSelectedTrees] = useState<Map<string, number>>(new Map());

  const calculations = useMemo(() => {
    let totalPrice = 0;
    let totalFreeDuration = 0;
    let totalTrees = 0;
    const selectedTreesData: SelectedTree[] = [];
    const operatingFees: { name: string; fee: number }[] = [];

    selectedTrees.forEach((quantity, treeId) => {
      const treeType = treeTypes.find(t => t.id === treeId);
      if (treeType && quantity > 0) {
        totalPrice += treeType.price * quantity;
        const treeFree = treeType.freeDuration[duration] || 0;
        totalFreeDuration = Math.max(totalFreeDuration, treeFree);
        totalTrees += quantity;
        selectedTreesData.push({ treeType, quantity });
        operatingFees.push({
          name: `${treeType.name} ${treeType.subtitle}`,
          fee: treeType.operatingFee
        });
      }
    });

    const totalDuration = duration + totalFreeDuration;
    const yearlyAverage = totalDuration > 0 ? Math.round(totalPrice / totalDuration) : 0;

    let farmType = 'حديقة صغيرة';
    if (totalTrees >= 50) farmType = 'مزرعة';
    else if (totalTrees >= 20) farmType = 'بستان';
    else if (totalTrees >= 10) farmType = 'حديقة';

    return {
      totalPrice,
      totalFreeDuration,
      totalDuration,
      yearlyAverage,
      totalTrees,
      farmType,
      selectedTreesData,
      operatingFees
    };
  }, [duration, selectedTrees]);

  const toggleTree = (treeId: string) => {
    const newSelection = new Map(selectedTrees);
    if (newSelection.has(treeId)) {
      newSelection.delete(treeId);
    } else {
      newSelection.set(treeId, 1);
    }
    setSelectedTrees(newSelection);
  };

  const updateQuantity = (treeId: string, change: number) => {
    const newSelection = new Map(selectedTrees);
    const current = newSelection.get(treeId) || 0;
    const newValue = Math.max(0, current + change);

    if (newValue === 0) {
      newSelection.delete(treeId);
    } else {
      newSelection.set(treeId, newValue);
    }

    setSelectedTrees(newSelection);
  };

  const handleComplete = () => {
    if (calculations.totalTrees === 0) return;

    onComplete({
      duration,
      trees: calculations.selectedTreesData,
      totalPrice: calculations.totalPrice,
      freeDuration: calculations.totalFreeDuration,
      totalDuration: calculations.totalDuration
    });
  };

  const sliderPosition = durationOptions.indexOf(duration);
  const sliderPercentage = (sliderPosition / (durationOptions.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
      <div
        className="h-full w-full overflow-y-auto"
        style={{
          background: 'linear-gradient(to bottom, #F5F1E8 0%, #E8E0D0 100%)'
        }}
      >
        <div
          className="fixed inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=1920)',
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom'
          }}
        />

        <div className="sticky top-0 z-20 bg-transparent">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-[#2F3E36]">حاسبة المزرعة</h1>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="relative z-10 px-4 pb-8">
          {/* 1. قسم اختيار مدة العقد */}
          <div
            className="rounded-3xl p-5 mb-4"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,248,243,0.95) 100%)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(200,190,170,0.3)'
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-lg font-bold text-[#2F3E36]">اختر مدة عقد الانتفاع</span>
              <span className="text-xl">🌿</span>
            </div>
            <p className="text-center text-sm text-[#6B7B6E] mb-6 flex items-center justify-center gap-1">
              <span>اختر المدة التي تحب تأسيس مزرعتك فيها</span>
              <span className="text-base">🌿</span>
            </p>

            <div className="relative px-2 mb-2">
              <div className="relative h-1 bg-[#D4C9B8] rounded-full">
                <div
                  className="absolute h-full rounded-full"
                  style={{
                    width: `${sliderPercentage}%`,
                    background: 'linear-gradient(90deg, #C9B896 0%, #A69578 100%)'
                  }}
                />
                <div className="absolute inset-0 flex justify-between items-center">
                  {durationOptions.map((d, idx) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx <= sliderPosition ? 'bg-[#8B7B5E]' : 'bg-[#C8BCA8]'
                      }`}
                    />
                  ))}
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300"
                  style={{ left: `${sliderPercentage}%` }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                    style={{
                      background: 'linear-gradient(145deg, #C9A86C 0%, #8B7355 100%)',
                      boxShadow: '0 2px 8px rgba(139,115,85,0.4)'
                    }}
                  >
                    {duration}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-4 text-xs font-medium text-[#6B7B6E]">
                <span>1 سنة</span>
                <span>2 سنوات</span>
                <span>3 سنوات</span>
                <span>5 سنوات</span>
                <span>10 سنوات</span>
              </div>
            </div>
          </div>

          {/* 2. قسم اختيار أنواع الأشجار */}
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-xl">🌳</span>
              <span className="text-lg font-bold text-[#2F3E36]">نوع الأشجار</span>
              <span className="text-xl">🌳</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {treeTypes.map((tree) => {
                const isSelected = selectedTrees.has(tree.id);
                const quantity = selectedTrees.get(tree.id) || 0;
                const freeDuration = tree.freeDuration[duration] || 0;

                return (
                  <div
                    key={tree.id}
                    className="relative rounded-2xl overflow-hidden transition-all duration-200"
                    style={{
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,248,243,0.95) 100%)',
                      boxShadow: isSelected
                        ? '0 4px 16px rgba(47,62,54,0.15), inset 0 0 0 2px #4A5D52'
                        : '0 2px 12px rgba(0,0,0,0.06)',
                      border: isSelected ? 'none' : '1px solid rgba(200,190,170,0.3)'
                    }}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#4A5D52] flex items-center justify-center z-10">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <button
                      onClick={() => !isSelected && toggleTree(tree.id)}
                      className="w-full p-3"
                    >
                      <div className="w-full h-20 mb-2 flex items-center justify-center">
                        <img
                          src={tree.id.includes('olive')
                            ? 'https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=200'
                            : 'https://images.pexels.com/photos/2090651/pexels-photo-2090651.jpeg?auto=compress&cs=tinysrgb&w=200'
                          }
                          alt={tree.name}
                          className="h-full w-auto object-contain rounded-lg"
                        />
                      </div>

                      <h3 className="font-bold text-[#2F3E36] text-sm text-center">{tree.name}</h3>
                      <p className="text-xs text-[#6B7B6E] text-center mb-2">{tree.subtitle}</p>

                      {freeDuration > 0 ? (
                        <div
                          className="rounded-lg py-1 px-2 mb-2"
                          style={{ background: 'rgba(201,168,108,0.2)' }}
                        >
                          <p className="text-xs font-bold text-[#8B7355] text-center">
                            {freeDuration} {freeDuration === 1 ? 'سنة مجاناً' : 'سنوات مجاناً'}
                          </p>
                        </div>
                      ) : (
                        <div
                          className="rounded-lg py-1 px-2 mb-2"
                          style={{ background: 'rgba(107,123,110,0.1)' }}
                        >
                          <p className="text-xs text-[#6B7B6E] text-center">
                            لا يوجد
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm font-bold text-[#4A5D52]">{tree.price}</span>
                        <span className="text-xs text-[#6B7B6E]">ر.س</span>
                        <span className="text-lg">🌿</span>
                      </div>
                    </button>

                    {/* 3. قسم تحديد عدد الأشجار لكل نوع */}
                    {isSelected && (
                      <div className="px-3 pb-3">
                        <div
                          className="flex items-center justify-center gap-3 rounded-xl py-2"
                          style={{ background: 'rgba(74,93,82,0.08)' }}
                        >
                          <button
                            onClick={() => updateQuantity(tree.id, -1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95"
                            style={{
                              background: 'linear-gradient(145deg, #E8E0D0 0%, #D4C9B8 100%)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            <Minus className="w-4 h-4 text-[#6B7B6E]" />
                          </button>
                          <span className="font-bold text-lg text-[#2F3E36] min-w-[40px] text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(tree.id, 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95"
                            style={{
                              background: 'linear-gradient(145deg, #4A5D52 0%, #3A4A42 100%)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {calculations.totalTrees > 0 && (
            <>
              {/* 4. عرض المدة المجانية */}
              <div
                className="rounded-2xl p-4 mb-4 flex items-center gap-4"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,248,243,0.95) 100%)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(200,190,170,0.3)'
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(201,168,108,0.15)' }}
                >
                  <Calendar className="w-7 h-7 text-[#8B7355]" />
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-[#2F3E36]">
                      {calculations.totalFreeDuration > 0
                        ? `${calculations.totalFreeDuration} ${calculations.totalFreeDuration === 1 ? 'سنة' : 'سنوات'} تشجيعية`
                        : 'لا توجد مدة مجانية'}
                    </span>
                    {calculations.totalFreeDuration > 0 && <span className="text-lg text-green-600">✓</span>}
                  </div>
                  <div className="text-sm text-[#6B7B6E] space-y-1">
                    <p>مدة العقد: <span className="font-bold text-[#2F3E36]">{duration} {duration === 1 ? 'سنة' : 'سنوات'}</span></p>
                    {calculations.totalFreeDuration > 0 && (
                      <p>المدة المجانية: <span className="font-bold text-[#C9A86C]">{calculations.totalFreeDuration} {calculations.totalFreeDuration === 1 ? 'سنة' : 'سنوات'}</span></p>
                    )}
                    <p>إجمالي مدة الانتفاع: <span className="font-bold text-[#4A5D52]">{calculations.totalDuration} {calculations.totalDuration === 1 ? 'سنة' : 'سنوات'}</span></p>
                  </div>
                </div>
              </div>

              {/* 5. عرض السعر الإجمالي + متوسط التكلفة السنوية */}
              <div
                className="rounded-2xl p-4 mb-4"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,248,243,0.95) 100%)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(200,190,170,0.3)'
                }}
              >
                <div className="text-center mb-4">
                  <p className="text-sm text-[#6B7B6E] mb-1">السعر الإجمالي</p>
                  <p className="text-3xl font-bold text-[#2F3E36]">
                    {calculations.totalPrice.toLocaleString()} <span className="text-lg">ر.س</span>
                  </p>
                </div>

                <div
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(201,168,108,0.15)' }}
                >
                  <p className="text-sm text-[#6B7B6E] mb-1">متوسط التكلفة السنوية</p>
                  <p className="text-xl font-bold text-[#8B7355]">
                    {calculations.yearlyAverage.toLocaleString()} <span className="text-sm">ر.س / سنة</span>
                  </p>
                  <p className="text-xs text-[#6B7B6E] mt-1">
                    (بعد احتساب المدة المجانية)
                  </p>
                </div>
              </div>

              {/* 6. ملخص التأسيس */}
              <div
                className="rounded-2xl p-4 mb-4"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,248,243,0.95) 100%)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(200,190,170,0.3)'
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-lg">🌻</span>
                  <span className="text-base font-bold text-[#2F3E36]">بهذا الاختيار أنت تؤسس</span>
                  <span className="text-lg">🌿</span>
                </div>
                <p className="text-center text-xl font-bold text-[#2F3E36] mb-4 flex items-center justify-center gap-2">
                  <span>{calculations.farmType}</span>
                  <span className="text-xl">🌿</span>
                </p>

                {/* ملخص الأشجار */}
                <div className="space-y-2 mb-4">
                  {calculations.selectedTreesData.map(({ treeType, quantity }) => (
                    <div
                      key={treeType.id}
                      className="flex justify-between items-center gap-3 px-3 py-2 rounded-lg overflow-x-auto"
                      style={{ background: 'rgba(74,93,82,0.05)' }}
                    >
                      <span className="text-sm text-[#6B7B6E] whitespace-nowrap">{treeType.name} {treeType.subtitle}</span>
                      <span className="font-bold text-[#2F3E36] flex-shrink-0">{quantity} شجرة</span>
                    </div>
                  ))}
                  <div
                    className="flex justify-between items-center px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(74,93,82,0.1)' }}
                  >
                    <span className="font-bold text-[#2F3E36]">إجمالي الأشجار</span>
                    <span className="font-bold text-lg text-[#4A5D52]">{calculations.totalTrees} شجرة</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: <Gift className="w-5 h-5" />, label: 'إهداء' },
                    { icon: <Handshake className="w-5 h-5" />, label: 'تفارل' },
                    { icon: <ShoppingBasket className="w-5 h-5" />, label: 'حصاد منزلي' },
                    { icon: <span className="text-xl">🫒</span>, label: 'بيع المحصول' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(201,168,108,0.15)' }}
                      >
                        <span className="text-[#8B7355]">{item.icon}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#2F3E36] text-center">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. رسوم التشغيل (معلومة فقط) */}
              <div
                className="rounded-2xl p-4 mb-4"
                style={{
                  background: 'rgba(107,123,110,0.05)',
                  border: '1px solid rgba(107,123,110,0.2)'
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-[#6B7B6E]" />
                  <span className="font-bold text-[#2F3E36]">رسوم التشغيل السنوية (تقديرية)</span>
                </div>
                <div className="space-y-2">
                  {calculations.operatingFees.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-[#6B7B6E]">{item.name}</span>
                      <span className="font-bold text-[#2F3E36]">{item.fee} ر.س / شجرة</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#6B7B6E] mt-3 text-center">
                  تُحسب لاحقاً عند تفعيل المزرعة
                </p>
              </div>

              {/* 8. زر أكمل تأسيس مزرعتك */}
              <button
                onClick={handleComplete}
                className="w-full py-4 rounded-full font-bold text-base text-white mb-3 transition-all active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(145deg, #D4B56A 0%, #A08040 50%, #8B7030 100%)',
                  boxShadow: '0 4px 16px rgba(160,128,64,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  border: '2px solid #C9A050'
                }}
              >
                أكمل تأسيس مزرعتك
              </button>

              <p className="text-center text-sm text-[#6B7B6E] mb-2">
                لا يوجد دفع في هذه المرحلة
              </p>
            </>
          )}

          {calculations.totalTrees === 0 && (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,248,243,0.95) 100%)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '2px dashed rgba(107,123,110,0.3)'
              }}
            >
              <div className="text-5xl mb-3">🌱</div>
              <p className="text-base font-medium text-[#6B7B6E]">
                اختر نوع الأشجار لبدء حساب مزرعتك
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
