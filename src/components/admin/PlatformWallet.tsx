import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Heart, Calendar, Building } from 'lucide-react';
import { platformWalletService, WalletSummary } from '../../services/platformWalletService';

export default function PlatformWallet() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, transfersData] = await Promise.all([
        platformWalletService.getWalletSummary(),
        platformWalletService.getTransferHistory()
      ]);
      setSummary(summaryData);
      setTransfers(transfersData);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">محفظة الأرباح</h2>
        <p className="text-sm text-gray-600 mt-1">إدارة الفوائض المالية المحولة من المزارع</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Transferred */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm opacity-90">إجمالي الرصيد الداخل</div>
              <div className="text-xs opacity-75">من جميع المزارع</div>
            </div>
          </div>
          <div className="text-3xl font-bold">
            {summary?.total_transferred.toLocaleString() || 0}
            <span className="text-xl mr-2">ر.س</span>
          </div>
        </div>

        {/* Platform Share */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm opacity-90">رصيد المنصة</div>
              <div className="text-xs opacity-75">75% من الإجمالي</div>
            </div>
          </div>
          <div className="text-3xl font-bold">
            {summary?.platform_balance.toLocaleString() || 0}
            <span className="text-xl mr-2">ر.س</span>
          </div>
        </div>

        {/* Charity Share */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm opacity-90">رصيد الأعمال الخيرية</div>
              <div className="text-xs opacity-75">25% من الإجمالي</div>
            </div>
          </div>
          <div className="text-3xl font-bold">
            {summary?.charity_balance.toLocaleString() || 0}
            <span className="text-xl mr-2">ر.س</span>
          </div>
        </div>
      </div>

      {/* Transfer History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">سجل التحويلات</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">التاريخ</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">المزرعة</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">المبلغ المحول</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">حصة المنصة (75%)</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">حصة الخيرية (25%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    لا توجد تحويلات حتى الآن
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(transfer.transferred_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transfer.farms?.name_ar || transfer.farms?.name || 'غير محدد'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {transfer.transfer_amount.toLocaleString()} ر.س
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          {transfer.platform_share.toLocaleString()} ر.س
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-600">
                          {transfer.charity_share.toLocaleString()} ر.س
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-sm text-blue-800 space-y-1">
            <div className="font-medium">معلومات مهمة:</div>
            <ul className="list-disc mr-4 space-y-1">
              <li>التحويلات تتم يدويًا من صفحة مالية كل مزرعة</li>
              <li>يتم التقسيم التلقائي: 75% للمنصة و 25% للأعمال الخيرية</li>
              <li>لا يمكن تعديل أو حذف التحويلات بعد تنفيذها</li>
              <li>كل تحويل مسجل ومحفوظ بشكل دائم</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
