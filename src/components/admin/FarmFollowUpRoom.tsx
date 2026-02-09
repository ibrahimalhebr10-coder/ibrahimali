import { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Timer,
  Zap,
  Trees,
  DollarSign,
  Calendar,
  Users,
  Activity,
  Lock,
  Unlock
} from 'lucide-react';
import { farmFollowUpService, FarmFollowUpStats, FarmReservationDetail, QuickStats } from '../../services/farmFollowUpService';

export default function FarmFollowUpRoom() {
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [farms, setFarms] = useState<FarmFollowUpStats[]>([]);
  const [filteredFarms, setFilteredFarms] = useState<FarmFollowUpStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [expandedFarm, setExpandedFarm] = useState<string | null>(null);
  const [farmReservations, setFarmReservations] = useState<{ [key: string]: FarmReservationDetail[] }>({});
  const [loadingReservations, setLoadingReservations] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [farms, searchTerm, urgencyFilter]);

  const loadData = async () => {
    try {
      const [statsData, farmsData] = await Promise.all([
        farmFollowUpService.getQuickStats(),
        farmFollowUpService.getFarmsStats()
      ]);

      setQuickStats(statsData);
      setFarms(farmsData);
    } catch (error) {
      console.error('Error loading farm follow-up data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = farmFollowUpService.searchFarms(farms, searchTerm);
    filtered = farmFollowUpService.filterByUrgency(filtered, urgencyFilter);
    setFilteredFarms(filtered);
  };

  const toggleFarmExpanded = async (farmId: string) => {
    if (expandedFarm === farmId) {
      setExpandedFarm(null);
      return;
    }

    setExpandedFarm(farmId);

    if (!farmReservations[farmId]) {
      setLoadingReservations(farmId);
      try {
        const reservations = await farmFollowUpService.getFarmReservations(farmId);
        setFarmReservations(prev => ({ ...prev, [farmId]: reservations }));
      } catch (error) {
        console.error('Error loading farm reservations:', error);
      } finally {
        setLoadingReservations(null);
      }
    }
  };

  const handleToggleFarmPaymentMode = async (farm: FarmFollowUpStats) => {
    const currentMode = farm.default_payment_mode;
    const newMode = currentMode === 'flexible' ? 'immediate' : 'flexible';

    const days = newMode === 'flexible' ? prompt('كم يوم تريد منح العملاء؟', '7') : null;
    if (newMode === 'flexible' && !days) return;

    const reason = prompt('السبب:');
    if (!reason) return;

    try {
      const result = await farmFollowUpService.toggleFarmPaymentMode(
        farm.farm_id,
        newMode === 'flexible',
        parseInt(days || '7'),
        reason
      );

      if (result.success) {
        alert(result.message);
        loadData();
        if (expandedFarm === farm.farm_id) {
          const reservations = await farmFollowUpService.getFarmReservations(farm.farm_id);
          setFarmReservations(prev => ({ ...prev, [farm.farm_id]: reservations }));
        }
      }
    } catch (error) {
      alert('حدث خطأ أثناء تبديل وضع الدفع');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">متابعة المزارع</h2>
          <p className="text-sm text-gray-600 mt-1">نظام متابعة شامل على مستوى المزارع</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          تحديث
        </button>
      </div>

      {/* الاحصائيات السريعة */}
      {quickStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <QuickStatCard
            icon={<Trees className="w-6 h-6" />}
            label="مزارع لديها معلق"
            value={quickStats.total_farms_with_pending}
            color="blue"
          />
          <QuickStatCard
            icon={<Users className="w-6 h-6" />}
            label="حجوزات معلقة"
            value={quickStats.total_pending_reservations}
            color="yellow"
          />
          <QuickStatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="المبلغ المعلق"
            value={`${quickStats.total_pending_amount.toLocaleString('ar-SA')} ر.س`}
            color="green"
          />
          <QuickStatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            label="مزارع حرجة"
            value={quickStats.critical_farms_count}
            color="red"
          />
          <QuickStatCard
            icon={<Timer className="w-6 h-6" />}
            label="مزارع عاجلة"
            value={quickStats.urgent_farms_count}
            color="orange"
          />
          <QuickStatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="مزارع قريبة للامتلاء"
            value={quickStats.farms_nearly_full}
            color="purple"
          />
        </div>
      )}

      {/* الفلاتر والبحث */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث عن مزرعة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الفلتر
            </label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">الكل ({farms.length})</option>
              <option value="critical">مزارع حرجة</option>
              <option value="urgent">مزارع عاجلة</option>
              <option value="has_pending">لديها معلق</option>
              <option value="nearly_full">قريبة للامتلاء</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          عرض {filteredFarms.length} من {farms.length} مزرعة
        </div>
      </div>

      {/* قائمة المزارع */}
      <div className="space-y-4">
        {filteredFarms.map((farm) => (
          <FarmCard
            key={farm.farm_id}
            farm={farm}
            isExpanded={expandedFarm === farm.farm_id}
            onToggle={() => toggleFarmExpanded(farm.farm_id)}
            onTogglePaymentMode={() => handleToggleFarmPaymentMode(farm)}
            reservations={farmReservations[farm.farm_id] || []}
            loadingReservations={loadingReservations === farm.farm_id}
          />
        ))}

        {filteredFarms.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مزارع</h3>
            <p className="mt-1 text-sm text-gray-500">لا توجد مزارع تطابق الفلاتر المحددة</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickStatCard({ icon, label, value, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600 mt-1">{label}</div>
      </div>
    </div>
  );
}

function FarmCard({
  farm,
  isExpanded,
  onToggle,
  onTogglePaymentMode,
  reservations,
  loadingReservations
}: {
  farm: FarmFollowUpStats;
  isExpanded: boolean;
  onToggle: () => void;
  onTogglePaymentMode: () => void;
  reservations: FarmReservationDetail[];
  loadingReservations: boolean;
}) {
  const occupancyPercentage = farmFollowUpService.getOccupancyPercentage(farm);
  const hasIssues = farm.critical_reservations_count > 0 || farm.urgent_reservations_count > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border-2 border-gray-200 hover:border-green-500 transition-colors">
      {/* رأس البطاقة */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">{farm.farm_name}</h3>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {farm.farm_category}
              </span>
              {farm.is_open_for_booking ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  <Unlock className="w-3 h-3" />
                  مفتوحة
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                  <Lock className="w-3 h-3" />
                  مغلقة
                </span>
              )}
            </div>

            {/* شريط التقدم */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">الامتلاء</span>
                <span className={`font-bold ${farmFollowUpService.getOccupancyColor(occupancyPercentage)}`}>
                  {occupancyPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${farmFollowUpService.getProgressBarColor(occupancyPercentage)}`}
                  style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                <span>{farm.reserved_trees} محجوز</span>
                <span>{farm.remaining_trees} متبقي</span>
                <span>{farm.total_trees} إجمالي</span>
              </div>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-6 h-6 text-gray-600" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* الاحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <StatBox
            label="حجوزات معلقة"
            value={farm.pending_reservations_count}
            color={farm.pending_reservations_count > 0 ? 'yellow' : 'gray'}
          />
          <StatBox
            label="حجوزات مؤكدة"
            value={farm.confirmed_reservations_count}
            color="green"
          />
          <StatBox
            label="المبلغ المعلق"
            value={`${farm.pending_amount.toLocaleString('ar-SA')} ر.س`}
            color={farm.pending_amount > 0 ? 'yellow' : 'gray'}
          />
          <StatBox
            label="إجمالي المتابعات"
            value={farm.total_follow_ups}
            color="blue"
          />
        </div>

        {/* التنبيهات */}
        {hasIssues && (
          <div className="mt-4 flex flex-wrap gap-2">
            {farm.critical_reservations_count > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{farm.critical_reservations_count} حجز حرج (أقل من 24 ساعة)</span>
              </div>
            )}
            {farm.urgent_reservations_count > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm">
                <Timer className="w-4 h-4" />
                <span>{farm.urgent_reservations_count} حجز عاجل (أقل من 3 أيام)</span>
              </div>
            )}
          </div>
        )}

        {/* الإجراءات */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onTogglePaymentMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              farm.default_payment_mode === 'flexible'
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {farm.default_payment_mode === 'flexible' ? (
              <>
                <Zap className="w-4 h-4" />
                <span>تحويل للدفع الفوري</span>
              </>
            ) : (
              <>
                <Timer className="w-4 h-4" />
                <span>تحويل للدفع المرن</span>
              </>
            )}
          </button>

          {farm.last_reservation_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>آخر حجز: {new Date(farm.last_reservation_date).toLocaleDateString('ar-SA')}</span>
            </div>
          )}
        </div>
      </div>

      {/* التفاصيل الموسعة */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">
            حجوزات المزرعة ({reservations.length})
          </h4>

          {loadingReservations ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : reservations.length > 0 ? (
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <ReservationCard key={reservation.reservation_id} reservation={reservation} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد حجوزات معلقة أو مؤكدة
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: any) {
  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    blue: 'bg-blue-50 border-blue-200'
  };

  return (
    <div className={`border-2 rounded-lg p-3 ${colorClasses[color]}`}>
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-lg font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function ReservationCard({ reservation }: { reservation: FarmReservationDetail }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{reservation.customer_name}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${farmFollowUpService.getUrgencyColor(reservation.urgency_level)}`}>
              {farmFollowUpService.getUrgencyText(reservation.urgency_level)}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              reservation.path_type === 'agricultural' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {reservation.path_type === 'agricultural' ? 'زراعي' : 'استثماري'}
            </span>
          </div>

          <div className="text-sm text-gray-600 mt-1">{reservation.customer_phone}</div>

          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-gray-600">
              <span className="font-medium">{reservation.trees_count}</span> شجرة
            </span>
            <span className="text-gray-600">
              <span className="font-medium">{reservation.total_amount.toLocaleString('ar-SA')}</span> ر.س
            </span>
            {reservation.payment_deadline && (
              <span className="text-gray-600">
                المتبقي: <span className="font-medium">{farmFollowUpService.formatTimeRemaining(reservation.hours_remaining)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>متابعات: {reservation.follow_up_count}</span>
            <span>تذكيرات: {reservation.payment_reminder_count}</span>
            {reservation.last_activity_type && (
              <span>آخر نشاط: {reservation.last_activity_type}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
            reservation.flexible_payment_enabled
              ? 'bg-orange-100 text-orange-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {reservation.flexible_payment_enabled ? (
              <>
                <Timer className="w-3 h-3" />
                <span>مرن</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                <span>فوري</span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
