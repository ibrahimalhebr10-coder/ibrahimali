import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowRight, AlertCircle } from 'lucide-react';
import { paymentService, PaymentMethod } from '../services/paymentService';
import PaymentCardForm from './PaymentCardForm';
import ApplePayButton from './ApplePayButton';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    if (!user) {
      setNeedsAuth(true);
      setError('يجب تسجيل الدخول أولاً لإتمام عملية الدفع');
    } else {
      setNeedsAuth(false);
      setError(null);
    }
  }, [user]);

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
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          </div>
        )}

        {needsAuth ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                تسجيل الدخول مطلوب
              </h2>
              <p className="text-gray-600">
                لإتمام عملية الدفع، يجب تسجيل الدخول أو إنشاء حساب جديد
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={onBack}
                className="w-full px-6 py-4 bg-darkgreen text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                الرجوع للتسجيل
              </button>

              <p className="text-sm text-gray-500 text-center">
                سيتم حفظ حجزك وستتمكن من إتمام الدفع بعد تسجيل الدخول
              </p>
            </div>
          </div>
        ) : (
          <>
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
          </>
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
