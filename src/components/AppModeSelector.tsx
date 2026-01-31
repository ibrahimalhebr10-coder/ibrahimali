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
      label: 'محصولي الزراعي',
      icon: Sprout,
      gradient: 'linear-gradient(145deg, rgba(58, 161, 126, 0.95) 0%, rgba(47, 130, 102, 0.90) 50%, rgba(58, 161, 126, 0.95) 100%)',
      inactiveGradient: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(249,249,249,0.8) 100%)',
      border: 'rgba(58, 161, 126, 0.70)',
      shadow: 'rgba(58, 161, 126, 0.45)'
    },
    {
      id: 'investment' as AppMode,
      label: 'محصولي الاستثماري',
      icon: TrendingUp,
      gradient: 'linear-gradient(145deg, rgba(212, 175, 55, 0.95) 0%, rgba(184, 148, 47, 0.90) 50%, rgba(212, 175, 55, 0.95) 100%)',
      inactiveGradient: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(249,249,249,0.8) 100%)',
      border: 'rgba(212, 175, 55, 0.70)',
      shadow: 'rgba(212, 175, 55, 0.45)'
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
            className="flex-1 rounded-xl lg:rounded-2xl h-12 lg:h-16 xl:h-18 flex flex-col items-center justify-center bg-white transition-all duration-300 hover:scale-[1.02] active:scale-95 backdrop-blur-lg relative overflow-hidden"
            style={{
              boxShadow: isActive
                ? `0 4px 16px ${mode.shadow}, 0 8px 32px ${mode.shadow}, inset 0 1px 0 rgba(255,255,255,0.7)`
                : '0 2px 6px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
              background: isActive
                ? mode.gradient
                : mode.inactiveGradient,
              border: `2px solid ${isActive ? mode.border : 'rgba(220,220,220,0.4)'}`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <Icon
              className={`w-5 h-5 lg:w-7 lg:h-7 xl:w-8 xl:h-8 mb-0.5 lg:mb-1 ${
                isActive ? 'text-white drop-shadow-lg' : 'text-darkgreen/60'
              }`}
              strokeWidth={2.5}
              style={isActive ? { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' } : {}}
            />
            <span
              className={`text-[9px] lg:text-xs xl:text-sm font-black text-center leading-tight px-2 ${
                isActive ? 'text-white drop-shadow-md' : 'text-darkgreen/60'
              }`}
              style={isActive ? { textShadow: '0 1px 2px rgba(0,0,0,0.2)' } : {}}
            >
              {mode.label}
            </span>
            {isActive && (
              <div
                className="absolute inset-0 rounded-xl lg:rounded-2xl pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 70%)'
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
