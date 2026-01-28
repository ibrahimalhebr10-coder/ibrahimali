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
        <InvestorAccountCard
          journeyState={journeyState}
          onPaymentClick={() => setShowPaymentPage(true)}
        />
      </div>
    </div>
  );
}

function InvestorAccountCard({
  journeyState,
  onPaymentClick
}: {
  journeyState: InvestorJourneyState;
  onPaymentClick: () => void;
}) {
  const config = getStateConfig(journeyState);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border-2" style={{ borderColor: config.borderColor }}>
      <div className="text-center mb-6">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: config.iconBg }}
        >
          {config.icon}
        </div>

        {config.badge && (
          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mb-4 border-2"
            style={{
              backgroundColor: config.badge.bg,
              borderColor: config.badge.border,
              color: config.badge.text
            }}
          >
            {config.badge.animated && (
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: config.badge.dotColor }}
              />
            )}
            {config.badge.text}
          </div>
        )}

        <h2 className="text-3xl font-bold text-gray-900 mb-3">{config.title}</h2>
        <p className="text-gray-700 text-lg leading-relaxed max-w-2xl mx-auto">
          {config.description}
        </p>
      </div>

      {journeyState.reservation && (
        <div
          className="rounded-2xl p-6 border-2 mb-6"
          style={{
            background: config.summaryBg,
            borderColor: config.summaryBorder
          }}
        >
          <ReservationSummary reservation={journeyState.reservation} />
        </div>
      )}

      {config.infoCards && config.infoCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {config.infoCards.map((card, index) => (
            <div
              key={index}
              className="rounded-2xl p-5 border-2"
              style={{
                backgroundColor: card.bg,
                borderColor: card.border
              }}
            >
              <div className="flex items-start gap-3">
                <div style={{ color: card.iconColor }}>{card.icon}</div>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: card.titleColor }}>
                    {card.title}
                  </h3>
                  <p className="text-sm" style={{ color: card.textColor }}>
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {config.nextStep && (
        <div
          className="rounded-2xl p-6 text-center mb-6 border-2"
          style={{
            background: config.nextStep.bg,
            borderColor: config.nextStep.border
          }}
        >
          <div style={{ color: config.nextStep.iconColor }} className="mx-auto mb-3 w-8 h-8 flex items-center justify-center">
            {config.nextStep.icon}
          </div>
          <h3 className="font-bold text-lg mb-2" style={{ color: config.nextStep.titleColor }}>
            {config.nextStep.title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: config.nextStep.textColor }}>
            {config.nextStep.description}
          </p>
        </div>
      )}

      {config.cta && (
        <button
          onClick={() => {
            if (config.cta!.action === 'payment') {
              onPaymentClick();
            } else if (config.cta!.action === 'navigate') {
              window.location.href = config.cta!.href || '/';
            }
          }}
          className="w-full px-8 py-5 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg text-white"
          style={{
            background: config.cta.gradient
          }}
        >
          <span className="flex items-center gap-3 justify-center">
            {config.cta.iconLeft}
            {config.cta.text}
            {config.cta.iconRight}
          </span>
        </button>
      )}
    </div>
  );
}

function getStateConfig(journeyState: InvestorJourneyState) {
  switch (journeyState.status) {
    case 'no_reservation':
      return {
        borderColor: '#86efac',
        iconBg: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)',
        icon: <TreePine className="w-12 h-12 text-green-600" />,
        title: 'ابدأ رحلتك الاستثمارية',
        description: 'لا يوجد لديك حجز بعد. استثمر في مزرعتك الخاصة وابدأ جني الأرباح',
        summaryBg: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)',
        summaryBorder: '#86efac',
        cta: {
          text: 'تصفح المزارع المتاحة',
          action: 'navigate',
          href: '/',
          gradient: 'linear-gradient(to right, #16a34a, #059669)',
          iconLeft: null,
          iconRight: <ArrowRight className="w-6 h-6" />
        }
      };

    case 'pending':
      return {
        borderColor: '#86efac',
        iconBg: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)',
        icon: <TreePine className="w-12 h-12 text-green-600" />,
        badge: {
          text: 'محجوز مؤقتاً باسمك',
          bg: '#fef3c7',
          border: '#fcd34d',
          textColor: '#92400e',
          dotColor: '#f59e0b',
          animated: true
        },
        title: 'تم حجز مزرعتك بنجاح',
        description: 'أشجارك محفوظة باسمك، وهي الآن في انتظار اعتماد ضمّها إلى حوزتك',
        summaryBg: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)',
        summaryBorder: '#86efac',
        infoCards: [
          {
            bg: '#dbeafe',
            border: '#93c5fd',
            iconColor: '#2563eb',
            titleColor: '#1e3a8a',
            textColor: '#1e40af',
            icon: <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-1" />,
            title: 'أشجارك محجوزة',
            description: 'تم تأمين الأشجار المطلوبة باسمك ولن تكون متاحة لأي مستثمر آخر'
          },
          {
            bg: '#f3e8ff',
            border: '#d8b4fe',
            iconColor: '#9333ea',
            titleColor: '#581c87',
            textColor: '#7e22ce',
            icon: <Clock className="w-6 h-6 flex-shrink-0 mt-1" />,
            title: 'مراجعة سريعة',
            description: 'فريقنا يراجع طلبك. عادة ما تستغرق هذه العملية 24-48 ساعة'
          }
        ],
        nextStep: {
          bg: 'linear-gradient(to right, #d1fae5, #a7f3d0)',
          border: '#6ee7b7',
          iconColor: '#059669',
          titleColor: '#064e3b',
          textColor: '#065f46',
          icon: <Sparkles className="w-8 h-8" />,
          title: 'الخطوة التالية',
          description: 'سنرسل لك إشعاراً فور اعتماد حجزك، وبعدها يمكنك إتمام عملية السداد لضم الأشجار رسمياً إلى حوزتك'
        }
      };

    case 'waiting_for_payment':
      return {
        borderColor: '#93c5fd',
        iconBg: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)',
        icon: <CheckCircle2 className="w-12 h-12 text-blue-600" />,
        badge: {
          text: 'معتمد - جاهز للسداد',
          bg: '#dbeafe',
          border: '#60a5fa',
          textColor: '#1e40af',
          dotColor: '#3b82f6',
          animated: true
        },
        title: 'تم اعتماد حجزك',
        description: 'مبروك! حجزك معتمد الآن. أكمل عملية السداد لتأمين أشجارك بشكل نهائي',
        summaryBg: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)',
        summaryBorder: '#93c5fd',
        nextStep: {
          bg: 'linear-gradient(to right, #dbeafe, #bfdbfe)',
          border: '#93c5fd',
          iconColor: '#2563eb',
          titleColor: '#1e3a8a',
          textColor: '#1e40af',
          icon: <Sparkles className="w-8 h-8" />,
          title: 'بعد السداد',
          description: 'بعد إتمام السداد، سيتم تأكيد ملكيتك للأشجار ونقلها إلى قسم "محصولي"'
        },
        cta: {
          text: 'انتقل للسداد',
          action: 'payment',
          gradient: 'linear-gradient(to right, #2563eb, #0891b2)',
          iconLeft: <CreditCard className="w-6 h-6" />,
          iconRight: <ArrowRight className="w-6 h-6" />
        }
      };

    case 'payment_submitted':
      return {
        borderColor: '#d8b4fe',
        iconBg: 'linear-gradient(to bottom right, #f3e8ff, #e9d5ff)',
        icon: <FileCheck className="w-12 h-12 text-purple-600" />,
        badge: {
          text: 'في انتظار اعتماد السداد',
          bg: '#f3e8ff',
          border: '#c084fc',
          textColor: '#6b21a8',
          dotColor: '#a855f7',
          animated: true
        },
        title: 'تم رفع إيصال السداد',
        description: 'فريقنا المالي يراجع الإيصال الآن. سنرسل لك إشعاراً فور التأكيد',
        summaryBg: 'linear-gradient(to bottom right, #f3e8ff, #e9d5ff)',
        summaryBorder: '#d8b4fe',
        nextStep: {
          bg: 'linear-gradient(to right, #f3e8ff, #e9d5ff)',
          border: '#d8b4fe',
          iconColor: '#9333ea',
          titleColor: '#581c87',
          textColor: '#6b21a8',
          icon: <Clock className="w-8 h-8" />,
          title: 'مراجعة الإيصال',
          description: journeyState.latestReceipt
            ? `تم رفع الإيصال بتاريخ ${new Date(journeyState.latestReceipt.created_at).toLocaleDateString('ar-SA')}. عادة ما تستغرق المراجعة 1-3 أيام عمل`
            : 'عادة ما تستغرق مراجعة الإيصال 1-3 أيام عمل'
        }
      };

    case 'paid':
      return {
        borderColor: '#86efac',
        iconBg: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)',
        icon: <CheckCircle2 className="w-12 h-12 text-green-600" />,
        badge: {
          text: 'تم اعتماد السداد',
          bg: '#d1fae5',
          border: '#4ade80',
          textColor: '#14532d',
          dotColor: '#22c55e',
          animated: false
        },
        title: 'مبروك! تم تأكيد سدادك',
        description: 'تم تأكيد سدادك بنجاح. جاري نقل أشجارك إلى قسم "محصولي"',
        summaryBg: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)',
        summaryBorder: '#86efac',
        nextStep: {
          bg: 'linear-gradient(to right, #d1fae5, #a7f3d0)',
          border: '#86efac',
          iconColor: '#059669',
          titleColor: '#064e3b',
          textColor: '#065f46',
          icon: <Sparkles className="w-8 h-8" />,
          title: 'الخطوة التالية',
          description: 'سيتم نقل أشجارك قريباً إلى قسم "محصولي" حيث يمكنك متابعة نموها ومواعيد الصيانة والحصاد'
        }
      };

    case 'transferred_to_harvest':
      return {
        borderColor: '#6ee7b7',
        iconBg: 'linear-gradient(to bottom right, #d1fae5, #99f6e4)',
        icon: <Sprout className="w-12 h-12 text-emerald-600" />,
        badge: {
          text: 'نشط في محصولي',
          bg: '#d1fae5',
          border: '#34d399',
          textColor: '#064e3b',
          dotColor: '#10b981',
          animated: false
        },
        title: 'مبروك! أشجارك في محصولي',
        description: 'رحلتك الاستثمارية بدأت الآن. تابع أشجارك وعملياتها الزراعية',
        summaryBg: 'linear-gradient(to bottom right, #d1fae5, #99f6e4)',
        summaryBorder: '#6ee7b7',
        cta: {
          text: 'انتقل إلى محصولي',
          action: 'navigate',
          href: '#harvest',
          gradient: 'linear-gradient(to right, #059669, #0d9488)',
          iconLeft: <Sprout className="w-6 h-6" />,
          iconRight: <ArrowRight className="w-6 h-6" />
        }
      };

    case 'cancelled':
      return {
        borderColor: '#fca5a5',
        iconBg: 'linear-gradient(to bottom right, #fee2e2, #fecaca)',
        icon: <XCircle className="w-12 h-12 text-red-600" />,
        badge: {
          text: 'تم الإلغاء',
          bg: '#fee2e2',
          border: '#f87171',
          textColor: '#7f1d1d',
          dotColor: '#ef4444',
          animated: false
        },
        title: 'تم إلغاء هذا الحجز',
        description: 'يمكنك إنشاء حجز جديد في أي وقت',
        summaryBg: 'linear-gradient(to bottom right, #fee2e2, #fecaca)',
        summaryBorder: '#fca5a5',
        cta: {
          text: 'تصفح المزارع المتاحة',
          action: 'navigate',
          href: '/',
          gradient: 'linear-gradient(to right, #4b5563, #374151)',
          iconLeft: <TreePine className="w-6 h-6" />,
          iconRight: <ArrowRight className="w-6 h-6" />
        }
      };

    default:
      return {
        borderColor: '#d1d5db',
        iconBg: 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)',
        icon: <AlertCircle className="w-12 h-12 text-gray-600" />,
        title: 'حالة غير معروفة',
        description: 'يرجى التواصل مع الدعم',
        summaryBg: 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)',
        summaryBorder: '#d1d5db'
      };
  }
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
            <p className="font-bold text-gray-900">{reservation.contract_years} سنوات</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-lg">
            <DollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">المبلغ الإجمالي</p>
            <p className="font-bold text-gray-900">
              {reservation.total_amount.toLocaleString('ar-SA')} ريال
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
