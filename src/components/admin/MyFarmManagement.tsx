import React, { useState } from 'react';
import { Sprout, TrendingUp, TreePine, Calendar, Droplets, Camera, Gift, DollarSign, FileText, Package, Leaf } from 'lucide-react';

type FarmPath = 'agricultural' | 'investment';

type AgriculturalTab = 'trees-journey' | 'operations' | 'documentation' | 'harvest-management';
type InvestmentTab = 'assets' | 'contracts' | 'returns' | 'products';

const MyFarmManagement: React.FC = () => {
  const [activePath, setActivePath] = useState<FarmPath>('agricultural');
  const [activeAgriculturalTab, setActiveAgriculturalTab] = useState<AgriculturalTab>('trees-journey');
  const [activeInvestmentTab, setActiveInvestmentTab] = useState<InvestmentTab>('assets');

  const agriculturalTabs = [
    { id: 'trees-journey' as AgriculturalTab, label: 'الأشجار والرحلة', icon: TreePine },
    { id: 'operations' as AgriculturalTab, label: 'العمليات الزراعية', icon: Droplets },
    { id: 'documentation' as AgriculturalTab, label: 'التوثيق والتصوير', icon: Camera },
    { id: 'harvest-management' as AgriculturalTab, label: 'إدارة المحصول', icon: Gift },
  ];

  const investmentTabs = [
    { id: 'assets' as InvestmentTab, label: 'الأصول الزراعية', icon: TreePine },
    { id: 'contracts' as InvestmentTab, label: 'الإيجارات والعقود', icon: FileText },
    { id: 'returns' as InvestmentTab, label: 'العوائد', icon: DollarSign },
    { id: 'products' as InvestmentTab, label: 'المنتجات والمخلفات', icon: Package },
  ];

  const renderAgriculturalContent = () => {
    switch (activeAgriculturalTab) {
      case 'trees-journey':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TreePine className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">الأشجار والرحلة الزراعية</h3>
                  <p className="text-sm text-gray-500">إدارة رحلة الأشجار من النمو إلى الحصاد</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">مراحل الشجرة</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        نمو - مرحلة النمو الأولية
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        إثمار - بداية الإنتاج
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        حصاد - جني الثمار
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">ملاحظة:</span> التواريخ تقديرية وقد تتغير حسب الظروف الجوية والموسم
                </p>
              </div>
            </div>
          </div>
        );

      case 'operations':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">العمليات الزراعية</h3>
                  <p className="text-sm text-gray-500">تسجيل الأنشطة الزراعية اليومية</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    الري
                  </h4>
                  <p className="text-sm text-gray-600">تسجيل عمليات الري والمواعيد</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-purple-600" />
                    التقليم
                  </h4>
                  <p className="text-sm text-gray-600">تسجيل عمليات التقليم والتشذيب</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-600" />
                    التسميد
                  </h4>
                  <p className="text-sm text-gray-600">تسجيل عمليات التسميد والأنواع</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TreePine className="w-5 h-5 text-red-600" />
                    مكافحة الآفات
                  </h4>
                  <p className="text-sm text-gray-600">تسجيل عمليات المكافحة والعلاج</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'documentation':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Camera className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">التوثيق والتصوير</h3>
                  <p className="text-sm text-gray-500">توثيق الرحلة الزراعية بالصور والملاحظات</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-3">صور موسمية</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    تصوير دوري للأشجار لإظهار التطور والنمو
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border border-purple-200">
                      صور شهرية
                    </span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border border-purple-200">
                      صور موسمية
                    </span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border border-purple-200">
                      صور خاصة
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3">ملاحظات ميدانية</h4>
                  <p className="text-sm text-gray-600">
                    تسجيل ملاحظات بسيطة عن حالة الأشجار والنشاط
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-3">تحديثات عامة</h4>
                  <p className="text-sm text-gray-600">
                    نشر تحديثات للمزارعين بلغة بسيطة وإنسانية
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'harvest-management':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">إدارة المحصول</h3>
                  <p className="text-sm text-gray-500">إعداد خيارات التصرف بالمحصول</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-3">خيارات المزارع</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    الخيارات المتاحة للمزارع للتصرف بمحصوله
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">استلام</div>
                      <div className="text-xs text-gray-600">استلام المحصول شخصيًا</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">إهداء</div>
                      <div className="text-xs text-gray-600">إهداء المحصول لشخص آخر</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">صدقة</div>
                      <div className="text-xs text-gray-600">التبرع بالمحصول</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">متابعة</div>
                      <div className="text-xs text-gray-600">متابعة فقط بدون استلام</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">ملاحظة:</span> الإدارة تُعد الخيارات، والمزارع يختار لاحقًا في الواجهة
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderInvestmentContent = () => {
    switch (activeInvestmentTab) {
      case 'assets':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <TreePine className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">الأصول الزراعية</h3>
                  <p className="text-sm text-gray-500">إدارة الأصول والأشجار المستثمرة</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
                  <h4 className="font-semibold text-gray-900 mb-3">معلومات الأصول</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white p-4 rounded-lg border border-emerald-200">
                      <div className="text-xs text-gray-600 mb-1">عدد الأشجار</div>
                      <div className="text-2xl font-bold text-gray-900">0</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-emerald-200">
                      <div className="text-xs text-gray-600 mb-1">أنواع الأشجار</div>
                      <div className="text-2xl font-bold text-gray-900">0</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-emerald-200">
                      <div className="text-xs text-gray-600 mb-1">المزارع</div>
                      <div className="text-2xl font-bold text-gray-900">0</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">ملاحظة:</span> لغة الأصول الاستثمارية وليست اللغة الزراعية التفصيلية
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'contracts':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">الإيجارات والعقود</h3>
                  <p className="text-sm text-gray-500">إدارة عقود الإيجار والأشجار المؤجرة</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3">حالة العقود</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="font-medium text-gray-900">نشط</div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">0</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="font-medium text-gray-900">مجاني</div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">0</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <div className="font-medium text-gray-900">منتهي</div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">0</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'returns':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">العوائد الاستثمارية</h3>
                  <p className="text-sm text-gray-500">ملخص عام للعوائد والإيرادات</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-4">إيرادات الإيجارات</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-xs text-gray-600 mb-1">إجمالي الإيرادات</div>
                      <div className="text-2xl font-bold text-gray-900">0 ر.س</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-xs text-gray-600 mb-1">هذا الشهر</div>
                      <div className="text-2xl font-bold text-gray-900">0 ر.س</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">ملاحظة:</span> عرض إداري - ما يُعرض للمستثمر يكون بشكل أبسط
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">المنتجات والمخلفات</h3>
                  <p className="text-sm text-gray-500">إدارة المنتجات الأساسية والمخلفات الزراعية</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                  <h4 className="font-semibold text-gray-900 mb-3">المنتجات الأساسية</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    المحاصيل والمنتجات الرئيسية من الأشجار
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-orange-200">
                    <div className="text-sm text-gray-500">لا توجد بيانات حاليًا</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-3">المخلفات الزراعية</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    القيمة المضافة من المخلفات والنواتج الثانوية
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">تفل</div>
                      <div className="text-xs text-gray-600">بقايا العصر</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">تقليم</div>
                      <div className="text-xs text-gray-600">أغصان التقليم</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">أوراق</div>
                      <div className="text-xs text-gray-600">أوراق متساقطة</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-sm text-purple-800">
                    <span className="font-semibold">نقطة تميز:</span> لا منصة أخرى توثق المخلفات والقيمة المضافة بهذا الوضوح
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <TreePine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">مزرعتي</h2>
            <p className="text-sm text-gray-500">مركز إدارة الرحلة الزراعية والاستثمارية</p>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
          <button
            onClick={() => setActivePath('agricultural')}
            className={`
              flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
              ${activePath === 'agricultural'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <Sprout className="w-5 h-5" />
            <span>المسار الزراعي</span>
          </button>
          <button
            onClick={() => setActivePath('investment')}
            className={`
              flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
              ${activePath === 'investment'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <TrendingUp className="w-5 h-5" />
            <span>المسار الاستثماري</span>
          </button>
        </div>

        {activePath === 'agricultural' && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {agriculturalTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeAgriculturalTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAgriculturalTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all
                    ${isActive
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {activePath === 'investment' && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {investmentTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeInvestmentTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveInvestmentTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all
                    ${isActive
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activePath === 'agricultural' ? renderAgriculturalContent() : renderInvestmentContent()}
    </div>
  );
};

export default MyFarmManagement;
