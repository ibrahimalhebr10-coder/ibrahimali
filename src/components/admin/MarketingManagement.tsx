import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Users, Zap, Clock, CheckCircle, AlertCircle, Bell, Share2, FolderOpen, Volume2 } from 'lucide-react';
import { momentumCenterService, MomentumIndicators, MomentumDecision } from '../../services/momentumCenterService';

const MarketingManagement = () => {
  const [indicators, setIndicators] = useState<MomentumIndicators | null>(null);
  const [decisionsLog, setDecisionsLog] = useState<MomentumDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [indicatorsData, logData] = await Promise.all([
        momentumCenterService.getMomentumIndicators(),
        momentumCenterService.getDecisionsLog(20)
      ]);
      setIndicators(indicatorsData);
      setDecisionsLog(logData);
    } catch (error) {
      console.error('Error loading momentum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePushMomentum = () => {
    setShowActionModal(true);
  };

  const handleChooseSilence = async () => {
    try {
      await momentumCenterService.recordDecision('silence', 'اختيار الصمت', 'الإدارة قررت عدم التحرك الآن');
      await loadData();
      alert('✓ تم تسجيل قرار الصمت');
    } catch (error) {
      console.error('Error recording silence decision:', error);
      alert('حدث خطأ أثناء تسجيل القرار');
    }
  };

  const handleActionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAction) return;

    const formData = new FormData(e.currentTarget);
    const reason = formData.get('reason') as string;

    try {
      await momentumCenterService.recordDecision('push', selectedAction, reason);
      await loadData();
      setShowActionModal(false);
      setSelectedAction(null);
      alert('✓ تم تسجيل قرار الزخم بنجاح');
    } catch (error) {
      console.error('Error recording momentum decision:', error);
      alert('حدث خطأ أثناء تسجيل القرار');
    }
  };

  const getStatusBadge = (status: string, type: string) => {
    const badges = {
      registrations: {
        high: { bg: 'bg-green-100', text: 'text-green-800', label: 'مرتفع' },
        medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'متوسط' },
        quiet: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'هادئ' }
      },
      operations: {
        active: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'نشط' },
        moderate: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'معتدل' },
        quiet: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'هادئ' }
      },
      engagement: {
        high: { bg: 'bg-green-100', text: 'text-green-800', label: 'مرتفع' },
        medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'متوسط' },
        low: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'منخفض' }
      },
      capacity: {
        urgent: { bg: 'bg-red-100', text: 'text-red-800', label: 'عاجل' },
        attention: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'انتباه' },
        healthy: { bg: 'bg-green-100', text: 'text-green-800', label: 'صحي' }
      }
    };

    const badge = badges[type as keyof typeof badges]?.[status as keyof (typeof badges)[keyof typeof badges]];
    if (!badge) return null;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  if (!indicators) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">حدث خطأ أثناء تحميل البيانات</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">مركز الزخم</h1>
          <p className="text-gray-600">قراءة نبض المنصة واقتراح توقيت الحركة</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
          <Activity className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">قراءة مباشرة</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            {getStatusBadge(indicators.registrations.status, 'registrations')}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">التسجيلات</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{indicators.registrations.count}</p>
          <p className="text-sm text-gray-600">في آخر 7 أيام</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            {getStatusBadge(indicators.operations.status, 'operations')}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">التشغيل</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{indicators.operations.count}</p>
          <p className="text-sm text-gray-600">سجلات صيانة حديثة</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            {getStatusBadge(indicators.engagement.status, 'engagement')}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">التفاعل</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{indicators.engagement.total_reservations}</p>
          <p className="text-sm text-gray-600">إجمالي الحجوزات النشطة</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            {getStatusBadge(indicators.capacity.status, 'capacity')}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">السعة</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{indicators.capacity.farms_near_full}</p>
          <p className="text-sm text-gray-600">مزارع قاربت الامتلاء</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-darkgreen to-green-700 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Activity className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">الاقتراح الذكي</h3>
            <p className="text-lg text-white/90 mb-6">{indicators.suggestion}</p>
            <div className="flex gap-3">
              <button
                onClick={handlePushMomentum}
                className="flex items-center gap-2 px-6 py-3 bg-white text-darkgreen rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-lg"
              >
                <Zap className="w-5 h-5" />
                ضخ زخم خفيف
              </button>
              <button
                onClick={handleChooseSilence}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/30"
              >
                <Volume2 className="w-5 h-5" />
                اختيار الصمت
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <Clock className="w-6 h-6 text-gray-600" />
          <h3 className="text-xl font-bold text-gray-900">سجل القرارات</h3>
        </div>
        <div className="p-6">
          {decisionsLog.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              لم يتم اتخاذ أي قرارات بعد
            </div>
          ) : (
            <div className="space-y-4">
              {decisionsLog.map((decision) => (
                <div
                  key={decision.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    decision.decision_type === 'push' ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    {decision.decision_type === 'push' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{decision.action_taken}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        decision.decision_type === 'push'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {decision.decision_type === 'push' ? 'ضخ زخم' : 'صمت'}
                      </span>
                    </div>
                    {decision.reason && (
                      <p className="text-sm text-gray-600 mb-2">{decision.reason}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>بواسطة: {decision.admin_name}</span>
                      <span>{new Date(decision.created_at).toLocaleString('ar-SA')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <Zap className="w-6 h-6 text-darkgreen" />
              <h3 className="text-xl font-bold text-gray-900">اختر نوع الزخم</h3>
            </div>
            <form onSubmit={handleActionSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">نوع الحركة</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedAction('إشعار داخلي')}
                    className={`p-4 rounded-lg border-2 transition-all text-right ${
                      selectedAction === 'إشعار داخلي'
                        ? 'border-darkgreen bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Bell className="w-5 h-5 text-darkgreen" />
                      <span className="font-semibold text-gray-900">إشعار داخلي</span>
                    </div>
                    <p className="text-sm text-gray-600">إرسال إشعار للعملاء الحاليين</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAction('تفعيل شركاء الرحلة')}
                    className={`p-4 rounded-lg border-2 transition-all text-right ${
                      selectedAction === 'تفعيل شركاء الرحلة'
                        ? 'border-darkgreen bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Share2 className="w-5 h-5 text-darkgreen" />
                      <span className="font-semibold text-gray-900">شركاء الرحلة</span>
                    </div>
                    <p className="text-sm text-gray-600">تفعيل برنامج الإحالة</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAction('فتح فرصة جديدة')}
                    className={`p-4 rounded-lg border-2 transition-all text-right ${
                      selectedAction === 'فتح فرصة جديدة'
                        ? 'border-darkgreen bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FolderOpen className="w-5 h-5 text-darkgreen" />
                      <span className="font-semibold text-gray-900">فرصة جديدة</span>
                    </div>
                    <p className="text-sm text-gray-600">فتح مزرعة أو عرض جديد</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowActionModal(false);
                      setSelectedAction(null);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-right border-gray-200 hover:border-gray-300`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Volume2 className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">إلغاء / صمت</span>
                    </div>
                    <p className="text-sm text-gray-600">عدم التحرك الآن</p>
                  </button>
                </div>
              </div>

              {selectedAction && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">سبب القرار (اختياري)</label>
                  <textarea
                    name="reason"
                    rows={3}
                    placeholder="مثال: نشاط مرتفع يستدعي دفعة خفيفة..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={!selectedAction}
                  className="flex-1 px-6 py-3 bg-darkgreen text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  تأكيد القرار
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedAction(null);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingManagement;
