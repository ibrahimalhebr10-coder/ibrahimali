import { useState } from 'react';
import { CheckCircle2, Award, ArrowRight, X } from 'lucide-react';
import TemporaryCertificate from './TemporaryCertificate';
import InvestorRegistrationForm from './InvestorRegistrationForm';

interface BookingSuccessScreenProps {
  reservation: {
    id: string;
    farmName: string;
    treeCount: number;
    durationYears: number;
    bonusYears: number;
    totalPrice: number;
    contractName: string;
    createdAt: string;
  };
  guestId: string;
  onRegistrationComplete: (userId: string) => void;
  onClose?: () => void;
}

export default function BookingSuccessScreen({
  reservation,
  guestId,
  onRegistrationComplete,
  onClose
}: BookingSuccessScreenProps) {
  const [showCertificate, setShowCertificate] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  if (showCertificate && !showRegistration) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-amber-50/98 via-yellow-50/95 to-orange-50/98 z-50 overflow-y-auto">
        <div className="min-h-screen p-4 flex items-center justify-center">
          <div className="max-w-2xl w-full space-y-4">
            <button
              onClick={() => setShowCertificate(false)}
              className="mb-4 p-3 bg-white/80 rounded-xl shadow-lg hover:bg-white transition-colors flex items-center gap-2 font-bold text-[#B8942F]"
            >
              <ArrowRight className="w-5 h-5" />
              <span>رجوع</span>
            </button>

            <TemporaryCertificate
              farmName={reservation.farmName}
              treeCount={reservation.treeCount}
              durationYears={reservation.durationYears}
              bonusYears={reservation.bonusYears}
              reservationId={reservation.id}
              createdAt={reservation.createdAt}
            />

            <div className="bg-white/80 rounded-xl p-4 shadow-lg">
              <p className="text-sm text-center text-gray-700 leading-relaxed">
                <span className="font-bold">ملاحظة:</span> هذه الشهادة للعرض فقط ولا يمكن تحميلها أو طباعتها حالياً.
                سيتم إصدار شهادة رسمية بعد إتمام التسجيل والسداد.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showRegistration) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-amber-50/98 via-yellow-50/95 to-orange-50/98 z-50 overflow-y-auto">
        <div className="min-h-screen p-4 flex items-center justify-center">
          <div className="max-w-md w-full">
            {onClose && (
              <button
                onClick={onClose}
                className="mb-4 p-3 bg-white/80 rounded-xl shadow-lg hover:bg-white transition-colors flex items-center gap-2 font-bold text-gray-700"
              >
                <X className="w-5 h-5" />
                <span>إلغاء</span>
              </button>
            )}

            <InvestorRegistrationForm
              guestId={guestId}
              onSuccess={onRegistrationComplete}
              onCancel={() => setShowRegistration(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50/98 via-yellow-50/95 to-orange-50/98 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-lg w-full space-y-6">
          {onClose && (
            <button
              onClick={onClose}
              className="p-3 bg-white/80 rounded-xl shadow-lg hover:bg-white transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          )}

          <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-[#D4AF37]/30 space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-[#B8942F]">
                  تم تثبيت حجز مزرعتك الاستثمارية بنجاح
                </h1>
                <p className="text-sm text-gray-600">حجزك محفوظ ومؤمّن في النظام</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 space-y-4 border-2 border-[#D4AF37]/30">
              <h3 className="text-lg font-bold text-[#B8942F] text-center border-b-2 border-[#D4AF37]/30 pb-3">
                تفاصيل الحجز
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">المزرعة</span>
                  <span className="text-base font-bold text-[#B8942F]">{reservation.farmName}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">العقد</span>
                  <span className="text-base font-bold text-[#B8942F]">{reservation.contractName}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">عدد الأشجار</span>
                  <span className="text-xl font-bold text-green-700">{reservation.treeCount} شجرة</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">مدة الاستثمار</span>
                  <span className="text-base font-bold text-blue-700">
                    {reservation.durationYears} سنوات
                    {reservation.bonusYears > 0 && (
                      <span className="text-green-600 mr-1">+{reservation.bonusYears}</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t-2 border-[#D4AF37]/30">
                  <span className="text-base font-bold text-gray-700">الإجمالي</span>
                  <span className="text-2xl font-bold text-[#D4AF37]">
                    {reservation.totalPrice.toLocaleString()} ر.س
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 space-y-4">
              <div className="flex items-center gap-3 justify-center">
                <Award className="w-8 h-8 text-[#D4AF37]" />
                <h3 className="text-lg font-bold text-[#B8942F]">شهادة استثمار مؤقتة</h3>
              </div>

              <p className="text-sm text-center text-gray-700 leading-relaxed">
                يمكنك الآن عرض شهادتك المؤقتة داخل التطبيق
              </p>

              <button
                onClick={() => setShowCertificate(true)}
                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8942F] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Award className="w-5 h-5" />
                <span>عرض الشهادة</span>
              </button>

              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-amber-800 text-center font-semibold">
                  ⚠ عرض فقط داخل التطبيق • لا تحميل • لا طباعة
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 space-y-4 text-center">
              <h3 className="text-lg font-bold text-purple-800">
                حتى تضم مزرعتك إلى حسابك
              </h3>
              <p className="text-base font-bold text-[#B8942F]">
                بقي عليك إنشاء حساب المستثمر
              </p>

              <button
                onClick={() => setShowRegistration(true)}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                <span>إنشاء حساب المستثمر</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
