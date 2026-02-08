import { ArrowLeft, MapPin, Calendar, TrendingUp, Clock, Gift, Sparkles, CheckCircle2, Coins, Target } from 'lucide-react';

interface InvestmentReviewScreenProps {
  farmName: string;
  farmLocation?: string;
  packageName?: string;
  contractName: string;
  durationYears: number;
  bonusYears: number;
  treeCount: number;
  totalPrice: number;
  pricePerTree?: number;
  treeVarieties?: any[];
  onConfirm: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function InvestmentReviewScreen({
  farmName,
  farmLocation,
  packageName,
  contractName,
  durationYears,
  bonusYears,
  treeCount,
  totalPrice,
  pricePerTree,
  treeVarieties,
  onConfirm,
  onBack,
  isLoading = false
}: InvestmentReviewScreenProps) {
  const calculatedPricePerTree = pricePerTree || (treeCount > 0 ? Math.round(totalPrice / treeCount) : 0);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 z-50 overflow-y-auto">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-amber-100/50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-amber-700">مراجعة الاستثمار</span>
            <span className="text-xs text-amber-600">الخطوة 1 من 3</span>
          </div>
          <div className="relative h-2 bg-amber-100/50 rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-full transition-all duration-700 ease-out"
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
            className="group p-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-bold text-amber-700 disabled:opacity-50 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>رجوع</span>
          </button>

          {/* Main Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-100/50 overflow-hidden">
            {/* Header Section - Golden Theme */}
            <div className="relative bg-gradient-to-br from-amber-600 via-yellow-600 to-orange-600 p-8 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

              {/* Floating particles effect */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 right-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <div className="absolute top-20 right-32 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="absolute top-32 right-20 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              </div>

              <div className="relative text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl shadow-lg transform hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <TrendingUp className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    ملخص استثمار أشجارك
                  </h1>
                  <p className="text-amber-100 text-sm">
                    راجع تفاصيل استثمارك قبل التأكيد
                  </p>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="p-6 space-y-5">
              {/* Farm Details Card */}
              <div className="group bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-2xl p-5 border border-amber-100/50 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-amber-600/10 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">المزرعة الاستثمارية</p>
                      <p className="text-lg font-bold text-amber-900">{farmName}</p>
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
                <div className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">نوع العقد</p>
                      <p className="text-base font-bold text-gray-900">{contractName}</p>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">مدة الاستثمار</p>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-gray-900">{durationYears} سنوات</p>
                        {bonusYears > 0 && (
                          <span className="flex items-center gap-1 bg-gradient-to-r from-emerald-400 to-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                            <Gift className="w-3 h-3" />
                            +{bonusYears}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trees Count - Golden Highlighted */}
              <div className="relative bg-gradient-to-br from-amber-600 via-yellow-600 to-orange-600 rounded-2xl p-6 text-white overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Coins className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-amber-100 text-sm font-medium mb-1">عدد الأشجار الاستثمارية</p>
                      <p className="text-3xl font-bold">{treeCount} شجرة</p>
                      <p className="text-amber-100 text-xs mt-1">
                        {calculatedPricePerTree.toLocaleString()} ر.س للشجرة الواحدة
                      </p>
                    </div>
                  </div>
                  <Sparkles className="w-8 h-8 text-white/30 group-hover:text-white/50 transition-colors" />
                </div>
              </div>

              {/* Total Investment Amount */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-amber-200 overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400"></div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-700">قيمة الاستثمار</span>
                  <div className="text-right">
                    <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent">
                      {totalPrice.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">ريال سعودي</p>
                  </div>
                </div>
              </div>

              {/* Investment Benefits Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-400/20 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-bold text-blue-900">مزايا أشجارك الذهبية</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 group">
                    <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform shadow-md">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm text-blue-900 leading-relaxed">
                      استثمار مضمون بعوائد سنوية محددة
                    </p>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform shadow-md">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm text-blue-900 leading-relaxed">
                      متابعة استثمارك ومحصولك عبر المنصة
                    </p>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform shadow-md">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm text-blue-900 leading-relaxed">
                      تحصل على أرباحك بشكل دوري حسب دورة الاستثمار
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-bold text-amber-900">ملاحظة مهمة</span>
                </div>
                <p className="text-sm text-amber-800 leading-relaxed">
                  بعد تأكيد الاستثمار والدفع، سيتم تفعيل أشجارك الذهبية مباشرة وستبدأ رحلتك الاستثمارية معنا. ستحصل على عوائد استثمارية منتظمة.
                </p>
              </div>

              {/* Confirm Button - Golden */}
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="relative w-full py-5 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
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
                      <TrendingUp className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span className="text-lg">تأكيد استثمار أشجارك والانتقال للدفع</span>
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
