import { useState, useEffect } from 'react';
import { X, Clock, Sprout, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { reservationService, type Reservation } from '../services/reservationService';

interface PendingReservationsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PendingReservations({ isOpen, onClose }: PendingReservationsProps) {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadReservations();
    }
  }, [isOpen, user]);

  const loadReservations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await reservationService.getUserReservations(user.id);
      setReservations(data);
    } catch (err) {
      setError('حدث خطأ أثناء تحميل الحجوزات');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'بانتظار المراجعة';
      case 'confirmed':
        return 'مؤكد';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />

      <div
        className="fixed inset-x-0 bottom-0 bg-white z-50 max-h-[90vh] overflow-hidden rounded-t-3xl"
        style={{
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <div
          className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #3AA17E 0%, #2D8B6A 100%)',
            boxShadow: '0 4px 12px rgba(58, 161, 126, 0.2)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">حجوزاتي</h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-darkgreen mx-auto"></div>
              <p className="text-sm text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 flex-1">{error}</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-12">
              <Sprout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">لا توجد حجوزات بعد</h3>
              <p className="text-sm text-gray-600">
                قم بحجز أشجارك الأولى من المزارع المتاحة
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="bg-white border-2 border-gray-200 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-darkgreen mb-1">
                        {reservation.farmName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {reservation.totalTrees} شجرة
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(
                        reservation.status
                      )}`}
                    >
                      {getStatusText(reservation.status)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {formatDate(reservation.createdAt)}
                      </span>
                    </div>

                    {reservation.contractName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          {reservation.contractName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 font-bold">
                        {reservation.totalPrice.toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>

                  {reservation.status === 'pending' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-xs text-amber-800 text-center">
                        سيتم مراجعة حجزك من قبل الإدارة وسنتواصل معك قريباً
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
