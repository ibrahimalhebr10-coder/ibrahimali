import React, { useState } from 'react';
import { CreditCard, Calendar, Lock, Shield } from 'lucide-react';

interface PaymentCardFormProps {
  amount: number;
  onSuccess: (token: string, reference: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

const PaymentCardForm: React.FC<PaymentCardFormProps> = ({
  amount,
  onSuccess,
  onError,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (disabled || isProcessing) return;

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockToken = `tok_${Math.random().toString(36).substr(2, 9)}`;
      const mockReference = `ref_${Math.random().toString(36).substr(2, 9)}`;

      onSuccess(mockToken, mockReference);
    } catch (error) {
      onError('فشل في معالجة البطاقة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">بيانات البطاقة المصرفية</h3>
          <div className="flex items-center gap-2">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
              alt="Visa"
              className="h-5 opacity-70"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
              alt="Mastercard"
              className="h-5 opacity-70"
            />
            <div className="h-5 px-2 bg-gradient-to-r from-blue-600 to-green-600 rounded flex items-center">
              <span className="text-white text-xs font-bold">مدى</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              رقم البطاقة
            </label>
            <div className="relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                <CreditCard className="w-5 h-5 text-gray-400" />
              </div>
              <div
                id="card-number-element"
                className="w-full pr-12 pl-4 py-3.5 border-2 border-gray-300 rounded-xl bg-gray-50 focus-within:border-darkgreen focus-within:bg-white transition-all text-right"
              >
                <span className="text-gray-400 text-sm">•••• •••• •••• ••••</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                تاريخ الانتهاء
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <div
                  id="card-expiry-element"
                  className="w-full pr-12 pl-4 py-3.5 border-2 border-gray-300 rounded-xl bg-gray-50 focus-within:border-darkgreen focus-within:bg-white transition-all text-right"
                >
                  <span className="text-gray-400 text-sm">MM / YY</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                رمز الأمان
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <div
                  id="card-cvc-element"
                  className="w-full pr-12 pl-4 py-3.5 border-2 border-gray-300 rounded-xl bg-gray-50 focus-within:border-darkgreen focus-within:bg-white transition-all text-right"
                >
                  <span className="text-gray-400 text-sm">•••</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-semibold">المبلغ</span>
            <div className="text-2xl font-bold text-darkgreen">
              {amount.toLocaleString('ar-SA')}
              <span className="text-lg mr-1">ريال</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={disabled || isProcessing}
          className={`
            mt-6 w-full py-4 rounded-xl font-bold text-lg
            transition-all duration-300 transform
            ${disabled || isProcessing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-darkgreen to-green-700 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
            }
          `}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>جاري المعالجة...</span>
            </div>
          ) : (
            'تنفيذ الدفع'
          )}
        </button>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="text-green-900 font-semibold">معلوماتك محمية بالكامل</p>
            <p className="text-green-800">لا يتم حفظ بيانات البطاقة في المنصة</p>
            <p className="text-green-700 text-xs">معتمد من الجهات الرسمية ومتوافق مع معايير الأمان العالمية</p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PaymentCardForm;
