import React, { useState, useEffect } from 'react';
import { Flame, Phone, Mail, Clock, TrendingUp, Activity, Eye, MessageSquare } from 'lucide-react';
import { leadScoringService, LeadScore } from '../../services/leadScoringService';

export default function HotLeadsDashboard() {
  const [hotLeads, setHotLeads] = useState<LeadScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadScore | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadHotLeads();
    const interval = setInterval(() => {
      loadHotLeads();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshKey]);

  const loadHotLeads = async () => {
    try {
      const leads = await leadScoringService.getHotLeads(100);
      setHotLeads(leads);
    } catch (error) {
      console.error('Error loading hot leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeadActivities = async (lead: LeadScore) => {
    setSelectedLead(lead);
    const acts = await leadScoringService.getLeadActivities(
      lead.user_id || lead.session_id,
      20
    );
    setActivities(acts);
  };

  const getTemperatureColor = (temp: string) => {
    switch (temp) {
      case 'burning':
        return 'bg-red-600 text-white';
      case 'hot':
        return 'bg-orange-500 text-white';
      case 'warm':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getTemperatureIcon = (temp: string) => {
    switch (temp) {
      case 'burning':
        return <Flame className="w-5 h-5 animate-pulse" />;
      case 'hot':
        return <Flame className="w-5 h-5" />;
      case 'warm':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getStageLabel = (stage: string) => {
    const stages: Record<string, string> = {
      visitor: 'زائر',
      interested: 'مهتم',
      engaged: 'متفاعل',
      cart_abandoned: 'ترك السلة',
      payment_stuck: 'عالق في الدفع',
      converted: 'تم التحويل',
      lost: 'ضائع'
    };
    return stages[stage] || stage;
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      page_visit: 'زيارة صفحة',
      farm_view: 'مشاهدة مزرعة',
      farm_view_repeat: 'عودة لمشاهدة مزرعة',
      pricing_view: 'مشاهدة الأسعار',
      package_details: 'فتح تفاصيل باقة',
      reservation_start: 'بدء حجز',
      registration_complete: 'إتمام التسجيل',
      payment_page: 'صفحة الدفع',
      reservation_complete: 'إتمام الحجز',
      time_on_page_1min: 'بقاء دقيقة',
      time_on_page_3min: 'بقاء 3 دقائق',
      return_visitor: 'عائد',
      whatsapp_click: 'نقر واتساب'
    };
    return labels[type] || type;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  const getPriorityAction = (lead: LeadScore) => {
    if (lead.conversion_stage === 'payment_stuck') {
      return { action: 'اتصل فوراً', color: 'bg-red-600', icon: Phone };
    }
    if (lead.conversion_stage === 'cart_abandoned') {
      return { action: 'أرسل رسالة', color: 'bg-orange-500', icon: MessageSquare };
    }
    if (lead.temperature === 'burning') {
      return { action: 'تواصل الآن', color: 'bg-red-500', icon: Phone };
    }
    if (lead.temperature === 'hot') {
      return { action: 'تابع قريباً', color: 'bg-orange-400', icon: MessageSquare };
    }
    return { action: 'راقب', color: 'bg-yellow-500', icon: Eye };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/90 backdrop-blur-sm rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">العملاء الساخنون</h2>
            <p className="text-sm text-gray-600">
              {hotLeads.length} عميل جاهز للتحويل
            </p>
          </div>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
        >
          تحديث
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {hotLeads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Flame className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">لا يوجد عملاء ساخنون حالياً</p>
              <p className="text-sm mt-2">سيظهر العملاء الساخنون هنا تلقائياً</p>
            </div>
          ) : (
            hotLeads.map((lead) => {
              const priority = getPriorityAction(lead);
              const Icon = priority.icon;

              return (
                <div
                  key={lead.id}
                  onClick={() => loadLeadActivities(lead)}
                  className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:border-orange-200 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-16 h-16 ${getTemperatureColor(lead.temperature)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        {getTemperatureIcon(lead.temperature)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {lead.full_name || lead.phone || 'زائر جديد'}
                          </h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                            {lead.total_points} نقطة
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                          {lead.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span className="font-mono">{lead.phone}</span>
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-orange-600">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimeAgo(lead.last_activity_at)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                            {getStageLabel(lead.conversion_stage)}
                          </span>
                          {lead.last_activity_type && (
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                              آخر نشاط: {getActivityLabel(lead.last_activity_type)}
                            </span>
                          )}
                          <span className="px-3 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-full">
                            {lead.activities_count} نشاط
                          </span>
                        </div>
                      </div>
                    </div>

                    <button className={`${priority.color} text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                      {priority.action}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {selectedLead ? 'تفاصيل العميل' : 'اختر عميلاً'}
            </h3>

            {!selectedLead ? (
              <div className="text-center py-8 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">انقر على أي عميل لعرض تفاصيله</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">معلومات العميل</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">النقاط الكلية:</span>
                      <span className="font-bold text-orange-600">{selectedLead.total_points}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الحرارة:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTemperatureColor(selectedLead.temperature)}`}>
                        {selectedLead.temperature}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">المرحلة:</span>
                      <span className="font-medium">{getStageLabel(selectedLead.conversion_stage)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">أول زيارة:</span>
                      <span className="font-medium">{formatTimeAgo(selectedLead.first_seen_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">آخر الأنشطة</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-2 text-xs p-2 bg-gray-50 rounded">
                        <Activity className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {getActivityLabel(activity.activity_type)}
                          </p>
                          <p className="text-gray-500 truncate">
                            {activity.page_url}
                          </p>
                          <p className="text-orange-600 mt-1">
                            {formatTimeAgo(activity.created_at)}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded font-medium">
                          +{activity.points_awarded}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}