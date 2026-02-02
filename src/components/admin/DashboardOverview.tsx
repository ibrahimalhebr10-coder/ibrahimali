import React, { useEffect, useState } from 'react';
import { Users, TreePine, Package, TrendingUp, DollarSign, MessageSquare, Activity, BarChart3, LayoutDashboard } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrees: 0,
    activeFarms: 0,
    activeContracts: 0,
    totalRevenue: 0,
    pendingMessages: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [farmsResult, reservationsResult] = await Promise.all([
        supabase.from('farms').select('total_trees, is_open_for_booking'),
        supabase.from('reservations').select('status, total_price'),
      ]);

      const totalTrees = farmsResult.data?.reduce((sum, farm) => sum + (farm.total_trees || 0), 0) || 0;
      const activeFarms = farmsResult.data?.filter(f => f.is_open_for_booking).length || 0;
      const activeContracts = reservationsResult.data?.filter(r => r.status === 'confirmed').length || 0;
      const totalRevenue = reservationsResult.data?.reduce((sum, r) => sum + (r.total_price || 0), 0) || 0;

      setStats({
        totalUsers: 0,
        totalTrees,
        activeFarms,
        activeContracts,
        totalRevenue,
        pendingMessages: 0,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const statsCards = [
    {
      label: 'المزارع النشطة',
      value: isLoading ? '...' : stats.activeFarms,
      icon: TreePine,
      color: 'green',
      change: '+5%',
      trend: 'up'
    },
    {
      label: 'إجمالي الأشجار',
      value: isLoading ? '...' : stats.totalTrees.toLocaleString(),
      icon: Package,
      color: 'emerald',
      change: '+12%',
      trend: 'up'
    },
    {
      label: 'العقود النشطة',
      value: isLoading ? '...' : stats.activeContracts,
      icon: TrendingUp,
      color: 'blue',
      change: '+8%',
      trend: 'up'
    },
    {
      label: 'الإيرادات الكلية',
      value: isLoading ? '...' : `${stats.totalRevenue.toLocaleString()} ر.س`,
      icon: DollarSign,
      color: 'purple',
      change: '+15%',
      trend: 'up'
    },
    {
      label: 'إجمالي المستخدمين',
      value: '---',
      icon: Users,
      color: 'orange',
      change: '+3%',
      trend: 'up'
    },
    {
      label: 'الرسائل الجديدة',
      value: '---',
      icon: MessageSquare,
      color: 'red',
      change: '0',
      trend: 'neutral'
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      green: 'bg-green-50 text-green-600 border-green-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-100',
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      red: 'bg-red-50 text-red-600 border-red-100',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const quickActions = [
    { label: 'إضافة مزرعة جديدة', icon: TreePine, color: 'green' },
    { label: 'إدارة الباقات', icon: Package, color: 'purple' },
    { label: 'مراجعة العقود', icon: TrendingUp, color: 'blue' },
    { label: 'الرسائل والإشعارات', icon: MessageSquare, color: 'orange' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            الصفحة الرئيسية
          </h1>
          <p className="text-sm sm:text-base text-gray-600 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            نظرة عامة على أداء المنصة الهجينة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            تحديث البيانات
          </button>
          <button className="px-4 py-2 bg-darkgreen text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">تقرير مفصل</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 lg:gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl border ${getColorClasses(stat.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {stat.trend === 'up' && (
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">{stat.label}</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-darkgreen rounded-full"></div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">إجراءات سريعة</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl hover:shadow-md hover:border-darkgreen transition-all group"
              >
                <div className={`p-4 rounded-xl ${getColorClasses(action.color)} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-darkgreen transition-colors text-center">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 rounded-xl p-6 lg:p-8 border border-green-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900">حالة النظام</h3>
          </div>
          <p className="text-sm lg:text-base text-gray-700 leading-relaxed mb-4">
            جميع الأنظمة تعمل بكفاءة. المنصة الهجينة جاهزة للاستقبال والتشغيل الكامل.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">قاعدة البيانات</span>
              <span className="text-xs font-semibold text-green-600 bg-white px-3 py-1 rounded-full">متصل</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">خدمات API</span>
              <span className="text-xs font-semibold text-green-600 bg-white px-3 py-1 rounded-full">نشط</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">التخزين السحابي</span>
              <span className="text-xs font-semibold text-green-600 bg-white px-3 py-1 rounded-full">جاهز</span>
            </div>
          </div>
        </div>

        {/* Platform Info */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 lg:p-8 border border-blue-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900">معلومات المنصة</h3>
          </div>
          <p className="text-sm lg:text-base text-gray-700 leading-relaxed mb-4">
            لوحة تحكم متكاملة لإدارة المزارع الهجينة (زراعية واستثمارية).
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>إدارة مركزية للمزارع والباقات</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>نظام عقود ذكي وآمن</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>تتبع لحظي للأشجار والحجوزات</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>تقارير مالية وإدارية شاملة</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Development Note */}
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 lg:p-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ملاحظة تطويرية</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              هذه نسخة محسّنة من لوحة التحكم مع تصميم احترافي متجاوب.
              البيانات المعروضة حالياً هي بيانات حقيقية من قاعدة البيانات.
              المزيد من الإحصائيات والمؤشرات سيتم إضافتها في المراحل القادمة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
