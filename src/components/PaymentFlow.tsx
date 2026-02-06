import { useState } from 'react';
import PaymentCheckoutPage from './PaymentCheckoutPage';
import PaymentSuccessPage from './PaymentSuccessPage';

interface PaymentFlowProps {
  reservationId: string;
  onComplete: () => void;
  onCancel: () => void;
}

type FlowStep = 'checkout' | 'success';

export default function PaymentFlow({ reservationId, onComplete, onCancel }: PaymentFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('checkout');

  const handlePaymentSuccess = () => {
    setCurrentStep('success');
  };

  const handleViewMyTrees = () => {
    onComplete();
  };

  const handleGoHome = () => {
    onComplete();
  };

  if (currentStep === 'checkout') {
    return (
      <PaymentCheckoutPage
        reservationId={reservationId}
        onSuccess={handlePaymentSuccess}
        onCancel={onCancel}
      />
    );
  }

  if (currentStep === 'success') {
    return (
      <PaymentSuccessPage
        reservationId={reservationId}
        onViewMyTrees={handleViewMyTrees}
        onGoHome={handleGoHome}
      />
    );
  }

  return null;
}
