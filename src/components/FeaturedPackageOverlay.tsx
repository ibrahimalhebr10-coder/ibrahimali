import { Package, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { FeaturedPackageSettings } from '../services/influencerMarketingService';

interface FeaturedPackageOverlayProps {
  settings: FeaturedPackageSettings;
  onDismiss: () => void;
}

export default function FeaturedPackageOverlay({ settings, onDismiss }: FeaturedPackageOverlayProps) {
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('featured_package_active');
    };

    const handlePopState = () => {
      sessionStorage.removeItem('featured_package_active');
      onDismiss();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onDismiss]);

  const getBorderStyles = () => {
    const baseStyles = {
      borderWidth: '3px',
      borderColor: settings.color
    };

    switch (settings.borderStyle) {
      case 'solid':
        return { ...baseStyles, borderStyle: 'solid' };
      case 'dashed':
        return { ...baseStyles, borderStyle: 'dashed' };
      case 'double':
        return { ...baseStyles, borderWidth: '4px', borderStyle: 'double' };
      case 'gradient':
        return {
          borderWidth: '3px',
          borderStyle: 'solid',
          borderColor: 'transparent',
          background: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${settings.color}, ${settings.color}88) border-box`
        };
      default:
        return { ...baseStyles, borderStyle: 'solid' };
    }
  };

  const getBenefitIcon = () => {
    switch (settings.benefitType) {
      case 'free_shipping':
        return '🚚';
      case 'discount':
        return '💰';
      case 'bonus_trees':
        return '🌳';
      case 'priority_support':
        return '⭐';
      case 'custom':
        return '🎁';
      default:
        return '🎁';
    }
  };

  const getBenefitLabel = () => {
    switch (settings.benefitType) {
      case 'free_shipping':
        return 'شحن مجاني';
      case 'discount':
        return 'خصم خاص';
      case 'bonus_trees':
        return 'أشجار إضافية';
      case 'priority_support':
        return 'دعم مميز';
      case 'custom':
        return 'مزية خاصة';
      default:
        return 'مزية خاصة';
    }
  };

  return (
    <div className="relative animate-fade-in-scale">
      <div
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:shadow-3xl hover:-translate-y-1"
        style={getBorderStyles()}
      >
        <div
          className="absolute top-0 left-0 right-0 text-center py-2.5 text-sm font-bold text-white shadow-lg z-10"
          style={{ backgroundColor: settings.color }}
        >
          {settings.congratulationText}
        </div>

        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: settings.color }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: settings.color }}
        />

        <div className="relative mt-12 p-6 space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${settings.color}20` }}
            >
              <Sparkles className="w-8 h-8" style={{ color: settings.color }} />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-slate-800">الباقة المميزة</h3>
            <p className="text-slate-600 text-sm">
              باقة خاصة لشركاء المسيرة
            </p>
          </div>

          <div
            className="px-6 py-4 rounded-xl text-center space-y-2"
            style={{ backgroundColor: `${settings.color}10` }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">{getBenefitIcon()}</span>
              <span
                className="text-lg font-bold"
                style={{ color: settings.color }}
              >
                {getBenefitLabel()}
              </span>
            </div>
            <p className="text-sm text-slate-700 font-medium">
              {settings.benefitDescription}
            </p>
          </div>

          <div className="flex items-center gap-2 justify-center px-4 py-3 bg-slate-50 rounded-xl">
            <Package className="w-5 h-5" style={{ color: settings.color }} />
            <span className="text-sm font-semibold text-slate-700">
              مزايا حصرية لشركاء المسيرة
            </span>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="px-4 py-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">السعر</p>
                <p className="text-lg font-bold text-slate-800">حسب الباقة</p>
              </div>
              <div className="px-4 py-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">المدة</p>
                <p className="text-lg font-bold text-slate-800">حسب الباقة</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4" style={{ color: settings.color }} />
            <span>باقة خاصة معتمدة من شريك المسيرة</span>
          </div>
        </div>

        <div
          className="absolute top-3 left-3 w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: settings.color }}
        />
        <div
          className="absolute bottom-3 right-3 w-2 h-2 rounded-full animate-pulse delay-75"
          style={{ backgroundColor: settings.color }}
        />
      </div>

      <style>{`
        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in-scale {
          animation: fade-in-scale 0.4s ease-out;
        }

        .delay-75 {
          animation-delay: 0.075s;
        }
      `}</style>
    </div>
  );
}
