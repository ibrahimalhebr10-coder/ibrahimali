import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Clock, XCircle, CreditCard, AlertCircle, Loader2, DollarSign, Calendar, User, RefreshCw, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { paymentService, Payment } from '../../services/paymentService';
import PaymentCard from './PaymentCard';
import Breadcrumb from './Breadcrumb';

interface FarmFinanceDetailsProps {
  farmId: number;
  farmName: string;
  onBack: () => void;
  onUpdate: () => void;
}

export default function FarmFinanceDetails({ farmId, farmName, onBack, onUpdate }: FarmFinanceDetailsProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'waiting_for_payment' | 'paid' | 'failed' | 'refunded'>('all');
  const [usersMap, setUsersMap] = useState<Map<string, { email: string; name: string; phone: string }>>(new Map());

  useEffect(() => {
    loadFarmPayments();
  }, [farmId]);

  const loadFarmPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const paymentsData = await paymentService.getPaymentsByFarm(farmId);

      if (paymentsData && paymentsData.length > 0) {
        const userIds = [...new Set(paymentsData.map((p) => p.user_id))];
        const { data: usersData } = await supabase.auth.admin.listUsers();

        const newUsersMap = new Map<string, { email: string; name: string; phone: string }>();
        if (usersData?.users) {
          usersData.users.forEach((user) => {
            if (userIds.includes(user.id)) {
              newUsersMap.set(user.id, {
                email: user.email || 'مستثمر',
                name: user.user_metadata?.full_name || '',
                phone: user.user_metadata?.phone || ''
              });
            }
          });
        }
        setUsersMap(newUsersMap);
      }

      setPayments(paymentsData);
    } catch (err) {
      console.error('Error loading farm payments:', err);
      setError('حدث خطأ أثناء تحميل البيانات المالية');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    const transactionId = prompt('أدخل رقم المعاملة (Transaction ID):');
    if (!transactionId) return;

    try {
      setProcessing(true);
      await paymentService.confirmPayment(paymentId, transactionId);
      await loadFarmPayments();
      onUpdate();
    } catch (err) {
      console.error('Error confirming payment:', err);
      alert('حدث خطأ أثناء تأكيد الدفع');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsFailed = async (paymentId: string) => {
    const reason = prompt('أدخل سبب الفشل (اختياري):');

    try {
      setProcessing(true);
      await paymentService.markPaymentAsFailed(paymentId, reason || undefined);
      await loadFarmPayments();
      onUpdate();
    } catch (err) {
      console.error('Error marking payment as failed:', err);
      alert('حدث خطأ أثناء تحديد الدفع كفاشل');
    } finally {
      setProcessing(false);
    }
  };

  const filteredPayments = activeTab === 'all'
    ? payments
    : payments.filter((p) => p.payment_status === activeTab);

  const waitingCount = payments.filter((p) => p.payment_status === 'waiting_for_payment').length;
  const paidCount = payments.filter((p) => p.payment_status === 'paid').length;
  const failedCount = payments.filter((p) => p.payment_status === 'failed').length;
  const refundedCount = payments.filter((p) => p.payment_status === 'refunded').length;

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; icon: any; className: string }> = {
      waiting_for_payment: {
        label: 'بانتظار السداد',
        icon: Clock,
        className: 'bg-blue-100 text-blue-800 border-blue-300'
      },
      paid: {
        label: 'مدفوع',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-800 border-green-300'
      },
      failed: {
        label: 'فشل',
        icon: XCircle,
        className: 'bg-red-100 text-red-800 border-red-300'
      },
      refunded: {
        label: 'مسترد',
        icon: RefreshCw,
        className: 'bg-orange-100 text-orange-800 border-orange-300'
      }
    };

    const { label, icon: Icon, className } = config[status] || config.waiting_for_payment;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 ${className}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const config: Record<string, { label: string; className: string }> = {
      mada: {
        label: 'مدى',
        className: 'bg-green-100 text-green-800 border-green-300'
      },
      tabby: {
        label: 'تابي',
        className: 'bg-purple-100 text-purple-800 border-purple-300'
      },
      tamara: {
        label: 'تمارا',
        className: 'bg-pink-100 text-pink-800 border-pink-300'
      }
    };

    const { label, className } = config[method] || config.mada;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 ${className}`}>
        <CreditCard className="w-3 h-3" />
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white border-b-2 border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
          >
            <ArrowRight className="w-5 h-5 text-gray-700" />
            <span className="font-bold text-gray-700">رجوع</span>
          </button>
        </div>

        <Breadcrumb
          items={[
            { label: 'لوحة التحكم', onClick: onBack },
            { label: 'إدارة المالية', onClick: onBack },
            { label: `مالية ${farmName}` }
          ]}
        />

        <div className="mt-4">
          <h1 className="text-3xl font-black text-gray-900">مالية {farmName}</h1>
          <p className="text-gray-600 mt-1">
            {payments.length} عملية مالية • {waitingCount} بانتظار السداد • {paidCount} مدفوع
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden mb-6">
          <div className="flex border-b-2 border-gray-100 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 min-w-[120px] px-6 py-4 font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-gray-100 text-gray-800 border-b-4 border-gray-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              الكل ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('waiting_for_payment')}
              className={`flex-1 min-w-[120px] px-6 py-4 font-bold transition-all ${
                activeTab === 'waiting_for_payment'
                  ? 'bg-blue-50 text-blue-800 border-b-4 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              بانتظار السداد ({waitingCount})
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`flex-1 min-w-[120px] px-6 py-4 font-bold transition-all ${
                activeTab === 'paid'
                  ? 'bg-green-50 text-green-800 border-b-4 border-green-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              مدفوع ({paidCount})
            </button>
            <button
              onClick={() => setActiveTab('failed')}
              className={`flex-1 min-w-[120px] px-6 py-4 font-bold transition-all ${
                activeTab === 'failed'
                  ? 'bg-red-50 text-red-800 border-b-4 border-red-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              فشل ({failedCount})
            </button>
            <button
              onClick={() => setActiveTab('refunded')}
              className={`flex-1 min-w-[120px] px-6 py-4 font-bold transition-all ${
                activeTab === 'refunded'
                  ? 'bg-orange-50 text-orange-800 border-b-4 border-orange-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              مسترد ({refundedCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-600 font-semibold">جاري تحميل البيانات المالية...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-1">خطأ</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد عمليات مالية</h3>
            <p className="text-gray-600">لا توجد عمليات مالية في الفئة المحددة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPayments.map((payment) => {
              const userInfo = usersMap.get(payment.user_id);

              return (
                <div
                  key={payment.id}
                  className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(payment.payment_status)}
                          {getPaymentMethodBadge(payment.payment_method)}
                        </div>
                        <p className="text-sm text-gray-600">
                          رقم العملية: <span className="font-mono text-xs">{payment.id.slice(0, 8)}...</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-black text-blue-700">{payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">ريال سعودي</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-600" />
                        <p className="text-xs font-semibold text-gray-600">المستثمر</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{userInfo?.email || 'غير متوفر'}</p>
                      {userInfo?.name && <p className="text-xs text-gray-600">{userInfo.name}</p>}
                      {userInfo?.phone && <p className="text-xs text-gray-600">{userInfo.phone}</p>}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <p className="text-xs font-semibold text-gray-600">تاريخ الإنشاء</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(payment.created_at).toLocaleDateString('ar-SA')}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(payment.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-gray-600" />
                        <p className="text-xs font-semibold text-gray-600">رقم المعاملة</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {payment.transaction_id || 'غير متوفر'}
                      </p>
                    </div>
                  </div>

                  {payment.payment_status === 'waiting_for_payment' && (
                    <div className="flex items-center gap-2 pt-3 border-t-2 border-gray-100">
                      <button
                        onClick={() => handleConfirmPayment(payment.id)}
                        disabled={processing}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        تأكيد الدفع
                      </button>
                      <button
                        onClick={() => handleMarkAsFailed(payment.id)}
                        disabled={processing}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        تحديد كفاشل
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
