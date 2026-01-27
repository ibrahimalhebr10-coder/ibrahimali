import { TrendingUp, DollarSign, CheckCircle2, Clock, XCircle, Eye, CreditCard } from 'lucide-react';

interface FarmFinanceCardProps {
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
  onViewDetails: (farmId: number) => void;
}

export default function FarmFinanceCard({
  farmId,
  farmName,
  totalAmount,
  waitingForPaymentAmount,
  paidAmount,
  failedAmount,
  refundedAmount,
  waitingCount,
  paidCount,
  failedCount,
  refundedCount,
  madaCount,
  tabbyCount,
  tamaraCount,
  onViewDetails
}: FarmFinanceCardProps) {
  const totalTransactions = waitingCount + paidCount + failedCount + refundedCount;
  const successRate = totalTransactions > 0 ? ((paidCount / totalTransactions) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden hover:shadow-xl transition-all">
      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{farmName}</h3>
              <p className="text-sm text-blue-50">
                {totalTransactions} عملية مالية • معدل النجاح {successRate}%
              </p>
            </div>
          </div>
          <button
            onClick={() => onViewDetails(farmId)}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white font-bold hover:bg-white/30 transition-all flex items-center gap-2 border border-white/30"
          >
            <Eye className="w-5 h-5" />
            <span className="hidden md:inline">عرض التفاصيل</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600">إجمالي المبالغ</p>
            </div>
            <p className="text-2xl font-black text-amber-700">{totalAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">ريال سعودي</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600">المبالغ المدفوعة</p>
            </div>
            <p className="text-2xl font-black text-green-700">{paidAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">ريال سعودي</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600">بانتظار السداد</p>
            </div>
            <p className="text-2xl font-black text-blue-700">{waitingForPaymentAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">ريال سعودي</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600">فشل / استرداد</p>
            </div>
            <p className="text-2xl font-black text-red-700">{(failedAmount + refundedAmount).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">ريال سعودي</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-gray-700">حالة العمليات:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {waitingCount > 0 && (
                <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full border border-blue-300">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span className="text-xs font-bold text-blue-800">{waitingCount} بانتظار</span>
                </div>
              )}
              {paidCount > 0 && (
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full border border-green-300">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  <span className="text-xs font-bold text-green-800">{paidCount} مدفوع</span>
                </div>
              )}
              {failedCount > 0 && (
                <div className="flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full border border-red-300">
                  <div className="w-2 h-2 rounded-full bg-red-600"></div>
                  <span className="text-xs font-bold text-red-800">{failedCount} فشل</span>
                </div>
              )}
              {refundedCount > 0 && (
                <div className="flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full border border-orange-300">
                  <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                  <span className="text-xs font-bold text-orange-800">{refundedCount} مسترد</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              <span className="text-sm font-bold text-gray-700">وسائل الدفع:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {madaCount > 0 && (
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full border border-green-300">
                  <span className="text-xs font-bold text-green-800">مدى {madaCount}</span>
                </div>
              )}
              {tabbyCount > 0 && (
                <div className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full border border-purple-300">
                  <span className="text-xs font-bold text-purple-800">تابي {tabbyCount}</span>
                </div>
              )}
              {tamaraCount > 0 && (
                <div className="flex items-center gap-2 bg-pink-100 px-3 py-1 rounded-full border border-pink-300">
                  <span className="text-xs font-bold text-pink-800">تمارا {tamaraCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
