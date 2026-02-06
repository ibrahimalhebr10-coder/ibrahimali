import { useState, useEffect } from 'react';
import AgriculturalReviewScreen from './AgriculturalReviewScreen';
import InvestmentReviewScreen from './InvestmentReviewScreen';
import StandaloneAccountRegistration from './StandaloneAccountRegistration';
import PaymentPage from './PaymentPage';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UnifiedBookingFlowProps {
  farmId: string;
  farmName: string;
  pathType: 'agricultural' | 'investment';
  packageName: string;
  treeCount: number;
  contractId: string;
  contractName: string;
  durationYears: number;
  bonusYears: number;
  totalPrice: number;
  treeVarieties?: any[];
  influencerCode?: string | null;
  onBack: () => void;
  onComplete: () => void;
}

type FlowStep = 'review' | 'registration' | 'payment' | 'success';

export default function UnifiedBookingFlow(props: UnifiedBookingFlowProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<FlowStep>('review');
  const [reservationId, setReservationId] = useState<string>('');
  const [reservationData, setReservationData] = useState<any>(null);

  useEffect(() => {
    if (user && currentStep === 'registration' && reservationId) {
      handleRegistrationSuccess();
    }
  }, [user, currentStep, reservationId]);

  const handleReviewConfirm = async () => {
    try {
      const reservationPayload = {
        user_id: user?.id || null,
        farm_id: props.farmId,
        farm_name: props.farmName,
        contract_id: props.contractId,
        contract_name: props.contractName,
        duration_years: props.durationYears,
        bonus_years: props.bonusYears,
        total_trees: props.treeCount,
        total_price: props.totalPrice,
        path_type: props.pathType,
        status: 'pending',
        influencer_code: props.influencerCode || null,
        tree_varieties: props.treeVarieties || []
      };

      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert(reservationPayload as any)
        .select()
        .single();

      if (error) throw error;

      setReservationId(reservation.id);
      setReservationData(reservationPayload);

      if (!user) {
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
        packageName={props.packageName}
        treeCount={props.treeCount}
        contractName={props.contractName}
        durationYears={props.durationYears}
        bonusYears={props.bonusYears}
        totalPrice={props.totalPrice}
        onConfirm={handleReviewConfirm}
        onBack={props.onBack}
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

  return null;
}
