import { Eye, Lock, Unlock, Settings, TrendingUp } from 'lucide-react';
import { FarmStats } from '../../services/adminService';

interface AdminFarmCardProps {
  farm: FarmStats;
  onViewDetails: (farm: FarmStats) => void;
  onToggleBooking: (farmId: string, isOpen: boolean) => void;
}

export default function AdminFarmCard({ farm, onViewDetails, onToggleBooking }: AdminFarmCardProps) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
      style={{
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        border: '2px solid #3AA17E'
      }}
    >
      <div className="relative h-48">
        <img src={farm.image} alt={farm.name} className="w-full h-full object-cover" />
        <div
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full backdrop-blur-sm"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <span className="text-xs font-bold text-white">{farm.name}</span>
        </div>
        <div
          className="absolute top-3 left-3 px-3 py-1.5 rounded-full"
          style={{
            background: farm.isOpenForBooking
              ? 'linear-gradient(145deg, #4CAF50, #388E3C)'
              : 'linear-gradient(145deg, #FF5252, #D32F2F)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
        >
          {farm.isOpenForBooking ? (
            <Unlock className="w-4 h-4 text-white" />
          ) : (
            <Lock className="w-4 h-4 text-white" />
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-lg font-bold text-gray-900">{farm.bookingPercentage}%</span>
          </div>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: farm.maintenanceStatus === 'active'
                ? 'linear-gradient(145deg, #E8F5E9, #C8E6C9)'
                : 'linear-gradient(145deg, #FFF3E0, #FFE0B2)',
              color: farm.maintenanceStatus === 'active' ? '#2E7D32' : '#E65100'
            }}
          >
            {farm.maintenanceStatus === 'active' ? 'نشط' : 'صيانة'}
          </span>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="text-xs font-semibold text-gray-700">متاح: {farm.availableTrees}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <span className="text-xs font-semibold text-gray-700">محجوز: {farm.reservedTrees}</span>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
              style={{ width: `${farm.bookingPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">
            الإجمالي: {farm.totalTrees} شجرة
          </p>
        </div>

        {farm.nextMaintenanceDate && (
          <div
            className="mb-4 p-3 rounded-xl"
            style={{
              background: 'linear-gradient(145deg, #E3F2FD, #BBDEFB)',
              border: '1px solid #2196F3'
            }}
          >
            <p className="text-xs font-semibold text-gray-700">
              الصيانة القادمة: {new Date(farm.nextMaintenanceDate).toLocaleDateString('ar-SA')}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(farm)}
            className="flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(145deg, #3AA17E, #2D8B6A)',
              border: '2px solid #3AA17E'
            }}
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm">إدارة</span>
          </button>
          <button
            onClick={() => onToggleBooking(farm.id, !farm.isOpenForBooking)}
            className="px-4 py-3 rounded-xl font-bold transition-all duration-300 hover:shadow-lg active:scale-98"
            style={{
              background: farm.isOpenForBooking
                ? 'linear-gradient(145deg, #FFEBEE, #FFCDD2)'
                : 'linear-gradient(145deg, #E8F5E9, #C8E6C9)',
              border: farm.isOpenForBooking ? '2px solid #F44336' : '2px solid #4CAF50',
              color: farm.isOpenForBooking ? '#C62828' : '#2E7D32'
            }}
          >
            {farm.isOpenForBooking ? (
              <Lock className="w-5 h-5" />
            ) : (
              <Unlock className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
