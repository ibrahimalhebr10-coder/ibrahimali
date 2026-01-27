import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, XCircle, Clock, TreePine, User, Calendar, AlertCircle, Loader2, Check, X, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { notificationService } from '../../services/notificationService';
import Breadcrumb from './Breadcrumb';

interface Reservation {
  id: string;
  user_id: string;
  farm_id: number;
  farm_name: string;
  contract_name: string;
  duration_years: number;
  bonus_years: number;
  total_trees: number;
  total_price: number;
  status: string;
  tree_details: any[];
  created_at: string;
  user_email?: string;
  user_phone?: string;
  user_name?: string;
}

interface FarmReservationsDetailsProps {
  farmId: number;
  farmName: string;
  onBack: () => void;
  onUpdate: () => void;
}

export default function FarmReservationsDetails({ farmId, farmName, onBack, onUpdate }: FarmReservationsDetailsProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservations, setSelectedReservations] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'pending' | 'cancelled'>('pending');

  useEffect(() => {
    loadReservations();
  }, [farmId]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .eq('farm_id', farmId)
        .in('status', ['pending', 'cancelled'])
        .order('created_at', { ascending: false });

      if (reservationsError) throw reservationsError;

      if (reservationsData && reservationsData.length > 0) {
        const userIds = [...new Set(reservationsData.map((r) => r.user_id))];

        const { data: usersData } = await supabase.auth.admin.listUsers();

        const usersMap = new Map();
        if (usersData?.users) {
          usersData.users.forEach((user) => {
            usersMap.set(user.id, {
              email: user.email,
              phone: user.user_metadata?.phone || '',
              name: user.user_metadata?.full_name || ''
            });
          });
        }

        const enrichedReservations = reservationsData.map((reservation) => ({
          ...reservation,
          user_email: usersMap.get(reservation.user_id)?.email,
          user_phone: usersMap.get(reservation.user_id)?.phone,
          user_name: usersMap.get(reservation.user_id)?.name,
        }));

        setReservations(enrichedReservations);
      } else {
        setReservations([]);
      }
    } catch (err) {
      console.error('Error loading reservations:', err);
      setError('حدث خطأ أثناء تحميل الحجوزات');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReservations = async (reservationIds: string[]) => {
    if (reservationIds.length === 0) return;

    const confirmed = window.confirm(
      `هل أنت متأكد من تعميد ${reservationIds.length} حجز؟\n\nعند التعميد:\n- سيتم تفعيل خيارات الدفع للمستثمرين\n- سيتم إرسال إشعار لكل مستثمر\n- يمكن للمستثمرين إتمام السداد فوراً`
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      const { data: reservationsToApprove, error: fetchError } = await supabase
        .from('reservations')
        .select('id, user_id, farm_id, farm_name, contract_name, total_price, payment_method')
        .in('id', reservationIds);

      if (fetchError) throw fetchError;
      if (!reservationsToApprove || reservationsToApprove.length === 0) {
        throw new Error('لم يتم العثور على الحجوزات');
      }

      const { data: approvedReservations, error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'waiting_for_payment' })
        .in('id', reservationIds)
        .select('id, user_id, farm_id, farm_name, contract_name, total_price, payment_method');

      if (updateError) throw updateError;

      if (approvedReservations) {
        const paymentPromises = approvedReservations.map(async (reservation) => {
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              reservation_id: reservation.id,
              user_id: reservation.user_id,
              farm_id: reservation.farm_id,
              farm_name: reservation.farm_name,
              amount: reservation.total_price,
              payment_method: reservation.payment_method || 'mada',
              payment_status: 'waiting_for_payment',
              gateway_response: {},
              metadata: {
                contract_name: reservation.contract_name,
                approved_at: new Date().toISOString()
              }
            });

          if (paymentError) {
            console.error(`Error creating payment for reservation ${reservation.id}:`, paymentError);
            throw paymentError;
          }
        });

        await Promise.all(paymentPromises);

        for (const reservation of approvedReservations) {
          try {
            await notificationService.createNotification({
              user_id: reservation.user_id,
              title: 'تم اعتماد حجزك',
              message: `تم اعتماد حجزك في ${reservation.farm_name} - ${reservation.contract_name}. يمكنك الآن إتمام السداد بقيمة ${reservation.total_price.toLocaleString()} ريال سعودي.`,
              type: 'payment_ready',
              read: false
            });
          } catch (notifError) {
            console.error('Error sending notification:', notifError);
          }
        }
      }

      await loadReservations();
      setSelectedReservations(new Set());
      onUpdate();

      alert(`تم تعميد ${reservationIds.length} حجز بنجاح!\nتم إنشاء ${reservationIds.length} عملية دفع في القسم المالي.\nتم إرسال إشعارات للمستثمرين.`);
    } catch (err) {
      console.error('Error approving reservations:', err);
      alert('حدث خطأ أثناء تعميد الحجوزات: ' + (err instanceof Error ? err.message : 'خطأ غير معروف'));
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelReservations = async (reservationIds: string[]) => {
    if (reservationIds.length === 0) return;

    const confirmed = window.confirm(
      `هل أنت متأكد من إلغاء ${reservationIds.length} حجز؟\nلا يمكن التراجع عن هذا الإجراء.`
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .in('id', reservationIds);

      if (updateError) throw updateError;

      await loadReservations();
      setSelectedReservations(new Set());
      onUpdate();

      alert(`تم إلغاء ${reservationIds.length} حجز بنجاح!`);
    } catch (err) {
      console.error('Error cancelling reservations:', err);
      alert('حدث خطأ أثناء إلغاء الحجوزات');
    } finally {
      setProcessing(false);
    }
  };

  const toggleReservationSelection = (id: string) => {
    const newSelection = new Set(selectedReservations);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedReservations(newSelection);
  };

  const selectAllPending = () => {
    const pendingIds = filteredReservations
      .filter((r) => r.status === 'pending')
      .map((r) => r.id);
    setSelectedReservations(new Set(pendingIds));
  };

  const clearSelection = () => {
    setSelectedReservations(new Set());
  };

  const filteredReservations = reservations.filter((r) => r.status === activeTab);

  const pendingCount = reservations.filter((r) => r.status === 'pending').length;
  const cancelledCount = reservations.filter((r) => r.status === 'cancelled').length;

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; icon: any; className: string }> = {
      pending: {
        label: 'قيد المراجعة',
        icon: Clock,
        className: 'bg-amber-100 text-amber-800 border-amber-300'
      },
      waiting_for_payment: {
        label: 'بانتظار السداد',
        icon: DollarSign,
        className: 'bg-blue-100 text-blue-800 border-blue-300'
      },
      paid: {
        label: 'مدفوع',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-800 border-green-300'
      },
      cancelled: {
        label: 'ملغي',
        icon: XCircle,
        className: 'bg-red-100 text-red-800 border-red-300'
      }
    };

    const { label, icon: Icon, className } = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 ${className}`}>
        <Icon className="w-3 h-3" />
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
            { label: 'لوحة التحكم', onClick: () => { onBack(); } },
            { label: 'إدارة الحجوزات', onClick: onBack },
            { label: farmName }
          ]}
        />

        <div className="mt-4">
          <h1 className="text-3xl font-black text-gray-900">حجوزات {farmName}</h1>
          <p className="text-gray-600 mt-1">
            {reservations.length} حجز • {pendingCount} قيد المراجعة • {cancelledCount} ملغي
          </p>
        </div>

        {selectedReservations.size > 0 && (
          <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm font-bold text-blue-900">
              تم تحديد {selectedReservations.size} حجز
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleApproveReservations(Array.from(selectedReservations))}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                تعميد المحدد
              </button>
              <button
                onClick={() => handleCancelReservations(Array.from(selectedReservations))}
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                إلغاء المحدد
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}

        {pendingCount > 0 && selectedReservations.size === 0 && activeTab === 'pending' && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={selectAllPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              تحديد الكل
            </button>
            <button
              onClick={() => handleApproveReservations(filteredReservations.map(r => r.id))}
              disabled={processing}
              className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              تعميد الكل ({pendingCount})
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden mb-6">
          <div className="flex border-b-2 border-gray-100">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 px-6 py-4 font-bold transition-all ${
                activeTab === 'pending'
                  ? 'bg-amber-50 text-amber-800 border-b-4 border-amber-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              قيد المراجعة ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`flex-1 px-6 py-4 font-bold transition-all ${
                activeTab === 'cancelled'
                  ? 'bg-red-50 text-red-800 border-b-4 border-red-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              ملغي ({cancelledCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
            <p className="text-gray-600 font-semibold">جاري تحميل الحجوزات...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-1">خطأ</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد حجوزات</h3>
            <p className="text-gray-600">
              لا توجد حجوزات بحالة "{activeTab === 'pending' ? 'قيد المراجعة' : 'ملغي'}"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden hover:shadow-xl transition-all ${
                  selectedReservations.has(reservation.id) ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-100'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {activeTab === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedReservations.has(reservation.id)}
                            onChange={() => toggleReservationSelection(reservation.id)}
                            className="w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500"
                          />
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <TreePine className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{reservation.contract_name}</h3>
                            <p className="text-sm text-gray-600">رقم الحجز: {reservation.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(reservation.status)}
                  </div>

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

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm font-bold text-gray-700 mb-2">معلومات المستثمر:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-900 font-semibold">{reservation.user_name || 'غير متوفر'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">الجوال:</span>
                        <span className="text-gray-900 font-semibold" dir="ltr">{reservation.user_phone || 'غير متوفر'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-900">{new Date(reservation.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>

                  {activeTab === 'pending' && (
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleApproveReservations([reservation.id])}
                        disabled={processing}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        تعميد الحجز
                      </button>
                      <button
                        onClick={() => handleCancelReservations([reservation.id])}
                        disabled={processing}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        إلغاء الحجز
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
