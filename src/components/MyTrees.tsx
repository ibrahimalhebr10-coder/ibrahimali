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

    if (identity === 'investment') {
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
          <MyGreenTrees
            onNavigateToPayment={onNavigateToPayment}
            onShowAuth={onShowAuth}
          />
        )}
      </div>

      <button
        onClick={onClose}
        className="fixed top-6 left-4 z-50 p-2 bg-white/90 backdrop-blur-sm hover:bg-gray-100 rounded-full transition-colors shadow-lg"
      >
        <X className="w-6 h-6 text-gray-600" />
      </button>
    </div>
  );
}
