import { useEffect, useState } from 'react';
import { Clock, TreePine, Calendar, FileText, AlertCircle, DollarSign, CheckCircle2, CreditCard, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { paymentService } from '../services/paymentService';
import WhatsAppButton from './WhatsAppButton';
import PaymentPage from './PaymentPage';

interface Reservation {
  id: string;
  farm_id: number;
  farm_name: string;
  contract_name: string;
  duration_years: number;
  bonus_years: number;
  total_trees: number;
  total_price: number;
  status: string;
  tree_details: Array<{
    variety_name: string;
    type_name: string;
    quantity: number;
    price_per_tree: number;
  }>;
  created_at: string;
}

export default function MyReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    loadReservations();
  }, [user]);

  const loadReservations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReservations(data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (reservation: Reservation, method: 'mada' | 'tabby' | 'tamara') => {
    if (!user) return;

    try {
      setProcessingPayment(reservation.id);

      const payment = await paymentService.createPayment({
        reservation_id: reservation.id,
        user_id: user.id,
        farm_id: reservation.farm_id,
        farm_name: reservation.farm_name,
        amount: reservation.total_price,
        payment_method: method,
        metadata: {
          contract_name: reservation.contract_name,
          total_trees: reservation.total_trees,
          duration_years: reservation.duration_years
        }
      });

      alert(`تم إنشاء عملية الدفع بنجاح!\n\nفي النسخة الكاملة:\n- سيتم توجيهك لبوابة الدفع ${method === 'mada' ? 'مدى' : method === 'tabby' ? 'تابي' : 'تمارا'}\n- بعد إتمام الدفع سيتم تحديث حالة الحجز تلقائياً\n\nرقم المعاملة: ${payment.id}`);

      await loadReservations();
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('حدث خطأ أثناء إنشاء عملية الدفع. يرجى المحاولة مرة أخرى.');
    } finally {
      setProcessingPayment(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      pending: {
        label: 'قيد المراجعة',
        className: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: Clock
      },
      waiting_for_payment: {
        label: 'بانتظار السداد',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: DollarSign
      },
      paid: {
        label: 'مدفوع',
        className: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle2
      },
      cancelled: {
        label: 'ملغي',
        className: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">جاري تحميل حجوزاتك...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg border-2 border-green-200 mb-4">
            <FileText className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-black text-gray-900">حجوزاتي</h1>
          </div>
          <p className="text-gray-600">جميع حجوزاتك واستثماراتك في مكان واحد</p>
        </div>

        {reservations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد حجوزات بعد</h3>
            <p className="text-gray-600 mb-6">لم تقم بحجز أي استثمارات حتى الآن</p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
            >
              تصفح المزارع
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                          <TreePine className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{reservation.farm_name}</h3>
                          <p className="text-sm text-gray-600">عقد {reservation.contract_name}</p>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(reservation.status)}
                  </div>

                  {reservation.status === 'pending' && (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-amber-900 font-semibold">حجزك قيد المراجعة</p>
                        <p className="text-xs text-amber-800 mt-1">
                          يتم الآن مراجعة حجزك من قبل الإدارة. سيتم إخطارك عند اعتماد الحجز وإتاحة خيارات الدفع.
                        </p>
                      </div>
                    </div>
                  )}

                  {reservation.status === 'waiting_for_payment' && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-4 mb-4">
                      <div className="flex items-start gap-3 mb-4">
                        <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-base text-blue-900 font-bold">تم اعتماد حجزك!</p>
                          <p className="text-sm text-blue-800 mt-1">
                            يمكنك الآن إتمام عملية السداد بقيمة <span className="font-bold">{reservation.total_price.toLocaleString()} ريال سعودي</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setShowPaymentPage(true);
                        }}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                      >
                        <CreditCard className="w-5 h-5" />
                        <span>إتمام السداد</span>
                      </button>
                    </div>
                  )}

                  {reservation.status === 'paid' && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-green-900 font-semibold">تم استلام الدفع بنجاح</p>
                        <p className="text-xs text-green-800 mt-1">
                          شكراً لك! تم تأكيد استثمارك وسيتم التواصل معك قريباً بالتفاصيل.
                        </p>
                      </div>
                    </div>
                  )}

                  {reservation.status === 'cancelled' && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-red-900 font-semibold">تم إلغاء الحجز</p>
                        <p className="text-xs text-red-800 mt-1">
                          تم إلغاء هذا الحجز. يمكنك إنشاء حجز جديد في أي وقت.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">عدد الأشجار</p>
                      <p className="text-lg font-black text-green-700">{reservation.total_trees}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">مدة العقد</p>
                      <p className="text-lg font-black text-blue-700">{reservation.duration_years} سنوات</p>
                    </div>
                    {reservation.bonus_years > 0 && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200">
                        <p className="text-xs text-gray-600 mb-1">سنوات مجانية</p>
                        <p className="text-lg font-black text-purple-700">{reservation.bonus_years} سنوات</p>
                      </div>
                    )}
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-200">
                      <p className="text-xs text-gray-600 mb-1">الإجمالي</p>
                      <p className="text-lg font-black text-amber-700">{reservation.total_price.toLocaleString()} ر.س</p>
                    </div>
                  </div>

                  {reservation.tree_details && reservation.tree_details.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-sm font-bold text-gray-700 mb-3">تفاصيل الأشجار:</p>
                      <div className="space-y-2">
                        {reservation.tree_details.map((detail, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <TreePine className="w-4 h-4 text-green-600" />
                              <span className="text-gray-900 font-semibold">{detail.variety_name}</span>
                              <span className="text-gray-500">({detail.type_name})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-green-600 font-bold">{detail.quantity} شجرة</span>
                              <span className="text-gray-400">×</span>
                              <span className="text-gray-900 font-semibold">{detail.price_per_tree} ر.س</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <WhatsAppButton
                      investorName={user?.email?.split('@')[0] || 'مستثمر'}
                      reservationNumber={reservation.id.substring(0, 8)}
                      farmName={reservation.farm_name}
                      variant="secondary"
                      size="medium"
                      className="w-full"
                    />
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>تاريخ الحجز: {formatDate(reservation.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPaymentPage && selectedReservation && (
        <PaymentPage
          reservation={{
            id: selectedReservation.id,
            farm_name: selectedReservation.farm_name,
            tree_count: selectedReservation.total_trees,
            contract_years: selectedReservation.duration_years,
            total_amount: selectedReservation.total_price,
            status: selectedReservation.status
          }}
          onClose={() => {
            setShowPaymentPage(false);
            setSelectedReservation(null);
          }}
          onSuccess={() => {
            setShowPaymentPage(false);
            setSelectedReservation(null);
            loadReservations();
          }}
        />
      )}
    </div>
  );
}
