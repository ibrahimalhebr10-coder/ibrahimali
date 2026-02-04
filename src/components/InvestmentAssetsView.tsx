import React, { useState } from 'react';
import { TrendingUp, Shield, Sprout, ArrowRight, Lock } from 'lucide-react';
import { getDemoGoldenTreesData } from '../services/demoDataService';
import { useDemoMode } from '../contexts/DemoModeContext';
import DemoActionModal from './DemoActionModal';

interface InvestmentAssetsViewProps {
  onShowAuth?: () => void;
}

export default function InvestmentAssetsView({ onShowAuth }: InvestmentAssetsViewProps) {
  const { isDemoMode } = useDemoMode();
  const [showDemoActionModal, setShowDemoActionModal] = useState(false);
  const data = getDemoGoldenTreesData();

  const handleInvestmentAction = () => {
    if (isDemoMode) {
      setShowDemoActionModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pb-32">
      {showDemoActionModal && (
        <DemoActionModal
          onClose={() => setShowDemoActionModal(false)}
          onLogin={() => {
            setShowDemoActionModal(false);
            if (onShowAuth) {
              onShowAuth('login');
            }
          }}
          onRegister={() => {
            setShowDemoActionModal(false);
            if (onShowAuth) {
              onShowAuth('register');
            }
          }}
        />
      )}

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent"></div>

        <div className="relative max-w-6xl mx-auto px-4 py-24 text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-2xl">
              <Sprout className="w-12 h-12 text-white" />
            </div>
          </div>

          <div className="space-y-6 mb-12">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              {data.heroMessage.title}
            </h1>
            <p className="text-3xl text-amber-200/90 font-light">
              {data.heroMessage.subtitle}
            </p>
          </div>

          <button
            onClick={handleInvestmentAction}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl text-lg font-medium transition-all duration-300 border border-white/20"
          >
            <span>{data.heroMessage.cta}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-16">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-3xl"></div>
          <div className="relative h-96 rounded-3xl overflow-hidden">
            <img
              src="https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg"
              alt="أصل زراعي"
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent flex items-end p-12">
              <p className="text-2xl font-light text-white/90">
                أصل زراعي يعمل بصمت… وينمو مع الوقت
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl p-10 border border-white/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-3xl font-bold">أصلك الاستثماري</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <span className="text-slate-400">النوع</span>
                <span className="text-xl font-semibold">{data.treeType}</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <span className="text-slate-400">الموقع</span>
                <span className="text-xl font-semibold">{data.farmName}</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <span className="text-slate-400">المدة</span>
                <span className="text-xl font-semibold">{data.contractDuration} سنوات</span>
              </div>
              <div className="flex items-center justify-between py-4">
                <span className="text-slate-400">الحالة</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xl font-semibold text-green-400">{data.assetStatus.condition}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-900/20 to-slate-900/50 backdrop-blur-sm rounded-3xl p-10 border border-amber-500/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-3xl font-bold">مؤشرات القيمة</h2>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-2xl">
                <p className="text-lg text-amber-200/80 mb-4 font-light italic">
                  "{data.valueInsights.statement}"
                </p>
              </div>

              {data.valueInsights.sources.map((source, index) => (
                <div key={index} className="flex items-start justify-between py-3">
                  <span className="text-slate-300">{source.name}</span>
                  <span className="text-amber-400 font-medium">{source.contribution}</span>
                </div>
              ))}

              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">النمو</span>
                  <span className="text-lg text-green-400">{data.assetStatus.performance}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">التنويع</span>
                  <span className="text-lg text-blue-400">{data.assetStatus.diversification}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-3xl p-12 border border-white/5 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-3xl font-bold mb-4">السجل التاريخي</h3>
            <p className="text-xl text-slate-300 font-light leading-relaxed">
              {data.historicalNote}
            </p>
            <p className="text-sm text-slate-500 italic">
              العوائد السابقة لا تضمن النتائج المستقبلية
            </p>
          </div>
        </div>

        <div className="text-center space-y-6">
          <button
            onClick={handleInvestmentAction}
            className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 rounded-2xl text-lg font-semibold transition-all duration-300 shadow-2xl shadow-amber-500/20"
          >
            <span>ابدأ رحلتك الاستثمارية</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-slate-500 text-sm">
            التسجيل يفتح لك التفاصيل الكاملة والتنفيذ الفعلي
          </p>
        </div>
      </div>
    </div>
  );
}
