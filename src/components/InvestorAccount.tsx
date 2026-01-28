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
import JourneyBar, { getJourneyStep } from './JourneyBar';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <JourneyBar currentStep={getJourneyStep(journeyState.status)} />
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
    <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200">
      <div className="text-center mb-8">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: config.iconBg }}
        >
          {config.icon}
        </div>

        {config.badge && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4"
            style={{
              backgroundColor: config.badge.bg,
              color: config.badge.textColor
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

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 leading-snug px-2">{config.title}</h2>
        <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-lg mx-auto px-2">
          {config.description}
        </p>
      </div>

      {journeyState.reservation && (
        <div
          className="rounded-xl sm:rounded-2xl p-5 sm:p-6 mb-6"
          style={{
            background: config.summaryBg
          }}
        >
          <ReservationSummary reservation={journeyState.reservation} />
        </div>
      )}

      {config.infoCards && config.infoCards.length > 0 && (
        <div className="space-y-4 mb-6">
          {config.infoCards.map((card, index) => (
            <div
              key={index}
              className="rounded-xl sm:rounded-2xl p-5 sm:p-6"
              style={{
                backgroundColor: card.bg
              }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5" style={{ color: card.iconColor }}>{card.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg mb-2" style={{ color: card.titleColor }}>
                    {card.title}
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed" style={{ color: card.textColor }}>
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
          className="rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center mb-6"
          style={{
            background: config.nextStep.bg
          }}
        >
          <div style={{ color: config.nextStep.iconColor }} className="mx-auto mb-3 w-8 h-8 flex items-center justify-center">
            {config.nextStep.icon}
          </div>
          <h3 className="font-bold text-base sm:text-lg mb-2" style={{ color: config.nextStep.titleColor }}>
            {config.nextStep.title}
          </h3>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: config.nextStep.textColor }}>
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
          className="w-full px-6 sm:px-8 py-4 sm:py-5 rounded-xl font-bold text-lg sm:text-xl transition-all hover:shadow-lg text-white active:scale-95"
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
        iconBg: 'linear-gradient(to bottom right, #d1fae5, #bbf7d0)',
        icon: <TreePine className="w-12 h-12 text-emerald-700" />,
        title: 'ابدأ رحلتك الاستثمارية',
        description: 'اختر المزرعة التي تناسبك واستثمر في مستقبلك الزراعي',
        summaryBg: 'linear-gradient(to bottom right, #ecfdf5, #d1fae5)',
        cta: {
          text: 'استكشف المزارع',
          action: 'navigate',
          href: '/',
          gradient: 'linear-gradient(to right, #059669, #047857)',
          iconLeft: null,
          iconRight: <ArrowRight className="w-6 h-6" />
        }
      };

    case 'pending':
      return {
        iconBg: 'linear-gradient(to bottom right, #d1fae5, #bbf7d0)',
        icon: <TreePine className="w-12 h-12 text-emerald-700" />,
        badge: {
          text: 'محجوز باسمك',
          bg: '#fef9c3',
          textColor: '#713f12',
          dotColor: '#eab308',
          animated: true
        },
        title: 'رائع! أشجارك محجوزة',
        description: 'الأشجار التي اخترتها محفوظة باسمك الآن ولن تكون متاحة لأي شخص آخر',
        summaryBg: 'linear-gradient(to bottom right, #ecfdf5, #d1fae5)',
        infoCards: [
          {
            bg: '#dbeafe',
            iconColor: '#0369a1',
            titleColor: '#075985',
            textColor: '#0c4a6e',
            icon: <CheckCircle2 className="w-6 h-6 flex-shrink-0" />,
            title: 'أشجارك بأمان',
            description: 'الأشجار محفوظة باسمك وغير متاحة لأي مستثمر آخر'
          },
          {
            bg: '#f5f3ff',
            iconColor: '#7c3aed',
            titleColor: '#6d28d9',
            textColor: '#5b21b6',
            icon: <Clock className="w-6 h-6 flex-shrink-0" />,
            title: 'نراجع طلبك',
            description: 'عادة يستغرق الأمر يوم أو يومين، وسنبلغك فوراً عند الانتهاء'
          }
        ],
        nextStep: {
          bg: 'linear-gradient(to right, #ecfdf5, #d1fae5)',
          iconColor: '#047857',
          titleColor: '#065f46',
          textColor: '#064e3b',
          icon: <Sparkles className="w-8 h-8" />,
          title: 'بعد المراجعة',
          description: 'سنرسل لك إشعاراً فور اعتماد حجزك، وبعدها يمكنك إتمام السداد'
        }
      };

    case 'waiting_for_payment':
      return {
        iconBg: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)',
        icon: <CheckCircle2 className="w-12 h-12 text-sky-700" />,
        badge: {
          text: 'جاهز للسداد',
          bg: '#dbeafe',
          textColor: '#0c4a6e',
          dotColor: '#0ea5e9',
          animated: true
        },
        title: 'مبروك! حجزك معتمد',
        description: 'تم اعتماد حجزك بنجاح، والآن يمكنك إتمام السداد لتأمين أشجارك',
        summaryBg: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)',
        nextStep: {
          bg: 'linear-gradient(to right, #f0f9ff, #e0f2fe)',
          iconColor: '#0369a1',
          titleColor: '#075985',
          textColor: '#0c4a6e',
          icon: <Sparkles className="w-8 h-8" />,
          title: 'بعد السداد',
          description: 'بعد إتمام السداد، سننقل أشجارك إلى "محصولي" حيث يمكنك متابعتها'
        },
        cta: {
          text: 'أكمل السداد',
          action: 'payment',
          gradient: 'linear-gradient(to right, #0284c7, #0369a1)',
          iconLeft: <CreditCard className="w-6 h-6" />,
          iconRight: <ArrowRight className="w-6 h-6" />
        }
      };

    case 'payment_submitted':
      return {
        iconBg: 'linear-gradient(to bottom right, #f5f3ff, #ede9fe)',
        icon: <FileCheck className="w-12 h-12 text-violet-700" />,
        badge: {
          text: 'نراجع إيصالك',
          bg: '#f5f3ff',
          textColor: '#5b21b6',
          dotColor: '#a855f7',
          animated: true
        },
        title: 'شكراً! استلمنا إيصالك',
        description: 'نراجع الإيصال الآن للتأكد من كل شيء، وسنبلغك فور الانتهاء',
        summaryBg: 'linear-gradient(to bottom right, #faf5ff, #f5f3ff)',
        nextStep: {
          bg: 'linear-gradient(to right, #faf5ff, #f5f3ff)',
          iconColor: '#7c3aed',
          titleColor: '#6d28d9',
          textColor: '#5b21b6',
          icon: <Clock className="w-8 h-8" />,
          title: 'نراجع الإيصال',
          description: journeyState.latestReceipt
            ? `استلمنا إيصالك في ${new Date(journeyState.latestReceipt.created_at).toLocaleDateString('ar-SA')}، وعادة نحتاج يوم إلى ثلاثة أيام للمراجعة`
            : 'عادة نحتاج يوم إلى ثلاثة أيام للمراجعة'
        }
      };

    case 'paid':
      return {
        iconBg: 'linear-gradient(to bottom right, #d1fae5, #bbf7d0)',
        icon: <CheckCircle2 className="w-12 h-12 text-emerald-700" />,
        badge: {
          text: 'تم تأكيد السداد',
          bg: '#d1fae5',
          textColor: '#14532d',
          dotColor: '#22c55e',
          animated: false
        },
        title: 'مبروك! سدادك مؤكد',
        description: 'تم تأكيد سدادك بنجاح، وقريباً سننقل أشجارك إلى "محصولي"',
        summaryBg: 'linear-gradient(to bottom right, #ecfdf5, #d1fae5)',
        nextStep: {
          bg: 'linear-gradient(to right, #ecfdf5, #d1fae5)',
          iconColor: '#047857',
          titleColor: '#065f46',
          textColor: '#064e3b',
          icon: <Sparkles className="w-8 h-8" />,
          title: 'الخطوة القادمة',
          description: 'سننقل أشجارك قريباً إلى "محصولي" حيث يمكنك متابعتها'
        }
      };

    case 'transferred_to_harvest':
      return {
        iconBg: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)',
        icon: <Sprout className="w-12 h-12 text-emerald-700" />,
        badge: {
          text: 'أشجارك نشطة',
          bg: '#d1fae5',
          textColor: '#064e3b',
          dotColor: '#10b981',
          animated: false
        },
        title: 'مبروك! استثمارك بدأ',
        description: 'أشجارك الآن في "محصولي" حيث يمكنك متابعة كل شيء',
        summaryBg: 'linear-gradient(to bottom right, #ecfdf5, #d1fae5)',
        cta: {
          text: 'اذهب إلى محصولي',
          action: 'navigate',
          href: '#harvest',
          gradient: 'linear-gradient(to right, #059669, #047857)',
          iconLeft: <Sprout className="w-6 h-6" />,
          iconRight: <ArrowRight className="w-6 h-6" />
        }
      };

    case 'cancelled':
      return {
        iconBg: 'linear-gradient(to bottom right, #fee2e2, #fecaca)',
        icon: <XCircle className="w-12 h-12 text-rose-700" />,
        badge: {
          text: 'ملغي',
          bg: '#fee2e2',
          textColor: '#7f1d1d',
          dotColor: '#ef4444',
          animated: false
        },
        title: 'تم إلغاء الحجز',
        description: 'لا بأس، يمكنك إنشاء حجز جديد متى شئت',
        summaryBg: 'linear-gradient(to bottom right, #fef2f2, #fee2e2)',
        cta: {
          text: 'استكشف المزارع',
          action: 'navigate',
          href: '/',
          gradient: 'linear-gradient(to right, #64748b, #475569)',
          iconLeft: <TreePine className="w-6 h-6" />,
          iconRight: <ArrowRight className="w-6 h-6" />
        }
      };

    default:
      return {
        iconBg: 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)',
        icon: <AlertCircle className="w-12 h-12 text-gray-600" />,
        title: 'نحتاج مساعدة',
        description: 'تواصل معنا لمساعدتك',
        summaryBg: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)'
      };
  }
}

function ReservationSummary({ reservation }: { reservation: InvestorReservation }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-5">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">تفاصيل استثمارك</h3>
      </div>

      <div className="space-y-3">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl flex-shrink-0">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 mb-0.5">المزرعة</p>
            <p className="font-bold text-gray-900 text-base">{reservation.farm_name}</p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
          <div className="bg-teal-100 p-3 rounded-xl flex-shrink-0">
            <TreePine className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 mb-0.5">عدد الأشجار</p>
            <p className="font-bold text-gray-900 text-base">{reservation.total_trees} شجرة</p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
          <div className="bg-sky-100 p-3 rounded-xl flex-shrink-0">
            <Calendar className="w-5 h-5 text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 mb-0.5">مدة الاستثمار</p>
            <p className="font-bold text-gray-900 text-base">{reservation.contract_years} سنوات</p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-xl flex-shrink-0">
            <DollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 mb-0.5">قيمة الاستثمار</p>
            <p className="font-bold text-gray-900 text-base">
              {reservation.total_amount.toLocaleString('ar-SA')} ريال
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
