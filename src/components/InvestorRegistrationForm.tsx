import { useState } from 'react';
import { User, Phone, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InvestorRegistrationFormProps {
  guestId: string;
  onSuccess: (userId: string) => void;
  onCancel?: () => void;
}

export default function InvestorRegistrationForm({ guestId, onSuccess, onCancel }: InvestorRegistrationFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('يرجى إدخال الاسم الكامل');
      return false;
    }
    if (formData.fullName.trim().length < 3) {
      setError('الاسم يجب أن يكون 3 أحرف على الأقل');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setError('يرجى إدخال رقم الجوال');
      return false;
    }
    const phoneRegex = /^(05|5)\d{8}$/;
    if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
      setError('رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام');
      return false;
    }
    if (!formData.password) {
      setError('يرجى إدخال كلمة المرور');
      return false;
    }
    if (formData.password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const phoneNumber = formData.phoneNumber.replace(/\s/g, '');
      const email = `${phoneNumber}@investor.harvest.local`;

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone_number: phoneNumber,
            user_type: 'investor'
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('رقم الجوال مسجل مسبقاً. يرجى تسجيل الدخول أو استخدام رقم آخر');
        } else {
          setError('حدث خطأ في التسجيل. يرجى المحاولة مرة أخرى');
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        onSuccess(authData.user.id);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى');
      setLoading(false);
    }
  };

  const handlePasswordReset = () => {
    setShowPasswordReset(true);
  };

  if (showPasswordReset) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-[#D4AF37]/30">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-[#B8942F]">استعادة كلمة المرور</h3>
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-sm text-amber-800 leading-relaxed">
              سيتم تفعيل نظام استعادة كلمة المرور عبر رسائل SMS قريباً.
              <br />
              حالياً، يرجى التواصل مع الدعم الفني للمساعدة.
            </p>
          </div>
          <button
            onClick={() => setShowPasswordReset(false)}
            className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8942F] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            رجوع
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-[#D4AF37]/30">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8942F] rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[#B8942F] mb-2">إنشاء حساب المستثمر</h2>
        <p className="text-sm text-gray-600">سجّل حسابك لإكمال حجز مزرعتك</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            الاسم الكامل
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="أدخل اسمك الكامل"
              className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors text-right"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            رقم الجوال
          </label>
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="05xxxxxxxx"
              className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors text-right"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">مثال: 0512345678</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            كلمة المرور
          </label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="أدخل كلمة المرور"
              className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors text-right"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">8 أحرف على الأقل</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            تأكيد كلمة المرور
          </label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="أعد إدخال كلمة المرور"
              className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors text-right"
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-semibold">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8942F] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>جاري التسجيل...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>تسجيل الحساب</span>
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handlePasswordReset}
            className="text-sm text-[#D4AF37] hover:text-[#B8942F] font-semibold hover:underline transition-colors"
          >
            استعادة كلمة المرور
          </button>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            إلغاء
          </button>
        )}
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200">
          <p className="text-xs text-center text-amber-800 leading-relaxed">
            بإنشاء الحساب، أنت توافق على الشروط والأحكام الخاصة بالمنصة
          </p>
        </div>
      </div>
    </div>
  );
}
