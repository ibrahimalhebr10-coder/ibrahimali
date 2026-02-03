import { ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { identityService } from '../services/identityService';
import { useState } from 'react';

export default function IdentitySwitcher() {
  const { user, identity, secondaryIdentity, secondaryIdentityEnabled, switchToSecondaryIdentity } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);

  if (!user || !secondaryIdentity || !secondaryIdentityEnabled) {
    return null;
  }

  const handleSwitch = async () => {
    if (isSwitching) return;

    setIsSwitching(true);
    try {
      await switchToSecondaryIdentity();
    } finally {
      setIsSwitching(false);
    }
  };

  const primaryColor = identityService.getIdentityColor(identity);
  const secondaryColor = identityService.getIdentityColor(secondaryIdentity);

  return (
    <button
      onClick={handleSwitch}
      disabled={isSwitching}
      className="fixed bottom-24 left-4 z-40 rounded-full p-3 transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50"
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        boxShadow: `0 4px 12px rgba(0,0,0,0.15), 0 0 0 2px white, 0 0 20px ${primaryColor}40`
      }}
      title={`التبديل إلى ${identityService.getIdentityLabel(secondaryIdentity)}`}
    >
      <ArrowLeftRight
        className="w-5 h-5 text-white"
        strokeWidth={2.5}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          animation: isSwitching ? 'spin 1s linear infinite' : 'none'
        }}
      />
    </button>
  );
}
