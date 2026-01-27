import { useState, useEffect } from 'react';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import FarmReservationsCard from './FarmReservationsCard';
import FarmReservationsDetails from './FarmReservationsDetails';
import Breadcrumb from './Breadcrumb';

interface FarmReservationsStats {
  farmId: number;
  farmName: string;
  totalTrees: number;
  totalInvestors: number;
  totalAmount: number;
  pendingCount: number;
  waitingForPaymentCount: number;
  paidCount: number;
}

interface ReservationsManagementProps {
  onBack: () => void;
}

export default function ReservationsManagement({ onBack }: ReservationsManagementProps) {
  const [farmsStats, setFarmsStats] = useState<FarmReservationsStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  useEffect(() => {
    loadFarmsReservationsStats();
  }, []);

  const loadFarmsReservationsStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('farm_id, farm_name, total_trees, total_price, user_id, status');

      if (reservationsError) throw reservationsError;

      if (!reservations || reservations.length === 0) {
        setFarmsStats([]);
        setLoading(false);
        return;
      }

      const farmStatsMap = new Map<number, FarmReservationsStats>();

      reservations.forEach((reservation) => {
        const farmId = reservation.farm_id;

        if (!farmStatsMap.has(farmId)) {
          farmStatsMap.set(farmId, {
            farmId,
            farmName: reservation.farm_name,
            totalTrees: 0,
            totalInvestors: 0,
            totalAmount: 0,
            pendingCount: 0,
            waitingForPaymentCount: 0,
            paidCount: 0,
          });
        }

        const stats = farmStatsMap.get(farmId)!;
        stats.totalTrees += reservation.total_trees || 0;
        stats.totalAmount += reservation.total_price || 0;

        if (reservation.status === 'pending') {
          stats.pendingCount += 1;
        } else if (reservation.status === 'waiting_for_payment') {
          stats.waitingForPaymentCount += 1;
        } else if (reservation.status === 'paid') {
          stats.paidCount += 1;
        }
      });

      for (const [farmId, stats] of farmStatsMap) {
        const uniqueInvestors = new Set(
          reservations
            .filter((r) => r.farm_id === farmId)
            .map((r) => r.user_id)
        );
        stats.totalInvestors = uniqueInvestors.size;
      }

      const statsArray = Array.from(farmStatsMap.values());
      statsArray.sort((a, b) => b.totalAmount - a.totalAmount);

      setFarmsStats(statsArray);
    } catch (err) {
      console.error('Error loading farms reservations stats:', err);
      setError('حدث خطأ أثناء تحميل إحصائيات الحجوزات');
    } finally {
      setLoading(false);
    }
  };

  if (selectedFarmId) {
    const selectedFarm = farmsStats.find((f) => f.farmId === selectedFarmId);
    return (
      <FarmReservationsDetails
        farmId={selectedFarmId}
        farmName={selectedFarm?.farmName || ''}
        onBack={() => setSelectedFarmId(null)}
        onUpdate={loadFarmsReservationsStats}
      />
    );
  }

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
            { label: 'إدارة الحجوزات' }
          ]}
        />

        <div className="mt-4">
          <h1 className="text-3xl font-black text-gray-900">إدارة الحجوزات</h1>
          <p className="text-gray-600 mt-1">عرض وإدارة حجوزات جميع المزارع</p>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
            <p className="text-gray-600 font-semibold">جاري تحميل إحصائيات الحجوزات...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-1">خطأ</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        ) : farmsStats.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد حجوزات بعد</h3>
            <p className="text-gray-600">لم يتم إنشاء أي حجوزات حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">إجمالي الإحصائيات</p>
                  <p className="text-2xl font-black text-green-700 mt-1">
                    {farmsStats.length} مزرعة • {farmsStats.reduce((sum, f) => sum + f.pendingCount + f.approvedCount, 0)} حجز
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-600">إجمالي المبلغ</p>
                  <p className="text-2xl font-black text-amber-700 mt-1">
                    {farmsStats.reduce((sum, f) => sum + f.totalAmount, 0).toLocaleString()} ر.س
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {farmsStats.map((farmStats) => (
                <FarmReservationsCard
                  key={farmStats.farmId}
                  {...farmStats}
                  onViewDetails={setSelectedFarmId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
