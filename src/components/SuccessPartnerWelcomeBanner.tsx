import { X, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SuccessPartnerWelcomeBannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessPartnerWelcomeBanner({ isOpen, onClose }: SuccessPartnerWelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60000] transition-all duration-300"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        opacity: isVisible ? 1 : 0
      }}
    >
      <div
        className="mx-4 mb-4 lg:mx-auto lg:max-w-2xl rounded-2xl p-4 lg:p-5 backdrop-blur-xl shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.92) 100%)',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 12px 40px rgba(16, 185, 129, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
        }}
      >
        <div className="flex items-start gap-3 lg:gap-4">
          <div className="flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-white" strokeWidth={2.5} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base lg:text-lg font-black text-white mb-1.5 lg:mb-2">
              🌿 أنت الآن داخل حساب شريك النجاح
            </h3>
            <p className="text-sm lg:text-base text-white/90 font-semibold leading-relaxed">
              يمكنك الدخول إليه دائمًا من زر <span className="font-black">"حسابي"</span>
            </p>
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-white/20 hover:bg-white/30"
          >
            <X className="w-4 h-4 lg:w-5 lg:h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
