import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { supabase } from '../../lib/supabase';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

type LoginStep = 'identifier' | 'password';

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<LoginStep>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('يرجى إدخال اسم المستخدم أو البريد الإلكتروني');
      return;
    }

    setIsLoading(true);

    try {
      const { data: adminRecord, error: adminError } = await supabase
        .from('admins')
        .select('id, email, full_name, role, is_active')
        .eq('email', identifier.toLowerCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (adminError) {
        console.error('Admin query error:', adminError);
        setError('خطأ في الاتصال بقاعدة البيانات');
        setIsLoading(false);
        return;
      }

      if (!adminRecord) {
        setError('هذا الحساب غير مخوّل للدخول إلى لوحة الإدارة');
        setIsLoading(false);
        return;
      }

      setAdminName(adminRecord.full_name);
      setStep('password');
      setError('');
    } catch (err) {
      console.error('Verification error:', err);
      setError('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(identifier, password);

      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'كلمة المرور غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('identifier');
    setPassword('');
    setError('');
    setAdminName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-darkgreen rounded-full mb-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent animate-pulse"></div>
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-white relative z-10" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">لوحة إدارة المنصة</h1>
          <p className="text-sm md:text-base text-gray-600">
            {step === 'identifier' ? 'تسجيل الدخول للإداريين فقط' : 'أدخل كلمة المرور للمتابعة'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
          {/* Step 1: Identifier */}
          {step === 'identifier' && (
            <form onSubmit={handleIdentifierSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 flex items-start gap-3 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm md:text-base text-red-800">{error}</p>
                </div>
              )}

              {/* Identifier Field */}
              <div>
                <label htmlFor="identifier" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                  اسم المستخدم أو البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-darkgreen focus:border-transparent text-right text-sm md:text-base transition-all"
                    placeholder="أدخل اسم المستخدم أو البريد"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-darkgreen text-white py-3 md:py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جارٍ التحقق...</span>
                  </div>
                ) : (
                  'متابعة'
                )}
              </button>
            </form>
          )}

          {/* Step 2: Password */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 flex items-start gap-3 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm md:text-base text-green-800 font-semibold">تم التعرف على حساب إداري</p>
                  <p className="text-xs md:text-sm text-green-700 mt-1">مرحباً، {adminName}</p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 flex items-start gap-3 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm md:text-base text-red-800">{error}</p>
                </div>
              )}

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-darkgreen focus:border-transparent text-right text-sm md:text-base transition-all"
                    placeholder="أدخل كلمة المرور"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex-shrink-0 px-4 py-3 md:py-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span className="hidden md:inline">رجوع</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-darkgreen text-white py-3 md:py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جارٍ الدخول...</span>
                    </div>
                  ) : (
                    'دخول لوحة الإدارة'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-amber-50 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-amber-900 text-center leading-relaxed">
                لا يوجد خيار لإنشاء حساب أو استعادة كلمة المرور من هنا.
                <br />
                يتم إنشاء الحسابات من داخل النظام فقط.
              </p>
            </div>
          </div>
        </div>

        {/* Dev Credentials Info */}
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl shadow-lg border border-blue-200 p-5 md:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">
                معلومات دخول المدير العام (للتطوير)
              </h3>
              <p className="text-xs md:text-sm text-gray-600">
                استخدم هذه المعلومات لمتابعة التطوير واختبار النظام
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 md:p-4 border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">البريد الإلكتروني</p>
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm md:text-base font-mono text-blue-700 font-semibold">
                  admin@dev.com
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('admin@dev.com');
                  }}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  نسخ
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 md:p-4 border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">كلمة المرور</p>
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm md:text-base font-mono text-blue-700 font-semibold">
                  Admin@123
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('Admin@123');
                  }}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  نسخ
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-900 text-center">
              هذه معلومات دخول للتطوير فقط. يجب تغييرها قبل النشر الفعلي.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs md:text-sm text-gray-500">
            © 2026 محصولي - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
