import { useState, useEffect } from 'react';
import { X, TreePine, Calendar, MapPin, FileText, Clock, DollarSign, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { reservationService, type Reservation, type ReservationItem } from '../services/reservationService';

interface MyReservationsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyReservations({ isOpen, onClose }: MyReservationsProps) {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [reservationItems, setReservationItems] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadReservations();
    }
  }, [isOpen, user]);

  const loadReservations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await reservationService.getUserReservations(user.id);
      const confirmedReservations = data.filter(r => r.status === 'confirmed' || r.status === 'completed');
      setReservations(confirmedReservations);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (reservation: Reservation) => {
    setSelectedReservation(reservation);
    const items = await reservationService.getReservationItems(reservation.id);
    setReservationItems(items);
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
                  <h2 className="text-2xl font-bold text-green-800 mb-2">{selectedReservation.farmName}</h2>
                  <p className="text-sm text-gray-600">رقم الحجز: #{selectedReservation.id.substring(0, 8).toUpperCase()}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">إجمالي الأشجار</span>
                      <div className="flex items-center gap-2">
                        <TreePine className="w-4 h-4 text-green-600" />
                        <span className="text-2xl font-bold text-green-700">{selectedReservation.totalTrees}</span>
                      </div>
                    </div>
                  </div>

                  {selectedReservation.durationYears && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">مدة العقد</span>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-lg font-bold text-blue-700">
                            {selectedReservation.durationYears} سنوات
                            {selectedReservation.bonusYears && selectedReservation.bonusYears > 0 && (
                              <span className="text-sm text-green-600 mr-1">
                                + {selectedReservation.bonusYears} مجانًا
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
                        <span className="text-2xl font-bold">{selectedReservation.totalPrice.toLocaleString()} ريال</span>
                      </div>
                    </div>
                  </div>

                  {reservationItems.length > 0 && (
                    <div className="border-t-2 border-gray-200 pt-4 mt-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">تفاصيل الأشجار</h3>
                      <div className="space-y-3">
                        {reservationItems.map((item) => (
                          <div key={item.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                            <div className="text-right">
                              <p className="font-bold text-gray-900">{item.varietyName}</p>
                              <p className="text-sm text-gray-600">{item.typeName}</p>
                            </div>
                            <div className="text-left">
                              <p className="text-xl font-bold text-green-700">{item.quantity}</p>
                              <p className="text-xs text-gray-600">{item.pricePerTree} ريال/شجرة</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <p className="text-xs text-gray-500">
                      تم الحجز في: {new Date(selectedReservation.createdAt).toLocaleDateString('ar-SA')}
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
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-500"></div>
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TreePine className="w-16 h-16 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">لا توجد حجوزات بعد</h2>
                <p className="text-gray-600 mb-6">ابدأ رحلتك الزراعية الآن واحجز أشجارك</p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  تصفح المزارع
                </button>
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
                          <h3 className="text-lg font-bold text-gray-900">{reservation.farmName}</h3>
                          <p className="text-sm text-gray-600">#{reservation.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-green-700">{reservation.totalTrees}</p>
                        <p className="text-xs text-gray-600">شجرة</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {reservation.durationYears && (
                        <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="text-right flex-1">
                            <p className="text-xs text-gray-600">المدة</p>
                            <p className="text-sm font-bold text-blue-700">
                              {reservation.durationYears} سنوات
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div className="text-right flex-1">
                          <p className="text-xs text-gray-600">المبلغ</p>
                          <p className="text-sm font-bold text-green-700">
                            {reservation.totalPrice.toLocaleString()} ريال
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-green-700">نشط</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">
                          {new Date(reservation.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
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
