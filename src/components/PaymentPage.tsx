import React, { useState } from 'react';
import { CreditCard, ArrowRight } from 'lucide-react';
import { paymentService, PaymentMethod } from '../services/paymentService';
import PaymentCardForm from './PaymentCardForm';
import ApplePayButton from './ApplePayButton';

interface PaymentPageProps {
  reservationId?: string;
  amount: number;
  onSuccess: () => void;
  onBack?: () => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({
  reservationId,
  amount,
  onSuccess,
  onBack
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaymentSuccess = async (token: string, reference: string, method: PaymentMethod) => {
    try {
      setIsProcessing(true);
      setError(null);

      const payment = await paymentService.createPayment({
        reservationId,
        amount,
        paymentMethod: method
      });

      await paymentService.processPayment(payment.id, token, reference);
      await paymentService.completePayment(payment.id);

      onSuccess();
    } catch (err) {
      setError('حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.');
      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-darkgreen hover:text-green-700 font-semibold transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span>الرجوع</span>
          </button>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-darkgreen to-green-700 rounded-2xl shadow-lg mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            إتمام الدفع
          </h1>
          <p className="text-gray-600">
            أدخل بيانات بطاقتك المصرفية لإتمام العملية
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-red-800 text-center font-semibold">{error}</p>
          </div>
        )}

        <PaymentCardForm
          amount={amount}
          onSuccess={(token, reference) => handlePaymentSuccess(token, reference, 'card')}
          onError={setError}
          disabled={isProcessing}
        />

        {paymentService.isApplePayAvailable() && (
          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">أو</span>
              </div>
            </div>

            <ApplePayButton
              amount={amount}
              onSuccess={(token, reference) => handlePaymentSuccess(token, reference, 'apple_pay')}
              onError={setError}
              disabled={isProcessing}
            />
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            بالمتابعة، أنت توافق على
            {' '}
            <button className="text-darkgreen font-semibold hover:underline">
              شروط الخدمة
            </button>
            {' و '}
            <button className="text-darkgreen font-semibold hover:underline">
              سياسة الخصوصية
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
