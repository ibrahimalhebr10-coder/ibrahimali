import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Wallet, Calendar, Lock, Archive, Trash2, AlertTriangle } from 'lucide-react';
import { farmFinancialService, FarmFinancialTransaction, FarmBalance } from '../../services/farmFinancialService';
import { platformWalletService } from '../../services/platformWalletService';

interface FarmFinancialPageProps {
  farmId: string;
  farmName: string;
  onBack: () => void;
}

export default function FarmFinancialPage({ farmId, farmName, onBack }: FarmFinancialPageProps) {
  const [activeTab, setActiveTab] = useState<'agricultural' | 'investment'>('agricultural');
  const [totalBalance, setTotalBalance] = useState<FarmBalance | null>(null);
  const [pathBalance, setPathBalance] = useState<FarmBalance | null>(null);
  const [transactions, setTransactions] = useState<FarmFinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isFinanciallyClosed, setIsFinanciallyClosed] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [farmId, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [totalBalanceData, pathBalanceData, transactionsData] = await Promise.all([
        farmFinancialService.getFarmBalance(farmId),
        farmFinancialService.getFarmBalance(farmId, activeTab),
        farmFinancialService.getFarmTransactions(farmId, activeTab)
      ]);
      setTotalBalance(totalBalanceData);
      setPathBalance(pathBalanceData);
      setTransactions(transactionsData);

      if (transactionsData.length > 0) {
        const lastTransaction = transactionsData[0];
        const lastDate = new Date(lastTransaction.transaction_date);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        setIsFinanciallyClosed(lastDate < oneMonthAgo);
      } else {
        setIsFinanciallyClosed(false);
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await farmFinancialService.addTransaction({
        farm_id: farmId,
        path_type: activeTab,
        transaction_type: formData.get('type') as 'income' | 'expense',
        amount: parseFloat(formData.get('amount') as string),
        description: formData.get('description') as string,
        transaction_date: formData.get('date') as string
      });

      setShowAddModal(false);
      loadData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('حدث خطأ أثناء إضافة العملية');
    }
  };

  const handleTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);

    if (!totalBalance || amount > totalBalance.current_balance) {
      alert('المبلغ أكبر من الرصيد المتاح');
      return;
    }

    try {
      const result = await platformWalletService.transferToWallet(farmId, amount);

      if (result.success) {
        const platformShare = (amount * 0.75).toFixed(2);
        const charityShare = (amount * 0.25).toFixed(2);
        alert(
          `✓ تم التحويل بنجاح!\n\n` +
          `المبلغ المحول: ${amount.toLocaleString()} ر.س\n` +
          `• حصة المنصة (75%): ${parseFloat(platformShare).toLocaleString()} ر.س\n` +
          `• حصة الخيرية (25%): ${parseFloat(charityShare).toLocaleString()} ر.س\n\n` +
          `يمكنك الآن مراجعة الرصيد في قسم "محفظة الأرباح" من لوحة التحكم.`
        );
        setShowTransferModal(false);
        loadData();
      } else {
        alert('❌ ' + (result.error || 'حدث خطأ أثناء التحويل'));
      }
    } catch (error) {
      console.error('Error transferring to wallet:', error);
      alert('❌ حدث خطأ أثناء التحويل. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleArchive = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const archiveName = formData.get('archiveName') as string;
    const clearCurrent = formData.get('clearCurrent') === 'true';
    const notes = formData.get('notes') as string;

    try {
      setArchiveLoading(true);
      const result = await farmFinancialService.archiveFarmFinances(farmId, archiveName, clearCurrent, notes);

      if (result.success) {
        alert(
          `✓ تم الأرشفة بنجاح!\n\n` +
          `اسم الأرشيف: ${result.archive_name}\n` +
          `الدخل المؤرشف: ${result.total_income?.toLocaleString()} ر.س\n` +
          `المصروفات المؤرشفة: ${result.total_expenses?.toLocaleString()} ر.س\n` +
          `الرصيد النهائي: ${result.final_balance?.toLocaleString()} ر.س\n` +
          `العمليات المؤرشفة: ${result.transactions_archived}\n` +
          `التحويلات المؤرشفة: ${result.transfers_archived}\n\n` +
          (clearCurrent ? '✓ تم تصفير البيانات الحالية' : 'البيانات الحالية محفوظة')
        );
        setShowArchiveModal(false);
        loadData();
      } else {
        alert('❌ ' + (result.error || 'حدث خطأ أثناء الأرشفة'));
      }
    } catch (error) {
      console.error('Error archiving:', error);
      alert('❌ حدث خطأ أثناء الأرشفة. يرجى المحاولة مرة أخرى.');
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const confirmationCode = formData.get('confirmationCode') as string;
    const adminReason = formData.get('adminReason') as string;

    if (!adminReason || adminReason.length < 10) {
      alert('يرجى إدخال سبب الحذف (10 أحرف على الأقل)');
      return;
    }

    try {
      setDeleteLoading(true);
      const result = await farmFinancialService.deleteFarmFinancesPermanently(farmId, confirmationCode, adminReason);

      if (result.success) {
        alert(
          `✓ تم الحذف النهائي بنجاح!\n\n` +
          `العمليات المحذوفة: ${result.transactions_deleted}\n` +
          `التحويلات المحذوفة: ${result.transfers_deleted}\n\n` +
          `تم تسجيل العملية في سجل التدقيق`
        );
        setShowDeleteModal(false);
        loadData();
      } else {
        alert('❌ ' + (result.error || 'حدث خطأ أثناء الحذف'));
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('❌ حدث خطأ أثناء الحذف. يرجى المحاولة مرة أخرى.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{farmName}</h2>
            <p className="text-sm text-gray-600">مالية المزرعة</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة عملية
          </button>
          {totalBalance && totalBalance.current_balance > 0 && (
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              دفع فائض مالي
            </button>
          )}
          <button
            onClick={() => setShowArchiveModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Archive className="w-4 h-4" />
            أرشفة
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            حذف نهائي
          </button>
        </div>
      </div>

      {/* Summary Card - إجمالي كل المسارات */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-xs text-gray-500 mb-3 text-center">الملخص الكلي لجميع المسارات</div>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">إجمالي الإيرادات</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totalBalance?.total_income.toLocaleString() || 0} ر.س
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
              <TrendingDown className="w-5 h-5" />
              <span className="text-sm font-medium">إجمالي المصروفات</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totalBalance?.total_expenses.toLocaleString() || 0} ر.س
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium">الرصيد الكلي</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totalBalance?.current_balance.toLocaleString() || 0} ر.س
            </div>
          </div>
        </div>
      </div>

      {/* شارة مغلق ماليًا - تذكير بصري فقط */}
      {isFinanciallyClosed && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-amber-900">
              هذه الفترة مغلقة ماليًا
            </div>
            <div className="text-xs text-amber-700 mt-0.5">
              لا توجد عمليات مالية منذ أكثر من شهر - يُنصح بمراجعة السجلات
            </div>
          </div>
        </div>
      )}

      {/* Path Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('agricultural')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'agricultural'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          أشجاري الخضراء
        </button>
        <button
          onClick={() => setActiveTab('investment')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'investment'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          أشجاري الذهبية
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">التاريخ</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">نوع العملية</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">الوصف</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">المبلغ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  لا توجد عمليات مالية حتى الآن
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(transaction.transaction_date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.transaction_type === 'income'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.transaction_type === 'income' ? (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          إيراد
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          مصروف
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {transaction.amount.toLocaleString()} ر.س
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">إضافة عملية مالية</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع العملية
                </label>
                <select
                  name="type"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="income">إيراد</option>
                  <option value="expense">مصروف</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المبلغ (ر.س)
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="مثال: رسوم صيانة – أشجاري الخضراء (تحويل بنكي)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="mt-1 text-xs text-gray-500">
                  يُفضل كتابة وصف واضح يشمل نوع العملية والمسار
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التاريخ
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  إضافة
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">دفع فائض مالي إلى محفظة المنصة</h3>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-700 mb-3">
                الرصيد الكلي للمزرعة من جميع المسارات:
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {totalBalance?.current_balance.toLocaleString() || 0} ر.س
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-blue-200">
                <div className="text-xs">
                  <div className="text-gray-500 mb-1">أشجاري الخضراء</div>
                  <div className={`font-bold ${pathBalance && activeTab === 'agricultural' ? (pathBalance.current_balance >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                    {activeTab === 'agricultural' ? `${pathBalance?.current_balance.toLocaleString() || 0} ر.س` : '---'}
                  </div>
                </div>
                <div className="text-xs">
                  <div className="text-gray-500 mb-1">أشجاري الذهبية</div>
                  <div className={`font-bold ${pathBalance && activeTab === 'investment' ? (pathBalance.current_balance >= 0 ? 'text-amber-600' : 'text-red-600') : 'text-gray-400'}`}>
                    {activeTab === 'investment' ? `${pathBalance?.current_balance.toLocaleString() || 0} ر.س` : '---'}
                  </div>
                </div>
              </div>
            </div>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المبلغ المراد تحويله (ر.س)
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="0.01"
                  step="0.01"
                  max={totalBalance?.current_balance}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
                <div>• سيتم تقسيم المبلغ تلقائيًا:</div>
                <div className="mr-4">- 75% للمنصة</div>
                <div className="mr-4">- 25% للأعمال الخيرية</div>
                <div className="text-red-600 mt-2">• لا يمكن التراجع عن التحويل</div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  تحويل
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <Archive className="w-6 h-6 text-yellow-600" />
              <h3 className="text-xl font-bold text-gray-900">أرشفة البيانات المالية</h3>
            </div>
            <form onSubmit={handleArchive} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الأرشيف</label>
                <input
                  type="text"
                  name="archiveName"
                  required
                  placeholder="مثال: الربع الأول 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="أي ملاحظات إضافية..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="clearCurrent"
                    value="true"
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">تصفير البيانات بعد الأرشفة</div>
                    <div className="text-gray-600 mt-1">سيتم حفظ نسخة في الأرشيف ثم حذف البيانات الحالية للبدء من جديد</div>
                  </div>
                </label>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 space-y-1">
                <div className="font-semibold">ما الذي سيتم أرشفته؟</div>
                <div>• جميع العمليات المالية</div>
                <div>• جميع التحويلات للمحفظة</div>
                <div>• الأرصدة والملخصات</div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={archiveLoading}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  {archiveLoading ? 'جاري الأرشفة...' : 'أرشفة الآن'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-red-200 bg-red-50 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-red-900">حذف نهائي - تحذير</h3>
            </div>
            <form onSubmit={handleDelete} className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <div className="font-bold text-red-900">تحذير شديد الأهمية:</div>
                <div className="text-sm text-red-800 space-y-1">
                  <div>• الحذف نهائي ولا يمكن التراجع عنه</div>
                  <div>• سيتم حذف جميع البيانات المالية</div>
                  <div>• سيتم تسجيل هذه العملية في سجل التدقيق</div>
                  <div>• يجب إدخال كود التأكيد الصحيح</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سبب الحذف (إلزامي)</label>
                <textarea
                  name="adminReason"
                  required
                  rows={3}
                  placeholder="يرجى توضيح السبب بالتفصيل (10 أحرف على الأقل)..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كود التأكيد</label>
                <input
                  type="text"
                  name="confirmationCode"
                  required
                  placeholder={`${farmId.substring(0, 8)}DELETE`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                />
                <div className="text-xs text-gray-600 mt-1">
                  اكتب: <span className="font-mono font-bold">{farmId.substring(0, 8)}DELETE</span>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? 'جاري الحذف...' : 'حذف نهائي'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
