import { Sprout, ArrowRight, Crown, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';

interface HeaderProps {
  onBack?: () => void;
  showBackButton?: boolean;
  onAdminAccess?: () => void;
  onOpenAdminDashboard?: () => void;
}

export default function Header({ onBack, showBackButton = false, onAdminAccess, onOpenAdminDashboard }: HeaderProps) {
  const { isAdminAuthenticated, admin } = useAdmin();
  const [clickCount, setClickCount] = useState(0);
  const [pulseLevel, setPulseLevel] = useState(0);

  useEffect(() => {
    if (clickCount > 0 && clickCount < 4) {
      const timer = setTimeout(() => {
        setClickCount(0);
        setPulseLevel(0);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const handleCrownClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    setPulseLevel(newCount);

    if (newCount === 4) {
      setClickCount(0);
      setPulseLevel(0);
      onAdminAccess?.();
    }
  };
  return (
    <header
      className="h-14 lg:h-16 px-4 lg:px-12 flex items-center justify-between z-50 backdrop-blur-lg flex-shrink-0 fixed top-0 left-0 right-0"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,247,243,0.95) 100%)',
        borderBottom: '2px solid #3AA17E',
        boxShadow: '0 4px 16px rgba(58,161,126,0.12)'
      }}
    >
      {/* Logo & Brand - Top Right Corner */}
      <button
        onClick={() => window.location.href = '/'}
        className="flex items-center gap-2 lg:gap-4 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <div
          className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #2F5233 0%, #3D6B42 50%, #2F5233 100%)',
            boxShadow: '0 2px 8px rgba(47,82,51,0.3)'
          }}
        >
          <Sprout className="w-5 h-5 lg:w-6 lg:h-6 text-white drop-shadow-lg" />
        </div>
        <div className="flex flex-col leading-none">
          <h1
            className="text-sm lg:text-xl font-black"
            style={{
              background: 'linear-gradient(135deg, #2F5233 0%, #3D6B42 50%, #2F5233 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            حصص زراعية
          </h1>
          <p className="text-[8px] lg:text-xs text-darkgreen/60 font-semibold">
            استثمر واربح
          </p>
        </div>
      </button>

      <div className="flex-1" />

      {/* Admin Dashboard Button - Only visible when admin is logged in */}
      {isAdminAuthenticated && onOpenAdminDashboard && (
        <button
          onClick={onOpenAdminDashboard}
          className="px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 mr-3 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(145deg, #2F5233, #3D6B42)',
            boxShadow: '0 4px 12px rgba(47, 82, 51, 0.4)',
            border: '2px solid rgba(255, 215, 0, 0.3)'
          }}
        >
          <ShieldCheck className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-bold text-sm hidden lg:block">لوحة التحكم</span>
        </button>
      )}

      {/* Hidden Crown - Admin Access */}
      {!isAdminAuthenticated && (
        <button
          onClick={handleCrownClick}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 mr-3"
          style={{
            opacity: pulseLevel > 0 ? 0.3 + (pulseLevel * 0.2) : 0.15,
            background: pulseLevel > 0
              ? `rgba(255, 215, 0, ${0.1 + (pulseLevel * 0.1)})`
              : 'transparent',
            transform: pulseLevel > 0 ? 'scale(1.1)' : 'scale(1)',
            animation: pulseLevel > 0 ? 'pulse 0.3s ease-in-out' : 'none'
          }}
        >
          <Crown
            className="w-4 h-4"
            style={{
              color: pulseLevel > 0 ? '#FFD700' : '#888',
              filter: pulseLevel > 0 ? `drop-shadow(0 0 ${pulseLevel * 2}px rgba(255, 215, 0, 0.8))` : 'none'
            }}
          />
        </button>
      )}

      {/* Back Button - Left Side */}
      {showBackButton && (
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-darkgreen/10 active:scale-95"
          style={{
            border: '2px solid #3AA17E'
          }}
        >
          <ArrowRight className="w-5 h-5 text-darkgreen" />
        </button>
      )}
    </header>
  );
}
