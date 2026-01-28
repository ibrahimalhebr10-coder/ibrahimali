import { useState, useEffect } from 'react';
import { ArrowRight, DollarSign, AlertCircle, Loader2, TrendingUp, FileText, Building2 } from 'lucide-react';
import { paymentService, Payment } from '../../services/paymentService';
import FarmFinanceCard from './FarmFinanceCard';
import FarmFinanceDetails from './FarmFinanceDetails';
import Breadcrumb from './Breadcrumb';
import PaymentReceiptsManagement from './PaymentReceiptsManagement';

interface FarmFinanceStats {
  farmId: number;
  farmName: string;
  totalAmount: number;
  waitingForPaymentAmount: number;
  paidAmount: number;
  failedAmount: number;
  refundedAmount: number;
  waitingCount: number;
  paidCount: number;
  failedCount: number;
  refundedCount: number;
  madaCount: number;
  tabbyCount: number;
  tamaraCount: number;
}

interface FinanceManagementProps {
  onBack: () => void;
}

export default function FinanceManagement({ onBack }: FinanceManagementProps) {
  const [farmsStats, setFarmsStats] = useState<FarmFinanceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'farms' | 'receipts'>('receipts');

  useEffect(() => {
    loadFarmsFinanceStats();
  }, []);

  const loadFarmsFinanceStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const payments = await paymentService.getAllPayments();

      if (!payments || payments.length === 0) {
        setFarmsStats([]);
        setLoading(false);
        return;
      }

      const farmStatsMap = new Map<number, FarmFinanceStats>();

      payments.forEach((payment) => {
        const farmId = payment.farm_id;

        if (!farmStatsMap.has(farmId)) {
          farmStatsMap.set(farmId, {
            farmId,
            farmName: payment.farm_name,
            totalAmount: 0,
            waitingForPaymentAmount: 0,
            paidAmount: 0,
            failedAmount: 0,
            refundedAmount: 0,
            waitingCount: 0,
            paidCount: 0,
            failedCount: 0,
            refundedCount: 0,
            madaCount: 0,
            tabbyCount: 0,
            tamaraCount: 0,
          });
        }

        const stats = farmStatsMap.get(farmId)!;
        const amount = payment.amount || 0;

        stats.totalAmount += amount;

        if (payment.payment_status === 'waiting_for_payment') {
          stats.waitingForPaymentAmount += amount;
          stats.waitingCount += 1;
        } else if (payment.payment_status === 'paid') {
          stats.paidAmount += amount;
          stats.paidCount += 1;
        } else if (payment.payment_status === 'failed') {
          stats.failedAmount += amount;
          stats.failedCount += 1;
        } else if (payment.payment_status === 'refunded') {
          stats.refundedAmount += amount;
          stats.refundedCount += 1;
        }

        if (payment.payment_method === 'mada') {
          stats.madaCount += 1;
        } else if (payment.payment_method === 'tabby') {
          stats.tabbyCount += 1;
        } else if (payment.payment_method === 'tamara') {
          stats.tamaraCount += 1;
        }
      });

      const statsArray = Array.from(farmStatsMap.values());
      statsArray.sort((a, b) => b.totalAmount - a.totalAmount);

      setFarmsStats(statsArray);
    } catch (err) {
      console.error('Error loading farms finance stats:', err);
      setError('حدث خطأ أثناء تحميل الإحصائيات المالية');
    } finally {
      setLoading(false);
    }
  };

  if (selectedFarmId) {
    const selectedFarm = farmsStats.find((f) => f.farmId === selectedFarmId);
    return (
      <FarmFinanceDetails
        farmId={selectedFarmId}
        farmName={selectedFarm?.farmName || ''}
        onBack={() => setSelectedFarmId(null)}
        onUpdate={loadFarmsFinanceStats}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white border-b-2 border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
          >
            <ArrowRight className="w-5 h-5 text-gray-700" />
            <span className="font-bold text-gray-700">رجوع</span>
          </button>
        </div>

        <Breadcrumb
          items={[
            { label: 'لوحة التحكم', onClick: onBack },
            { label: 'القسم المالي' }
          ]}
        />

        <div className="mt-4">
          <h1 className="text-3xl font-black text-gray-900">القسم المالي</h1>
          <p className="text-gray-600 mt-1">إدارة العمليات المالية والإيصالات</p>
        </div>
      </div>

      <div className="border-b-2 border-gray-200 bg-white px-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-6 py-3 font-bold transition-all border-b-4 ${
              activeTab === 'receipts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span>الإيصالات</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('farms')}
            className={`px-6 py-3 font-bold transition-all border-b-4 ${
              activeTab === 'farms'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <span>المزارع</span>
            </div>
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'receipts' ? (
          <PaymentReceiptsManagement />
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-600 font-semibold">جاري تحميل الإحصائيات المالية...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-1">خطأ</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        ) : farmsStats.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد عمليات مالية</h3>
            <p className="text-gray-600">لم يتم إنشاء أي عمليات مالية حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">إجمالي الإحصائيات</p>
                  <p className="text-2xl font-black text-blue-700 mt-1">
                    {farmsStats.length} مزرعة • {farmsStats.reduce((sum, f) => sum + f.waitingCount + f.paidCount + f.failedCount + f.refundedCount, 0)} عملية مالية
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-600">إجمالي المبالغ</p>
                  <p className="text-2xl font-black text-green-700 mt-1">
                    {farmsStats.reduce((sum, f) => sum + f.totalAmount, 0).toLocaleString()} ر.س
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-600">المبالغ المدفوعة</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    {farmsStats.reduce((sum, f) => sum + f.paidAmount, 0).toLocaleString()} ر.س
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-600">بانتظار السداد</p>
                  <p className="text-2xl font-black text-blue-700 mt-1">
                    {farmsStats.reduce((sum, f) => sum + f.waitingForPaymentAmount, 0).toLocaleString()} ر.س
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {farmsStats.map((farmStats) => (
                <FarmFinanceCard
                  key={farmStats.farmId}
                  {...farmStats}
                  onViewDetails={setSelectedFarmId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
