import { useEffect, useState } from 'react';
import { Clock, TreePine, Calendar, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: {
        label: 'قيد المراجعة',
        className: 'bg-amber-100 text-amber-800 border-amber-300'
      },
      confirmed: {
        label: 'مؤكد',
        className: 'bg-green-100 text-green-800 border-green-300'
      },
      completed: {
        label: 'مكتمل',
        className: 'bg-blue-100 text-blue-800 border-blue-300'
      },
      cancelled: {
        label: 'ملغي',
        className: 'bg-red-100 text-red-800 border-red-300'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 ${config.className}`}>
        <Clock className="w-3 h-3" />
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
                          سيتم التواصل معك قريباً لإتمام عملية السداد وتأكيد الحجز
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
    </div>
  );
}
