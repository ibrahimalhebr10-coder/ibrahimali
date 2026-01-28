import { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Building2,
  User,
  Calendar,
  DollarSign,
  Eye,
  Download
} from 'lucide-react';
import { paymentService, PaymentReceipt } from '../../services/paymentService';
import { paymentMethodsService, PaymentMethod } from '../../services/paymentMethodsService';
import { supabase } from '../../lib/supabase';

interface ReceiptWithDetails extends PaymentReceipt {
  reservation_details?: {
    farm_name: string;
    tree_count: number;
    user_email: string;
  };
  payment_method_name?: string;
}

export default function PaymentReceiptsManagement() {
  const [receipts, setReceipts] = useState<ReceiptWithDetails[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptWithDetails | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedReceipt) {
      loadReceiptFile(selectedReceipt.receipt_file_path);
    }
  }, [selectedReceipt]);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [methods, allReceipts] = await Promise.all([
        paymentMethodsService.getAllMethods(),
        loadAllReceipts()
      ]);

      setPaymentMethods(methods);
      setReceipts(allReceipts);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllReceipts(): Promise<ReceiptWithDetails[]> {
    const { data: receiptsData, error: receiptsError } = await supabase
      .from('payment_receipts')
      .select(`
        *,
        reservations (
          farm_name,
          total_trees,
          users:user_id (
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (receiptsError) throw receiptsError;

    return (receiptsData || []).map((receipt: any) => ({
      ...receipt,
      reservation_details: {
        farm_name: receipt.reservations?.farm_name || 'غير متاح',
        tree_count: receipt.reservations?.total_trees || 0,
        user_email: receipt.reservations?.users?.email || 'غير متاح'
      }
    }));
  }

  async function loadReceiptFile(filePath: string) {
    try {
      const url = await paymentService.getReceiptFileUrl(filePath);
      setFileUrl(url);
    } catch (err: any) {
      console.error('Error loading file:', err);
      setFileUrl(null);
    }
  }

  async function handleReview(status: 'approved' | 'rejected') {
    if (!selectedReceipt) return;

    if (status === 'rejected' && !reviewNotes.trim()) {
      setError('يرجى كتابة سبب الرفض');
      return;
    }

    try {
      setReviewing(true);
      setError('');

      await paymentService.reviewReceipt(
        selectedReceipt.id,
        status,
        reviewNotes.trim() || undefined
      );

      setSelectedReceipt(null);
      setReviewNotes('');
      setFileUrl(null);
      await loadData();
    } catch (err: any) {
      console.error('Error reviewing receipt:', err);
      setError(err.message || 'فشلت عملية المراجعة');
    } finally {
      setReviewing(false);
    }
  }

  function getStatusBadge(status: string) {
    const badges = {
      pending: {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-300',
        icon: Clock,
        label: 'قيد المراجعة'
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        icon: CheckCircle,
        label: 'موافق عليه'
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        icon: XCircle,
        label: 'مرفوض'
      }
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border-2 ${badge.bg} ${badge.text} ${badge.border}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  }

  function getMethodName(methodId: string): string {
    const method = paymentMethods.find(m => m.id === methodId);
    return method?.name_ar || 'غير محدد';
  }

  const filteredReceipts = receipts.filter(r => r.status === activeTab);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-600 font-semibold">جاري تحميل الإيصالات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="border-b-2 border-gray-200 flex">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-6 py-4 font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-50 text-amber-800 border-b-4 border-amber-500'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              <span>قيد المراجعة</span>
              <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                {receipts.filter(r => r.status === 'pending').length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 px-6 py-4 font-bold transition-all ${
              activeTab === 'approved'
                ? 'bg-green-50 text-green-800 border-b-4 border-green-500'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>موافق عليها</span>
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {receipts.filter(r => r.status === 'approved').length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex-1 px-6 py-4 font-bold transition-all ${
              activeTab === 'rejected'
                ? 'bg-red-50 text-red-800 border-b-4 border-red-500'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>مرفوضة</span>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {receipts.filter(r => r.status === 'rejected').length}
              </span>
            </div>
          </button>
        </div>

        <div className="p-6">
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                لا توجد إيصالات {activeTab === 'pending' ? 'قيد المراجعة' : activeTab === 'approved' ? 'موافق عليها' : 'مرفوضة'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'pending' && 'سيظهر هنا الإيصالات التي يرفعها المستثمرون'}
                {activeTab === 'approved' && 'سيظهر هنا الإيصالات التي تمت الموافقة عليها'}
                {activeTab === 'rejected' && 'سيظهر هنا الإيصالات المرفوضة'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{receipt.reservation_details?.farm_name}</h4>
                          <p className="text-sm text-gray-600">{receipt.reservation_details?.user_email}</p>
                        </div>
                        {getStatusBadge(receipt.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600 mb-0.5">المبلغ</p>
                          <p className="font-bold text-gray-900">{receipt.amount.toLocaleString()} ر.س</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600 mb-0.5">الوسيلة</p>
                          <p className="font-bold text-gray-900 text-sm">{getMethodName(receipt.payment_method_id)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600 mb-0.5">عدد الأشجار</p>
                          <p className="font-bold text-gray-900">{receipt.reservation_details?.tree_count || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600 mb-0.5">تاريخ الرفع</p>
                          <p className="font-bold text-gray-900 text-xs">
                            {new Date(receipt.created_at).toLocaleDateString('ar-SA', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {receipt.notes && (
                        <div className="bg-blue-50 rounded-lg p-3 mb-3">
                          <p className="text-xs font-semibold text-blue-800 mb-1">ملاحظات المستثمر:</p>
                          <p className="text-sm text-blue-900">{receipt.notes}</p>
                        </div>
                      )}

                      {receipt.review_notes && (
                        <div className={`rounded-lg p-3 mb-3 ${
                          receipt.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <p className={`text-xs font-semibold mb-1 ${
                            receipt.status === 'approved' ? 'text-green-800' : 'text-red-800'
                          }`}>
                            ملاحظات المراجعة:
                          </p>
                          <p className={`text-sm ${
                            receipt.status === 'approved' ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {receipt.review_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {receipt.status === 'pending' && (
                      <button
                        onClick={() => setSelectedReceipt(receipt)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>مراجعة</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full my-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
              <h2 className="text-2xl font-bold text-white">مراجعة الإيصال</h2>
              <p className="text-blue-100 text-sm mt-1">تحقق من الإيصال وقم بالموافقة أو الرفض</p>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">معلومات الحجز</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">المزرعة:</span>
                        <span className="font-bold text-gray-900">{selectedReceipt.reservation_details?.farm_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">المستثمر:</span>
                        <span className="font-bold text-gray-900 text-sm">{selectedReceipt.reservation_details?.user_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">المبلغ:</span>
                        <span className="font-bold text-green-600 text-lg">{selectedReceipt.amount.toLocaleString()} ر.س</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">تاريخ الرفع:</span>
                        <span className="font-bold text-gray-900">
                          {new Date(selectedReceipt.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedReceipt.notes && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h4 className="font-bold text-blue-900 mb-2">ملاحظات المستثمر:</h4>
                      <p className="text-blue-800">{selectedReceipt.notes}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      ملاحظات المراجعة {reviewNotes.trim() === '' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="اكتب ملاحظاتك هنا... (إلزامي في حالة الرفض)"
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">الإيصال المرفوع</h3>
                  {fileUrl ? (
                    <div className="bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200">
                      {selectedReceipt.receipt_file_type === 'application/pdf' ? (
                        <iframe
                          src={fileUrl}
                          className="w-full h-[500px]"
                          title="Receipt PDF"
                        />
                      ) : (
                        <img
                          src={fileUrl}
                          alt="Receipt"
                          className="w-full h-auto"
                        />
                      )}
                      <a
                        href={fileUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-center font-bold text-gray-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        <span>تحميل الإيصال</span>
                      </a>
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-xl p-8 text-center">
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                      <p className="text-gray-600">جاري تحميل الإيصال...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t-2 border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setSelectedReceipt(null);
                  setReviewNotes('');
                  setFileUrl(null);
                  setError('');
                }}
                disabled={reviewing}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-all disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleReview('rejected')}
                disabled={reviewing}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reviewing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري الرفض...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    <span>رفض</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleReview('approved')}
                disabled={reviewing}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reviewing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري الموافقة...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>موافقة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
