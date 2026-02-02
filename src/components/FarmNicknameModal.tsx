import { useState, useEffect } from 'react';
import { TreePine, Sparkles, X, Edit2 } from 'lucide-react';
import { investorAccountService } from '../services/investorAccountService';

interface FarmNicknameModalProps {
  userId: string;
  onClose: () => void;
  onSave: (nickname: string) => void;
  currentNickname?: string | null;
  isFirstTime?: boolean;
}

export default function FarmNicknameModal({
  userId,
  onClose,
  onSave,
  currentNickname,
  isFirstTime = true
}: FarmNicknameModalProps) {
  const [nickname, setNickname] = useState(currentNickname || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const suggestions = [
    'مزرعة الأمل',
    'بستان العائلة',
    'حديقة الذكريات',
    'مزرعة النور',
    'بستان السعادة',
    'حديقة الجنة',
    'مزرعة البركة',
    'بستان الخير'
  ];

  const handleSave = async () => {
    if (nickname.trim().length > 0 && nickname.trim().length < 3) {
      setError('الاسم يجب أن يكون 3 أحرف على الأقل');
      return;
    }

    if (nickname.trim().length > 50) {
      setError('الاسم يجب أن يكون 50 حرف كحد أقصى');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const success = await investorAccountService.updateFarmNickname(userId, nickname.trim());

      if (success) {
        onSave(nickname.trim());
        onClose();
      } else {
        setError('حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى');
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (isFirstTime) {
      onSave('');
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white px-8 py-6 relative">
          <div className="absolute top-4 right-4">
            {!isFirstTime && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <TreePine className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {isFirstTime ? 'اختر اسماً لمزرعتك' : 'تعديل اسم المزرعة'}
              </h2>
              <p className="text-white/90 text-sm">
                {isFirstTime
                  ? 'أضف لمسة شخصية لمزرعتك (اختياري)'
                  : 'يمكنك تغيير اسم مزرعتك في أي وقت'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              اسم المزرعة
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError('');
                }}
                placeholder="مثال: مزرعة الأمل"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-lg"
                maxLength={50}
                autoFocus
              />
              {nickname.length > 0 && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {nickname.length}/50
                </div>
              )}
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <X className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          {/* Suggestions */}
          {isFirstTime && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                اقتراحات:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setNickname(suggestion)}
                    className="px-4 py-2 bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-700 rounded-full text-sm font-medium transition-all hover:scale-105"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-800">
              <strong>ملاحظة:</strong> سيظهر هذا الاسم في واجهتك الشخصية، الرسائل، والتقارير. يمكنك تركه فارغاً أو تعديله لاحقاً في أي وقت.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <TreePine className="w-5 h-5" />
                  {nickname.trim() ? 'حفظ الاسم' : 'المتابعة بدون اسم'}
                </>
              )}
            </button>

            {isFirstTime && (
              <button
                onClick={handleSkip}
                disabled={saving}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                تخطي
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
