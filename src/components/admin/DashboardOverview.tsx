import React from 'react';
import { Users, TreePine, Package, TrendingUp, DollarSign, MessageSquare } from 'lucide-react';

const DashboardOverview: React.FC = () => {
  const stats = [
    { label: 'إجمالي المستخدمين', value: '---', icon: Users, color: 'blue' },
    { label: 'إجمالي الأشجار', value: '---', icon: TreePine, color: 'green' },
    { label: 'الباقات النشطة', value: '---', icon: Package, color: 'purple' },
    { label: 'العقود الجارية', value: '---', icon: TrendingUp, color: 'orange' },
    { label: 'الإيرادات', value: '---', icon: DollarSign, color: 'emerald' },
    { label: 'الرسائل الجديدة', value: '---', icon: MessageSquare, color: 'red' },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
      emerald: 'bg-emerald-50 text-emerald-600',
      red: 'bg-red-50 text-red-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">الصفحة الرئيسية</h1>
        <p className="text-gray-600">نظرة عامة على أداء المنصة</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-gray-900">هيكلة لوحة التحكم</h3>
        </div>
        <p className="text-gray-700 leading-relaxed">
          هذه نسخة هيكلية من لوحة التحكم. جميع الأقسام جاهزة للتطوير المرحلي.
          المؤشرات والبيانات سيتم ربطها في المراحل القادمة.
        </p>
      </div>
    </div>
  );
};

export default DashboardOverview;
