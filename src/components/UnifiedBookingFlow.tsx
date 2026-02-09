import { useState, useEffect } from 'react';
import AgriculturalReviewScreen from './AgriculturalReviewScreen';
import InvestmentReviewScreen from './InvestmentReviewScreen';
import StandaloneAccountRegistration from './StandaloneAccountRegistration';
import PaymentPage from './PaymentPage';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { systemSettingsService } from '../services/systemSettingsService';

interface UnifiedBookingFlowProps {
  farmId: string;
  farmName: string;
  farmLocation?: string;
  pathType: 'agricultural' | 'investment';
  packageName: string;
  treeCount: number;
  contractId: string;
  contractName: string;
  durationYears: number;
  bonusYears: number;
  totalPrice: number;
  pricePerTree?: number;
  treeVarieties?: any[];
  influencerCode?: string | null;
  onBack: () => void;
  onComplete: () => void;
}

type FlowStep = 'review' | 'registration' | 'payment' | 'success' | 'flexible-success';

export default function UnifiedBookingFlow(props: UnifiedBookingFlowProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<FlowStep>('review');
  const [reservationId, setReservationId] = useState<string>('');
  const [reservationData, setReservationData] = useState<any>(null);
  const [flexiblePaymentEnabled, setFlexiblePaymentEnabled] = useState(false);
  const [paymentGracePeriodDays, setPaymentGracePeriodDays] = useState(7);
  const [isFlexiblePaymentChosen, setIsFlexiblePaymentChosen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (user && currentStep === 'registration' && reservationId) {
      handleRegistrationSuccess();
    }
  }, [user, currentStep, reservationId]);

  const loadSettings = async () => {
    try {
      console.log('🔧 [SETTINGS] تحميل إعدادات الدفع المرن...');
      console.log('👤 [SETTINGS] المستخدم:', user ? 'مسجل' : 'زائر');

      const settings = await systemSettingsService.getAllSettings();

      console.log('📦 [SETTINGS] عدد الإعدادات المحملة:', settings.length);

      // Convert array to object for easier access
      const settingsObj: Record<string, string> = {};
      settings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });

      const flexibleEnabled = settingsObj['flexible_payment_enabled'] === 'true';
      const gracePeriod = parseInt(settingsObj['payment_grace_period_days'] || '30');

      console.log('✅ [SETTINGS] Flexible Payment Enabled:', flexibleEnabled);
      console.log('✅ [SETTINGS] Grace Period Days:', gracePeriod);
      console.log('✅ [SETTINGS] القيمة الخام:', settingsObj['flexible_payment_enabled']);

      setFlexiblePaymentEnabled(flexibleEnabled);
      setPaymentGracePeriodDays(gracePeriod);

      // إذا فشل التحميل، نستخدم القيم الافتراضية
      if (settings.length === 0) {
        console.warn('⚠️ [SETTINGS] لم يتم تحميل إعدادات - استخدام القيم الافتراضية');
        setFlexiblePaymentEnabled(true); // افتراضياً مفعّل
        setPaymentGracePeriodDays(30);
      }
    } catch (error) {
      console.error('❌ [SETTINGS] خطأ في تحميل الإعدادات:', error);
      // في حالة الخطأ، نفعّل النظام افتراضياً
      console.log('🔄 [SETTINGS] تفعيل النظام المرن افتراضياً بعد الخطأ');
      setFlexiblePaymentEnabled(true);
      setPaymentGracePeriodDays(30);
    }
  };

  const handleReviewConfirm = async (useFlexiblePayment: boolean = false) => {
    try {
      const guestId = !user?.id
        ? `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        : null;

      if (guestId) {
        console.log('👤 [UNIFIED] إنشاء Guest ID للزائر:', guestId);
      }

      const paymentDeadline = useFlexiblePayment
        ? new Date(Date.now() + paymentGracePeriodDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const reservationPayload = {
        user_id: user?.id || null,
        guest_id: guestId,
        farm_id: props.farmId,
        farm_name: props.farmName,
        contract_id: props.contractId,
        contract_name: props.contractName,
        duration_years: props.durationYears,
        bonus_years: props.bonusYears,
        total_trees: props.treeCount,
        total_price: props.totalPrice,
        path_type: props.pathType,
        status: useFlexiblePayment ? 'pending_payment' : 'pending',
        flexible_payment_enabled: useFlexiblePayment,
        payment_deadline: paymentDeadline,
        influencer_code: props.influencerCode || null
      };

      console.log('🚀 [UNIFIED] إنشاء حجز جديد - البيانات:', reservationPayload);
      console.log('✅ [UNIFIED] user_id:', reservationPayload.user_id || 'null');
      console.log('✅ [UNIFIED] guest_id:', reservationPayload.guest_id || 'null');

      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert(reservationPayload as any)
        .select()
        .single();

      if (error) {
        console.error('❌ [UNIFIED] فشل إنشاء الحجز:', error);
        throw error;
      }

      console.log('✅ [UNIFIED] تم إنشاء الحجز بنجاح! ID:', reservation?.id);

      setReservationId(reservation.id);
      setReservationData(reservationPayload);
      setIsFlexiblePaymentChosen(useFlexiblePayment);

      // إذا لم يكن المستخدم مسجلاً، يجب أن يسجل أولاً (سواء دفع فوري أو مرن)
      if (!user) {
        console.log('👤 [UNIFIED] زائر غير مسجل - التوجيه للتسجيل');
        setCurrentStep('registration');
      } else if (useFlexiblePayment) {
        // المستخدم مسجل واختار الدفع المرن - شاشة النجاح المرنة
        console.log('✅ [UNIFIED] مستخدم مسجل + دفع مرن - شاشة النجاح المرنة');
        setCurrentStep('flexible-success');
      } else {
        // المستخدم مسجل واختار الدفع الفوري - صفحة الدفع
        console.log('💳 [UNIFIED] مستخدم مسجل + دفع فوري - صفحة الدفع');
        setCurrentStep('payment');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('حدث خطأ في إنشاء الحجز');
    }
  };

  const handleRegistrationSuccess = async () => {
    if (reservationId && user) {
      try {
        console.log('🔗 [UNIFIED] ربط الحجز بالمستخدم الجديد');
        await supabase
          .from('reservations')
          .update({ user_id: user.id })
          .eq('id', reservationId);

        // إذا كان المستخدم اختار الدفع المرن، نذهب لشاشة النجاح المرنة
        if (isFlexiblePaymentChosen) {
          console.log('✅ [UNIFIED] بعد التسجيل - التوجيه لشاشة النجاح المرنة');
          setCurrentStep('flexible-success');
        } else {
          console.log('💳 [UNIFIED] بعد التسجيل - التوجيه لصفحة الدفع');
          setCurrentStep('payment');
        }
      } catch (error) {
        console.error('Error updating reservation:', error);
        // في حالة الخطأ، نستمر حسب نوع الدفع المختار
        setCurrentStep(isFlexiblePaymentChosen ? 'flexible-success' : 'payment');
      }
    } else {
      // احتياطي: إذا لم يكن هناك reservationId أو user
      setCurrentStep(isFlexiblePaymentChosen ? 'flexible-success' : 'payment');
    }
  };

  const handlePaymentSuccess = async () => {
    setCurrentStep('success');
    props.onComplete();
  };

  const handleBackFromRegistration = () => {
    setCurrentStep('review');
  };

  if (currentStep === 'review') {
    return props.pathType === 'agricultural' ? (
      <AgriculturalReviewScreen
        farmName={props.farmName}
        farmLocation={props.farmLocation}
        contractName={props.contractName}
        treeCount={props.treeCount}
        durationYears={props.durationYears}
        bonusYears={props.bonusYears}
        totalPrice={props.totalPrice}
        pricePerTree={props.pricePerTree}
        onConfirm={handleReviewConfirm}
        onBack={props.onBack}
        flexiblePaymentEnabled={flexiblePaymentEnabled}
        paymentGracePeriodDays={paymentGracePeriodDays}
      />
    ) : (
      <InvestmentReviewScreen
        farmName={props.farmName}
        packageName={props.packageName}
        treeCount={props.treeCount}
        contractName={props.contractName}
        durationYears={props.durationYears}
        bonusYears={props.bonusYears}
        totalPrice={props.totalPrice}
        treeVarieties={props.treeVarieties || []}
        onConfirm={handleReviewConfirm}
        onBack={props.onBack}
        flexiblePaymentEnabled={flexiblePaymentEnabled}
        paymentGracePeriodDays={paymentGracePeriodDays}
      />
    );
  }

  if (currentStep === 'registration') {
    return (
      <StandaloneAccountRegistration
        onSuccess={handleRegistrationSuccess}
        onBack={handleBackFromRegistration}
        initialMode="register"
      />
    );
  }

  if (currentStep === 'payment' && reservationId) {
    return (
      <PaymentPage
        reservationId={reservationId}
        amount={props.totalPrice}
        onSuccess={handlePaymentSuccess}
        onBack={handleBackFromRegistration}
      />
    );
  }

  if (currentStep === 'success') {
    return null;
  }

  if (currentStep === 'flexible-success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          {/* بطاقة رئيسية فخمة */}
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-green-100">

            {/* رأس البطاقة - تصميم فخم */}
            <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

              {/* أيقونة النجاح المتطورة */}
              <div className="relative z-10 mb-4">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30 shadow-xl animate-pulse">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
                  مبارك! تم حجز أشجارك بنجاح
                </h1>

                <p className="text-xl text-white/90 font-medium leading-relaxed">
                  نشكرك على ثقتك الغالية ونهنئك باختيارك الرائع
                  <br />
                  أنت الآن جزء من رحلة استثمارية مميزة ومثمرة
                </p>
              </div>
            </div>

            {/* محتوى البطاقة */}
            <div className="p-8 space-y-6">

              {/* ملخص الحجز - تصميم أنيق */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-md">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-3 text-emerald-800 mb-4">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                    </svg>
                    <h3 className="text-2xl font-bold">تفاصيل حجزك</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">المزرعة</p>
                      <p className="text-lg font-bold text-emerald-900">{props.farmName}</p>
                    </div>
                    <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">عدد الأشجار</p>
                      <p className="text-lg font-bold text-emerald-900">{props.treeCount} شجرة</p>
                    </div>
                    <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">المبلغ الإجمالي</p>
                      <p className="text-lg font-bold text-emerald-900">{props.totalPrice.toLocaleString('ar-SA')} ر.س</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* رسالة التواصل - أنيقة وواضحة */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <h4 className="text-xl font-bold text-blue-900 mb-3">الخطوات القادمة</h4>
                    <p className="text-base text-blue-800 leading-relaxed mb-4">
                      عند اكتمال حجز جميع أشجار المزرعة وإغلاق الطلبات، سيكون لنا الشرف بالتواصل معكم لإتمام ضم أشجاركم إليكم وتفعيل استثمارك المبارك.
                    </p>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      سنرسل لكم جميع التفاصيل والتحديثات عبر الواتساب والبريد الإلكتروني، ونحن دائماً في خدمتكم لأي استفسار أو مساعدة.
                    </p>
                  </div>
                </div>
              </div>

              {/* رقم الحجز - تصميم أنيق */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                <p className="text-sm text-gray-600 mb-1">رقم الحجز المرجعي</p>
                <p className="text-lg font-mono font-bold text-gray-900 tracking-wider">{reservationId}</p>
                <p className="text-xs text-gray-500 mt-1">احتفظ بهذا الرقم للمراجعة</p>
              </div>

              {/* الأزرار - تصميم متطور */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => {
                    // الانتقال إلى صفحة الحساب
                    window.location.href = '/account';
                  }}
                  className="py-4 px-6 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  الدخول إلى حسابي
                </button>

                <button
                  onClick={props.onComplete}
                  className="py-4 px-6 bg-white text-emerald-700 border-2 border-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-all shadow-md hover:shadow-lg transform hover:scale-105 duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  العودة للواجهة الرئيسية
                </button>
              </div>

              {/* رسالة ختامية عاطفية */}
              <div className="text-center pt-4 border-t-2 border-gray-100">
                <p className="text-base text-gray-700 leading-relaxed">
                  🌱 نشكر لكم حسن اختياركم ونتمنى لكم رحلة استثمارية موفقة ومثمرة 🌱
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
