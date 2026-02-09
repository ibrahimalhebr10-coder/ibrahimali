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
      const settings = await systemSettingsService.getAllSettings();

      // Convert array to object for easier access
      const settingsObj: Record<string, string> = {};
      settings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });

      const flexibleEnabled = settingsObj['flexible_payment_enabled'] === 'true';
      const gracePeriod = parseInt(settingsObj['payment_grace_period_days'] || '7');

      console.log('🔧 [SETTINGS] Flexible Payment Enabled:', flexibleEnabled);
      console.log('🔧 [SETTINGS] Grace Period Days:', gracePeriod);

      setFlexiblePaymentEnabled(flexibleEnabled);
      setPaymentGracePeriodDays(gracePeriod);
    } catch (error) {
      console.error('Error loading settings:', error);
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

      if (useFlexiblePayment) {
        setCurrentStep('flexible-success');
      } else if (!user) {
        setCurrentStep('registration');
      } else {
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
        await supabase
          .from('reservations')
          .update({ user_id: user.id })
          .eq('id', reservationId);

        setCurrentStep('payment');
      } catch (error) {
        console.error('Error updating reservation:', error);
        setCurrentStep('payment');
      }
    } else {
      setCurrentStep('payment');
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
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            تم حجز أشجارك بنجاح!
          </h2>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6">
            <div className="text-lg font-bold text-green-900 mb-2">
              لديك {paymentGracePeriodDays} {paymentGracePeriodDays === 1 ? 'يوم' : 'أيام'} لإتمام الدفع
            </div>
            <p className="text-sm text-green-700">
              تم حجز {props.treeCount} شجرة في {props.farmName}
            </p>
            <p className="text-2xl font-bold text-green-900 mt-3">
              {props.totalPrice.toLocaleString('ar-SA')} ر.س
            </p>
          </div>

          <div className="text-right space-y-3 mb-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <p className="text-sm text-gray-700">سنرسل لك رابط الدفع عبر الواتساب والبريد الإلكتروني</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <p className="text-sm text-gray-700">يمكنك الدفع في أي وقت خلال المدة المحددة</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <p className="text-sm text-gray-700">سنتواصل معك للمتابعة والمساعدة</p>
            </div>
          </div>

          <button
            onClick={props.onComplete}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
          >
            العودة إلى الصفحة الرئيسية
          </button>

          <p className="text-xs text-gray-500 mt-4">
            رقم الحجز: {reservationId}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
