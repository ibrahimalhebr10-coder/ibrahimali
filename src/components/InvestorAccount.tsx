import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  investorJourneyService,
  InvestorJourneyState,
  InvestorReservation
} from '../services/investorJourneyService';
import {
  TreePine,
  Clock,
  CheckCircle2,
  FileCheck,
  Sprout,
  XCircle,
  Loader2,
  ArrowRight,
  Calendar,
  DollarSign,
  MapPin,
  TrendingUp,
  AlertCircle,
  Sparkles,
  CreditCard
} from 'lucide-react';
import PaymentPage from './PaymentPage';

export default function InvestorAccount() {
  const { user } = useAuth();
  const [journeyState, setJourneyState] = useState<InvestorJourneyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentPage, setShowPaymentPage] = useState(false);

  useEffect(() => {
    if (user) {
      loadJourneyState();
    }
  }, [user]);

  async function loadJourneyState() {
    if (!user) return;

    try {
      setLoading(true);
      const state = await investorJourneyService.getInvestorState(user.id);
      setJourneyState(state);
    } catch (error) {
      console.error('Error loading journey state:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">جاري تحميل حسابك...</p>
        </div>
      </div>
    );
  }

  if (!journeyState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">حدث خطأ في تحميل البيانات</p>
        </div>
      </div>
    );
  }

  if (showPaymentPage && journeyState.reservation) {
    return (
      <PaymentPage
        reservation={journeyState.reservation}
        onClose={() => {
          setShowPaymentPage(false);
          loadJourneyState();
        }}
        onPaymentComplete={() => {
          setShowPaymentPage(false);
          loadJourneyState();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {journeyState.status === 'no_reservation' && (
          <NoReservationView />
        )}

        {journeyState.status === 'pending' && journeyState.reservation && (
          <PendingReviewView reservation={journeyState.reservation} />
        )}

        {journeyState.status === 'waiting_for_payment' && journeyState.reservation && (
          <WaitingForPaymentView
            reservation={journeyState.reservation}
            onProceed={() => setShowPaymentPage(true)}
          />
        )}

        {journeyState.status === 'payment_submitted' && journeyState.reservation && (
          <PaymentSubmittedView
            reservation={journeyState.reservation}
            receipt={journeyState.latestReceipt}
          />
        )}

        {journeyState.status === 'paid' && journeyState.reservation && (
          <PaidConfirmedView reservation={journeyState.reservation} />
        )}

        {journeyState.status === 'transferred_to_harvest' && journeyState.reservation && (
          <TransferredToHarvestView reservation={journeyState.reservation} />
        )}

        {journeyState.status === 'cancelled' && journeyState.reservation && (
          <CancelledView reservation={journeyState.reservation} />
        )}
      </div>
    </div>
  );
}

function NoReservationView() {
  return (
    <div className="text-center py-12">
      <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-green-200">
        <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <TreePine className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">ابدأ رحلتك الاستثمارية</h2>
        <p className="text-gray-600 text-lg mb-8">
          لا يوجد لديك حجز بعد. استثمر في مزرعتك الخاصة وابدأ جني الأرباح
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
        >
          <span className="flex items-center gap-2 justify-center">
            تصفح المزارع المتاحة
            <ArrowRight className="w-5 h-5" />
          </span>
        </button>
      </div>
    </div>
  );
}

function PendingReviewView({ reservation }: { reservation: InvestorReservation }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-amber-200">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Clock className="w-12 h-12 text-amber-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">حجزك قيد المراجعة</h2>
          <p className="text-gray-600 text-lg">
            فريقنا يراجع طلبك الآن. سنرسل لك إشعاراً فور الاعتماد
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
          <ReservationSummary reservation={reservation} />
        </div>

        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 mb-1">ماذا يحدث الآن؟</h3>
              <p className="text-sm text-blue-800">
                فريق المزارع يتحقق من توفر الأشجار المطلوبة ويعد حجزك. عادة ما تستغرق هذه العملية 24-48 ساعة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaitingForPaymentView({
  reservation,
  onProceed
}: {
  reservation: InvestorReservation;
  onProceed: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-blue-200">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">تم اعتماد حجزك!</h2>
          <p className="text-gray-600 text-lg">
            مبروك! حجزك معتمد الآن. أكمل عملية السداد لتأمين أشجارك
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 mb-6">
          <ReservationSummary reservation={reservation} />
        </div>

        <button
          onClick={onProceed}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-5 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
        >
          <span className="flex items-center gap-3 justify-center">
            <CreditCard className="w-6 h-6" />
            إتمام عملية السداد
            <ArrowRight className="w-6 h-6" />
          </span>
        </button>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>بعد السداد، سيتم تأكيد ملكيتك للأشجار ونقلها إلى قسم "محصولي"</p>
        </div>
      </div>
    </div>
  );
}

function PaymentSubmittedView({
  reservation,
  receipt
}: {
  reservation: InvestorReservation;
  receipt: any;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-purple-200">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FileCheck className="w-12 h-12 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">تم رفع إيصال السداد</h2>
          <p className="text-gray-600 text-lg">
            فريقنا المالي يراجع الإيصال الآن. سنرسل لك إشعاراً فور التأكيد
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
          <ReservationSummary reservation={reservation} />
        </div>

        {receipt && (
          <div className="mt-6 bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <FileCheck className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-indigo-900 mb-1">تفاصيل الإيصال</h3>
                <p className="text-sm text-indigo-800">
                  تم رفع الإيصال بتاريخ {new Date(receipt.created_at).toLocaleDateString('ar-SA')}
                </p>
                <p className="text-xs text-indigo-700 mt-1">
                  عادة ما تستغرق المراجعة 1-3 أيام عمل
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PaidConfirmedView({ reservation }: { reservation: InvestorReservation }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-green-200">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">تم تأكيد سدادك!</h2>
          <p className="text-gray-600 text-lg">
            مبروك! تم تأكيد سدادك بنجاح. جاري نقل أشجارك إلى قسم "محصولي"
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 mb-6">
          <ReservationSummary reservation={reservation} />
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 mb-1">الخطوة التالية</h3>
              <p className="text-sm text-blue-800">
                سيتم نقل أشجارك قريباً إلى قسم "محصولي" حيث يمكنك متابعة نموها ومواعيد الصيانة والحصاد
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransferredToHarvestView({ reservation }: { reservation: InvestorReservation }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-emerald-200">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-emerald-100 to-teal-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">مبروك! أشجارك في محصولي</h2>
          <p className="text-gray-600 text-lg">
            رحلتك الاستثمارية بدأت الآن. تابع أشجارك وعملياتها الزراعية
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200 mb-6">
          <ReservationSummary reservation={reservation} />
        </div>

        <button
          onClick={() => window.location.href = '#harvest'}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-5 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
        >
          <span className="flex items-center gap-3 justify-center">
            <Sprout className="w-6 h-6" />
            انتقل إلى محصولي
            <ArrowRight className="w-6 h-6" />
          </span>
        </button>
      </div>
    </div>
  );
}

function CancelledView({ reservation }: { reservation: InvestorReservation }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-red-200">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-red-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">تم إلغاء هذا الحجز</h2>
          <p className="text-gray-600 text-lg">
            يمكنك إنشاء حجز جديد في أي وقت
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200 mb-6">
          <ReservationSummary reservation={reservation} />
        </div>

        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-5 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
        >
          <span className="flex items-center gap-3 justify-center">
            <TreePine className="w-6 h-6" />
            تصفح المزارع المتاحة
            <ArrowRight className="w-6 h-6" />
          </span>
        </button>
      </div>
    </div>
  );
}

function ReservationSummary({ reservation }: { reservation: InvestorReservation }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">ملخص الحجز</h3>
        <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${
          investorJourneyService.getStatusColor(reservation.status).bg
        } ${investorJourneyService.getStatusColor(reservation.status).text} ${
          investorJourneyService.getStatusColor(reservation.status).border
        }`}>
          {investorJourneyService.getStatusLabel(reservation.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">المزرعة</p>
            <p className="font-bold text-gray-900">{reservation.farm_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <TreePine className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">عدد الأشجار</p>
            <p className="font-bold text-gray-900">{reservation.total_trees} شجرة</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">مدة العقد</p>
            <p className="font-bold text-gray-900">
              {reservation.duration_years} سنوات
              {reservation.bonus_years > 0 && ` + ${reservation.bonus_years} مجاناً`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-lg">
            <DollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">المبلغ الإجمالي</p>
            <p className="font-bold text-gray-900">
              {reservation.total_price.toLocaleString('ar-SA')} ريال
            </p>
          </div>
        </div>
      </div>

      {reservation.tree_details && reservation.tree_details.length > 0 && (
        <div className="pt-4 border-t-2 border-gray-200">
          <h4 className="font-bold text-gray-900 mb-3">تفاصيل الأشجار</h4>
          <div className="space-y-2">
            {reservation.tree_details.map((tree, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <TreePine className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    {tree.variety_name} ({tree.type_name})
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{tree.quantity} شجرة</p>
                  <p className="text-xs text-gray-600">
                    {tree.price_per_tree.toLocaleString('ar-SA')} ريال/شجرة
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
