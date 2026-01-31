import { ArrowLeft, MapPin, Calendar, Clock, Gift, Sprout, Leaf, TreePine } from 'lucide-react';

interface AgriculturalReviewScreenProps {
  farmName: string;
  farmLocation?: string;
  contractName: string;
  durationYears: number;
  bonusYears: number;
  treeCount: number;
  totalPrice: number;
  pricePerTree: number;
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
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50/98 via-emerald-50/95 to-teal-50/98 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-lg w-full space-y-4">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="p-3 bg-white/80 rounded-xl shadow-lg hover:bg-white transition-colors flex items-center gap-2 font-bold text-green-700 disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>رجوع</span>
          </button>

          <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-green-600/30 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <TreePine className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-green-800">
                ملخص امتلاك أشجارك
              </h1>
              <p className="text-sm text-gray-600">
                راجع تفاصيل أشجارك الزراعية قبل التأكيد
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 space-y-4 border-2 border-green-600/30">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-green-600/30">
                  <span className="text-sm font-semibold text-gray-600">المزرعة</span>
                  <div className="text-right">
                    <p className="text-base font-bold text-green-800">{farmName}</p>
                    {farmLocation && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{farmLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-green-600/30">
                  <span className="text-sm font-semibold text-gray-600">نوع العقد</span>
                  <span className="text-base font-bold text-green-800">{contractName}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-green-600/30">
                  <span className="text-sm font-semibold text-gray-600">عدد الأشجار</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-700">{treeCount} شجرة</p>
                    <p className="text-xs text-gray-500">{pricePerTree.toLocaleString()} ر.س للشجرة</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-green-600/30">
                  <span className="text-sm font-semibold text-gray-600">مدة العقد الزراعي</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-base font-bold text-green-700">
                      {durationYears} سنوات
                    </span>
                    {bonusYears > 0 && (
                      <div className="flex items-center gap-1 bg-amber-100 rounded-full px-2 py-1">
                        <Gift className="w-3 h-3 text-amber-600" />
                        <span className="text-xs font-bold text-amber-700">+{bonusYears}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 bg-gradient-to-r from-green-600/20 to-emerald-600/10 rounded-lg p-4">
                  <span className="text-base font-bold text-gray-700">المبلغ الإجمالي</span>
                  <span className="text-3xl font-bold text-green-700">
                    {totalPrice.toLocaleString()} ر.س
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border-2 border-amber-200">
              <div className="flex items-center gap-2 text-sm text-amber-900 mb-3">
                <Sprout className="w-4 h-4" />
                <span className="font-bold">محصولك الزراعي:</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <Leaf className="w-3.5 h-3.5 text-green-600" />
                  <span>ستحصل على محصول أشجارك بالكامل كل موسم</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <Calendar className="w-3.5 h-3.5 text-green-600" />
                  <span>يمكنك حصاد محصولك بنفسك أو من خلال المزرعة</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-5 border-2 border-green-200">
              <div className="flex items-center gap-2 text-sm text-green-800 mb-2">
                <TreePine className="w-4 h-4" />
                <span className="font-bold">ملاحظة مهمة:</span>
              </div>
              <p className="text-sm text-green-700 leading-relaxed">
                بعد تأكيد الامتلاك والدفع، ستصبح مالكاً رسمياً لأشجارك وستبدأ رحلتك الزراعية معنا. ستحصل على محصول أشجارك بالكامل.
              </p>
            </div>

            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري التأكيد...</span>
                </>
              ) : (
                <>
                  <Sprout className="w-5 h-5" />
                  <span>تأكيد امتلاك أشجارك والدفع</span>
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
