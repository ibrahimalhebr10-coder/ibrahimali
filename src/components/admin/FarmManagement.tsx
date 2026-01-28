import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search, Filter, Lock, Unlock, Power } from 'lucide-react';
import { adminService, FarmStats } from '../../services/adminService';
import CreateEditFarm from './CreateEditFarm';
import FarmDetailsManagement from './FarmDetailsManagement';

interface FarmManagementProps {
  initialFarmId?: string | null;
}

export default function FarmManagement({ initialFarmId = null }: FarmManagementProps) {
  const [farms, setFarms] = useState<FarmStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<string | null>(null);
  const [viewFarmId, setViewFarmId] = useState<string | null>(null);

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    console.log('initialFarmId changed:', initialFarmId);
    if (initialFarmId !== null && initialFarmId !== undefined) {
      console.log('Opening farm details for initialFarmId:', initialFarmId);
      setViewFarmId(initialFarmId);
    }
  }, [initialFarmId]);

  async function loadFarms() {
    setLoading(true);
    const data = await adminService.getAllFarms();
    setFarms(data);
    setLoading(false);
  }

  async function handleDelete(farmId: string) {
    if (!confirm('هل أنت متأكد من حذف هذه المزرعة؟ هذا الإجراء لا يمكن التراجع عنه.')) return;

    const result = await adminService.deleteFarm(farmId);
    if (result.success) {
      await loadFarms();
    } else {
      if (result.hasReservations) {
        alert('❌ لا يمكن حذف هذه المزرعة!\n\nالسبب: تحتوي على حجوزات نشطة.\n\nيجب إلغاء جميع الحجوزات أو إتمامها قبل حذف المزرعة.');
      } else {
        alert('حدث خطأ أثناء حذف المزرعة');
      }
    }
  }

  function handleEdit(farmId: number) {
    setSelectedFarm(farmId);
    setShowCreateEdit(true);
  }

  function handleCreateNew() {
    setSelectedFarm(null);
    setShowCreateEdit(true);
  }

  function handleCloseCreateEdit() {
    setShowCreateEdit(false);
    setSelectedFarm(null);
    loadFarms();
  }

  function handleViewDetails(farmId: number) {
    console.log('handleViewDetails called for farm:', farmId);
    setViewFarmId(farmId);
  }

  function handleCloseFarmDetails() {
    console.log('Closing farm details, returning to farm list');
    setViewFarmId(null);
  }

  const filteredFarms = farms.filter(farm =>
    farm.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (viewFarmId) {
    return (
      <FarmDetailsManagement
        farmId={viewFarmId}
        onClose={handleCloseFarmDetails}
      />
    );
  }

  if (showCreateEdit) {
    return (
      <CreateEditFarm
        farmId={selectedFarm}
        onClose={handleCloseCreateEdit}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">إدارة المزارع</h1>
            <p className="text-gray-400 text-sm">إنشاء وتعديل وإدارة المزارع</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:shadow-xl flex items-center gap-2"
            style={{
              background: 'linear-gradient(145deg, #3AA17E, #2D8B6A)',
              boxShadow: '0 4px 12px rgba(58, 161, 126, 0.4)'
            }}
          >
            <Plus className="w-5 h-5" />
            <span>إنشاء مزرعة جديدة</span>
          </button>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مزرعة..."
              className="w-full px-12 py-3 rounded-xl text-right transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                color: 'white'
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFarms.map((farm) => (
                <div
                  key={farm.id}
                  className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                    border: '2px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="relative h-48">
                    <img
                      src={farm.image}
                      alt={farm.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <span
                        className="px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-sm"
                        style={{
                          background: farm.status === 'active'
                            ? 'rgba(76, 175, 80, 0.9)'
                            : 'rgba(244, 67, 54, 0.9)',
                          color: 'white'
                        }}
                      >
                        {farm.status === 'active' ? 'نشط' : 'موقوف'}
                      </span>
                      <span
                        className="px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-sm"
                        style={{
                          background: farm.isOpenForBooking
                            ? 'rgba(33, 150, 243, 0.9)'
                            : 'rgba(156, 39, 176, 0.9)',
                          color: 'white'
                        }}
                      >
                        {farm.isOpenForBooking ? 'مفتوح' : 'مغلق'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white mb-1">{farm.name}</h3>
                    <p className="text-gray-400 text-sm mb-1">{farm.category}</p>
                    <p className="text-gray-500 text-xs mb-4 flex items-center gap-1">
                      <span>📍</span>
                      <span>{farm.location || 'غير محدد'}</span>
                    </p>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div
                        className="p-3 rounded-xl text-center"
                        style={{
                          background: 'rgba(76, 175, 80, 0.1)',
                          border: '1px solid rgba(76, 175, 80, 0.3)'
                        }}
                      >
                        <p className="text-gray-400 text-xs mb-1">متاح</p>
                        <p className="text-green-400 font-bold text-base">{farm.availableTrees}</p>
                      </div>
                      <div
                        className="p-3 rounded-xl text-center"
                        style={{
                          background: 'rgba(255, 152, 0, 0.1)',
                          border: '1px solid rgba(255, 152, 0, 0.3)'
                        }}
                      >
                        <p className="text-gray-400 text-xs mb-1">محجوز</p>
                        <p className="text-orange-400 font-bold text-base">{farm.reservedTrees}</p>
                      </div>
                      <div
                        className="p-3 rounded-xl text-center"
                        style={{
                          background: 'rgba(33, 150, 243, 0.1)',
                          border: '1px solid rgba(33, 150, 243, 0.3)'
                        }}
                      >
                        <p className="text-gray-400 text-xs mb-1">الكلي</p>
                        <p className="text-blue-400 font-bold text-base">{farm.totalTrees}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-xs">نسبة الحجز</span>
                        <span className="text-blue-400 font-bold text-sm">{farm.bookingPercentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${farm.bookingPercentage}%`,
                            background: 'linear-gradient(90deg, #3AA17E, #2196F3)'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleViewDetails(farm.id)}
                        className="w-full px-4 py-3 rounded-xl font-bold transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(145deg, #3AA17E, #2D8B6A)',
                          color: 'white'
                        }}
                      >
                        <Eye className="w-5 h-5" />
                        <span>عرض المزرعة</span>
                      </button>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={async () => {
                            const newStatus = !farm.isOpenForBooking;
                            const success = await adminService.updateFarmStatus(farm.id, newStatus);
                            if (success) await loadFarms();
                          }}
                          className="px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-1.5"
                          style={{
                            background: farm.isOpenForBooking
                              ? 'linear-gradient(145deg, rgba(156, 39, 176, 0.9), rgba(123, 31, 162, 0.9))'
                              : 'linear-gradient(145deg, rgba(33, 150, 243, 0.9), rgba(25, 118, 210, 0.9))',
                            color: 'white'
                          }}
                          title={farm.isOpenForBooking ? 'إغلاق الحجز' : 'فتح الحجز'}
                        >
                          {farm.isOpenForBooking ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          <span>{farm.isOpenForBooking ? 'إغلاق' : 'فتح'}</span>
                        </button>
                        <button
                          onClick={async () => {
                            const newActive = farm.status !== 'active';
                            const success = await adminService.toggleFarmActive(farm.id, newActive);
                            if (success) await loadFarms();
                          }}
                          className="px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-1.5"
                          style={{
                            background: farm.status === 'active'
                              ? 'linear-gradient(145deg, rgba(244, 67, 54, 0.9), rgba(211, 47, 47, 0.9))'
                              : 'linear-gradient(145deg, rgba(76, 175, 80, 0.9), rgba(56, 142, 60, 0.9))',
                            color: 'white'
                          }}
                          title={farm.status === 'active' ? 'إيقاف المزرعة' : 'تشغيل المزرعة'}
                        >
                          <Power className="w-4 h-4" />
                          <span>{farm.status === 'active' ? 'إيقاف' : 'تشغيل'}</span>
                        </button>
                        <button
                          onClick={() => handleEdit(farm.id)}
                          className="px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-1.5"
                          style={{
                            background: 'linear-gradient(145deg, rgba(255, 152, 0, 0.9), rgba(245, 124, 0, 0.9))',
                            color: 'white'
                          }}
                          title="تحرير"
                        >
                          <Edit className="w-4 h-4" />
                          <span>تحرير</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredFarms.length === 0 && (
              <div className="text-center py-20">
                <div className="text-gray-400 mb-4">
                  {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد مزارع حالياً'}
                </div>
                {!searchQuery && (
                  <button
                    onClick={handleCreateNew}
                    className="px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:shadow-xl inline-flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(145deg, #3AA17E, #2D8B6A)',
                      boxShadow: '0 4px 12px rgba(58, 161, 126, 0.4)'
                    }}
                  >
                    <Plus className="w-5 h-5" />
                    <span>إنشاء أول مزرعة</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
