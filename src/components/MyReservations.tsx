import { useState, useEffect } from 'react';
import { X, TreePine, Calendar, MapPin, FileText, Clock, DollarSign, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ContractCountdown from './ContractCountdown';

interface Reservation {
  id: string;
  user_id: string;
  farm_id: string | number;
  farm_name: string;
  total_trees: number;
  total_price: number;
  status: string;
  contract_name: string | null;
  duration_years: number | null;
  bonus_years: number | null;
  contract_start_date: string | null;
  created_at: string;
}

interface MyReservationsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyReservations({ isOpen, onClose }: MyReservationsProps) {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadReservations();
    }
  }, [isOpen, user]);

  const loadReservations = async () => {
    if (!user) {
      console.error('❌ لا يوجد مستخدم مسجل دخول');
      setError('لا يوجد مستخدم مسجل دخول');
      setLoading(false);
      return;
    }

    console.log('🔍 بدء تحميل الحجوزات...');
    console.log('👤 User ID:', user.id);

    setLoading(true);
    setError(null);

    try {
      // الاستعلام الأول: جميع الحجوزات للمستخدم (بدون فلترة)
      console.log('📊 الاستعلام 1: جميع الحجوزات بدون فلترة');
      const { data: allReservations, error: allError } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('✅ جميع الحجوزات:', allReservations);
      console.log('❌ أخطاء الاستعلام 1:', allError);

      // الاستعلام الثاني: الحجوزات المؤكدة فقط
      console.log('📊 الاستعلام 2: الحجوزات المؤكدة فقط');
      const { data: confirmedReservations, error: confirmedError } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'completed'])
        .order('created_at', { ascending: false });

      console.log('✅ الحجوزات المؤكدة:', confirmedReservations);
      console.log('❌ أخطاء الاستعلام 2:', confirmedError);

      // الاستعلام الثالث: عد الحجوزات حسب الحالة
      console.log('📊 الاستعلام 3: إحصائيات الحجوزات');
      const { data: stats, error: statsError } = await supabase
        .from('reservations')
        .select('status')
        .eq('user_id', user.id);

      const statusCounts = stats?.reduce((acc: any, r: any) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {});

      console.log('📈 إحصائيات الحالة:', statusCounts);

      // حفظ معلومات التشخيص
      setDebugInfo({
        userId: user.id,
        allCount: allReservations?.length || 0,
        confirmedCount: confirmedReservations?.length || 0,
        statusCounts,
        allReservations,
        confirmedReservations,
        errors: {
          allError: allError?.message,
          confirmedError: confirmedError?.message,
          statsError: statsError?.message
        }
      });

      if (allError) {
        console.error('❌ خطأ في تحميل الحجوزات:', allError);
        setError(`خطأ في تحميل الحجوزات: ${allError.message}`);
        setLoading(false);
        return;
      }

      if (!allReservations || allReservations.length === 0) {
        console.warn('⚠️ لا توجد حجوزات للمستخدم');
        setReservations([]);
      } else {
        console.log(`✅ تم العثور على ${allReservations.length} حجز`);
        console.log('📋 تفاصيل الحجوزات:', allReservations.map(r => ({
          id: r.id.substring(0, 8),
          status: r.status,
          trees: r.total_trees,
          price: r.total_price
        })));

        // عرض الحجوزات المؤكدة فقط
        const filtered = confirmedReservations || [];
        console.log(`🔍 عرض ${filtered.length} حجز مؤكد من أصل ${allReservations.length}`);
        setReservations(filtered);
      }
    } catch (error: any) {
      console.error('❌ خطأ غير متوقع:', error);
      setError(`خطأ غير متوقع: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetails(true);
  };

  if (!isOpen) return null;

  if (showDetails && selectedReservation) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 z-50 overflow-y-auto">
        <div className="min-h-screen p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-20 rounded-t-3xl">
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">تفاصيل الحجز</h1>
                <div className="w-10"></div>
              </div>
            </div>

            <div className="space-y-6 mt-6">
              <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-green-300/50">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <TreePine className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-800 mb-2">{selectedReservation.farm_name}</h2>
                  <p className="text-sm text-gray-600">رقم الحجز: #{selectedReservation.id.substring(0, 8).toUpperCase()}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">إجمالي الأشجار</span>
                      <div className="flex items-center gap-2">
                        <TreePine className="w-4 h-4 text-green-600" />
                        <span className="text-2xl font-bold text-green-700">{selectedReservation.total_trees}</span>
                      </div>
                    </div>
                  </div>

                  {selectedReservation.duration_years && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">مدة العقد</span>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-lg font-bold text-blue-700">
                            {selectedReservation.duration_years} سنوات
                            {selectedReservation.bonus_years && selectedReservation.bonus_years > 0 && (
                              <span className="text-sm text-green-600 mr-1">
                                + {selectedReservation.bonus_years} مجانًا
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-sm opacity-90">المبلغ المدفوع</span>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-2xl font-bold">{selectedReservation.total_price.toLocaleString()} ريال</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-4">
                    <p className="text-xs text-gray-500">
                      تم الحجز في: {new Date(selectedReservation.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 z-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col">
        <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">أشجاري المحجوزة</h1>
            <div className="w-10"></div>
          </div>
        </div>

        <div className="flex-1 p-4">
          <div className="max-w-2xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-500 mb-4"></div>
                <p className="text-gray-600">جاري تحميل حجوزاتك...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-800 mb-2">حدث خطأ</h2>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadReservations}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : reservations.length === 0 ? (
              <div>
                <div className="text-center py-20">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TreePine className="w-16 h-16 text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">لا توجد حجوزات مؤكدة</h2>
                  <p className="text-gray-600 mb-6">ابدأ رحلتك الزراعية الآن واحجز أشجارك</p>
                  <button
                    onClick={onClose}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                  >
                    تصفح المزارع
                  </button>
                </div>

                {/* Debug Info */}
                {debugInfo && (
                  <div className="mt-8 bg-gray-100 rounded-2xl p-6 text-right" dir="rtl">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات التشخيص</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-bold">معرف المستخدم:</span> {debugInfo.userId}</p>
                      <p><span className="font-bold">إجمالي الحجوزات:</span> {debugInfo.allCount}</p>
                      <p><span className="font-bold">الحجوزات المؤكدة:</span> {debugInfo.confirmedCount}</p>
                      {debugInfo.statusCounts && (
                        <div>
                          <p className="font-bold mb-2">الحجوزات حسب الحالة:</p>
                          <ul className="mr-4 space-y-1">
                            {Object.entries(debugInfo.statusCounts).map(([status, count]) => (
                              <li key={status}>
                                <span className="font-mono bg-gray-200 px-2 py-1 rounded">{status}</span>: {count as number}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {debugInfo.allReservations && debugInfo.allReservations.length > 0 && (
                        <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
                          <p className="font-bold text-yellow-800 mb-2">
                            ⚠️ لديك {debugInfo.allReservations.length} حجز لكنها ليست مؤكدة!
                          </p>
                          <p className="text-sm text-yellow-700">
                            تفقد حالة الحجوزات في قاعدة البيانات
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200/50 hover:border-green-300 transition-all cursor-pointer"
                    onClick={() => handleViewDetails(reservation)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                          <TreePine className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-right">
                          <h3 className="text-lg font-bold text-gray-900">{reservation.farm_name}</h3>
                          <p className="text-sm text-gray-600">#{reservation.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-green-700">{reservation.total_trees}</p>
                        <p className="text-xs text-gray-600">شجرة</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {reservation.duration_years && (
                        <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="text-right flex-1">
                            <p className="text-xs text-gray-600">المدة</p>
                            <p className="text-sm font-bold text-blue-700">
                              {reservation.duration_years} سنوات
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div className="text-right flex-1">
                          <p className="text-xs text-gray-600">المبلغ</p>
                          <p className="text-sm font-bold text-green-700">
                            {reservation.total_price.toLocaleString()} ريال
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-bold text-green-700">نشط</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">
                            {new Date(reservation.created_at).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                      </div>

                      {/* العداد التنازلي */}
                      {reservation.contract_start_date &&
                       reservation.duration_years &&
                       reservation.bonus_years !== null && (
                        <ContractCountdown
                          contractStartDate={reservation.contract_start_date}
                          durationYears={reservation.duration_years}
                          bonusYears={reservation.bonus_years}
                          status={reservation.status}
                        />
                      )}
                    </div>
                  </div>
                ))}

                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-6 text-center border-2 border-green-300/50">
                  <Sparkles className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-green-800 mb-2">
                    لديك {reservations.length} حجز نشط
                  </h3>
                  <p className="text-sm text-green-700">
                    مبروك! استثماراتك تنمو معنا
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
