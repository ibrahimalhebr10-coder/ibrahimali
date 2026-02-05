import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader, TreePine, Receipt } from 'lucide-react';
import { maintenancePaymentService } from '../services/maintenancePaymentService';

interface MaintenancePaymentResultProps {
  onReturnHome: () => void;
}

export default function MaintenancePaymentResult({ onReturnHome }: MaintenancePaymentResultProps) {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const processPaymentResult = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentId = urlParams.get('payment_id');
        const status = urlParams.get('status');
        const transactionId = urlParams.get('transaction_id');

        if (!paymentId) {
          setMessage('معلومات الدفع غير مكتملة');
          setSuccess(false);
          setLoading(false);
          return;
        }

        if (status === 'cancelled') {
          setSuccess(false);
          setMessage('تم إلغاء عملية الدفع');
          setLoading(false);
          return;
        }

        if (status === 'failed') {
          setSuccess(false);
          setMessage('فشلت عملية الدفع');
          setLoading(false);
          return;
        }

        if (status === 'success' && transactionId) {
          const paymentRecord = await maintenancePaymentService.getPaymentById(paymentId);

          const result = await maintenancePaymentService.completePayment(
            paymentId,
            transactionId,
            paymentRecord.amount_due,
            'electronic_payment',
            { status: 'success', transaction_id: transactionId }
          );

          setSuccess(true);
          setMessage('تم تسجيل الدفع بنجاح');
          setPaymentDetails({
            payment_id: paymentId,
            transaction_id: transactionId,
            amount: result.amount_paid || 0
          });
        } else {
          const paymentRecord = await maintenancePaymentService.getPaymentById(paymentId);

          if (paymentRecord.payment_status === 'paid') {
            setSuccess(true);
            setMessage('تم السداد مسبقاً');
            setPaymentDetails({
              payment_id: paymentId,
              transaction_id: paymentRecord.transaction_id || 'غير متوفر',
              amount: paymentRecord.amount_paid || paymentRecord.amount_due || 0
            });
          } else {
            const transId = `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const result = await maintenancePaymentService.completePayment(
              paymentId,
              transId,
              paymentRecord.amount_due,
              'simulation',
              { simulated: true, timestamp: new Date().toISOString() }
            );

            setSuccess(true);
            setMessage('تم معالجة الدفع بنجاح');
            setPaymentDetails({
              payment_id: paymentId,
              transaction_id: transId,
              amount: result.amount_paid || 0
            });
          }
        }
      } catch (error: any) {
        console.error('Error processing payment result:', error);
        setSuccess(false);
        setMessage(error?.message || 'حدث خطأ في معالجة الدفع');
      } finally {
        setLoading(false);
      }
    };

    processPaymentResult();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4" dir="rtl">
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Loader className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">جاري معالجة الدفع...</h2>
          <p className="text-gray-600">الرجاء الانتظار</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
            success
              ? 'bg-gradient-to-br from-green-500 to-emerald-600'
              : 'bg-gradient-to-br from-red-500 to-rose-600'
          }`}>
            {success ? (
              <CheckCircle className="w-12 h-12 text-white" />
            ) : (
              <XCircle className="w-12 h-12 text-white" />
            )}
          </div>

          <h1 className={`text-3xl font-bold mb-3 ${
            success ? 'text-green-600' : 'text-red-600'
          }`}>
            {success ? 'تم السداد بنجاح' : 'فشل السداد'}
          </h1>

          <p className="text-gray-700 text-lg mb-8">{message}</p>

          {success && paymentDetails && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8 text-right border border-green-200">
              <div className="flex items-center gap-2 mb-4 text-green-700">
                <Receipt className="w-5 h-5" />
                <h3 className="font-bold text-lg">تفاصيل العملية</h3>
              </div>

              <div className="space-y-3">
                {paymentDetails.payment_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">رقم العملية:</span>
                    <span className="font-mono text-sm bg-white px-3 py-1.5 rounded-lg">
                      {paymentDetails.payment_id.slice(0, 8)}...
                    </span>
                  </div>
                )}

                {paymentDetails.transaction_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">رقم المعاملة:</span>
                    <span className="font-mono text-sm bg-white px-3 py-1.5 rounded-lg">
                      {paymentDetails.transaction_id}
                    </span>
                  </div>
                )}

                {paymentDetails.amount && (
                  <div className="flex justify-between items-center pt-3 border-t border-green-200">
                    <span className="text-gray-600">المبلغ المدفوع:</span>
                    <span className="font-bold text-xl text-green-700">
                      {paymentDetails.amount.toFixed(2)} ر.س
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={onReturnHome}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl"
            >
              <TreePine className="w-5 h-5" />
              العودة إلى أشجاري
            </button>

            {!success && (
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all font-semibold"
              >
                العودة للمحاولة مرة أخرى
              </button>
            )}
          </div>

          {success && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800 leading-relaxed">
                سيتم تحديث حالة السداد في حسابك خلال لحظات. شكراً لك!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
