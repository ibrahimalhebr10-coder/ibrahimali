import { useState, useEffect } from 'react';
import { X, Leaf, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDemoMode } from '../contexts/DemoModeContext';
import { userTreesService, type UserTreesSummary } from '../services/userTreesService';
import MyGreenTrees from './MyGreenTrees';
import InvestmentAssetsView from './InvestmentAssetsView';
import DemoActionModal from './DemoActionModal';

interface MyTreesProps {
  onClose: () => void;
  onNavigateToPayment?: (maintenanceId: string) => void;
  onShowAuth?: (mode: 'login' | 'register') => void;
}

type ActivePath = 'green' | 'golden';

export default function MyTrees({ onClose, onNavigateToPayment, onShowAuth }: MyTreesProps) {
  const { user, identity, updateIdentity } = useAuth();
  const { isDemoMode, demoType, enterDemoMode } = useDemoMode();
  const [treesSummary, setTreesSummary] = useState<UserTreesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePath, setActivePath] = useState<ActivePath>('green');
  const [showDemoActionModal, setShowDemoActionModal] = useState(false);

  useEffect(() => {
    loadTreesSummary();
  }, [user]);

  useEffect(() => {
    if (isDemoMode) {
      const demoPath = demoType === 'green' ? 'green' : 'golden';
      setActivePath(demoPath);
    } else if (identity === 'agricultural') {
      setActivePath('green');
    } else if (identity === 'investment') {
      setActivePath('golden');
    }
  }, [isDemoMode, demoType, identity]);

  const loadTreesSummary = async () => {
    if (isDemoMode || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const summary = await userTreesService.getUserTreesSummary(user.id);
      setTreesSummary(summary);

      if (summary.hasGreenTrees && !summary.hasGoldenTrees) {
        setActivePath('green');
      } else if (summary.hasGoldenTrees && !summary.hasGreenTrees) {
        setActivePath('golden');
      } else if (summary.hasGreenTrees && summary.hasGoldenTrees) {
        setActivePath(identity === 'investment' ? 'golden' : 'green');
      }
    } catch (error) {
      console.error('Error loading trees summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePathSwitch = async (newPath: ActivePath) => {
    if (isDemoMode) {
      setShowDemoActionModal(true);
      return;
    }

    if (!user) {
      const demoType = newPath === 'green' ? 'green' : 'golden';
      enterDemoMode(demoType);
      setActivePath(newPath);
      return;
    }

    setActivePath(newPath);
    const newIdentity = newPath === 'green' ? 'agricultural' : 'investment';
    await updateIdentity(newIdentity);
  };

  const hasMultiplePaths = isDemoMode
    ? false
    : (treesSummary?.hasGreenTrees && treesSummary?.hasGoldenTrees);

  const currentColor = activePath === 'green' ? '#3aa17e' : '#d4af37';
  const currentGradient = activePath === 'green'
    ? 'linear-gradient(135deg, #3aa17e 0%, #2f8266 100%)'
    : 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)';

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden flex flex-col">
      <div
        className="px-4 py-6 border-b"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 252, 250, 0.98) 100%)',
          borderColor: `${currentColor}20`
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex items-center gap-2">
            {activePath === 'green' ? (
              <Leaf className="w-6 h-6" style={{ color: currentColor }} />
            ) : (
              <Sparkles className="w-6 h-6" style={{ color: currentColor }} />
            )}
            <h1 className="text-2xl font-bold" style={{ color: currentColor }}>
              {activePath === 'green' ? 'أشجاري الخضراء' : 'أشجاري الذهبية'}
            </h1>
          </div>

          <div className="w-10"></div>
        </div>

        {hasMultiplePaths && (
          <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm">
            <button
              onClick={() => handlePathSwitch('green')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                activePath === 'green'
                  ? 'text-white shadow-lg scale-[1.02]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={{
                background: activePath === 'green'
                  ? 'linear-gradient(135deg, #3aa17e 0%, #2f8266 100%)'
                  : 'transparent'
              }}
            >
              <Leaf className="w-4 h-4" />
              <span>الأشجار الخضراء</span>
              {treesSummary && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activePath === 'green' ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {treesSummary.greenTreesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handlePathSwitch('golden')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                activePath === 'golden'
                  ? 'text-white shadow-lg scale-[1.02]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={{
                background: activePath === 'golden'
                  ? 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)'
                  : 'transparent'
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span>الأشجار الذهبية</span>
              {treesSummary && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activePath === 'golden' ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {treesSummary.goldenTreesCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div
                className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                style={{ borderColor: `${currentColor}40`, borderTopColor: 'transparent' }}
              ></div>
              <p className="text-gray-500">جاري التحميل...</p>
            </div>
          </div>
        ) : (
          <>
            {activePath === 'green' ? (
              <MyGreenTrees
                onNavigateToPayment={onNavigateToPayment}
                onShowAuth={onShowAuth}
              />
            ) : (
              <InvestmentAssetsView />
            )}
          </>
        )}
      </div>

      {showDemoActionModal && (
        <DemoActionModal
          message="للتبديل بين المسارات، يجب تسجيل الدخول أولاً"
          onLogin={() => {
            setShowDemoActionModal(false);
            onShowAuth?.('login');
          }}
          onRegister={() => {
            setShowDemoActionModal(false);
            onShowAuth?.('register');
          }}
          onClose={() => setShowDemoActionModal(false)}
        />
      )}
    </div>
  );
}
