import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Building2, Upload, FileText, Loader, CreditCard, CalendarCheck, Clock, Bell } from 'lucide-react';
import { paymentMethodsService, PaymentMethod } from '../services/paymentMethodsService';
import { paymentService, PaymentReceipt } from '../services/paymentService';

interface ReservationData {
  id: string;
  farm_name: string;
  tree_count: number;
  contract_years: number;
  total_amount: number;
  status: string;
}

interface PaymentPageProps {
  reservation: ReservationData;
  onClose: () => void;
  onSuccess: () => void;
}

const methodIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  mada: CreditCard,
  tabby: CalendarCheck,
  tamara: Clock,
  bank_transfer: Building2
};

export default function PaymentPage({ reservation, onClose, onSuccess }: PaymentPageProps) {
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingReceipts, setExistingReceipts] = useState<PaymentReceipt[]>([]);

  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    notes: ''
  });

  useEffect(() => {
    loadPaymentData();
  }, [reservation.id]);

  async function loadPaymentData() {
    try {
      setLoading(true);
      const [methods, receipts] = await Promise.all([
        paymentMethodsService.getActiveMethods(),
        paymentService.getReceiptsByReservation(reservation.id)
      ]);

      setAvailableMethods(methods);
      setExistingReceipts(receipts);

      const bankTransferMethod = methods.find(m => m.method_type === 'bank_transfer');
      if (bankTransferMethod) {
        setSelectedMethod(bankTransferMethod);
      } else if (methods.length > 0) {
        setSelectedMethod(methods[0]);
      }
    } catch (err: any) {
      console.error('Error loading payment data:', err);
      setError('فشل تحميل بيانات السداد');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('نوع الملف غير مدعوم. يرجى اختيار صورة أو PDF');
      return;
    }

    setUploadForm({ ...uploadForm, file });
    setError('');
  }

  async function handleSendNotification() {
    try {
      setSendingNotification(true);
      setError('');

      await paymentService.sendPaymentOpenedNotification(reservation.id);

      setNotificationSent(true);
      setSuccess('تم إرسال إشعار فتح السداد بنجاح');

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Error sending notification:', err);
      setError('فشل إرسال الإشعار');
    } finally {
      setSendingNotification(false);
    }
  }

  async function handleUploadReceipt() {
    if (!uploadForm.file || !selectedMethod) {
      setError('يرجى اختيار ملف الإيصال');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      await paymentService.uploadReceipt({
        reservation_id: reservation.id,
        payment_method_id: selectedMethod.id,
        amount: reservation.total_amount,
        file: uploadForm.file,
        notes: uploadForm.notes
      });

      setSuccess('تم رفع الإيصال بنجاح! سيتم مراجعته خلال 24 ساعة');
      setUploadForm({ file: null, notes: '' });

      await loadPaymentData();

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('Error uploading receipt:', err);
      setError(err.message || 'فشل رفع الإيصال. يرجى المحاولة مرة أخرى');
    } finally {
      setUploading(false);
    }
  }

  function getReceiptStatusBadge(status: string) {
    const badges = {
      pending: {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        label: 'قيد المراجعة'
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'تمت الموافقة'
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'مرفوض'
      }
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 text-green-600 animate-spin" />
            <p className="text-gray-600">جاري تحميل بيانات السداد...</p>
          </div>
        </div>
      </div>
    );
  }

  if (availableMethods.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد وسائل سداد متاحة</h3>
            <p className="text-gray-600 mb-6">
              يرجى التواصل مع الإدارة لتفعيل وسائل السداد
            </p>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">إتمام السداد</h2>
            <p className="text-green-100 text-sm mt-1">اختر وسيلة الدفع وأكمل العملية</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">ملاحظة مهمة:</p>
                <p>لن يتم تأكيد حجزك إلا بعد إتمام السداد والموافقة عليه من قبل الإدارة المالية.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">ملخص الحجز</h3>
              <button
                onClick={handleSendNotification}
                disabled={sendingNotification || notificationSent}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  notificationSent
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                }`}
              >
                {sendingNotification ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm">جاري الإرسال...</span>
                  </>
                ) : notificationSent ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">تم الإرسال</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">إرسال إشعار</span>
                  </>
                )}
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">المزرعة:</span>
                <span className="font-semibold text-gray-900">{reservation.farm_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">عدد الأشجار:</span>
                <span className="font-semibold text-gray-900">{reservation.tree_count} شجرة</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">مدة العقد:</span>
                <span className="font-semibold text-gray-900">{reservation.contract_years} سنوات</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between">
                <span className="text-gray-900 font-bold">المبلغ المستحق:</span>
                <span className="text-2xl font-bold text-green-600">
                  {reservation.total_amount.toLocaleString('ar-SA')} ر.س
                </span>
              </div>
            </div>
          </div>

          {existingReceipts.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">الإيصالات المرفوعة</h3>
              <div className="space-y-3">
                {existingReceipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="bg-white rounded-lg p-4 border border-amber-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          إيصال بقيمة {receipt.amount.toLocaleString('ar-SA')} ر.س
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(receipt.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    {getReceiptStatusBadge(receipt.status)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">وسائل السداد المتاحة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableMethods.map((method) => {
                const Icon = methodIcons[method.method_type] || Building2;
                const isSelected = selectedMethod?.id === method.id;

                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method)}
                    className={`p-4 rounded-xl border-2 transition-all text-right ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isSelected ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{method.name_ar}</h4>
                        <p className="text-xs text-gray-500">{method.name_en}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{method.description_ar}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedMethod?.method_type === 'bank_transfer' && (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات التحويل البنكي</h3>

              <div className="space-y-4 mb-6">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">اسم البنك</p>
                  <p className="font-bold text-gray-900">
                    {selectedMethod.config.bank_name || 'لم يتم تحديده بعد'}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">رقم الآيبان (IBAN)</p>
                  <p className="font-bold text-gray-900 text-lg tracking-wider">
                    {selectedMethod.config.iban || 'لم يتم تحديده بعد'}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">اسم المستفيد</p>
                  <p className="font-bold text-gray-900">
                    {selectedMethod.config.account_name || 'لم يتم تحديده بعد'}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">رقم الحساب</p>
                  <p className="font-bold text-gray-900">
                    {selectedMethod.config.account_number || 'لم يتم تحديده بعد'}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-900">
                    <p className="font-semibold mb-1">تعليمات مهمة:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>قم بالتحويل للحساب أعلاه بالمبلغ المطلوب بالضبط</li>
                      <li>احتفظ بإيصال التحويل من البنك أو التطبيق</li>
                      <li>ارفع صورة واضحة للإيصال أدناه</li>
                      <li>سيتم مراجعة الإيصال خلال 24 ساعة</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    رفع إيصال التحويل *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                    <input
                      type="file"
                      id="receipt-upload"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="receipt-upload"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <Upload className="w-12 h-12 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {uploadForm.file ? uploadForm.file.name : 'اضغط لاختيار الملف'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          صورة أو PDF (حتى 5 ميجابايت)
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    ملاحظات (اختياري)
                  </label>
                  <textarea
                    value={uploadForm.notes}
                    onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                    placeholder="أي معلومات إضافية تود إضافتها..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedMethod?.method_type !== 'bank_transfer' && (
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">قريباً!</p>
                  <p>
                    وسيلة الدفع {selectedMethod?.name_ar} ستكون متاحة قريباً.
                    يمكنك حالياً استخدام التحويل البنكي.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800">{success}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            إلغاء
          </button>

          {selectedMethod?.method_type === 'bank_transfer' && (
            <button
              onClick={handleUploadReceipt}
              disabled={!uploadForm.file || uploading}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>جاري الرفع...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>رفع الإيصال</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
