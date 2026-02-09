import { useState, useEffect } from 'react';
import { CheckCircle2, Award, ArrowRight, X, FileText } from 'lucide-react';
import InvestmentContract from './InvestmentContract';
import InvestorRegistrationForm from './InvestorRegistrationForm';
import InvestorWelcomeScreen from './InvestorWelcomeScreen';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [investorName, setInvestorName] = useState('');

  const handleRegistrationSuccess = async (userId: string) => {
    if (user) {
      const fullName = user.user_metadata?.full_name || 'المستثمر';
      setInvestorName(fullName);
      setShowRegistration(false);
      setShowWelcome(true);
    }
  };

  const handleGoToAccount = () => {
    onRegistrationComplete('');
  };

  if (showWelcome) {
    return (
      <InvestorWelcomeScreen
        investorName={investorName}
        onGoToAccount={handleGoToAccount}
      />
    );
  }

  if (showRegistration) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-amber-50/98 via-yellow-50/95 to-orange-50/98 z-50 overflow-y-auto">
        <div className="w-full max-w-md mx-auto py-8 px-4">
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
            onSuccess={handleRegistrationSuccess}
            onCancel={() => setShowRegistration(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50/98 via-yellow-50/95 to-orange-50/98 z-50 overflow-y-auto">
      <div className="w-full max-w-lg mx-auto py-8 px-4 space-y-6">
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
                  تم تفعيل استثمار أشجارك بنجاح
                </h1>
                <p className="text-base font-semibold text-green-700">أصبحت الآن مستثمرًا زراعيًا معنا</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 space-y-4 border-2 border-[#D4AF37]/30">
              <h3 className="text-lg font-bold text-[#B8942F] text-center border-b-2 border-[#D4AF37]/30 pb-3">
                تفاصيل الاستثمار
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

            <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#B8942F]/10 rounded-xl p-6 border-2 border-[#D4AF37] space-y-4">
              <div className="flex items-center gap-3 justify-center">
                <FileText className="w-8 h-8 text-[#D4AF37]" />
                <h3 className="text-lg font-bold text-[#B8942F]">عقدك الرسمي</h3>
              </div>

              <p className="text-sm text-center text-gray-700 leading-relaxed">
                سيتم إصدار عقد الاستثمار الرسمي مباشرة بعد إتمام التسجيل والدفع
              </p>

              <div className="bg-white/80 rounded-lg p-4 border-2 border-[#D4AF37]/30">
                <p className="text-xs text-[#B8942F] text-center font-semibold leading-relaxed">
                  عقد رسمي • قابل للطباعة • قابل للتحميل PDF
                  <br />
                  سيكون متاح في حسابك فوراً بعد الدفع
                </p>
              </div>
            </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 space-y-4 text-center">
            <h3 className="text-lg font-bold text-green-800">
              الخطوة التالية
            </h3>
            <p className="text-base font-bold text-[#B8942F]">
              أنشئ حساب المستثمر وأكمل الدفع
            </p>
            <p className="text-sm text-gray-700">
              بعد الدفع، سيصبح عقدك الرسمي جاهزاً للعرض والتحميل
            </p>

            <button
              onClick={() => setShowRegistration(true)}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              <span>إنشاء حساب المستثمر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
