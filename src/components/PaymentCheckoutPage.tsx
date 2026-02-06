import { useState, useEffect } from 'react';
import { CreditCard, Check, Lock, Smartphone, Apple, Building2, ChevronRight, User, Mail, Phone, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { paymentProvidersService, PaymentProvider } from '../services/paymentProvidersService';
import { reservationService } from '../services/reservationService';
import { supabase } from '../lib/supabase';

interface PaymentCheckoutPageProps {
  reservationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ReservationSummary {
  farmName: string;
  treeCount: number;
  treeType: string;
  totalPrice: number;
  contractDuration: number;
  pathType: 'agricultural' | 'investment';
}

export default function PaymentCheckoutPage({ reservationId, onSuccess, onCancel }: PaymentCheckoutPageProps) {
  const { user } = useAuth();
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [reservationSummary, setReservationSummary] = useState<ReservationSummary | null>(null);
  const [isAppleDevice, setIsAppleDevice] = useState(false);

  const [quickRegisterData, setQuickRegisterData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    checkAppleDevice();
    loadEnabledProviders();
    loadReservationSummary();
  }, []);

  useEffect(() => {
    if (!user) {
      setShowQuickRegister(true);
    }
  }, [user]);

  const checkAppleDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod|macintosh/.test(userAgent);
    setIsAppleDevice(isApple);
  };

  const loadEnabledProviders = async () => {
    try {
      const allProviders = await paymentProvidersService.getEnabledProviders();
      setProviders(allProviders);

      if (isAppleDevice && allProviders.some(p => p.provider_code === 'apple_pay')) {
        setSelectedProvider('apple_pay');
      } else if (allProviders.length > 0) {
        setSelectedProvider(allProviders[0].provider_code);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReservationSummary = async () => {
    try {
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          *,
          farms(name_ar),
          tree_varieties(name_ar)
        `)
        .eq('id', reservationId)
        .single();

      if (error) throw error;

      setReservationSummary({
        farmName: reservation.farms?.name_ar || 'المزرعة',
        treeCount: reservation.tree_count || 0,
        treeType: reservation.tree_varieties?.name_ar || 'شجرة',
        totalPrice: reservation.total_price || 0,
        contractDuration: reservation.contract_duration || 0,
        pathType: reservation.path_type || 'agricultural'
      });
    } catch (error) {
      console.error('Error loading reservation:', error);
    }
  };

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: quickRegisterData.email,
        password: quickRegisterData.password,
        options: {
          data: {
            full_name: quickRegisterData.fullName,
            phone: quickRegisterData.phone
          }
        }
      });

      if (error) throw error;

      setShowQuickRegister(false);
      alert('✓ تم إنشاء الحساب بنجاح');
    } catch (error: any) {
      console.error('Error registering:', error);
      alert(error.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedProvider) {
      alert('الرجاء اختيار وسيلة دفع');
      return;
    }

    if (!user && showQuickRegister) {
      alert('الرجاء إكمال التسجيل أولاً');
      return;
    }

    setProcessing(true);

    try {
      await reservationService.updateReservationStatus(reservationId, 'pending_payment');

      const provider = providers.find(p => p.provider_code === selectedProvider);

      if (selectedProvider === 'bank_transfer') {
        onSuccess();
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      await reservationService.updateReservationStatus(reservationId, 'confirmed');

      onSuccess();
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('حدث خطأ أثناء معالجة الدفع');
    } finally {
      setProcessing(false);
    }
  };

  const getProviderIcon = (code: string) => {
    switch (code) {
      case 'mada':
      case 'visa_mastercard':
        return <CreditCard className="w-6 h-6" />;
      case 'apple_pay':
        return <Apple className="w-6 h-6" />;
      case 'bank_transfer':
        return <Building2 className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
            العودة
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">إتمام الدفع</h1>
                  <p className="text-sm text-gray-600">اختر وسيلة الدفع المناسبة</p>
                </div>
              </div>

              {showQuickRegister && !user && (
                <div className="mb-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">إنشاء حساب سريع</h3>
                      <p className="text-sm text-gray-600">أنشئ حسابك لإكمال عملية الدفع</p>
                    </div>
                  </div>

                  <form onSubmit={handleQuickRegister} className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4" />
                        الاسم الكامل
                      </label>
                      <input
                        type="text"
                        value={quickRegisterData.fullName}
                        onChange={(e) => setQuickRegisterData({ ...quickRegisterData, fullName: e.target.value })}
                        placeholder="أدخل اسمك الكامل"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4" />
                        رقم الجوال
                      </label>
                      <input
                        type="tel"
                        value={quickRegisterData.phone}
                        onChange={(e) => setQuickRegisterData({ ...quickRegisterData, phone: e.target.value })}
                        placeholder="05XXXXXXXX"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        dir="ltr"
                        required
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4" />
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={quickRegisterData.email}
                        onChange={(e) => setQuickRegisterData({ ...quickRegisterData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        dir="ltr"
                        required
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Lock className="w-4 h-4" />
                        كلمة المرور
                      </label>
                      <input
                        type="password"
                        value={quickRegisterData.password}
                        onChange={(e) => setQuickRegisterData({ ...quickRegisterData, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        minLength={6}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={processing}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'جاري التسجيل...' : 'إنشاء الحساب والمتابعة'}
                    </button>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  اختر وسيلة الدفع
                </h3>

                {providers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد وسائل دفع متاحة حالياً
                  </div>
                ) : (
                  providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.provider_code)}
                      disabled={showQuickRegister && !user}
                      className={`
                        w-full p-4 rounded-xl border-2 transition-all text-right
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${selectedProvider === provider.provider_code
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center
                            ${selectedProvider === provider.provider_code
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                            }
                          `}>
                            {getProviderIcon(provider.provider_code)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{provider.provider_name_ar}</p>
                            <p className="text-sm text-gray-600">{provider.description_ar}</p>
                          </div>
                        </div>
                        {selectedProvider === provider.provider_code && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-8 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <p>جميع المعاملات مؤمنة ومشفرة بأعلى معايير الأمان</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
              <h3 className="font-bold text-gray-900 mb-4">ملخص الحجز</h3>

              {reservationSummary ? (
                <div className="space-y-4">
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">المزرعة</p>
                    <p className="font-bold text-gray-900">{reservationSummary.farmName}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">نوع الشجرة</span>
                      <span className="font-medium text-gray-900">{reservationSummary.treeType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">عدد الأشجار</span>
                      <span className="font-medium text-gray-900">{reservationSummary.treeCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">مدة العقد</span>
                      <span className="font-medium text-gray-900">{reservationSummary.contractDuration} سنة</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">المبلغ الإجمالي</span>
                      <span className="text-2xl font-bold text-green-600">
                        {reservationSummary.totalPrice.toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={!selectedProvider || processing || (showQuickRegister && !user)}
                    className="w-full mt-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        إتمام الدفع
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader className="w-8 h-8 text-green-600 animate-spin mx-auto" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
