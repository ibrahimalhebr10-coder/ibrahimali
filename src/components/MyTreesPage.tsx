import { useState } from 'react';
import { X, TreePine, Package, Recycle, Rocket, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AgriculturalAssetsTab from './investment/AgriculturalAssetsTab';
import ProductYieldsTab from './investment/ProductYieldsTab';
import WasteYieldsTab from './investment/WasteYieldsTab';
import ExpansionOpportunitiesTab from './investment/ExpansionOpportunitiesTab';
import SmartReportsTab from './investment/SmartReportsTab';

interface MyTreesPageProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

type InvestmentSubTab = 'assets' | 'products' | 'waste' | 'expansion' | 'reports';

export default function MyTreesPage({ isOpen, onClose, onLogin }: MyTreesPageProps) {
  const { user } = useAuth();
  const [investmentSubTab, setInvestmentSubTab] = useState<InvestmentSubTab>('assets');

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TreePine className="w-10 h-10 text-darkgreen" />
          </div>
          <h2 className="text-2xl font-bold text-darkgreen mb-3">متابعة أشجاري</h2>
          <p className="text-gray-600 mb-6">سجل الدخول لمتابعة أصولك الزراعية</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              إغلاق
            </button>
            <button
              onClick={() => {
                onClose();
                onLogin();
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-darkgreen to-green-600 hover:from-green-700 hover:to-green-700 text-white rounded-xl font-semibold transition-colors shadow-lg"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100000] flex items-end lg:items-center justify-center">
      <div
        className="bg-white w-full lg:max-w-6xl lg:max-h-[90vh] lg:rounded-3xl shadow-2xl flex flex-col"
        style={{
          height: '100%',
          maxHeight: '100vh',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem'
        }}
      >
        <div className="sticky top-0 z-20 bg-gradient-to-r from-darkgreen to-green-600 text-white px-6 py-4 rounded-t-3xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TreePine className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">متابعة أشجاري</h2>
                <p className="text-sm text-white/80">متابعة استثماراتك الزراعية</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="sticky top-[88px] lg:top-[96px] z-10 bg-white border-b-2 border-gray-200 px-4 overflow-x-auto">
          <div className="flex gap-2 py-3 min-w-max">
              <button
                onClick={() => setInvestmentSubTab('assets')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  investmentSubTab === 'assets'
                    ? 'bg-darkgreen text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TreePine className="w-4 h-4" />
                أصولي الزراعية
              </button>
              <button
                onClick={() => setInvestmentSubTab('products')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  investmentSubTab === 'products'
                    ? 'bg-darkgreen text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Package className="w-4 h-4" />
                عوائد المنتجات
              </button>
              <button
                onClick={() => setInvestmentSubTab('waste')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  investmentSubTab === 'waste'
                    ? 'bg-darkgreen text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Recycle className="w-4 h-4" />
                عوائد المخلفات
              </button>
              <button
                onClick={() => setInvestmentSubTab('expansion')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  investmentSubTab === 'expansion'
                    ? 'bg-darkgreen text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Rocket className="w-4 h-4" />
                فرص التوسعة
              </button>
              <button
                onClick={() => setInvestmentSubTab('reports')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  investmentSubTab === 'reports'
                    ? 'bg-darkgreen text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                التقارير الذكية
              </button>
            </div>
          </div>

        <div
          className="flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          <div className="p-6">
            {investmentSubTab === 'assets' && <AgriculturalAssetsTab />}
            {investmentSubTab === 'products' && <ProductYieldsTab />}
            {investmentSubTab === 'waste' && <WasteYieldsTab />}
            {investmentSubTab === 'expansion' && <ExpansionOpportunitiesTab />}
            {investmentSubTab === 'reports' && <SmartReportsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
