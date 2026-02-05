import { Sprout, Plus, TreePine } from 'lucide-react';
import { type IdentityType } from '../services/identityService';

interface FooterProps {
  identity: IdentityType;
  onMyFarmClick: () => void;
  onOfferFarmClick: () => void;
}

export default function Footer({ identity, onMyFarmClick, onOfferFarmClick }: FooterProps) {
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
        <div className="max-w-md mx-auto px-4 py-3 space-y-2">
          {/* زر أشجاري - ديناميكي */}
          <button
            onClick={onMyFarmClick}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            style={{ background: gradient }}
          >
            <TreePine className="w-6 h-6" />
            <span>أشجاري</span>
          </button>

          {/* زر اعرض مزرعتك */}
          <button
            onClick={onOfferFarmClick}
            className="group relative w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden border-2"
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #d4af37 100%)',
              borderColor: '#b8942f'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>

            <div className="relative flex items-center justify-center gap-3">
              <div className="relative">
                <Plus className="w-5 h-5 absolute -top-1 -right-1 group-hover:rotate-90 transition-transform duration-300" />
                <Sprout className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="group-hover:scale-105 transition-transform duration-300">اعرض مزرعتك</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <p className="text-center text-xs text-gray-500">
            نبحث عن شركاء استثنائيين
          </p>
        </div>
      </div>
    </div>
  );
}
