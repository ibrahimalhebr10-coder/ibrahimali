import { Sprout, ArrowRight } from 'lucide-react';

interface HeaderProps {
  onBack?: () => void;
  showBackButton?: boolean;
}

export default function Header({ onBack, showBackButton = false }: HeaderProps) {
  return (
    <header
      className="h-14 lg:h-16 px-4 lg:px-12 flex items-center justify-between z-50 backdrop-blur-xl flex-shrink-0 fixed top-0 left-0 right-0"
      style={{
        background: 'linear-gradient(135deg, rgba(230, 232, 235, 0.85) 0%, rgba(238, 239, 241, 0.80) 100%)',
        borderBottom: '2px solid rgba(58,161,126,0.3)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
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
