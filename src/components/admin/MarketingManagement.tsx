import { Megaphone, TrendingUp, Users, Target } from 'lucide-react';

const MarketingManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">التسويق</h1>
          <p className="text-gray-600">إدارة الحملات التسويقية والترويجية</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-lg">
          <Megaphone className="w-5 h-5 text-pink-600" />
          <span className="text-sm font-medium text-pink-700">قريباً</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center mb-4">
            <Megaphone className="w-6 h-6 text-pink-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">الحملات الإعلانية</h3>
          <p className="text-sm text-gray-600">إدارة الحملات التسويقية على منصات التواصل الاجتماعي</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">تحليل الأداء</h3>
          <p className="text-sm text-gray-600">متابعة نتائج الحملات ومعدلات التحويل</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">الجمهور المستهدف</h3>
          <p className="text-sm text-gray-600">تحديد وتحليل شرائح العملاء المستهدفة</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border border-pink-100 p-12 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Megaphone className="w-10 h-10 text-pink-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">أدوات التسويق قيد التطوير</h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          نعمل على بناء مجموعة شاملة من الأدوات التسويقية لمساعدتك في الوصول لعملائك بفعالية أكبر
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>سيتم إطلاق أدوات التسويق قريباً</span>
        </div>
      </div>
    </div>
  );
};

export default MarketingManagement;
