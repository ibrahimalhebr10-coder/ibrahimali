import { ArrowLeft, CreditCard, Building2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface PaymentMethodSelectorProps {
  totalAmount: number;
  onSelectMethod: (method: 'mada' | 'bank_transfer') => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function PaymentMethodSelector({
  totalAmount,
  onSelectMethod,
  onBack,
  isLoading = false
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<'mada' | 'bank_transfer' | null>(null);

  const handleConfirm = () => {
    if (selectedMethod) {
      onSelectMethod(selectedMethod);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50/98 via-yellow-50/95 to-orange-50/98 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-lg w-full space-y-4">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="p-3 bg-white/80 rounded-xl shadow-lg hover:bg-white transition-colors flex items-center gap-2 font-bold text-[#B8942F] disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>رجوع</span>
          </button>

          <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-[#D4AF37]/30 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8942F] rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#B8942F]">
                اختر طريقة الدفع
              </h1>
              <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#B8942F]/10 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">المبلغ المطلوب</p>
                <p className="text-2xl font-bold text-[#D4AF37]">
                  {totalAmount.toLocaleString()} ر.س
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setSelectedMethod('mada')}
                disabled={isLoading}
                className={`w-full p-5 rounded-xl border-2 transition-all text-right ${
                  selectedMethod === 'mada'
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-500 shadow-lg'
                    : 'bg-white border-gray-200 hover:border-[#D4AF37]/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">مدى</h3>
                        <p className="text-xs text-gray-500">دفع فوري وآمن</p>
                      </div>
                    </div>
                    <div className="mr-13 space-y-1">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        تفعيل فوري للاستثمار
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        آمن ومضمون 100%
                      </p>
                    </div>
                  </div>
                  {selectedMethod === 'mada' && (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedMethod('bank_transfer')}
                disabled={isLoading}
                className={`w-full p-5 rounded-xl border-2 transition-all text-right ${
                  selectedMethod === 'bank_transfer'
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-500 shadow-lg'
                    : 'bg-white border-gray-200 hover:border-[#D4AF37]/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">تحويل بنكي</h3>
                        <p className="text-xs text-gray-500">تأكيد خلال 24 ساعة</p>
                      </div>
                    </div>
                    <div className="mr-13 space-y-1">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-blue-600">✓</span>
                        مناسب للمبالغ الكبيرة
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-blue-600">✓</span>
                        تأكيد يدوي من الإدارة
                      </p>
                    </div>
                  </div>
                  {selectedMethod === 'bank_transfer' && (
                    <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-sm text-center text-amber-800 font-semibold">
                استثمارك يتم تفعيله بعد تأكيد الدفع
              </p>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!selectedMethod || isLoading}
              className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8942F] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري المعالجة...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>متابعة الدفع</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
