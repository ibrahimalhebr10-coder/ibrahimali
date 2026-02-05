import { useState, useEffect } from 'react';
import { X, Leaf, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDemoMode } from '../contexts/DemoModeContext';
import { userTreesService, type UserTreesSummary } from '../services/userTreesService';
import MyGreenTrees from './MyGreenTrees';
import InvestmentAssetsView from './InvestmentAssetsView';

interface MyTreesProps {
  onClose: () => void;
  onNavigateToPayment?: (maintenanceId: string) => void;
  onShowAuth?: (mode: 'login' | 'register') => void;
}

type ActivePath = 'green' | 'golden';

export default function MyTrees({ onClose, onNavigateToPayment, onShowAuth }: MyTreesProps) {
  const { user, identity } = useAuth();
  const { isDemoMode, demoType } = useDemoMode();
  const [treesSummary, setTreesSummary] = useState<UserTreesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const activePath: ActivePath = isDemoMode
    ? (demoType === 'green' ? 'green' : 'golden')
    : (identity === 'agricultural' ? 'green' : 'golden');

  useEffect(() => {
    loadTreesSummary();
  }, [user]);

  const loadTreesSummary = async () => {
    if (isDemoMode || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const summary = await userTreesService.getUserTreesSummary(user.id);
      setTreesSummary(summary);
    } catch (error) {
      console.error('Error loading trees summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentColor = activePath === 'green' ? '#3aa17e' : '#d4af37';
  const currentTreesCount = activePath === 'green'
    ? treesSummary?.greenTreesCount || 0
    : treesSummary?.goldenTreesCount || 0;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden flex flex-col">
      <div
        className="px-4 py-6 border-b"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 252, 250, 0.98) 100%)',
          borderColor: `${currentColor}20`
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex flex-col items-center gap-1">
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
            {!isDemoMode && treesSummary && (
              <p className="text-sm text-gray-500">
                {currentTreesCount} {currentTreesCount === 1 ? 'شجرة' : currentTreesCount === 2 ? 'شجرتان' : 'أشجار'}
              </p>
            )}
          </div>

          <div className="w-10"></div>
        </div>
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
    </div>
  );
}
