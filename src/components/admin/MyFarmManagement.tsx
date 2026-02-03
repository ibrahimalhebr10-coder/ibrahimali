import React, { useState } from 'react';
import {
  Sprout,
  TrendingUp,
  TreePine,
  Calendar,
  Droplets,
  Camera,
  Gift,
  FileText,
  Package,
  Leaf,
  Sparkles,
  TrendingDown,
  Plus,
  Activity
} from 'lucide-react';

type FarmPath = 'agricultural' | 'investment' | null;

type AgriculturalTab = 'trees-management' | 'operations' | 'documentation' | 'harvest-stage' | 'experience-builder';
type InvestmentTab = 'assets' | 'investment-status' | 'products-waste' | 'expansion' | 'experience-builder';

const MyFarmManagement: React.FC = () => {
  const [activePath, setActivePath] = useState<FarmPath>(null);
  const [activeAgriculturalTab, setActiveAgriculturalTab] = useState<AgriculturalTab>('trees-management');
  const [activeInvestmentTab, setActiveInvestmentTab] = useState<InvestmentTab>('assets');

  const agriculturalTabs = [
    { id: 'trees-management' as AgriculturalTab, label: 'إدارة الأشجار', icon: TreePine },
    { id: 'operations' as AgriculturalTab, label: 'العمليات الزراعية', icon: Droplets },
    { id: 'documentation' as AgriculturalTab, label: 'التوثيق الزراعي', icon: Camera },
    { id: 'harvest-stage' as AgriculturalTab, label: 'المحصول والمرحلة', icon: Gift },
    { id: 'experience-builder' as AgriculturalTab, label: 'Experience Builder', icon: Sparkles },
  ];

  const investmentTabs = [
    { id: 'assets' as InvestmentTab, label: 'الأصول الزراعية', icon: TreePine },
    { id: 'investment-status' as InvestmentTab, label: 'حالة الاستثمار', icon: Activity },
    { id: 'products-waste' as InvestmentTab, label: 'المنتجات والمخلفات', icon: Package },
    { id: 'expansion' as InvestmentTab, label: 'فرص التوسعة', icon: Plus },
    { id: 'experience-builder' as InvestmentTab, label: 'Experience Builder', icon: Sparkles },
  ];

  const renderAgriculturalContent = () => {
    switch (activeAgriculturalTab) {
      case 'trees-management':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TreePine className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">إدارة الأشجار</h3>
                  <p className="text-sm text-gray-500">عدد الأشجار، مراحل النمو، الصحة، والوسوم</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-4">إحصائيات الأشجار</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-xs text-gray-600 mb-1">إجمالي الأشجار</div>
                      <div className="text-2xl font-bold text-gray-900">0</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-xs text-gray-600 mb-1">أشجار سليمة</div>
                      <div className="text-2xl font-bold text-green-600">0</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-xs text-gray-600 mb-1">تحتاج متابعة</div>
                      <div className="text-2xl font-bold text-orange-600">0</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3">مراحل النمو</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900">نمو</span>
                      </div>
                      <span className="text-sm text-gray-600">مرحلة النمو الأولية</span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900">إثمار</span>
                      </div>
                      <span className="text-sm text-gray-600">بداية الإنتاج</span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900">حصاد</span>
                      </div>
                      <span className="text-sm text-gray-600">جني الثمار</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                  <h4 className="font-semibold text-gray-900 mb-3">وسم الأشجار</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    وضع علامات على الأشجار التي تحتاج متابعة خاصة
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border border-orange-200">
                      احتياج مائي
                    </span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border border-orange-200">
                      آفات
                    </span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border border-orange-200">
                      احتياج تسميد
                    </span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border border-orange-200">
                      فحص دوري
                    </span>
                  </div>
                </div>
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
                  <p className="text-sm text-gray-500">ري، تقليم، تسميد، مكافحة - مع سجل زمني</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    الري
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">تسجيل عمليات الري والمواعيد</p>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <div className="text-xs text-gray-500">آخر عملية ري</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">لم يتم التسجيل بعد</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-purple-600" />
                    التقليم
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">تسجيل عمليات التقليم والتشذيب</p>
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <div className="text-xs text-gray-500">آخر عملية تقليم</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">لم يتم التسجيل بعد</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-600" />
                    التسميد
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">تسجيل عمليات التسميد والأنواع</p>
                  <div className="bg-white p-3 rounded-lg border border-orange-200">
                    <div className="text-xs text-gray-500">آخر عملية تسميد</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">لم يتم التسجيل بعد</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TreePine className="w-5 h-5 text-red-600" />
                    مكافحة الآفات
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">تسجيل عمليات المكافحة والعلاج</p>
                  <div className="bg-white p-3 rounded-lg border border-red-200">
                    <div className="text-xs text-gray-500">آخر عملية مكافحة</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">لم يتم التسجيل بعد</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">السجل الزمني:</span> يتم تسجيل كل عملية زراعية مع التاريخ والملاحظات
                </p>
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
                  <h3 className="text-xl font-bold text-gray-900">التوثيق الزراعي</h3>
                  <p className="text-sm text-gray-500">صور، فيديو، ملاحظات ميدانية - مرتبطة بالمراحل</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-3">التصوير الدوري</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    تصوير دوري للأشجار لإظهار التطور والنمو
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-lg border border-purple-200 text-center">
                      <div className="text-2xl font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-600 mt-1">صور شهرية</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-purple-200 text-center">
                      <div className="text-2xl font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-600 mt-1">صور موسمية</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-purple-200 text-center">
                      <div className="text-2xl font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-600 mt-1">فيديوهات</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3">ربط بالمراحل</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    ربط كل صورة أو فيديو بمرحلة النمو أو العملية الزراعية
                  </p>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <div className="text-sm text-gray-500">مثال: صورة مرتبطة بـ "عملية الري - 15 يناير"</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-3">ملاحظات ميدانية</h4>
                  <p className="text-sm text-gray-600">
                    تسجيل ملاحظات بسيطة عن حالة الأشجار والنشاط اليومي
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'harvest-stage':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">المحصول والمرحلة</h3>
                  <p className="text-sm text-gray-500">المرحلة الحالية، نافذة تقديرية - بدون أرقام إنتاج</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-4">المرحلة الحالية</h4>
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <div className="font-medium text-gray-900">مرحلة النمو</div>
                        <div className="text-xs text-gray-600 mt-1">الأشجار في مرحلة النمو الأولية</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-4">نافذة تقديرية</h4>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                      <div className="text-xs text-gray-600">موعد الإثمار المتوقع</div>
                      <div className="text-sm font-medium text-gray-900 mt-1">سبتمبر - أكتوبر 2026</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                      <div className="text-xs text-gray-600">موعد الحصاد المتوقع</div>
                      <div className="text-sm font-medium text-gray-900 mt-1">نوفمبر - ديسمبر 2026</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">مهم:</span> لا يتم عرض أرقام إنتاج أو عوائد - فقط مراحل ومواعيد تقديرية
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-sm text-purple-800">
                    <span className="font-semibold">لغة إنسانية:</span> "شجرتك الآن في مرحلة النمو" بدلاً من "الإنتاج المتوقع 50 كجم"
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'experience-builder':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Experience Builder - الزراعي</h3>
                  <p className="text-sm text-gray-500">تحديد ما يراه المزارع في واجهة "مزرعتي الزراعي"</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-3">🎯 الهدف من هذا التبويب</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    هنا تحدد الإدارة ما يظهر للمزارع العادي عندما يضغط على زر "مزرعتي الزراعي" في الواجهة الأمامية
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></div>
                        <span>لغة إنسانية وبسيطة</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></div>
                        <span>صور توضيحية</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></div>
                        <span>رحلة الشجرة</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></div>
                        <span>تحديثات دورية</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-3">المحتوى المعروض</h4>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">عنوان الرحلة</div>
                      <div className="text-sm text-gray-600">مثال: "شجرتك تنمو بصحة جيدة"</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">وصف المرحلة</div>
                      <div className="text-sm text-gray-600">مثال: "أشجارك الآن في مرحلة النمو الأولية..."</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">صور المرحلة</div>
                      <div className="text-sm text-gray-600">صور حديثة للأشجار</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">ماذا بعد؟</div>
                      <div className="text-sm text-gray-600">خطوات قادمة بلغة بسيطة</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">الربط:</span> هذا المحتوى يُعرض تلقائيًا في زر "مزرعتي الزراعي" بالواجهة
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
                  <p className="text-sm text-gray-500">عدد، أنواع، توزيع، ارتباط بالعقود</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
                  <h4 className="font-semibold text-gray-900 mb-4">معلومات الأصول</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-emerald-200">
                      <div className="text-xs text-gray-600 mb-1">عدد الأشجار</div>
                      <div className="text-2xl font-bold text-gray-900">0</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-emerald-200">
                      <div className="text-xs text-gray-600 mb-1">أنواع الأشجار</div>
                      <div className="text-2xl font-bold text-gray-900">0</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-emerald-200">
                      <div className="text-xs text-gray-600 mb-1">عدد المزارع</div>
                      <div className="text-2xl font-bold text-gray-900">0</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3">التوزيع حسب النوع</h4>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">زيتون</span>
                        <span className="text-sm text-gray-600">0 شجرة</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">نخيل</span>
                        <span className="text-sm text-gray-600">0 شجرة</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-3">ارتباط بالعقود</h4>
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <div className="text-sm text-gray-600">عدد الأشجار المرتبطة بعقود نشطة</div>
                    <div className="text-2xl font-bold text-gray-900 mt-2">0</div>
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

      case 'investment-status':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">حالة الاستثمار</h3>
                  <p className="text-sm text-gray-500">نشط، فترة مجانية، يقترب من الانتهاء</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-4">العقود النشطة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">نشط</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-600 mt-1">عقود جارية</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">مجاني</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-600 mt-1">فترة مجانية</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">يقترب</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-600 mt-1">قرب الانتهاء</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-3">العقود المنتهية</h4>
                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-sm text-gray-600 mt-1">عقود منتهية - بحاجة لتجديد</div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">تنبيه:</span> العقود التي تقترب من الانتهاء تحتاج متابعة للتجديد
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'products-waste':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">المنتجات والمخلفات</h3>
                  <p className="text-sm text-gray-500">ثمار، زيوت، مخلفات - تسجيل قيمة فقط</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                  <h4 className="font-semibold text-gray-900 mb-4">المنتجات الأساسية</h4>
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">ثمار</div>
                          <div className="text-xs text-gray-600 mt-1">المحصول الرئيسي</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">0 كجم</div>
                          <div className="text-xs text-gray-600">متوقع</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">زيوت</div>
                          <div className="text-xs text-gray-600 mt-1">من الثمار</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">0 لتر</div>
                          <div className="text-xs text-gray-600">متوقع</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-4">المخلفات الزراعية</h4>
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
                    <span className="font-semibold">نقطة تميز:</span> تسجيل قيمة المخلفات - لا منصة أخرى تفعل هذا
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">ملاحظة:</span> تسجيل القيمة فقط - لا تفاصيل زراعية
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'expansion':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">فرص التوسعة</h3>
                  <p className="text-sm text-gray-500">زيادة أشجار، ترقية عقود، مزرعة جديدة</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-4">زيادة عدد الأشجار</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    إضافة أشجار جديدة في نفس المزرعة
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">فرص متاحة</div>
                        <div className="text-xs text-gray-600 mt-1">أشجار يمكن إضافتها</div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">0</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-4">ترقية العقود</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    الانتقال من باقة إلى باقة أكبر
                  </p>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">عقود قابلة للترقية</span>
                        <span className="text-sm font-medium text-gray-900">0</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-4">دخول مزرعة جديدة</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    الاستثمار في مزرعة أخرى لتنويع المحفظة
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">مزارع جديدة متاحة</div>
                        <div className="text-xs text-gray-600 mt-1">مزارع مفتوحة للحجز</div>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">0</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">استراتيجية:</span> تشجيع المستثمرين على التوسع وزيادة استثماراتهم
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'experience-builder':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Experience Builder - الاستثماري</h3>
                  <p className="text-sm text-gray-500">تحديد ما يراه المستثمر في واجهة "مزرعتي الاستثماري"</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3">🎯 الهدف من هذا التبويب</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    هنا تحدد الإدارة ما يظهر للمستثمر عندما يضغط على زر "مزرعتي الاستثماري" في الواجهة الأمامية
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                        <span>لغة أصول وأرقام</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                        <span>لغة نمو ومتابعة</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                        <span>لغة توسعة وفرص</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                        <span>عرض احترافي للعوائد</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-3">المحتوى المعروض</h4>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">ملخص الأصول</div>
                      <div className="text-sm text-gray-600">عدد الأشجار، التوزيع، القيمة</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">حالة الاستثمار</div>
                      <div className="text-sm text-gray-600">العقود النشطة، المدة المتبقية</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">العوائد المتوقعة</div>
                      <div className="text-sm text-gray-600">تقديرات بناءً على الأداء السابق</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="font-medium text-gray-900 mb-1">فرص التوسع</div>
                      <div className="text-sm text-gray-600">باقات جديدة، زيادة أشجار</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-sm text-purple-800">
                    <span className="font-semibold">الفرق:</span> المستثمر يرى أرقام وأداء، المزارع يرى رحلة وحالة
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">الربط:</span> هذا المحتوى يُعرض تلقائيًا في زر "مزرعتي الاستثماري" بالواجهة
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

  if (!activePath) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <TreePine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">مزرعتي</h2>
              <p className="text-sm text-gray-500">اختر المسار للبدء</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setActivePath('agricultural')}
              className="group bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-2xl p-8 border-2 border-green-200 hover:border-green-300 transition-all text-right"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Sprout className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">المسار الزراعي</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    إدارة الحياة الزراعية للأشجار - العمليات، التوثيق، المراحل
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border border-green-200">
                      إدارة الأشجار
                    </span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border border-green-200">
                      العمليات الزراعية
                    </span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border border-green-200">
                      التوثيق
                    </span>
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActivePath('investment')}
              className="group bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-300 transition-all text-right"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">المسار الاستثماري</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    إدارة الأصل الاستثماري - العقود، المنتجات، فرص التوسعة
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border border-blue-200">
                      الأصول
                    </span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border border-blue-200">
                      حالة الاستثمار
                    </span>
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-700 border border-blue-200">
                      التوسعة
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-sm text-purple-800">
              <span className="font-semibold">مهم:</span> لا تبويبات مشتركة، لا أدوات مشتركة، لا عرض موحّد - كل مسار مستقل تمامًا
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <TreePine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">مزرعتي</h2>
              <p className="text-sm text-gray-500">
                {activePath === 'agricultural' ? 'المسار الزراعي' : 'المسار الاستثماري'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActivePath(null)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            تغيير المسار
          </button>
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
