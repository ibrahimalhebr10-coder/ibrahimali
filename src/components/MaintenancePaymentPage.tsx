import React, { useState, useEffect } from 'react';
import { X, CreditCard, Building2, Clock, Sprout, DollarSign, CheckCircle2, Loader2, Copy, MessageCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clientMaintenanceService, ClientMaintenanceRecord } from '../services/clientMaintenanceService';
import { paymentMethodsService, PaymentMethod } from '../services/paymentMethodsService';
import { maintenancePaymentService } from '../services/maintenancePaymentService';
import { systemSettingsService } from '../services/systemSettingsService';

interface MaintenancePaymentPageProps {
  maintenanceId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MaintenancePaymentPage({
  maintenanceId,
  onClose,
  onSuccess
}: MaintenancePaymentPageProps) {
  const { user, identity } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [maintenanceRecord, setMaintenanceRecord] = useState<ClientMaintenanceRecord | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [selectedMethodType, setSelectedMethodType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [bankInfo, setBankInfo] = useState<{
    bankNameAr: string;
    accountName: string;
    accountNumber: string;
    swiftCode: string;
  } | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [maintenanceId]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const pathType = identity === 'agricultural' ? 'agricultural' : 'investment';
      const records = await clientMaintenanceService.getClientMaintenanceRecords(pathType);
      const record = records.find(r => r.maintenance_id === maintenanceId);

      if (!record) {
        throw new Error('لم يتم العثور على سجل الصيانة');
      }

      if (record.payment_status === 'paid') {
        throw new Error('تم سداد رسوم هذه الصيانة مسبقاً');
      }

      const paymentStatus = await maintenancePaymentService.checkPaymentStatus(
        record.maintenance_fee_id!,
        user.id
      );

      if (paymentStatus.has_payment && paymentStatus.status === 'paid') {
        throw new Error('تم سداد رسوم هذه الصيانة مسبقاً');
      }

      const methods = await paymentMethodsService.getActiveMethods();

      const [bankNameAr, accountName, accountNumber, swiftCode, whatsappNum] = await Promise.all([
        systemSettingsService.getSetting('bank_name_ar'),
        systemSettingsService.getSetting('bank_account_name'),
        systemSettingsService.getSetting('bank_account_number'),
        systemSettingsService.getSetting('bank_swift_code'),
        systemSettingsService.getSetting('whatsapp_admin_number')
      ]);

      setBankInfo({
        bankNameAr: bankNameAr || 'البنك الأهلي التجاري',
        accountName: accountName || 'منصة المزارع الخضراء',
        accountNumber: accountNumber || 'SA1234567890123456789012',
        swiftCode: swiftCode || 'NCBKSAJE'
      });

      setWhatsappNumber(whatsappNum || '+966500000000');

      setMaintenanceRecord(record);
      setPaymentMethods(methods);

      if (methods.length > 0) {
        setSelectedMethod(methods[0].id);
        setSelectedMethodType(methods[0].method_type);
      }
    } catch (err: any) {
      console.error('Error loading payment data:', err);
      setError(err.message || 'خطأ في تحميل بيانات الدفع');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSendWhatsApp = () => {
    if (!maintenanceRecord || !bankInfo) return;

    const message = `السلام عليكم، أرغب في إرسال إيصال التحويل البنكي لسداد رسوم الصيانة:

المزرعة: ${maintenanceRecord.farm_name}
نوع الصيانة: ${maintenanceRecord.maintenance_title}
المبلغ المحول: ${maintenanceRecord.client_due_amount} ر.س
رقم الحساب المحول إليه: ${bankInfo.accountNumber}

برجاء تأكيد استلام الإيصال وتفعيل الدفع في حسابي.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleConfirmPayment = async () => {
    if (!user || !maintenanceRecord || !maintenanceRecord.maintenance_fee_id) {
      alert('بيانات غير مكتملة');
      return;
    }

    if (!selectedMethod) {
      alert('يرجى اختيار وسيلة الدفع');
      return;
    }

    try {
      setProcessing(true);

      const paymentInfo = await maintenancePaymentService.initiatePayment(
        maintenanceRecord.maintenance_fee_id,
        user.id
      );

      window.location.href = paymentInfo.paymentUrl;
    } catch (err: any) {
      console.error('Error initiating payment:', err);
      alert(err.message || 'خطأ في بدء عملية الدفع');
      setProcessing(false);
    }
  };

  const getMethodIcon = (methodType: string) => {
    switch (methodType) {
      case 'mada':
      case 'tabby':
      case 'tamara':
        return <CreditCard className="w-6 h-6" />;
      case 'bank_transfer':
        return <Building2 className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">جاري تحميل بيانات الدفع...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تعذر إتمام العملية</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl hover:bg-gray-800 transition-colors font-semibold"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  if (!maintenanceRecord) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onClose}
          disabled={processing}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
          العودة
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">سداد رسوم الصيانة</h1>
            <p className="text-green-100">قم بمراجعة التفاصيل واختيار وسيلة الدفع</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">تفاصيل الصيانة</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sprout className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">المزرعة</p>
                    <p className="text-lg font-semibold text-gray-900">{maintenanceRecord.farm_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">نوع الصيانة</p>
                    <p className="text-lg font-semibold text-gray-900">{maintenanceRecord.maintenance_title}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sprout className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">عدد الأشجار</p>
                    <p className="text-lg font-semibold text-gray-900">{maintenanceRecord.client_tree_count} شجرة</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">المبلغ للشجرة الواحدة</p>
                    <p className="text-lg font-semibold text-gray-900">{maintenanceRecord.cost_per_tree} ر.س</p>
                  </div>
                </div>

                <div className="border-t border-green-200 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">المبلغ الإجمالي المستحق</span>
                    <span className="text-3xl font-bold text-green-600">{maintenanceRecord.client_due_amount} ر.س</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">اختر وسيلة الدفع</h2>

              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">لا توجد وسائل دفع متاحة حالياً</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        setSelectedMethod(method.id);
                        setSelectedMethodType(method.method_type);
                        setCopySuccess('');
                      }}
                      disabled={processing}
                      className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 ${
                        selectedMethod === method.id
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-green-300'
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          selectedMethod === method.id
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getMethodIcon(method.method_type)}
                        </div>
                        <div className="flex-1 text-right">
                          <p className="font-semibold text-gray-900">{method.name_ar}</p>
                          <p className="text-sm text-gray-600">{method.description_ar}</p>
                        </div>
                        {selectedMethod === method.id && (
                          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedMethodType === 'bank_transfer' && bankInfo ? (
              <div className="pt-6 space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">معلومات التحويل البنكي</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">اسم البنك</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-lg font-bold text-gray-900">{bankInfo.bankNameAr}</p>
                        <button
                          onClick={() => handleCopyToClipboard(bankInfo.bankNameAr, 'bank')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      {copySuccess === 'bank' && (
                        <p className="text-xs text-green-600 mt-1">تم النسخ!</p>
                      )}
                    </div>

                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">اسم صاحب الحساب</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-lg font-bold text-gray-900">{bankInfo.accountName}</p>
                        <button
                          onClick={() => handleCopyToClipboard(bankInfo.accountName, 'name')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      {copySuccess === 'name' && (
                        <p className="text-xs text-green-600 mt-1">تم النسخ!</p>
                      )}
                    </div>

                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">رقم الحساب / الآيبان</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-lg font-bold text-gray-900 font-mono">{bankInfo.accountNumber}</p>
                        <button
                          onClick={() => handleCopyToClipboard(bankInfo.accountNumber, 'account')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      {copySuccess === 'account' && (
                        <p className="text-xs text-green-600 mt-1">تم النسخ!</p>
                      )}
                    </div>

                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">المبلغ المطلوب تحويله</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-2xl font-bold text-green-600">{maintenanceRecord.client_due_amount} ر.س</p>
                        <button
                          onClick={() => handleCopyToClipboard(maintenanceRecord.client_due_amount.toString(), 'amount')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      {copySuccess === 'amount' && (
                        <p className="text-xs text-green-600 mt-1">تم النسخ!</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Info className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">خطوات إتمام الدفع</h4>
                      <ol className="text-sm text-gray-700 space-y-2 mr-2">
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-amber-600 flex-shrink-0">1.</span>
                          <span>قم بتحويل المبلغ المطلوب إلى الحساب البنكي المذكور أعلاه</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-amber-600 flex-shrink-0">2.</span>
                          <span>احتفظ بإيصال التحويل من البنك</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-amber-600 flex-shrink-0">3.</span>
                          <span>أرسل صورة الإيصال عبر الواتساب للإدارة باستخدام الزر أدناه</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-amber-600 flex-shrink-0">4.</span>
                          <span>سيتم تأكيد الدفع وتفعيله في حسابك خلال 24 ساعة</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSendWhatsApp}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-5 rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <MessageCircle className="w-6 h-6" />
                  إرسال إيصال التحويل عبر الواتساب
                </button>

                <p className="text-center text-sm text-gray-600">
                  بعد إرسال الإيصال، سيتم مراجعته وتأكيد الدفع في حسابك
                </p>
              </div>
            ) : (
              <div className="pt-6">
                <button
                  onClick={handleConfirmPayment}
                  disabled={processing || !selectedMethod}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      جاري التحويل لبوابة الدفع...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6" />
                      تأكيد السداد
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-600 mt-4">
                  سيتم تحويلك إلى بوابة الدفع الآمنة لإتمام العملية
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">دفع آمن ومضمون</h3>
              <p className="text-sm text-gray-600">
                جميع المعاملات محمية بأعلى معايير الأمان. بياناتك المالية آمنة تماماً.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
