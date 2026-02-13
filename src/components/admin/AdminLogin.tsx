import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Shield } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    if (!password) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
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
            تسجيل الدخول للإداريين فقط
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm md:text-base text-red-800">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-darkgreen focus:border-transparent text-right text-sm md:text-base transition-all"
                  placeholder="أدخل البريد الإلكتروني"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

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
                  <span>جارٍ الدخول...</span>
                </div>
              ) : (
                'دخول لوحة الإدارة'
              )}
            </button>
          </form>

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
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-xs text-gray-600 mb-2 font-semibold">البريد الإلكتروني</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <code className="text-base lg:text-lg font-mono text-blue-700 font-bold bg-blue-50 px-3 py-2 rounded border border-blue-200 break-all select-all">
                  admin@dev.com
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('admin@dev.com');
                    setEmail('admin@dev.com');
                  }}
                  className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap shadow-sm"
                >
                  نسخ وملء
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-xs text-gray-600 mb-2 font-semibold">كلمة المرور</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <code className="text-base lg:text-lg font-mono text-blue-700 font-bold bg-blue-50 px-3 py-2 rounded border border-blue-200 break-all select-all">
                  Admin@123
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('Admin@123');
                    setPassword('Admin@123');
                  }}
                  className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap shadow-sm"
                >
                  نسخ وملء
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
