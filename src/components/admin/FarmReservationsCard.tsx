import { TreePine, Users, DollarSign, Eye, TrendingUp } from 'lucide-react';

interface FarmReservationsCardProps {
  farmId: number;
  farmName: string;
  totalTrees: number;
  totalInvestors: number;
  totalAmount: number;
  pendingCount: number;
  cancelledCount: number;
  onViewDetails: (farmId: number) => void;
}

export default function FarmReservationsCard({
  farmId,
  farmName,
  totalTrees,
  totalInvestors,
  totalAmount,
  pendingCount,
  cancelledCount,
  onViewDetails
}: FarmReservationsCardProps) {
  const totalReservations = pendingCount + cancelledCount;

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden hover:shadow-xl transition-all">
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TreePine className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{farmName}</h3>
              <p className="text-sm text-green-50">
                {totalReservations} حجز • {pendingCount} قيد المراجعة
              </p>
            </div>
          </div>
          <button
            onClick={() => onViewDetails(farmId)}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white font-bold hover:bg-white/30 transition-all flex items-center gap-2 border border-white/30"
          >
            <Eye className="w-5 h-5" />
            <span className="hidden md:inline">عرض التفاصيل</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <TreePine className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600">الأشجار المحجوزة</p>
            </div>
            <p className="text-2xl font-black text-green-700">{totalTrees.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">شجرة محجوزة</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600">عدد المستثمرين</p>
            </div>
            <p className="text-2xl font-black text-blue-700">{totalInvestors.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">مستثمر فريد</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600">إجمالي المبلغ</p>
            </div>
            <p className="text-2xl font-black text-amber-700">{totalAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">ريال سعودي</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-bold text-gray-700">الحالة:</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                <div className="w-2 h-2 rounded-full bg-amber-600"></div>
                <span className="text-sm font-bold text-amber-800">{pendingCount} قيد المراجعة</span>
              </div>
            )}
            {cancelledCount > 0 && (
              <div className="flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full border border-red-300">
                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                <span className="text-sm font-bold text-red-800">{cancelledCount} ملغي</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
