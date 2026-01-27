import { useState, useEffect } from 'react';
import { ArrowRight, DollarSign, CreditCard, AlertCircle, Loader2, TrendingUp, CheckCircle2, XCircle, RefreshCw, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { paymentService, Payment, PaymentStats } from '../../services/paymentService';
import PaymentCard from './PaymentCard';
import Breadcrumb from './Breadcrumb';

interface FinanceManagementProps {
  onBack: () => void;
}

export default function FinanceManagement({ onBack }: FinanceManagementProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'waiting_for_payment' | 'paid' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [usersMap, setUsersMap] = useState<Map<string, string>>(new Map());
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [paymentsData, statsData] = await Promise.all([
        paymentService.getAllPayments(),
        paymentService.getPaymentStats()
      ]);

      setPayments(paymentsData);
      setStats(statsData);

      if (paymentsData.length > 0) {
        const userIds = [...new Set(paymentsData.map((p) => p.user_id))];
        const { data: usersData } = await supabase.auth.admin.listUsers();

        const newUsersMap = new Map<string, string>();
        if (usersData?.users) {
          usersData.users.forEach((user) => {
            if (userIds.includes(user.id)) {
              newUsersMap.set(user.id, user.email || 'مستثمر');
            }
          });
        }
        setUsersMap(newUsersMap);
      }
    } catch (err) {
      console.error('Error loading finance data:', err);
      setError('حدث خطأ أثناء تحميل البيانات المالية');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await loadFinanceData();
      return;
    }

    try {
      setLoading(true);
      const results = await paymentService.searchPayments(searchTerm);
      setPayments(results);
    } catch (err) {
      console.error('Error searching payments:', err);
      setError('حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    const transactionId = prompt('أدخل رقم المعاملة (Transaction ID):');

    if (!transactionId || !transactionId.trim()) {
      alert('يجب إدخال رقم المعاملة');
      return;
    }

    try {
      setProcessingPaymentId(paymentId);

      await paymentService.confirmPayment(paymentId, transactionId.trim());

      alert('تم تأكيد الدفع بنجاح!\n\n✅ تم تحديث حالة الدفع إلى "مدفوع"\n✅ تم تحديث حالة الحجز إلى "مدفوع"\n\nالحجز الآن مدفوع وجاهز للتشغيل لاحقاً.');

      await loadFinanceData();
    } catch (err) {
      console.error('Error confirming payment:', err);
      alert('حدث خطأ أثناء تأكيد الدفع: ' + (err instanceof Error ? err.message : 'خطأ غير معروف'));
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleMarkAsFailed = async (paymentId: string) => {
    const reason = prompt('أدخل سبب فشل الدفع (اختياري):');

    if (!confirm('هل أنت متأكد من تحديد هذا الدفع كفاشل؟')) {
      return;
    }

    try {
      setProcessingPaymentId(paymentId);

      await paymentService.markPaymentAsFailed(paymentId, reason || undefined);

      alert('تم تحديد الدفع كفاشل.\n\nيمكن للمستثمر محاولة الدفع مرة أخرى.');

      await loadFinanceData();
    } catch (err) {
      console.error('Error marking payment as failed:', err);
      alert('حدث خطأ: ' + (err instanceof Error ? err.message : 'خطأ غير معروف'));
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const filteredPayments = activeTab === 'all'
    ? payments
    : payments.filter((p) => p.payment_status === activeTab);

  const waitingCount = payments.filter((p) => p.payment_status === 'waiting_for_payment').length;
  const paidCount = payments.filter((p) => p.payment_status === 'paid').length;
  const failedCount = payments.filter((p) => p.payment_status === 'failed').length;

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
            { label: 'القسم المالي' }
          ]}
        />

        <div className="mt-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">القسم المالي</h1>
              <p className="text-gray-600">متابعة المعاملات المالية والمدفوعات</p>
            </div>
          </div>
        </div>

        {stats && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-bold text-blue-900">إجمالي المعاملات</p>
              </div>
              <p className="text-2xl font-black text-blue-700">{stats.totalPayments}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <p className="text-sm font-bold text-green-900">إجمالي المبلغ</p>
              </div>
              <p className="text-xl font-black text-green-700">{stats.totalAmount.toLocaleString()} ر.س</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-sm font-bold text-amber-900">بانتظار السداد</p>
              </div>
              <p className="text-2xl font-black text-amber-700">{stats.waitingForPayment}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-bold text-purple-900">مدفوع</p>
              </div>
              <p className="text-2xl font-black text-purple-700">{stats.paidCount}</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="ابحث عن معاملة (اسم المزرعة، رقم المعاملة...)"
              className="w-full pr-10 pl-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
          >
            بحث
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden mb-6">
          <div className="flex border-b-2 border-gray-100">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-6 py-4 font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-gray-50 text-gray-800 border-b-4 border-gray-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              الكل ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('waiting_for_payment')}
              className={`flex-1 px-6 py-4 font-bold transition-all ${
                activeTab === 'waiting_for_payment'
                  ? 'bg-blue-50 text-blue-800 border-b-4 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              بانتظار السداد ({waitingCount})
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`flex-1 px-6 py-4 font-bold transition-all ${
                activeTab === 'paid'
                  ? 'bg-green-50 text-green-800 border-b-4 border-green-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              مدفوع ({paidCount})
            </button>
            <button
              onClick={() => setActiveTab('failed')}
              className={`flex-1 px-6 py-4 font-bold transition-all ${
                activeTab === 'failed'
                  ? 'bg-red-50 text-red-800 border-b-4 border-red-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              فشل ({failedCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
            <p className="text-gray-600 font-semibold">جاري تحميل المعاملات المالية...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-1">خطأ</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد معاملات</h3>
            <p className="text-gray-600">
              لا توجد معاملات مالية{' '}
              {activeTab !== 'all' && `بحالة "${
                activeTab === 'waiting_for_payment' ? 'بانتظار السداد' :
                activeTab === 'paid' ? 'مدفوع' : 'فشل'
              }"`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredPayments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                userEmail={usersMap.get(payment.user_id)}
                onConfirmPayment={handleConfirmPayment}
                onMarkAsFailed={handleMarkAsFailed}
                isProcessing={processingPaymentId === payment.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
