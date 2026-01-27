import { Calendar, CreditCard, DollarSign, CheckCircle2, XCircle, AlertCircle, RefreshCw, User, TreePine } from 'lucide-react';
import type { Payment } from '../../services/paymentService';

interface PaymentCardProps {
  payment: Payment;
  userEmail?: string;
}

export default function PaymentCard({ payment, userEmail }: PaymentCardProps) {
  const getStatusConfig = (status: Payment['payment_status']) => {
    const configs = {
      waiting_for_payment: {
        label: 'بانتظار السداد',
        icon: AlertCircle,
        className: 'bg-blue-100 text-blue-800 border-blue-300'
      },
      paid: {
        label: 'مدفوع',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-800 border-green-300'
      },
      failed: {
        label: 'فشل',
        icon: XCircle,
        className: 'bg-red-100 text-red-800 border-red-300'
      },
      refunded: {
        label: 'مسترجع',
        icon: RefreshCw,
        className: 'bg-gray-100 text-gray-800 border-gray-300'
      }
    };

    return configs[status];
  };

  const getMethodConfig = (method: Payment['payment_method']) => {
    const configs = {
      mada: {
        label: 'مدى',
        className: 'bg-gradient-to-br from-blue-500 to-blue-600'
      },
      tabby: {
        label: 'تابي',
        className: 'bg-gradient-to-br from-purple-500 to-purple-600'
      },
      tamara: {
        label: 'تمارا',
        className: 'bg-gradient-to-br from-pink-500 to-pink-600'
      }
    };

    return configs[method];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const statusConfig = getStatusConfig(payment.payment_status);
  const methodConfig = getMethodConfig(payment.payment_method);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-xl transition-all">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-xl ${methodConfig.className} flex items-center justify-center shadow-lg`}>
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{payment.farm_name}</h3>
                <p className="text-sm text-gray-600">{methodConfig.label}</p>
              </div>
            </div>
          </div>

          <div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border-2 ${statusConfig.className}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
            <p className="text-xs text-gray-600 mb-1">المبلغ</p>
            <p className="text-lg font-black text-green-700">{payment.amount.toLocaleString()}</p>
            <p className="text-xs text-gray-500">ريال سعودي</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">تاريخ الإنشاء</p>
            <p className="text-sm font-bold text-blue-700">{formatDate(payment.created_at)}</p>
          </div>
        </div>

        {payment.payment_date && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-sm font-semibold text-green-900">
                تاريخ السداد: {formatDate(payment.payment_date)}
              </p>
            </div>
          </div>
        )}

        {payment.transaction_id && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-600 mb-1">رقم المعاملة</p>
            <p className="text-sm font-mono font-bold text-gray-900">{payment.transaction_id}</p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{userEmail || 'المستثمر'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{formatDate(payment.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
