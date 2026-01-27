import { X, Sprout, Mail } from 'lucide-react';

interface MyHarvestProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: (mode: 'signup' | 'login') => void;
}

export default function MyHarvest({ isOpen, onClose }: MyHarvestProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />

      <div
        className="fixed inset-x-0 bottom-0 bg-white z-50 max-h-[90vh] overflow-hidden rounded-t-3xl"
        style={{
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <div
          className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #3AA17E 0%, #2D8B6A 100%)',
            boxShadow: '0 4px 12px rgba(58, 161, 126, 0.2)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">محصولي</h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="px-6 py-8 space-y-6">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 text-center border-2 border-amber-200">
            <Mail className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-3">خدمة التسجيل غير متاحة حالياً</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              للاستفسارات عن المحصول والحجوزات، يرجى التواصل معنا عبر قنواتنا الرسمية
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
