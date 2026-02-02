import { useState, useRef } from 'react';
import { Sprout, ArrowRight } from 'lucide-react';

interface HeaderProps {
  onBack?: () => void;
  showBackButton?: boolean;
  isVisible?: boolean;
  onAdminAccess?: () => void;
}

export default function Header({ onBack, showBackButton = false, isVisible = true, onAdminAccess }: HeaderProps) {
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleHiddenAreaClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    if (newCount === 4) {
      setClickCount(0);
      if (onAdminAccess) {
        onAdminAccess();
      }
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 2000);
    }
  };

  return (
    <header
      className="h-14 lg:h-16 px-4 lg:px-12 flex items-center justify-between z-50 backdrop-blur-2xl flex-shrink-0 fixed left-0 right-0 top-0"
      style={{
        background: 'linear-gradient(135deg, rgba(248, 250, 249, 0.95) 0%, rgba(242, 247, 244, 0.92) 100%)',
        borderBottom: '3px solid rgba(58,161,126,0.4)',
        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.1), inset 0 -1px 0 rgba(255,255,255,0.8)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1)',
        willChange: 'transform',
        WebkitTransform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        WebkitTransition: 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1)'
      }}
    >
      <button
        onClick={() => window.location.href = '/'}
        className="flex items-center gap-2 lg:gap-4 transition-all duration-300 hover:scale-105 active:scale-95 group"
      >
        <div
          className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:shadow-xl"
          style={{
            background: 'linear-gradient(145deg, #3AA17E 0%, #2F8266 50%, #3AA17E 100%)',
            boxShadow: '0 4px 12px rgba(58,161,126,0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
            border: '2px solid rgba(255,255,255,0.3)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/20 pointer-events-none"></div>
          <Sprout className="w-5 h-5 lg:w-7 lg:h-7 text-white drop-shadow-2xl relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
        </div>
        <div className="flex flex-col leading-none">
          <h1
            className="text-sm lg:text-2xl font-black transition-all duration-300 group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #3AA17E 0%, #2F8266 50%, #3AA17E 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.01em'
            }}
          >
            حصص زراعية
          </h1>
          <p className="text-[8px] lg:text-sm text-darkgreen/70 font-bold mt-0.5">
            استثمر واربح
          </p>
        </div>
      </button>

      <div className="flex-1" />

      {showBackButton && (
        <button
          onClick={onBack}
          className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,252,250,0.9) 100%)',
            border: '2.5px solid #3AA17E',
            boxShadow: '0 4px 12px rgba(58,161,126,0.2), inset 0 1px 2px rgba(255,255,255,0.8)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(58,161,126,0.3), inset 0 1px 2px rgba(255,255,255,0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(58,161,126,0.2), inset 0 1px 2px rgba(255,255,255,0.8)';
          }}
        >
          <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 text-darkgreen transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      )}

      {/* Semi-Hidden Admin Entry - Click 4 times */}
      <div
        onClick={handleHiddenAreaClick}
        className="absolute left-4 top-0 bottom-0 w-12 rounded-lg cursor-pointer transition-all duration-300 group/admin hover:bg-gray-100/20"
        style={{
          background: 'linear-gradient(145deg, rgba(59,130,246,0.03) 0%, rgba(37,99,235,0.05) 100%)',
          border: '1px solid rgba(59,130,246,0.08)',
          zIndex: 1
        }}
        title=""
      />
    </header>
  );
}
