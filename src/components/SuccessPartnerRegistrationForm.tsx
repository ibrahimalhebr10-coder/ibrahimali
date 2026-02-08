import { useState } from 'react';
import { X, User, Phone, Send, Loader, CheckCircle2, AlertCircle, Lock, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SuccessPartnerRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SuccessPartnerRegistrationForm({ isOpen, onClose, onSuccess }: SuccessPartnerRegistrationFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) return null;

  const validatePhone = (phoneNumber: string): boolean => {
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    const saudiPattern = /^(05|5)\d{8}$/;
    return saudiPattern.test(cleanPhone);
  };

  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.startsWith('05')) {
      return numbers.slice(0, 10);
    } else if (numbers.startsWith('5')) {
      return '0' + numbers.slice(0, 9);
    }
    return numbers.slice(0, 10);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('يرجى إدخال الاسم الثلاثي');
      return;
    }

    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length < 3) {
      setError('يرجى إدخال الاسم الثلاثي كاملاً');
      return;
    }

    if (!phone.trim()) {
      setError('يرجى إدخال رقم الجوال');
      return;
    }

    if (!validatePhone(phone)) {
      setError('يرجى إدخال رقم جوال سعودي صحيح (مثال: 0512345678)');
      return;
    }

    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    setIsSubmitting(true);

    try {
      const phoneEmail = `${phone.replace(/\s/g, '')}@ashjari.local`;

      let userId: string | null = null;
      let isExistingUser = false;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: phoneEmail,
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            phone: phone.trim()
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          isExistingUser = true;

          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: phoneEmail,
            password: password
          });

          if (signInError) {
            setError('كلمة المرور غير صحيحة. إذا نسيت كلمة المرور، يرجى التواصل مع الإدارة.');
            return;
          }

          userId = signInData.user?.id || null;
        } else {
          throw signUpError;
        }
      } else {
        userId = signUpData.user?.id || null;
      }

      if (!userId) {
        throw new Error('فشل الحصول على معرف المستخدم');
      }

      const { data: existingPartner } = await supabase
        .from('influencer_partners')
        .select('id, status')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingPartner) {
        if (existingPartner.status === 'active') {
          setError('أنت مسجل بالفعل كشريك نجاح!');
          return;
        } else if (existingPartner.status === 'pending') {
          setError('طلبك قيد المراجعة. سيتم تفعيل الكود بعد موافقة الإدارة.');
          return;
        } else if (existingPartner.status === 'suspended') {
          setError('نأسف، تم إيقاف حسابك. يرجى التواصل مع الإدارة.');
          return;
        }
      }

      const { data: nameCheck } = await supabase
        .from('influencer_partners')
        .select('id')
        .ilike('name', name.trim())
        .maybeSingle();

      if (nameCheck) {
        setError('هذا الاسم مسجل مسبقاً. يرجى استخدام اسم آخر.');
        await supabase.auth.signOut();
        return;
      }

      const { data: insertedPartner, error: insertError } = await supabase
        .from('influencer_partners')
        .insert({
          user_id: userId,
          name: name.trim(),
          display_name: name.trim(),
          phone: phone.trim()
        })
        .select('status')
        .single();

      if (insertError) {
        throw insertError;
      }

      const partnerStatus = insertedPartner?.status || 'pending';

      if (partnerStatus === 'pending') {
        setIsPending(true);
      } else {
        localStorage.setItem('successPartnerJustRegistered', 'true');
        console.log('🌿 [Registration] Success Partner registered - setting localStorage flag');
      }

      setSuccess(true);

      setTimeout(async () => {
        if (partnerStatus === 'pending') {
          await supabase.auth.signOut();
          onClose();
        } else {
          onSuccess();
        }
      }, 3000);

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'حدث خطأ أثناء التسجيل. يرجى المحاولة لاحقاً.');
      await supabase.auth.signOut();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900/90 via-amber-900/30 to-orange-900/40 backdrop-blur-md overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-4 py-12">
        {success ? (
          <div className="w-full max-w-md rounded-3xl p-8 animate-fadeIn shadow-2xl" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 251, 235, 0.95) 100%)',
            boxShadow: '0 20px 60px rgba(245, 158, 11, 0.4), 0 0 100px rgba(217, 119, 6, 0.2)',
            border: '2px solid rgba(245, 158, 11, 0.3)'
          }}>
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-amber-300 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                <div className="relative w-24 h-24 mx-auto rounded-full flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.15) 100%)',
                  border: '3px solid rgba(245, 158, 11, 0.4)'
                }}>
                  <CheckCircle2 className="w-12 h-12 text-amber-600" strokeWidth={2} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
                  <h3 className="text-2xl font-black text-amber-900">
                    مرحباً بك!
                  </h3>
                  <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
                </div>
                <p className="text-lg text-gray-800 leading-relaxed">
                  تم تسجيلك بنجاح في برنامج
                  <br />
                  <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                    شركاء النجاح
                  </span>
                </p>
              </div>

              <div className="rounded-2xl p-5" style={{
                background: 'linear-gradient(135deg, rgba(255, 251, 235, 0.7) 0%, rgba(254, 243, 199, 0.6) 100%)',
                border: '2px solid rgba(245, 158, 11, 0.3)',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
              }}>
                <p className="text-sm text-amber-900 font-semibold leading-relaxed">
                  {isPending ? (
                    <>
                      <span className="font-black text-lg">📋 في انتظار الموافقة</span>
                      <br />
                      <span className="text-amber-700">سنتواصل معك فور تفعيل حسابك وإرسال كودك الخاص</span>
                    </>
                  ) : (
                    <>
                      <Loader className="w-5 h-5 animate-spin inline-block ml-2" />
                      <span className="font-black">جاري تسجيل دخولك...</span>
                      <br />
                      <span className="text-amber-700">يمكنك الآن البدء في مشاركة الخير</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md rounded-3xl p-8 animate-fadeIn shadow-2xl" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 251, 235, 0.95) 100%)',
            boxShadow: '0 20px 60px rgba(245, 158, 11, 0.3), 0 0 100px rgba(217, 119, 6, 0.15)',
            border: '2px solid rgba(245, 158, 11, 0.2)'
          }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 mb-1">
                  انضم الآن
                </h2>
                <p className="text-sm text-gray-600 font-semibold">برنامج شركاء النجاح</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
                style={{
                  background: 'linear-gradient(145deg, rgba(255, 251, 235, 0.95) 0%, rgba(254, 243, 199, 0.9) 100%)',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)',
                  border: '2px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                <X className="w-5 h-5 text-amber-700 group-hover:text-amber-900 transition-colors" strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800">
                  الاسم الثلاثي
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <User className="w-5 h-5 text-amber-600" strokeWidth={2} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    placeholder="مثال: محمد أحمد العلي"
                    className="w-full pr-12 pl-4 py-4 rounded-2xl text-right text-gray-900 font-semibold placeholder:text-amber-400/60 placeholder:font-normal transition-all focus:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 251, 235, 0.6) 0%, rgba(254, 243, 199, 0.5) 100%)',
                      border: '2px solid rgba(245, 158, 11, 0.3)',
                      outline: 'none'
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-amber-700 text-right font-medium">
                  سيُستخدم كهوية أثرك في المنصة
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800">
                  رقم الجوال
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Phone className="w-5 h-5 text-amber-600" strokeWidth={2} />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="05xxxxxxxx"
                    className="w-full pr-12 pl-4 py-4 rounded-2xl text-right text-gray-900 font-semibold placeholder:text-amber-400/60 placeholder:font-normal transition-all focus:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 251, 235, 0.6) 0%, rgba(254, 243, 199, 0.5) 100%)',
                      border: '2px solid rgba(245, 158, 11, 0.3)',
                      outline: 'none',
                      direction: 'ltr',
                      textAlign: 'left'
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-amber-700 text-right font-medium">
                  سيُستخدم لتسجيل الدخول
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800">
                  كلمة المرور
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className="w-5 h-5 text-amber-600" strokeWidth={2} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="6 أحرف على الأقل"
                    className="w-full pr-12 pl-4 py-4 rounded-2xl text-right text-gray-900 font-semibold placeholder:text-amber-400/60 placeholder:font-normal transition-all focus:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 251, 235, 0.6) 0%, rgba(254, 243, 199, 0.5) 100%)',
                      border: '2px solid rgba(245, 158, 11, 0.3)',
                      outline: 'none'
                    }}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800">
                  تأكيد كلمة المرور
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className="w-5 h-5 text-amber-600" strokeWidth={2} />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="أعد إدخال كلمة المرور"
                    className="w-full pr-12 pl-4 py-4 rounded-2xl text-right text-gray-900 font-semibold placeholder:text-amber-400/60 placeholder:font-normal transition-all focus:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 251, 235, 0.6) 0%, rgba(254, 243, 199, 0.5) 100%)',
                      border: '2px solid rgba(245, 158, 11, 0.3)',
                      outline: 'none'
                    }}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl p-4 flex items-start gap-3 animate-fadeIn" style={{
                  background: 'linear-gradient(135deg, rgba(254, 242, 242, 0.9) 0%, rgba(254, 226, 226, 0.8) 100%)',
                  border: '2px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-sm text-red-800 leading-relaxed flex-1 font-medium">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl py-5 px-6 font-black text-white text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group shadow-xl"
                style={{
                  background: isSubmitting
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.7) 0%, rgba(217, 119, 6, 0.7) 100%)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                  boxShadow: '0 10px 30px rgba(245, 158, 11, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
                  border: '2px solid rgba(217, 119, 6, 0.5)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center gap-3">
                  {isSubmitting ? (
                    <>
                      <Loader className="w-6 h-6 animate-spin" strokeWidth={2.5} />
                      <span>جاري التسجيل...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" strokeWidth={2.5} />
                      <span>ابدأ رحلتك الآن</span>
                    </>
                  )}
                </div>
              </button>

              <div className="rounded-2xl p-4" style={{
                background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.6) 0%, rgba(224, 242, 254, 0.5) 100%)',
                border: '2px solid rgba(59, 130, 246, 0.2)'
              }}>
                <p className="text-xs text-gray-700 leading-relaxed text-center font-medium">
                  بإرسال هذا النموذج، أنت توافق على سياسة الخصوصية وشروط الاستخدام الخاصة ببرنامج شركاء النجاح
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
