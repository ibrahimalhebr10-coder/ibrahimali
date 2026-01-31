import { TrendingUp, DollarSign, TreePine, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react';

interface InvestmentAnalytics {
  totalInvestment: number;
  currentValue: number;
  growth: number;
  totalTrees: number;
  expectedYield: number;
  monthlyGrowth: number[];
}

interface AnalyticsDashboardProps {
  userId: string;
}

export default function InvestmentAnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<InvestmentAnalytics>({
    totalInvestment: 45000,
    currentValue: 52000,
    growth: 15.5,
    totalTrees: 120,
    expectedYield: 18000,
    monthlyGrowth: [5, 7, 9, 11, 13, 15.5]
  });

  const growthPercentage = ((analytics.currentValue - analytics.totalInvestment) / analytics.totalInvestment * 100).toFixed(1);
  const isPositive = analytics.growth >= 0;

  return (
    <div className="space-y-4">
      {/* Main Analytics Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Investment */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">إجمالي الاستثمار</span>
          </div>
          <p className="text-2xl font-bold">{analytics.totalInvestment.toLocaleString()}</p>
          <p className="text-xs opacity-75 mt-1">ريال سعودي</p>
        </div>

        {/* Current Value */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">القيمة الحالية</span>
          </div>
          <p className="text-2xl font-bold">{analytics.currentValue.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1">
            {isPositive ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            <span className="text-xs font-bold">{growthPercentage}%</span>
          </div>
        </div>

        {/* Total Trees */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <TreePine className="w-4 h-4" />
            <span className="text-xs">عدد الأشجار</span>
          </div>
          <p className="text-2xl font-bold">{analytics.totalTrees}</p>
          <p className="text-xs opacity-75 mt-1">شجرة منتجة</p>
        </div>

        {/* Expected Yield */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <Target className="w-4 h-4" />
            <span className="text-xs">العائد المتوقع</span>
          </div>
          <p className="text-2xl font-bold">{analytics.expectedYield.toLocaleString()}</p>
          <p className="text-xs opacity-75 mt-1">سنوياً</p>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">نمو الاستثمار</h3>
          <span className="text-xs text-gray-500">آخر 6 أشهر</span>
        </div>

        <div className="flex items-end justify-between gap-2 h-32">
          {analytics.monthlyGrowth.map((value, index) => {
            const height = (value / Math.max(...analytics.monthlyGrowth)) * 100;
            const isLast = index === analytics.monthlyGrowth.length - 1;

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isLast
                        ? 'bg-gradient-to-t from-green-600 to-emerald-500 shadow-lg'
                        : 'bg-gradient-to-t from-green-400 to-emerald-300'
                    }`}
                    style={{ height: `${height}%`, minHeight: '20px' }}
                  />
                  {isLast && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap">
                      {value}%
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-500">
                  {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'][index]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-green-50 rounded-xl p-3 border border-green-200 text-center">
          <p className="text-2xl font-bold text-green-600">A+</p>
          <p className="text-xs text-gray-600 mt-1">تقييم الأداء</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 text-center">
          <p className="text-2xl font-bold text-blue-600">92%</p>
          <p className="text-xs text-gray-600 mt-1">معدل الصحة</p>
        </div>

        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-center">
          <p className="text-2xl font-bold text-amber-600">8.5</p>
          <p className="text-xs text-gray-600 mt-1">رضا العملاء</p>
        </div>
      </div>
    </div>
  );
}
