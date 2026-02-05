import { useState, useEffect } from 'react';
import { Building, Wallet, TrendingUp, ChevronRight } from 'lucide-react';
import { farmService } from '../../services/farmService';
import FarmFinancialPage from './FarmFinancialPage';
import PlatformWallet from './PlatformWallet';

type View = 'select-farm' | 'farm-financial' | 'platform-wallet';

export default function FinanceSection() {
  const [currentView, setCurrentView] = useState<View>('select-farm');
  const [selectedFarm, setSelectedFarm] = useState<{ id: string; name: string } | null>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      setLoading(true);
      const farmsData = await farmService.getAllFarms();
      setFarms(farmsData);
    } catch (error) {
      console.error('Error loading farms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFarmSelect = (farm: any) => {
    setSelectedFarm({ id: farm.id, name: farm.name_ar || farm.name });
    setCurrentView('farm-financial');
  };

  const handleBackToSelection = () => {
    setSelectedFarm(null);
    setCurrentView('select-farm');
  };

  if (currentView === 'farm-financial' && selectedFarm) {
    return (
      <FarmFinancialPage
        farmId={selectedFarm.id}
        farmName={selectedFarm.name}
        onBack={handleBackToSelection}
      />
    );
  }

  if (currentView === 'platform-wallet') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setCurrentView('select-farm')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          العودة للقائمة الرئيسية
        </button>
        <PlatformWallet />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">قسم المالية</h2>
        <p className="text-sm text-gray-600 mt-1">إدارة الشؤون المالية للمزارع ومحفظة الأرباح</p>
      </div>

      {/* Platform Wallet Quick Access */}
      <button
        onClick={() => setCurrentView('platform-wallet')}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
              <Wallet className="w-8 h-8" />
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">محفظة الأرباح</div>
              <div className="text-sm opacity-90">عرض وإدارة الفوائض المالية</div>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 transform rotate-180" />
        </div>
      </button>

      {/* Farm Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">اختر مزرعة لعرض ماليتها</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-600">
            جاري تحميل المزارع...
          </div>
        ) : farms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            لا توجد مزارع متاحة
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {farms.map((farm) => (
              <button
                key={farm.id}
                onClick={() => handleFarmSelect(farm)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{farm.name_ar || farm.name}</div>
                    <div className="text-sm text-gray-600">{farm.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="text-sm font-medium">عرض المالية</span>
                  <ChevronRight className="w-5 h-5 transform rotate-180" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-sm text-blue-800 space-y-1">
            <div className="font-medium">كيف يعمل قسم المالية؟</div>
            <ul className="list-disc mr-4 space-y-1">
              <li>كل مزرعة = كيان مالي مستقل</li>
              <li>المالية تتابع فقط (لا تقرر ولا تحسب رسوم)</li>
              <li>الإيرادات تأتي من سداد رسوم الصيانة</li>
              <li>المصروفات تُضاف يدويًا</li>
              <li>التحويل لمحفظة الأرباح يدوي 100%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
