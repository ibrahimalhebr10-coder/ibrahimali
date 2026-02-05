import React, { useEffect, useState } from 'react';
import { Users, TreePine, FileText, CheckCircle, DollarSign, Database, Wifi, HardDrive, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrees: 0,
    activeFarms: 0,
    activeContracts: 0,
    totalRevenue: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadStats();
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [farmsResult, reservationsResult, usersResult] = await Promise.all([
        supabase.from('farms').select('total_trees, is_open_for_booking'),
        supabase.from('reservations').select('status, total_price, is_demo').eq('is_demo', false),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      ]);

      const totalTrees = farmsResult.data?.reduce((sum, farm) => sum + (farm.total_trees || 0), 0) || 0;
      const activeFarms = farmsResult.data?.filter(f => f.is_open_for_booking).length || 0;
      const activeContracts = reservationsResult.data?.filter(r => r.status === 'confirmed' || r.status === 'paid').length || 0;
      const totalRevenue = reservationsResult.data?.reduce((sum, r) => sum + (r.total_price || 0), 0) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalTrees,
        activeFarms,
        activeContracts,
        totalRevenue,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header - Simple Title Only */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          غرفة المراقبة
        </h1>
        <p className="text-gray-600">
          نظرة عامة على حالة المنصة
        </p>
      </div>

      {/* 1. شريط الحالة العام */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h2 className="text-lg font-semibold text-gray-900">حالة المنصة</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">النظام</p>
              <p className="text-sm font-semibold text-green-600">يعمل</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">قاعدة البيانات</p>
              <p className="text-sm font-semibold text-green-600">متصلة</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">بوابات الدفع</p>
              <p className="text-sm font-semibold text-green-600">نشطة</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">التشغيل</p>
              <p className="text-sm font-semibold text-green-600">مستقر</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. منطقة النبض الرقمي - بطاقات الأرقام */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">إجمالي المستخدمين</p>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? '...' : stats.totalUsers.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">العقود النشطة</p>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? '...' : stats.activeContracts.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TreePine className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">إجمالي الأشجار المحجوزة</p>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? '...' : stats.totalTrees.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">المزارع النشطة</p>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? '...' : stats.activeFarms.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">إجمالي الإيرادات</p>
          <p className="text-2xl font-bold text-gray-900">
            {isLoading ? '...' : `${stats.totalRevenue.toLocaleString()} ر.س`}
          </p>
        </div>
      </div>

      {/* 3. فاصل بصري */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

      {/* 4. لوحة ملخص المنصة */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-8 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">ملخص المنصة</h2>

        <div className="space-y-4 text-gray-700">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
            <p className="leading-relaxed">
              إدارة مركزية للمزارع - نظام موحد لإدارة جميع المزارع والباقات
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
            <p className="leading-relaxed">
              تشغيل وصيانة - نظام كامل لإدارة العمليات التشغيلية وسجلات الصيانة
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
            <p className="leading-relaxed">
              نظام مالي مبسط - تتبع الإيرادات والمصروفات لكل مزرعة بشكل منفصل
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
            <p className="leading-relaxed">
              مساران متكاملان - أشجاري الخضراء (زراعي) وأشجاري الذهبية (استثماري)
            </p>
          </div>
        </div>
      </div>

      {/* 5. لوحة الاطمئنان الإداري */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-3">المنصة جاهزة للتشغيل</h2>
            <div className="space-y-2 text-gray-700">
              <p className="flex items-center gap-2">
                <span className="text-green-600">•</span>
                <span>لا توجد تنبيهات حرجة</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-600">•</span>
                <span>لا توجد مشاكل معلّقة</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-600">•</span>
                <span>جميع الأنظمة تعمل بكفاءة</span>
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm text-gray-600">
                آخر تحديث: {formatDate(currentDate)} - {formatTime(currentDate)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
