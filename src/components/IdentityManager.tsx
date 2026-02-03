import { Sprout, TrendingUp, Check, Plus, X, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { identityService, type IdentityType } from '../services/identityService';
import { useState } from 'react';

export default function IdentityManager() {
  const {
    user,
    identity,
    secondaryIdentity,
    secondaryIdentityEnabled,
    enableSecondaryIdentity,
    disableSecondaryIdentity,
    switchToSecondaryIdentity
  } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showEnableOptions, setShowEnableOptions] = useState(false);

  if (!user) {
    return null;
  }

  const handleEnableSecondary = async (newSecondary: IdentityType) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const success = await enableSecondaryIdentity(newSecondary);
      if (success) {
        setShowEnableOptions(false);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisableSecondary = async () => {
    if (isProcessing) return;

    const confirmed = confirm('هل أنت متأكد من تعطيل الهوية الثانية؟');
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await disableSecondaryIdentity();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitch = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await switchToSecondaryIdentity();
    } finally {
      setIsProcessing(false);
    }
  };

  const getIdentityConfig = (identityType: IdentityType) => {
    const isAgricultural = identityType === 'agricultural';
    return {
      label: identityService.getIdentityLabel(identityType),
      color: identityService.getIdentityColor(identityType),
      icon: isAgricultural ? Sprout : TrendingUp,
      description: identityService.getIdentityDescription(identityType)
    };
  };

  const primaryConfig = getIdentityConfig(identity);
  const secondaryConfig = secondaryIdentity ? getIdentityConfig(secondaryIdentity) : null;
  const PrimaryIcon = primaryConfig.icon;
  const SecondaryIcon = secondaryConfig?.icon;

  const availableSecondary: IdentityType = identity === 'agricultural' ? 'investment' : 'agricultural';
  const availableConfig = getIdentityConfig(availableSecondary);
  const AvailableIcon = availableConfig.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">إدارة الهويات</h3>
      </div>

      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryConfig.color} 0%, ${primaryConfig.color}dd 100%)` }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <PrimaryIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-90">الهوية الأساسية</span>
                <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              </div>
              <p className="font-bold text-xl">{primaryConfig.label}</p>
            </div>
          </div>
          <p className="text-sm opacity-80">{primaryConfig.description}</p>
        </div>
      </div>

      {secondaryIdentity && secondaryIdentityEnabled && secondaryConfig && SecondaryIcon ? (
        <div>
          <div
            className="rounded-2xl p-6 text-white relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${secondaryConfig.color} 0%, ${secondaryConfig.color}dd 100%)` }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <SecondaryIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <span className="text-sm opacity-90">الهوية الثانية</span>
                  <p className="font-bold text-xl">{secondaryConfig.label}</p>
                </div>
              </div>
              <p className="text-sm opacity-80 mb-4">{secondaryConfig.description}</p>

              <div className="flex gap-2">
                <button
                  onClick={handleSwitch}
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-white/20 hover:bg-white/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>تبديل الهويات</span>
                </button>

                <button
                  onClick={handleDisableSecondary}
                  disabled={isProcessing}
                  className="py-3 px-4 rounded-xl font-bold bg-white/20 hover:bg-red-500/50 transition-all disabled:opacity-50"
                  title="تعطيل الهوية الثانية"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {!showEnableOptions ? (
            <button
              onClick={() => setShowEnableOptions(true)}
              className="w-full p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all flex items-center justify-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-green-500 transition-all flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                  إضافة هوية ثانية
                </p>
                <p className="text-sm text-gray-500">للتبديل السريع بين المزارع والمستثمر</p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">اختر الهوية الثانية:</p>
                <button
                  onClick={() => setShowEnableOptions(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <button
                onClick={() => handleEnableSecondary(availableSecondary)}
                disabled={isProcessing}
                className="w-full p-6 rounded-2xl text-white relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${availableConfig.color} 0%, ${availableConfig.color}dd 100%)` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <AvailableIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-bold text-xl">{availableConfig.label}</p>
                    <p className="text-sm opacity-90">{availableConfig.description}</p>
                  </div>
                  <Plus className="w-5 h-5 text-white" />
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-sm">💡</span>
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm text-blue-900 font-medium mb-1">ما هي الهوية الثانية؟</p>
            <p className="text-xs text-blue-700">
              يمكنك إضافة هوية ثانية للتبديل السريع بين وضع المزارع والمستثمر دون الحاجة لتغيير إعدادات حسابك
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
