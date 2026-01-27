import { useState, useEffect } from 'react';
import { X, Calendar, Wrench, DollarSign, Users, BarChart3, Save } from 'lucide-react';
import { adminService } from '../../services/adminService';

interface FarmDetailsManagementProps {
  farmId: string;
  onClose: () => void;
}

export default function FarmDetailsManagement({ farmId, onClose }: FarmDetailsManagementProps) {
  const [loading, setLoading] = useState(true);
  const [farm, setFarm] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [maintenanceData, setMaintenanceData] = useState({
    maintenance_status: 'active',
    last_maintenance_date: '',
    next_maintenance_date: '',
    admin_notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFarmDetails();
  }, [farmId]);

  async function loadFarmDetails() {
    setLoading(true);
    const [farmData, reservationsData] = await Promise.all([
      adminService.getFarmById(farmId),
      adminService.getFarmReservations(farmId)
    ]);

    if (farmData) {
      setFarm(farmData);
      setMaintenanceData({
        maintenance_status: farmData.maintenance_status || 'active',
        last_maintenance_date: farmData.last_maintenance_date || '',
        next_maintenance_date: farmData.next_maintenance_date || '',
        admin_notes: farmData.admin_notes || ''
      });
    }
    setReservations(reservationsData);
    setLoading(false);
  }

  async function handleSaveMaintenance() {
    setSaving(true);
    const success = await adminService.updateFarmMaintenance(farmId, maintenanceData);
    if (success) {
      alert('تم حفظ بيانات الصيانة بنجاح');
      await loadFarmDetails();
    } else {
      alert('حدث خطأ أثناء حفظ البيانات');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">لم يتم العثور على المزرعة</p>
          <button onClick={onClose} className="px-6 py-3 rounded-xl bg-green-600 text-white">
            العودة
          </button>
        </div>
      </div>
    );
  }

  const totalReservations = reservations.length;
  const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length;
  const pendingReservations = reservations.filter(r => r.status === 'pending').length;
  const totalRevenue = reservations
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + parseFloat(r.total_amount || '0'), 0);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{farm.name}</h1>
            <p className="text-gray-400 text-sm">{farm.location}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(145deg, rgba(33,150,243,0.1), rgba(33,150,243,0.05))',
              border: '2px solid rgba(33, 150, 243, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-bold text-white">{totalReservations}</span>
            </div>
            <p className="text-gray-400 text-sm">إجمالي الحجوزات</p>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(145deg, rgba(76,175,80,0.1), rgba(76,175,80,0.05))',
              border: '2px solid rgba(76, 175, 80, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <BarChart3 className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold text-white">{confirmedReservations}</span>
            </div>
            <p className="text-gray-400 text-sm">حجوزات مؤكدة</p>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(145deg, rgba(255,152,0,0.1), rgba(255,152,0,0.05))',
              border: '2px solid rgba(255, 152, 0, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-8 h-8 text-orange-400" />
              <span className="text-3xl font-bold text-white">{pendingReservations}</span>
            </div>
            <p className="text-gray-400 text-sm">حجوزات معلقة</p>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(145deg, rgba(156,39,176,0.1), rgba(156,39,176,0.05))',
              border: '2px solid rgba(156, 39, 176, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="w-8 h-8 text-purple-400" />
              <span className="text-3xl font-bold text-white">{totalRevenue.toFixed(0)}</span>
            </div>
            <p className="text-gray-400 text-sm">الإيرادات (ريال)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
              border: '2px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Wrench className="w-6 h-6 text-green-400" />
              <h2 className="text-lg font-bold text-white">إدارة الصيانة</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  حالة الصيانة
                </label>
                <select
                  value={maintenanceData.maintenance_status}
                  onChange={(e) => setMaintenanceData({ ...maintenanceData, maintenance_status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-right"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                >
                  <option value="active">نشط - جاهز</option>
                  <option value="maintenance">تحت الصيانة</option>
                  <option value="inspection">تحت المراجعة</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  آخر صيانة
                </label>
                <input
                  type="date"
                  value={maintenanceData.last_maintenance_date}
                  onChange={(e) => setMaintenanceData({ ...maintenanceData, last_maintenance_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-right"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  الصيانة القادمة
                </label>
                <input
                  type="date"
                  value={maintenanceData.next_maintenance_date}
                  onChange={(e) => setMaintenanceData({ ...maintenanceData, next_maintenance_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-right"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  ملاحظات الصيانة
                </label>
                <textarea
                  value={maintenanceData.admin_notes}
                  onChange={(e) => setMaintenanceData({ ...maintenanceData, admin_notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-right"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                  placeholder="ملاحظات حول حالة المزرعة والصيانة..."
                />
              </div>

              <button
                onClick={handleSaveMaintenance}
                disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(145deg, #3AA17E, #2D8B6A)',
                  boxShadow: '0 4px 12px rgba(58, 161, 126, 0.4)'
                }}
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>حفظ بيانات الصيانة</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
              border: '2px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <h2 className="text-lg font-bold text-white mb-4">معلومات المزرعة</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm mb-1">الوصف</p>
                <p className="text-white">{farm.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">إجمالي الأشجار</p>
                  <p className="text-white font-bold text-xl">{farm.total_trees}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">الأشجار المتاحة</p>
                  <p className="text-green-400 font-bold text-xl">{farm.available_trees}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">الأشجار المحجوزة</p>
                  <p className="text-orange-400 font-bold text-xl">{farm.reserved_trees}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">نسبة الحجز</p>
                  <p className="text-blue-400 font-bold text-xl">
                    {farm.total_trees > 0 ? Math.round((farm.reserved_trees / farm.total_trees) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            border: '2px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <h2 className="text-lg font-bold text-white mb-4">آخر الحجوزات</h2>
          {reservations.length > 0 ? (
            <div className="space-y-3">
              {reservations.slice(0, 5).map((reservation) => (
                <div
                  key={reservation.id}
                  className="p-4 rounded-xl flex items-center justify-between"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div>
                    <p className="text-white font-bold">{reservation.user?.full_name || 'غير معروف'}</p>
                    <p className="text-gray-400 text-sm">{reservation.total_trees} شجرة</p>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold">{parseFloat(reservation.total_amount || '0').toFixed(0)} ريال</p>
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        background: reservation.status === 'confirmed'
                          ? 'rgba(76, 175, 80, 0.2)'
                          : 'rgba(255, 152, 0, 0.2)',
                        color: reservation.status === 'confirmed' ? '#4CAF50' : '#FF9800'
                      }}
                    >
                      {reservation.status === 'confirmed' ? 'مؤكد' : 'معلق'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              لا توجد حجوزات حتى الآن
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
