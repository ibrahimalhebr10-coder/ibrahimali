import { useState, useEffect } from 'react';
import { User, Phone, Lock, AlertCircle, CheckCircle2, Sparkles, Shield, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PrePaymentRegistrationProps {
  farmName: string;
  treeCount: number;
  farmCategory: 'agricultural' | 'investment';
  guestId?: string;
  onSuccess: (userId: string, userName: string) => void;
  onBack?: () => void;
}

export default function PrePaymentRegistration({
  farmName,
  treeCount,
  farmCategory,
  guestId,
  onSuccess,
  onBack
}: PrePaymentRegistrationProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkExistingSession = async () => {
      if (user) {
        console.log('✅ [REGISTRATION] المستخدم مسجل دخول بالفعل:', user.id);

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        const userName = profile?.full_name || 'المستخدم';
        console.log('🔄 [REGISTRATION] تخطي التسجيل والمتابعة للدفع...');

        await updateUserIdentity(user.id);
        await linkTemporaryReservation(user.id);

        onSuccess(user.id, userName);
      }
    };

    checkExistingSession();
  }, [user]);

  const updateUserIdentity = async (userId: string) => {
    console.log('🔄 [REGISTRATION] تحديث هوية المستخدم...');
    console.log('📋 [REGISTRATION] farmCategory:', farmCategory);

    const identityField = farmCategory === 'investment' ? 'secondary_identity' : 'primary_identity';
    const updateData = {
      [identityField]: farmCategory === 'investment' ? 'investment' : 'agricultural'
    };

    console.log('📝 [REGISTRATION] تحديث:', identityField, '=', updateData[identityField]);

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId);

    if (profileError) {
      console.error('❌ [REGISTRATION] خطأ في تحديث الهوية:', profileError);
    } else {
      console.log('✅ [REGISTRATION] تم تحديث هوية المستخدم بنجاح!');
    }
  };

  const linkTemporaryReservation = async (userId: string) => {
    if (!guestId) {
      console.log('ℹ️ [REGISTRATION] لا يوجد حجز مؤقت للربط');
      return;
    }

    console.log('🔗 [REGISTRATION] ربط الحجز المؤقت:', guestId);

    const { data: tempReservation, error: findError } = await supabase
      .from('reservations')
      .select('*')
      .eq('guest_id', guestId)
      .eq('status', 'temporary')
      .maybeSingle();

    if (findError) {
      console.error('❌ [REGISTRATION] خطأ في البحث عن الحجز المؤقت:', findError);
      return;
    }

    if (tempReservation) {
      console.log('🔄 [REGISTRATION] تحديث الحجز المؤقت ID:', tempReservation.id);

      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          user_id: userId,
          guest_id: null,
          status: 'confirmed',
          temporary_expires_at: null
        })
        .eq('id', tempReservation.id);

      if (updateError) {
        console.error('❌ [REGISTRATION] خطأ في ربط الحجز:', updateError);
      } else {
        console.log('✅ [REGISTRATION] تم ربط الحجز المؤقت بالمستخدم!');
      }
    } else {
      console.log('ℹ️ [REGISTRATION] لم يتم العثور على حجز مؤقت');
    }
  };

  if (user) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-50/98 via-emerald-50/95 to-teal-50/98 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-bold text-gray-700">جاري التحقق من حسابك...</p>
          </div>
        </div>
      </div>
    );
  }

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
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل');
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
      const email = `${phoneNumber}@ashjari.local`;

      console.log('📝 [REGISTRATION] بدء إنشاء الحساب...');
      console.log('📝 [REGISTRATION] Phone:', phoneNumber);
      console.log('📝 [REGISTRATION] Category:', farmCategory);

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone_number: phoneNumber,
            user_type: farmCategory === 'investment' ? 'investor' : 'farmer'
          }
        }
      });

      if (signUpError) {
        console.error('❌ [REGISTRATION] Supabase signup error:', signUpError);
        if (signUpError.message.includes('already registered')) {
          setError('رقم الجوال مسجل مسبقاً. يرجى تسجيل الدخول أو استخدام رقم آخر');
        } else if (signUpError.message.includes('Password should be at least 6 characters')) {
          setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل (متطلب من النظام)');
        } else {
          setError(`خطأ في التسجيل: ${signUpError.message}`);
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        console.log('✅ [REGISTRATION] تم إنشاء الحساب! User ID:', authData.user.id);

        await updateUserIdentity(authData.user.id);
        await linkTemporaryReservation(authData.user.id);

        console.log('✅ [REGISTRATION] التسجيل مكتمل! الانتقال للدفع...');
        onSuccess(authData.user.id, formData.fullName);
      }
    } catch (err) {
      console.error('❌ [REGISTRATION] Registration error:', err);
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50/98 via-emerald-50/95 to-teal-50/98 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-lg w-full space-y-4">
          {onBack && (
            <button
              onClick={onBack}
              disabled={loading}
              className="p-3 bg-white/80 rounded-xl shadow-lg hover:bg-white transition-colors flex items-center gap-2 font-bold text-[#B8942F] disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>رجوع</span>
            </button>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-green-300/50 space-y-6">
            {/* Header with motivational message */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-bold text-green-800">
                  لحفظ أشجار مزرعتك
                </h1>
                <p className="text-xl font-bold text-[#B8942F]">
                  بقي عليك فقط فتح حسابك الآن
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-[#D4AF37]/30">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700 mb-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="font-bold">استثمارك محمي ومؤمّن</span>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm text-[#B8942F]">
                    <span className="font-bold">{treeCount}</span> شجرة في مزرعة <span className="font-bold">{farmName}</span>
                  </p>
                  <p className="text-xs text-gray-600">في انتظار تسجيل حسابك</p>
                </div>
              </div>
            </div>

            {/* Registration Form */}
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
                    className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors text-right"
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
                    className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors text-right"
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
                    className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors text-right"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">6 أحرف أو أرقام على الأقل</p>
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
                    className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors text-right"
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
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري فتح حسابك...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>فتح حسابي والمتابعة للدفع</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-gray-200">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <p className="text-xs text-center text-green-800 leading-relaxed">
                  بفتح الحساب، سيتم ربط استثمار أشجارك بحسابك الشخصي وسنتقل مباشرة لإتمام الدفع
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
