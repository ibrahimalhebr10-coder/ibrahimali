import { ArrowLeft, MapPin, Calendar, Clock, Gift, Sprout, Leaf, TreePine, CheckCircle2, Sparkles } from 'lucide-react';

interface AgriculturalReviewScreenProps {
  farmName: string;
  farmLocation?: string;
  contractName: string;
  durationYears: number;
  bonusYears: number;
  treeCount: number;
  totalPrice: number;
  pricePerTree?: number;
  onConfirm: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function AgriculturalReviewScreen({
  farmName,
  farmLocation,
  contractName,
  durationYears,
  bonusYears,
  treeCount,
  totalPrice,
  pricePerTree,
  onConfirm,
  onBack,
  isLoading = false
}: AgriculturalReviewScreenProps) {
  const calculatedPricePerTree = pricePerTree || (treeCount > 0 ? Math.round(totalPrice / treeCount) : 0);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 z-50 overflow-y-auto">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-emerald-100/50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-emerald-700">مراجعة الحجز</span>
            <span className="text-xs text-emerald-600">الخطوة 1 من 3</span>
          </div>
          <div className="relative h-2 bg-emerald-100/50 rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-700 ease-out"
                 style={{ width: '33.33%' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen p-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-5 animate-fade-in-up">
          {/* Back Button */}
          <button
            onClick={onBack}
            disabled={isLoading}
            className="group p-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-bold text-emerald-700 disabled:opacity-50 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>رجوع</span>
          </button>

          {/* Main Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-100/50 overflow-hidden">
            {/* Header Section */}
            <div className="relative bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 p-8 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

              <div className="relative text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl shadow-lg transform hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <TreePine className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    ملخص الانتفاع بالأشجار
                  </h1>
                  <p className="text-emerald-100 text-sm">
                    راجع تفاصيل أشجارك الزراعية قبل التأكيد
                  </p>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="p-6 space-y-5">
              {/* Farm Details Card */}
              <div className="group bg-gradient-to-br from-emerald-50/50 to-green-50/50 rounded-2xl p-5 border border-emerald-100/50 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">المزرعة</p>
                      <p className="text-lg font-bold text-emerald-900">{farmName}</p>
                    </div>
                  </div>
                  {farmLocation && (
                    <span className="text-xs text-gray-500 bg-white rounded-lg px-3 py-1.5 border border-gray-200">
                      {farmLocation}
                    </span>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contract Type */}
                <div className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">نوع العقد</p>
                      <p className="text-base font-bold text-gray-900">{contractName}</p>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">مدة العقد</p>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-gray-900">{durationYears} سنوات</p>
                        {bonusYears > 0 && (
                          <span className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                            <Gift className="w-3 h-3" />
                            +{bonusYears}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trees Count - Highlighted */}
              <div className="relative bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl p-6 text-white overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sprout className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-emerald-100 text-sm font-medium mb-1">عدد الأشجار</p>
                      <p className="text-3xl font-bold">{treeCount} شجرة</p>
                      <p className="text-emerald-100 text-xs mt-1">
                        {calculatedPricePerTree.toLocaleString()} ر.س للشجرة الواحدة
                      </p>
                    </div>
                  </div>
                  <Sparkles className="w-8 h-8 text-white/30 group-hover:text-white/50 transition-colors" />
                </div>
              </div>

              {/* Total Price */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-700">المبلغ الإجمالي</span>
                  <div className="text-right">
                    <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      {totalPrice.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">ريال سعودي</p>
                  </div>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-200/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-400/20 rounded-lg flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-bold text-amber-900">مزايا أشجارك الخضراء</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 group">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      ستحصل على محصول أشجارك بالكامل كل موسم
                    </p>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      يمكنك متابعة محصولك عن طريق تشغيل المنصة
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <TreePine className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="font-bold text-emerald-900">ملاحظة مهمة</span>
                </div>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  بعد تأكيدك طلب اشجارك، ستصبح منتفعاً رسمياً لأشجارك وستبدأ رحلتك الزراعية معنا. ستحصل على محصول أشجارك بالكامل.
                </p>
              </div>

              {/* Confirm Button */}
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="relative w-full py-5 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                style={{ backgroundSize: '200% 100%' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-lg">جاري التأكيد...</span>
                    </>
                  ) : (
                    <>
                      <Sprout className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      <span className="text-lg">تأكيد ضم أشجارك إلى مزرعتك الآن</span>
                    </>
                  )}
                </div>
              </button>

              {/* Terms */}
              <p className="text-xs text-center text-gray-500 leading-relaxed">
                بالمتابعة، أنت توافق على الشروط والأحكام الخاصة بالمنصة
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
