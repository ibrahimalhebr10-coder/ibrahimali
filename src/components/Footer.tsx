import { Home } from 'lucide-react';
import { type IdentityType } from '../services/identityService';

interface FooterProps {
  identity: IdentityType;
  onClick: () => void;
}

export default function Footer({ identity, onClick }: FooterProps) {
  const isAgricultural = identity === 'agricultural';

  const color = isAgricultural ? '#3aa17e' : '#d4af37';
  const gradient = isAgricultural
    ? 'linear-gradient(135deg, #3aa17e 0%, #2f8266 100%)'
    : 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pb-safe">
      <div
        className="backdrop-blur-xl border-t"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 250, 0.95) 100%)',
          borderColor: `${color}20`
        }}
      >
        <div className="max-w-md mx-auto px-4 py-3">
          <button
            onClick={onClick}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            style={{ background: gradient }}
          >
            <Home className="w-6 h-6" />
            <span>مزرعتي</span>
          </button>
        </div>
      </div>
    </div>
  );
}
