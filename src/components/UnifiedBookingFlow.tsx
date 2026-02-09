import { useState, useEffect } from 'react';
import AgriculturalReviewScreen from './AgriculturalReviewScreen';
import InvestmentReviewScreen from './InvestmentReviewScreen';
import StandaloneAccountRegistration from './StandaloneAccountRegistration';
import PaymentPage from './PaymentPage';
import FlexiblePaymentSuccessScreen from './FlexiblePaymentSuccessScreen';
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
        // المستخدم مسجل واختار الدفع المرن - صفحة النجاح المرنة
        console.log('✅ [UNIFIED] مستخدم مسجل + دفع مرن - صفحة النجاح المرنة');
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

        // إذا كان المستخدم اختار الدفع المرن، نذهب لصفحة النجاح المرنة
        if (isFlexiblePaymentChosen) {
          console.log('✅ [UNIFIED] بعد التسجيل - التوجيه لصفحة النجاح المرنة');
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
      <FlexiblePaymentSuccessScreen
        reservationId={reservationId}
        farmName={props.farmName}
        treeCount={props.treeCount}
        totalPrice={props.totalPrice}
        paymentDeadlineDays={paymentGracePeriodDays}
        onGoToHome={() => {
          window.location.href = '/';
        }}
        onGoToAccount={() => {
          window.location.href = '/account';
        }}
      />
    );
  }

  return null;
}
