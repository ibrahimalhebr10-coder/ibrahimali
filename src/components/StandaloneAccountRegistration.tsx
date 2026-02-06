import { useState } from 'react';
import { LogIn, UserPlus, Leaf } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface StandaloneAccountRegistrationProps {
  onSuccess: () => void;
  onBack: () => void;
  initialMode?: 'register' | 'login';
}

export default function StandaloneAccountRegistration({ onSuccess, onBack, initialMode = 'register' }: StandaloneAccountRegistrationProps) {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const validateForm = () => {
    if (!formData.fullName.trim() && mode === 'register') {
      setError('الرجاء إدخال الاسم الكامل');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setError('الرجاء إدخال رقم الجوال');
      return false;
    }
    if (!/^05\d{8}$/.test(formData.phoneNumber)) {
      setError('رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام');
      return false;
    }
    if (!formData.password) {
      setError('الرجاء إدخال كلمة المرور');
      return false;
    }
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const email = `${formData.phoneNumber}@ashjari.local`;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            user_type: 'investor'
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('هذا الرقم مسجل بالفعل. يرجى تسجيل الدخول');
          setMode('login');
        } else {
          setError('حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى');
        }
        return;
      }

      if (signUpData?.user) {
        const { error: signInError } = await signIn(email, formData.password);
        if (!signInError) {
          onSuccess();
        } else {
          setError('حدث خطأ أثناء تسجيل الدخول التلقائي');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const email = `${formData.phoneNumber}@ashjari.local`;
      const { error: signInError } = await signIn(email, formData.password);

      if (!signInError) {
        onSuccess();
      } else {
        setError('رقم الجوال أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-white to-green-50 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="mb-6 text-green-700 hover:text-green-800 font-medium flex items-center gap-2 transition-colors"
        >
          ← العودة للرئيسية
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Leaf className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'register' ? 'إنشاء حساب المستثمر' : 'تسجيل الدخول'}
            </h1>
            <p className="text-gray-600">
              {mode === 'register'
                ? 'انضم إلى منصة الاستثمار الزراعي'
                : 'أهلاً بعودتك'}
            </p>
          </div>

          <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="أدخل اسمك الكامل"
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الجوال
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="05xxxxxxxx"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="أدخل كلمة المرور"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                'جاري التحميل...'
              ) : mode === 'register' ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  إنشاء الحساب
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {mode === 'register' ? (
              <button
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                لديك حساب؟ تسجيل الدخول
              </button>
            ) : (
              <button
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                ليس لديك حساب؟ إنشاء حساب جديد
              </button>
            )}
          </div>

          {mode === 'register' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-2">
                  لماذا تنشئ حساب؟
                </h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• تصفح المزارع واستكشف الفرص</li>
                  <li>• متابعة استثماراتك في مكان واحد</li>
                  <li>• تلقي التحديثات والأخبار</li>
                  <li>• إدارة حسابك بسهولة</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
