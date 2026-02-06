import { useState } from 'react';
import { X, User, Phone, Send, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SuccessPartnerRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SuccessPartnerRegistrationForm({ isOpen, onClose, onSuccess }: SuccessPartnerRegistrationFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

    setIsSubmitting(true);

    try {
      const { data, error: functionError } = await supabase.rpc(
        'register_success_partner',
        {
          partner_name: name.trim(),
          partner_phone: phone.trim()
        }
      );

      if (functionError) {
        throw functionError;
      }

      const result = (data as any) || {};

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2500);
      } else {
        if (result.error === 'phone_exists') {
          setError('رقم الجوال مسجل مسبقاً. يرجى استخدام رقم آخر أو التواصل معنا.');
        } else if (result.error === 'name_exists') {
          setError('هذا الاسم مسجل مسبقاً. يرجى استخدام اسم آخر.');
        } else {
          setError(result.message || 'حدث خطأ أثناء التسجيل');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('حدث خطأ أثناء التسجيل. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-4 py-12">
        {success ? (
          <div className="w-full max-w-md rounded-3xl p-8 animate-fadeIn" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(236, 253, 245, 0.95) 100%)',
            boxShadow: '0 20px 60px rgba(16, 185, 129, 0.3)',
            border: '2px solid rgba(16, 185, 129, 0.3)'
          }}>
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-emerald-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative w-24 h-24 mx-auto rounded-full flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
                  border: '3px solid rgba(16, 185, 129, 0.4)'
                }}>
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" strokeWidth={2} />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black text-emerald-900">
                  تم استلام طلبك بنجاح!
                </h3>
                <p className="text-lg text-emerald-800/80 leading-relaxed">
                  شكراً لانضمامك إلى شركاء النجاح
                  <br />
                  سنتواصل معك قريباً عبر رقم الجوال
                </p>
              </div>

              <div className="rounded-2xl p-4" style={{
                background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.5) 0%, rgba(209, 250, 229, 0.4) 100%)',
                border: '2px solid rgba(16, 185, 129, 0.2)'
              }}>
                <p className="text-sm text-emerald-700">
                  ستتلقى رسالة تأكيد خلال 24-48 ساعة
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md rounded-3xl p-8 animate-fadeIn" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 252, 251, 0.95) 100%)',
            boxShadow: '0 20px 60px rgba(16, 185, 129, 0.25)',
            border: '2px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-emerald-900">
                التسجيل كشريك نجاح
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{
                  background: 'linear-gradient(145deg, rgba(239, 246, 255, 0.95) 0%, rgba(229, 242, 251, 0.9) 100%)',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                  border: '2px solid rgba(16, 185, 129, 0.2)'
                }}
              >
                <X className="w-5 h-5 text-emerald-700" strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-emerald-900">
                  الاسم الثلاثي
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <User className="w-5 h-5 text-emerald-600" strokeWidth={2} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    placeholder="مثال: محمد أحمد العلي"
                    className="w-full pr-12 pl-4 py-4 rounded-2xl text-right text-emerald-900 font-semibold placeholder:text-emerald-400 placeholder:font-normal transition-all focus:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.5) 0%, rgba(209, 250, 229, 0.4) 100%)',
                      border: '2px solid rgba(16, 185, 129, 0.3)',
                      outline: 'none'
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-emerald-600 text-right">
                  سيُستخدم كهوية أثرك في المنصة
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-emerald-900">
                  رقم الجوال
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Phone className="w-5 h-5 text-emerald-600" strokeWidth={2} />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="05xxxxxxxx"
                    className="w-full pr-12 pl-4 py-4 rounded-2xl text-right text-emerald-900 font-semibold placeholder:text-emerald-400 placeholder:font-normal transition-all focus:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.5) 0%, rgba(209, 250, 229, 0.4) 100%)',
                      border: '2px solid rgba(16, 185, 129, 0.3)',
                      outline: 'none',
                      direction: 'ltr',
                      textAlign: 'left'
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-emerald-600 text-right">
                  للتواصل والتفعيل
                </p>
              </div>

              {error && (
                <div className="rounded-2xl p-4 flex items-start gap-3 animate-fadeIn" style={{
                  background: 'linear-gradient(135deg, rgba(254, 242, 242, 0.9) 0%, rgba(254, 226, 226, 0.8) 100%)',
                  border: '2px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-sm text-red-800 leading-relaxed flex-1">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl py-4 px-6 font-black text-white text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{
                  background: isSubmitting
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.7) 0%, rgba(5, 150, 105, 0.7) 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
                  border: '2px solid rgba(5, 150, 105, 0.5)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center gap-3">
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" strokeWidth={2.5} />
                      <span>إرسال الطلب</span>
                    </>
                  )}
                </div>
              </button>

              <div className="rounded-2xl p-4" style={{
                background: 'linear-gradient(135deg, rgba(255, 251, 235, 0.6) 0%, rgba(254, 249, 231, 0.5) 100%)',
                border: '2px solid rgba(251, 191, 36, 0.3)'
              }}>
                <p className="text-xs text-amber-900/80 leading-relaxed text-center">
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
