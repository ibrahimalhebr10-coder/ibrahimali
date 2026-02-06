import { useState } from 'react';
import AgriculturalReviewScreen from './AgriculturalReviewScreen';
import InvestmentReviewScreen from './InvestmentReviewScreen';

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

type FlowStep = 'review' | 'payment';

export default function UnifiedBookingFlow(props: UnifiedBookingFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('review');
  const [reservationId, setReservationId] = useState<string>('');

  const handleReviewConfirm = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { user } = await import('../contexts/AuthContext').then(m => m.useAuth());

      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert({
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
        } as any)
        .select()
        .single();

      if (error) throw error;

      setReservationId(reservation.id);
      setCurrentStep('payment');
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('حدث خطأ في إنشاء الحجز');
    }
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

  if (currentStep === 'payment' && reservationId) {
    props.onComplete();
    return null;
  }

  return null;
}
