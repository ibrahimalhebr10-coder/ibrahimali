import { useState } from 'react';
import { Mail, Lock, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthForm({ isOpen, onClose, onSuccess }: AuthFormProps) {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await signUp(email, password);

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('هذا البريد الإلكتروني مسجل مسبقاً. جرب تسجيل الدخول.');
          } else {
            setError(signUpError.message);
          }
          setLoading(false);
          return;
        }

        setSuccess('تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...');

        setTimeout(async () => {
          const { error: signInError } = await signIn(email, password);

          if (signInError) {
            setError('تم إنشاء الحساب لكن فشل تسجيل الدخول التلقائي. جرب تسجيل الدخول يدوياً.');
            setMode('signin');
            setLoading(false);
            return;
          }

          setLoading(false);
          onSuccess();
        }, 1000);

      } else {
        const { error: signInError } = await signIn(email, password);

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          } else {
            setError(signInError.message);
          }
          setLoading(false);
          return;
        }

        setSuccess('تم تسجيل الدخول بنجاح!');
        setTimeout(() => {
          setLoading(false);
          onSuccess();
        }, 1000);
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative"
        style={{
          border: '3px solid #3AA17E',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #3AA17E 0%, #2F5233 100%)',
                boxShadow: '0 8px 16px rgba(58,161,126,0.3)'
              }}
            >
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-darkgreen mb-2">
              {mode === 'signup' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </h2>
            <p className="text-sm text-gray-600">
              {mode === 'signup'
                ? 'أنشئ حسابك للبدء في الاستثمار الزراعي'
                : 'سجل دخولك للوصول إلى حسابك'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 flex-1">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 flex-1">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-darkgreen mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  disabled={loading}
                  className="w-full pr-12 pl-4 py-4 rounded-xl border-2 border-gray-200 focus:border-darkgreen focus:outline-none transition-colors text-right disabled:bg-gray-50"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-darkgreen mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pr-12 pl-4 py-4 rounded-xl border-2 border-gray-200 focus:border-darkgreen focus:outline-none transition-colors text-left disabled:bg-gray-50"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {mode === 'signup' && 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: loading
                  ? 'linear-gradient(145deg, #9ca3af 0%, #6b7280 100%)'
                  : 'linear-gradient(145deg, #3AA17E 0%, #2F5233 100%)',
                boxShadow: loading
                  ? 'none'
                  : '0 4px 16px rgba(58,161,126,0.3)'
              }}
            >
              {loading
                ? 'جاري المعالجة...'
                : mode === 'signup'
                  ? 'إنشاء حساب'
                  : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
              className="text-sm text-darkgreen hover:underline disabled:opacity-50"
            >
              {mode === 'signup'
                ? 'لديك حساب؟ سجل الدخول'
                : 'ليس لديك حساب؟ سجل الآن'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
