import { useEffect, useState } from 'react';
import { X, Info } from 'lucide-react';

interface AccountTypeIndicatorProps {
  accountType: 'regular' | 'partner';
  onClose: () => void;
}

export default function AccountTypeIndicator({ accountType, onClose }: AccountTypeIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen this banner before
    const storageKey = `account_type_banner_seen_${accountType}`;
    const hasSeenBefore = localStorage.getItem(storageKey);

    if (!hasSeenBefore) {
      setIsVisible(true);
      localStorage.setItem(storageKey, 'true');
    }
  }, [accountType]);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  const isPartner = accountType === 'partner';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[50000] animate-slideUp px-4 w-full max-w-2xl">
      <div
        className="rounded-2xl p-4 shadow-2xl backdrop-blur-sm"
        style={{
          background: isPartner
            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.95) 0%, rgba(245, 158, 11, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.9) 100%)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: isPartner
            ? '0 8px 32px rgba(251, 191, 36, 0.4)'
            : '0 8px 32px rgba(16, 185, 129, 0.4)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Info className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          </div>

          <div className="flex-1">
            <p className="text-white font-bold text-sm leading-relaxed">
              {isPartner ? (
                <>
                  🔹 أنت داخل حساب <span className="font-black">شريك النجاح</span>
                  <br />
                  <span className="text-white/90 text-xs">
                    يمكنك العودة لحسابك الأساسي في أي وقت من زر "حسابي"
                  </span>
                </>
              ) : (
                <>
                  🔹 أنت داخل <span className="font-black">حسابك الأساسي</span>
                  <br />
                  <span className="text-white/90 text-xs">
                    يمكنك الوصول لحساب شريك النجاح في أي وقت من زر "حسابي"
                  </span>
                </>
              )}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <X className="w-4 h-4 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
