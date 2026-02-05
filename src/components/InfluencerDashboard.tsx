import { useState, useEffect } from 'react';
import { Award, TrendingUp, Calendar, MapPin, Sparkles } from 'lucide-react';
import {
  influencerMarketingService,
  InfluencerStats,
  InfluencerActivityLog
} from '../services/influencerMarketingService';

export default function InfluencerDashboard() {
  const [stats, setStats] = useState<InfluencerStats | null>(null);
  const [activityLog, setActivityLog] = useState<InfluencerActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

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
              <span className="text-sm text-amber-600">/20</span>
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
                          {log.trees_in_current_batch}/20
                        </span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
                            style={{ width: `${(log.trees_in_current_batch / 20) * 100}%` }}
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
