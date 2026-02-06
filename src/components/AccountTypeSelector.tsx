import { TreePine, Sparkles, X } from 'lucide-react';

interface AccountTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomerAccount: () => void;
  onSelectPartnerAccount: () => void;
  identity: 'agricultural' | 'investment';
}

export default function AccountTypeSelector({
  isOpen,
  onClose,
  onSelectCustomerAccount,
  onSelectPartnerAccount,
  identity
}: AccountTypeSelectorProps) {
  if (!isOpen) return null;

  const isAgricultural = identity === 'agricultural';
  const customerGradient = isAgricultural
    ? 'linear-gradient(135deg, #3aa17e 0%, #2f8266 100%)'
    : 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl transform transition-all scale-100">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">اختر الحساب</h2>
            <p className="text-sm text-gray-600">
              لديك حسابين - اختر الحساب الذي تريد فتحه
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onSelectCustomerAccount}
              className="group relative w-full p-6 rounded-2xl text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              style={{ background: customerGradient }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>

              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <TreePine className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-xl font-bold mb-1">
                    {isAgricultural ? 'أشجاري الخضراء' : 'أشجاري الذهبية'}
                  </h3>
                  <p className="text-sm opacity-90">
                    عقودي وصيانة أشجاري
                  </p>
                </div>
                <div className="text-2xl">{isAgricultural ? '🌳' : '🌟'}</div>
              </div>
            </button>

            <button
              onClick={onSelectPartnerAccount}
              className="group relative w-full p-6 rounded-2xl text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>

              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-xl font-bold mb-1">
                    حساب شريك النجاح
                  </h3>
                  <p className="text-sm opacity-90">
                    مكافآتي وأثري
                  </p>
                </div>
                <div className="text-2xl">⭐</div>
              </div>
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-800 text-center leading-relaxed">
              الحسابان منفصلان تماماً - لكل حساب بياناته الخاصة
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
