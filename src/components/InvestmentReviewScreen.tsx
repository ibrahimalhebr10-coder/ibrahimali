import { ArrowLeft, MapPin, Calendar, DollarSign, Clock, Gift } from 'lucide-react';

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
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50/98 via-yellow-50/95 to-orange-50/98 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-lg w-full space-y-4">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="p-3 bg-white/80 rounded-xl shadow-lg hover:bg-white transition-colors flex items-center gap-2 font-bold text-[#B8942F] disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>رجوع</span>
          </button>

          <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-[#D4AF37]/30 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8942F] rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#B8942F]">
                ملخص استثمار أشجارك
              </h1>
              <p className="text-sm text-gray-600">
                راجع تفاصيل استثمارك قبل التأكيد
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 space-y-4 border-2 border-[#D4AF37]/30">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/30">
                  <span className="text-sm font-semibold text-gray-600">المزرعة</span>
                  <div className="text-right">
                    <p className="text-base font-bold text-[#B8942F]">{farmName}</p>
                    {farmLocation && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{farmLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/30">
                  <span className="text-sm font-semibold text-gray-600">نوع العقد</span>
                  <span className="text-base font-bold text-[#B8942F]">{contractName}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/30">
                  <span className="text-sm font-semibold text-gray-600">عدد الأشجار</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-700">{treeCount} شجرة</p>
                    <p className="text-xs text-gray-500">{calculatedPricePerTree.toLocaleString()} ر.س للشجرة</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/30">
                  <span className="text-sm font-semibold text-gray-600">مدة الاستثمار</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-base font-bold text-blue-700">
                      {durationYears} سنوات
                    </span>
                    {bonusYears > 0 && (
                      <div className="flex items-center gap-1 bg-green-100 rounded-full px-2 py-1">
                        <Gift className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-bold text-green-700">+{bonusYears}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 bg-gradient-to-r from-[#D4AF37]/20 to-[#B8942F]/10 rounded-lg p-4">
                  <span className="text-base font-bold text-gray-700">المبلغ الإجمالي</span>
                  <span className="text-3xl font-bold text-[#D4AF37]">
                    {totalPrice.toLocaleString()} ر.س
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-bold">ملاحظة مهمة:</span>
              </div>
              <p className="text-sm text-blue-700 leading-relaxed">
                بعد تأكيد الاستثمار والدفع، سيتم تفعيل أشجارك مباشرة وستبدأ رحلتك الاستثمارية معنا.
              </p>
            </div>

            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري التأكيد...</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  <span>تأكيد استثمار أشجارك والدفع</span>
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-500">
              بالمتابعة، أنت توافق على الشروط والأحكام الخاصة بالمنصة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
