import { useState, useEffect } from 'react';
import { Award, TrendingUp, Calendar, MapPin, Sparkles, Copy, CheckCircle2, Bell, Users, Gift, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  influencerMarketingService,
  InfluencerStats,
  InfluencerActivityLog
} from '../services/influencerMarketingService';
import { partnerShareMessageService } from '../services/partnerShareMessageService';

export default function InfluencerDashboard() {
  const [stats, setStats] = useState<InfluencerStats | null>(null);
  const [activityLog, setActivityLog] = useState<InfluencerActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedName, setCopiedName] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    loadData();
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') {
        new Notification('🎉 تم تفعيل الإشعارات!', {
          body: 'سنرسل لك إشعاراً فورياً عند كسب مكافآت جديدة',
          icon: '/logo.png'
        });
      }
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, logData] = await Promise.all([
        influencerMarketingService.getMyInfluencerStats(),
        influencerMarketingService.getMyActivityLog()
      ]);

      setStats(statsData);
      setActivityLog(logData);
    } catch (err) {
      console.error('خطأ في تحميل بيانات المؤثر:', err);
      setError('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleShareByName = async () => {
    if (!stats) return;

    try {
      const templateData = await partnerShareMessageService.getTemplate();

      if (!templateData.enabled) {
        alert('نظام المشاركة غير مفعّل حالياً');
        return;
      }

      const partnerName = stats.name || '';
      const displayName = stats.display_name || partnerName;
      const partnerCode = stats.partner_code || '';

      const textToShare = partnerShareMessageService.renderTemplate(templateData.template, {
        partner_name: partnerName,
        display_name: displayName,
        partner_code: partnerCode,
        website_url: templateData.websiteUrl
      });

      await navigator.clipboard.writeText(textToShare);
      setCopiedName(true);
      setTimeout(() => setCopiedName(false), 2000);
    } catch (err) {
      console.error('Error copying:', err);
      alert('تم تحضير الرسالة! الرجاء النسخ يدوياً');
    }
  };

  const handleCopyCode = async () => {
    if (!stats?.partner_code) return;

    try {
      await navigator.clipboard.writeText(stats.partner_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Error copying code:', err);
    }
  };

  const getAchievements = () => {
    if (!stats) return [];

    const achievements = [];

    if (stats.total_bookings >= 1) {
      achievements.push({
        icon: '🎯',
        title: 'الخطوة الأولى',
        description: 'أول حجز ناجح'
      });
    }

    if (stats.total_bookings >= 5) {
      achievements.push({
        icon: '⭐',
        title: 'صاعد بقوة',
        description: '5 حجوزات ناجحة'
      });
    }

    if (stats.total_bookings >= 10) {
      achievements.push({
        icon: '💎',
        title: 'شريك محترف',
        description: '10 حجوزات ناجحة'
      });
    }

    if (stats.total_rewards_earned >= 1) {
      achievements.push({
        icon: '🏆',
        title: 'المكافأة الأولى',
        description: 'حصلت على أول شجرة مكافأة'
      });
    }

    if (stats.total_rewards_earned >= 5) {
      achievements.push({
        icon: '🌟',
        title: 'جامع المكافآت',
        description: '5 أشجار مكافأة'
      });
    }

    if (stats.total_trees_booked >= 20) {
      achievements.push({
        icon: '🌳',
        title: 'غارس الأشجار',
        description: '20 شجرة محالة'
      });
    }

    return achievements;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">جاري تحميل بياناتك...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-slate-50 rounded-2xl p-8 text-center">
        <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600 mb-2">لا توجد بيانات متاحة حالياً</p>
        <p className="text-sm text-slate-500">ابدأ بمشاركة كود الإحالة الخاص بك</p>
      </div>
    );
  }

  const progressPercentage = stats.progress_percentage || 0;

  return (
    <div className="space-y-6">
      {/* رأس القسم */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">لوحة شريك المسيرة</h2>
          <p className="text-slate-600">مكافآتك وإنجازاتك</p>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* إجمالي الأشجار المكتسبة */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8 text-emerald-600" />
            <span className="text-3xl font-bold text-emerald-700">{stats.total_rewards_earned}</span>
          </div>
          <h3 className="text-sm font-medium text-emerald-800 mb-1">الأشجار المكتسبة</h3>
          <p className="text-xs text-emerald-600">مكافآتك الإجمالية</p>
        </div>

        {/* إجمالي الحجوزات */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <span className="text-3xl font-bold text-blue-700">{stats.total_bookings}</span>
          </div>
          <h3 className="text-sm font-medium text-blue-800 mb-1">الحجوزات الناجحة</h3>
          <p className="text-xs text-blue-600">{stats.total_trees_booked} شجرة محجوزة</p>
        </div>

        {/* التقدم نحو المكافأة */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-amber-700">{stats.trees_in_current_batch}</span>
              <span className="text-sm text-amber-600">/{stats.trees_required_for_reward}</span>
            </div>
            <span className="text-sm font-medium text-amber-600 bg-amber-200 px-3 py-1 rounded-full">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-amber-800 mb-3">التقدم نحو المكافأة التالية</h3>

          {/* شريط التقدم */}
          <div className="relative w-full bg-amber-200 rounded-full h-3 overflow-hidden">
            <div
              className="absolute top-0 right-0 h-full bg-gradient-to-l from-amber-500 to-amber-600 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p className="text-xs text-amber-600 mt-2 text-center">
            {stats.trees_until_next_reward} {stats.trees_until_next_reward === 1 ? 'شجرة' : 'أشجار'} متبقية
          </p>

          <p className="text-xs text-amber-700 font-bold mt-3 text-center bg-white/50 py-2 rounded-lg">
            📊 كل {stats.trees_required_for_reward} شجرة = مكافأة واحدة
          </p>
        </div>
      </div>

      {/* بطاقة الإشعارات والإنجازات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* الإشعارات */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-blue-900">الإشعارات الفورية</h3>
                <p className="text-xs text-blue-600">تنبيهات المكافآت</p>
              </div>
            </div>
            {notificationsEnabled && (
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>

          <button
            onClick={requestNotificationPermission}
            disabled={notificationsEnabled}
            className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
              notificationsEnabled
                ? 'bg-emerald-500 text-white cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {notificationsEnabled ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                مفعلة
              </span>
            ) : (
              'تفعيل الإشعارات'
            )}
          </button>

          {notificationsEnabled && (
            <p className="text-xs text-blue-700 text-center mt-3">
              سنرسل لك تنبيهاً فورياً عند كل مكافأة جديدة
            </p>
          )}
        </div>

        {/* الإنجازات */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="text-base font-bold text-purple-900">الإنجازات</h3>
                <p className="text-xs text-purple-600">{getAchievements().length} إنجاز</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="w-full py-3 px-4 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300 active:scale-95"
          >
            {showAchievements ? 'إخفاء الإنجازات' : 'عرض الإنجازات'}
          </button>
        </div>
      </div>

      {/* عرض الإنجازات */}
      {showAchievements && getAchievements().length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6" />
            إنجازاتك
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {getAchievements().map((achievement, index) => (
              <div
                key={index}
                className="bg-white/80 rounded-xl p-4 text-center transform hover:scale-105 transition-all duration-300"
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <h4 className="text-sm font-bold text-purple-900 mb-1">{achievement.title}</h4>
                <p className="text-xs text-purple-600">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* قسم المشاركة */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
        <h3 className="text-lg font-bold text-emerald-900 mb-4 text-center">شارك كودك المميز واكسب المزيد!</h3>

        <div className="bg-white/80 rounded-xl p-4 mb-4">
          <p className="text-sm text-emerald-800 font-semibold mb-2 text-center flex items-center justify-center gap-2">
            <Gift className="w-5 h-5 text-amber-600" />
            كودك المميز:
          </p>
          <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300">
            <p className="text-2xl font-black text-amber-900 tracking-wider" style={{ letterSpacing: '0.15em', fontFamily: 'monospace' }}>
              {stats?.partner_code || ''}
            </p>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-all duration-300 active:scale-95"
              title="نسخ الكود"
            >
              {copiedCode ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-center text-amber-700 mt-2 font-semibold">
            اسمك: {stats?.display_name || stats?.name || ''}
          </p>
        </div>

        <button
          onClick={handleShareByName}
          className="w-full py-5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          {copiedName ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-lg">تم النسخ!</span>
            </>
          ) : (
            <>
              <Copy className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-lg">انسخ رسالة المشاركة</span>
            </>
          )}
        </button>

        <div className="mt-4 bg-white/80 rounded-xl p-4">
          <p className="text-xs text-emerald-800 text-center leading-relaxed">
            💡 <span className="font-bold">نصيحة:</span> اضغط على الزر لنسخ رسالة جاهزة تحتوي على كودك المميز، ثم الصقها في واتساب أو أي مكان تريد المشاركة فيه
          </p>
        </div>

        <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200">
          <p className="text-sm text-amber-900 text-center font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            كيف يستخدم العميل كودك؟
          </p>
          <div className="bg-white/80 rounded-lg p-3 text-center border border-amber-300">
            <p className="text-xs text-amber-900 leading-relaxed">
              عند الحجز، يدخل العميل كودك المميز
              <br />
              <span className="inline-block mt-1 px-3 py-1 bg-amber-100 rounded-lg font-black text-amber-900 tracking-wider" style={{ letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                {stats?.partner_code || ''}
              </span>
              <br />
              <span className="text-[10px] text-amber-700 mt-1 inline-block">في حقل "كود شريك المسيرة"</span>
            </p>
          </div>
        </div>
      </div>

      {/* إحصائيات متقدمة */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-6 h-6 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-800">إحصائيات متقدمة</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">{stats.total_bookings}</p>
            <p className="text-xs text-slate-600 mt-1">عملاء محالين</p>
          </div>

          <div className="bg-white rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">{stats.total_trees_booked}</p>
            <p className="text-xs text-slate-600 mt-1">أشجار محالة</p>
          </div>

          <div className="bg-white rounded-xl p-4 text-center">
            <Award className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">{stats.total_rewards_earned}</p>
            <p className="text-xs text-slate-600 mt-1">مكافآت مكتسبة</p>
          </div>

          <div className="bg-white rounded-xl p-4 text-center">
            <Gift className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">
              {stats.total_bookings > 0
                ? Math.round((stats.total_trees_booked / stats.total_bookings) * 10) / 10
                : 0}
            </p>
            <p className="text-xs text-slate-600 mt-1">متوسط الأشجار/عميل</p>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-xl p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">معدل التحويل:</span>
            <span className="font-bold text-emerald-600">
              {stats.total_bookings > 0
                ? `${Math.round((stats.total_rewards_earned / stats.total_bookings) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* سجل النشاط */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            سجل النشاط
          </h3>
          <p className="text-sm text-slate-600 mt-1">جميع حجوزاتك ومكافآتك</p>
        </div>

        <div className="overflow-x-auto">
          {activityLog.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">لا توجد حجوزات بعد</p>
              <p className="text-sm text-slate-500">شارك كود الإحالة الخاص بك لبدء كسب المكافآت</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">التاريخ</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">المزرعة</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">الأشجار المُحالة</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">المكافآت</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">التقدم بعدها</th>
                </tr>
              </thead>
              <tbody>
                {activityLog.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">
                          {new Date(log.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{log.farm_name}</div>
                        {log.farm_location && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            {log.farm_location}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-slate-700">{log.trees_referred}</span>
                    </td>
                    <td className="py-3 px-4">
                      {log.trees_earned > 0 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                          <Award className="w-3 h-3" />
                          +{log.trees_earned}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600">
                          {log.trees_in_current_batch}/{stats.trees_required_for_reward}
                        </span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
                            style={{ width: `${(log.trees_in_current_batch / stats.trees_required_for_reward) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* رسالة تحفيزية */}
      {stats.trees_until_next_reward <= 5 && stats.trees_until_next_reward > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">أنت قريب جداً!</h3>
              <p className="text-amber-50">
                {stats.trees_until_next_reward === 1
                  ? 'شجرة واحدة فقط تفصلك عن مكافأة جديدة!'
                  : `${stats.trees_until_next_reward} أشجار فقط تفصلك عن مكافأة جديدة!`}
              </p>
              <p className="text-sm text-amber-100 mt-2">
                استمر في مشاركة كود الإحالة الخاص بك
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
