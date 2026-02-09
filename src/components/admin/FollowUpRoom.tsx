import { useState, useEffect } from 'react';
import {
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ExternalLink,
  Plus,
  TrendingUp
} from 'lucide-react';
import { followUpService, PendingReservation, FollowUpStats } from '../../services/followUpService';

export default function FollowUpRoom() {
  const [stats, setStats] = useState<FollowUpStats | null>(null);
  const [reservations, setReservations] = useState<PendingReservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<PendingReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'critical' | 'urgent' | 'medium' | 'normal'>('all');
  const [pathFilter, setPathFilter] = useState<'all' | 'agricultural' | 'investment'>('all');
  const [selectedReservation, setSelectedReservation] = useState<PendingReservation | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);

  useEffect(() => {
    loadData();

    // تحديث البيانات كل دقيقة
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reservations, searchTerm, urgencyFilter, pathFilter]);

  const loadData = async () => {
    try {
      const [statsData, reservationsData] = await Promise.all([
        followUpService.getStats(),
        followUpService.getPendingReservations()
      ]);

      setStats(statsData);
      setReservations(reservationsData);
    } catch (error) {
      console.error('Error loading follow-up data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = reservations;

    // تطبيق فلتر البحث
    filtered = followUpService.searchReservations(filtered, searchTerm);

    // تطبيق فلتر الاستعجال
    filtered = followUpService.filterByUrgency(filtered, urgencyFilter);

    // تطبيق فلتر نوع المسار
    filtered = followUpService.filterByPathType(filtered, pathFilter);

    setFilteredReservations(filtered);
  };

  const handleLogActivity = (reservation: PendingReservation) => {
    setSelectedReservation(reservation);
    setShowActivityModal(true);
  };

  const handleSendReminder = async (reservation: PendingReservation) => {
    const paymentLink = followUpService.generatePaymentLink(reservation.id);
    const message = followUpService.getDefaultReminderMessage(
      reservation.customer_name,
      reservation.days_remaining,
      reservation.hours_remaining,
      paymentLink
    );

    if (confirm(`هل تريد إرسال التذكير التالي؟\n\n${message}`)) {
      try {
        await followUpService.sendReminder(reservation.id, message);
        alert('تم إرسال التذكير بنجاح');
        loadData();
      } catch (error) {
        alert('حدث خطأ أثناء إرسال التذكير');
      }
    }
  };

  const handleExtendDeadline = async (reservation: PendingReservation) => {
    const days = prompt('كم يوم تريد تمديد الموعد؟', '3');
    if (!days) return;

    const reason = prompt('السبب:');
    if (!reason) return;

    try {
      await followUpService.extendDeadline(reservation.id, parseInt(days), reason);
      alert('تم تمديد الموعد بنجاح');
      loadData();
    } catch (error) {
      alert('حدث خطأ أثناء تمديد الموعد');
    }
  };

  const handleOpenPaymentPage = (reservation: PendingReservation) => {
    const link = followUpService.generatePaymentLink(reservation.id);
    window.open(link, '_blank');
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
          <h2 className="text-2xl font-bold text-gray-900">غرفة المتابعة</h2>
          <p className="text-sm text-gray-600 mt-1">متابعة الحجوزات المعلقة ودفعها</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          تحديث
        </button>
      </div>

      {/* الإحصائيات */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="إجمالي المعلقة"
            value={stats.total_pending}
            color="blue"
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            label="حجوزات حرجة"
            value={stats.critical_count}
            color="red"
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            label="جديد اليوم"
            value={stats.new_today}
            color="green"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="المبلغ الإجمالي"
            value={`${stats.total_amount.toLocaleString('ar-SA')} ر.س`}
            color="purple"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="زراعي"
            value={stats.agricultural_count}
            color="green"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="استثماري"
            value={stats.investment_count}
            color="yellow"
          />
        </div>
      )}

      {/* الفلاتر والبحث */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        {/* شريط البحث */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث بالاسم، الرقم، أو البريد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* الفلاتر */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              مستوى الاستعجال
            </label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">الكل</option>
              <option value="critical">حرج جداً</option>
              <option value="urgent">عاجل</option>
              <option value="medium">متوسط</option>
              <option value="normal">عادي</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نوع المسار
            </label>
            <select
              value={pathFilter}
              onChange={(e) => setPathFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">الكل</option>
              <option value="agricultural">زراعي</option>
              <option value="investment">استثماري</option>
            </select>
          </div>
        </div>

        {/* عدد النتائج */}
        <div className="text-sm text-gray-600">
          عرض {filteredReservations.length} من {reservations.length} حجز
        </div>
      </div>

      {/* جدول الحجوزات */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  العميل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المزرعة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المسار
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الأشجار
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المتبقي
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  آخر متابعة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${followUpService.getUrgencyColor(reservation.urgency_level)}`}>
                      {followUpService.getUrgencyText(reservation.urgency_level)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{reservation.customer_name}</div>
                      <div className="text-gray-500">{reservation.customer_phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.farm_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      reservation.path_type === 'agricultural' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reservation.path_type === 'agricultural' ? 'زراعي' : 'استثماري'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.tree_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reservation.total_price.toLocaleString('ar-SA')} ر.س
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {followUpService.formatTimeRemaining(reservation.days_remaining, reservation.hours_remaining)}
                    </div>
                    <div className="text-xs text-gray-500">
                      التذكيرات: {reservation.payment_reminder_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reservation.last_activity ? (
                      <div>
                        <div className="font-medium">{reservation.last_activity.type}</div>
                        <div className="text-xs">{new Date(reservation.last_activity.created_at).toLocaleDateString('ar-SA')}</div>
                      </div>
                    ) : (
                      'لا يوجد'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSendReminder(reservation)}
                        className="text-blue-600 hover:text-blue-900"
                        title="إرسال تذكير"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleLogActivity(reservation)}
                        className="text-green-600 hover:text-green-900"
                        title="تسجيل متابعة"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleExtendDeadline(reservation)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="تمديد المدة"
                      >
                        <Clock className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleOpenPaymentPage(reservation)}
                        className="text-purple-600 hover:text-purple-900"
                        title="فتح صفحة الدفع"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReservations.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد حجوزات معلقة</h3>
              <p className="mt-1 text-sm text-gray-500">
                جميع الحجوزات تم دفعها أو لا توجد حجوزات معلقة حالياً
              </p>
            </div>
          )}
        </div>
      </div>

      {/* مودال تسجيل النشاط */}
      {showActivityModal && selectedReservation && (
        <ActivityModal
          reservation={selectedReservation}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedReservation(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// مكون بطاقة الإحصائيات
function StatCard({ icon, label, value, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600'
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

// مودال تسجيل النشاط
function ActivityModal({ reservation, onClose }: { reservation: PendingReservation; onClose: () => void }) {
  const [activityType, setActivityType] = useState<'phone_call' | 'whatsapp' | 'sms' | 'email' | 'manual_note'>('phone_call');
  const [result, setResult] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await followUpService.logActivity(reservation.id, activityType, result, notes);
      alert('تم تسجيل النشاط بنجاح');
      onClose();
    } catch (error) {
      alert('حدث خطأ أثناء تسجيل النشاط');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">تسجيل نشاط متابعة</h3>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">العميل:</div>
          <div className="font-medium text-gray-900">{reservation.customer_name}</div>
          <div className="text-sm text-gray-500">{reservation.customer_phone}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نوع النشاط
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="phone_call">مكالمة هاتفية</option>
              <option value="whatsapp">واتساب</option>
              <option value="sms">رسالة نصية</option>
              <option value="email">بريد إلكتروني</option>
              <option value="manual_note">ملاحظة يدوية</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              النتيجة
            </label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">اختر النتيجة</option>
              <option value="answered">تم الرد</option>
              <option value="no_answer">لم يرد</option>
              <option value="promised_payment">وعد بالدفع</option>
              <option value="requested_extension">طلب تمديد</option>
              <option value="wants_to_cancel">يريد الإلغاء</option>
              <option value="paid">تم الدفع</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الملاحظات
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="أضف أي ملاحظات..."
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
