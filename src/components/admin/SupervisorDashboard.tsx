import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Mail, Eye, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { investorMessagingService } from '../../services/investorMessagingService';

interface SupervisorStats {
  total_messages: number;
  total_recipients: number;
  total_farms_messaged: number;
  total_farm_managers: number;
  avg_read_rate: number;
  messages_last_7_days: number;
  messages_last_30_days: number;
}

interface ManagerStat {
  admin_id: string;
  admin_name: string;
  admin_email: string;
  total_messages: number;
  total_recipients: number;
  last_message_date?: string;
  farms_count: number;
}

export default function SupervisorDashboard() {
  const [stats, setStats] = useState<SupervisorStats | null>(null);
  const [managers, setManagers] = useState<ManagerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupervisorData();
  }, []);

  async function loadSupervisorData() {
    try {
      setLoading(true);
      const [statsData, managersData] = await Promise.all([
        investorMessagingService.getSuperAdminStats(),
        investorMessagingService.getFarmManagerStats()
      ]);

      setStats(statsData);
      setManagers(managersData);
    } catch (error) {
      console.error('Error loading supervisor data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800">فشل تحميل الإحصائيات</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="bg-blue-600 text-white p-3 rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              لوحة الإشراف - مراسلة المستثمرين
            </h2>
            <p className="text-gray-600">
              إحصائيات شاملة لجميع الرسائل المرسلة عبر النظام
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">إجمالي الرسائل</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total_messages}</p>
          <p className="text-xs text-gray-500 mt-2">
            {stats.messages_last_7_days} رسالة في آخر 7 أيام
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">إجمالي المستلمين</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total_recipients}</p>
          <p className="text-xs text-gray-500 mt-2">
            عبر {stats.total_farms_messaged} مزرعة
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">معدل القراءة</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.avg_read_rate}%</p>
          <p className="text-xs text-gray-500 mt-2">
            نسبة المستثمرين الذين قرأوا الرسائل
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">آخر 30 يوم</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.messages_last_30_days}</p>
          <p className="text-xs text-gray-500 mt-2">
            رسالة مرسلة
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-100 p-2 rounded-lg">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              أداء مديري المزارع
            </h3>
            <p className="text-sm text-gray-600">
              إحصائيات تفصيلية لكل مدير مزرعة
            </p>
          </div>
        </div>

        {managers.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">لا توجد بيانات لمديري المزارع</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    المدير
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    المزارع
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    الرسائل
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    المستلمين
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    آخر نشاط
                  </th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr
                    key={manager.admin_id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {manager.admin_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {manager.admin_email}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {manager.farms_count}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        <Mail className="w-3 h-3" />
                        {manager.total_messages}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        <Users className="w-3 h-3" />
                        {manager.total_recipients}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {manager.last_message_date ? (
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(manager.last_message_date).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">لا يوجد</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-900 space-y-2">
            <p className="font-semibold">ملاحظات الإشراف:</p>
            <ul className="list-disc list-inside space-y-1 text-green-800">
              <li>هذه الإحصائيات محدثة لحظياً من قاعدة البيانات</li>
              <li>معدل القراءة يشير إلى مدى تفاعل المستثمرين مع الرسائل</li>
              <li>يمكنك مراقبة نشاط كل مدير مزرعة وتقييم أدائه</li>
              <li>الإحصائيات تساعد في تحسين استراتيجية التواصل</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
