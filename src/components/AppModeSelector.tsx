import { Sprout, TrendingUp } from 'lucide-react';

export type AppMode = 'agricultural' | 'investment';

interface AppModeSelectorProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export default function AppModeSelector({ activeMode, onModeChange }: AppModeSelectorProps) {
  const modes = [
    {
      id: 'agricultural' as AppMode,
      label: 'أشجاري الخضراء',
      icon: Sprout,
      gradient: 'linear-gradient(135deg, #3aa17e 0%, #2f8266 25%, #3aa17e 50%, #2f8266 75%, #3aa17e 100%)',
      inactiveGradient: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,245,0.9) 50%, rgba(255,255,255,0.95) 100%)',
      border: '#3aa17e',
      activeBorder: 'rgba(58, 161, 126, 0.8)',
      shadow: 'rgba(58, 161, 126, 0.5)',
      glow: 'rgba(58, 161, 126, 0.6)'
    },
    {
      id: 'investment' as AppMode,
      label: 'أشجاري الذهبية',
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #d4af37 0%, #b8942f 25%, #d4af37 50%, #b8942f 75%, #d4af37 100%)',
      inactiveGradient: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,245,0.9) 50%, rgba(255,255,255,0.95) 100%)',
      border: '#d4af37',
      activeBorder: 'rgba(212, 175, 55, 0.8)',
      shadow: 'rgba(212, 175, 55, 0.5)',
      glow: 'rgba(212, 175, 55, 0.6)'
    }
  ];

  return (
    <div className="flex gap-2 lg:gap-4 justify-center lg:max-w-5xl lg:mx-auto">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className="flex-1 rounded-xl lg:rounded-2xl h-12 lg:h-16 xl:h-18 flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] relative overflow-hidden group"
            style={{
              boxShadow: isActive
                ? `0 6px 20px ${mode.shadow}, 0 10px 40px ${mode.glow}, inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.1)`
                : '0 3px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
              background: isActive ? mode.gradient : mode.inactiveGradient,
              border: isActive
                ? `3px solid ${mode.activeBorder}`
                : '2px solid rgba(210,210,210,0.5)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}
          >
            <Icon
              className={`w-4 h-4 lg:w-6 lg:h-6 xl:w-7 xl:h-7 mb-0.5 transition-all duration-300 ${
                isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
              }`}
              strokeWidth={isActive ? 3 : 2.5}
              style={isActive ? {
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
                transform: 'translateY(-1px)'
              } : {}}
            />
            <span
              className={`text-[11px] lg:text-sm xl:text-base font-black text-center leading-tight px-2 tracking-wide transition-all duration-300 ${
                isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'
              }`}
              style={isActive ? {
                textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
                letterSpacing: '0.3px'
              } : {}}
            >
              {mode.label}
            </span>
            {isActive && (
              <>
                <div
                  className="absolute inset-0 rounded-xl lg:rounded-2xl pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.35) 0%, transparent 60%)'
                  }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 h-1/2 rounded-b-xl lg:rounded-b-2xl pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.08) 0%, transparent 100%)'
                  }}
                />
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
