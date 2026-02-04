import React, { useState, useEffect } from 'react';
import { DollarSign, Users, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import { operationsService } from '../../services/operationsService';

interface PaymentSummary {
  id: string;
  full_name: string;
  farm_name: string;
  maintenance_type: string;
  maintenance_date: string;
  tree_count: number;
  amount_due: number;
  amount_paid: number;
  payment_status: string;
  payment_date: string | null;
  created_at: string;
}

export default function MaintenancePaymentsTab() {
  const [payments, setPayments] = useState<PaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await operationsService.getMaintenancePaymentsSummary();
      setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
      alert('خطأ في تحميل بيانات السداد');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (paymentId: string, amountDue: number) => {
    if (!confirm('هل أنت متأكد من تسجيل السداد؟')) return;

    try {
      await operationsService.updatePaymentStatus(paymentId, amountDue);
      alert('تم تسجيل السداد بنجاح');
      loadPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('خطأ في تسجيل السداد');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.farm_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.payment_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: filteredPayments.length,
    paid: filteredPayments.filter(p => p.payment_status === 'paid').length,
    pending: filteredPayments.filter(p => p.payment_status === 'pending').length,
    totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount_due, 0),
    paidAmount: filteredPayments.reduce((sum, p) => sum + p.amount_paid, 0),
    pendingAmount: filteredPayments.reduce((sum, p) => sum + (p.amount_due - p.amount_paid), 0)
  };

  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          مسدد
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3" />
        معلق
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      periodic: 'bg-orange-100 text-orange-800',
      seasonal: 'bg-yellow-100 text-yellow-800',
      emergency: 'bg-red-100 text-red-800'
    };
    const labels = {
      periodic: 'دورية',
      seasonal: 'موسمية',
      emergency: 'طارئة'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs ${colors[type as keyof typeof colors]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-lg font-bold text-blue-900 mb-2">متابعة السداد - النتائج المالية</h3>
        <p className="text-sm text-blue-700">
          هذا القسم يعرض الالتزامات المالية الناتجة عن سجلات الصيانة المنشورة. كل رسوم مرتبطة بسجل صيانة محدد.
        </p>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-4">
            <DollarSign className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد التزامات مالية بعد</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            عند إنشاء سجلات صيانة مع رسوم ونشرها للعملاء، ستظهر هنا الالتزامات المالية تلقائياً
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600 font-medium">عملاء لديهم التزامات</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                  <p className="text-xs text-blue-700 mt-1">من سجلات صيانة منشورة</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-green-600 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600 font-medium">المسددين</p>
                  <p className="text-3xl font-bold text-green-900">{stats.paid}</p>
                  <p className="text-sm text-green-700 font-semibold mt-1">{stats.paidAmount.toFixed(2)} ر.س</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-yellow-600 rounded-xl">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-yellow-600 font-medium">المتأخرين</p>
                  <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
                  <p className="text-sm text-yellow-700 font-semibold mt-1">{stats.pendingAmount.toFixed(2)} ر.س</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو المزرعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="paid">مسدد</option>
              <option value="pending">معلق</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-b from-blue-50 to-blue-100 border-b-2 border-blue-200">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                  <div>السياق التشغيلي</div>
                  <div className="text-xs font-normal text-gray-600 mt-1">المزرعة والصيانة</div>
                </th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                  <div>العميل</div>
                  <div className="text-xs font-normal text-gray-600 mt-1">صاحب الالتزام</div>
                </th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                  <div>الالتزام المالي</div>
                  <div className="text-xs font-normal text-gray-600 mt-1">المبلغ والسداد</div>
                </th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                  <div>الحالة</div>
                  <div className="text-xs font-normal text-gray-600 mt-1">مسدد/معلق</div>
                </th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-green-700">M</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{payment.farm_name}</div>
                          <div className="text-xs text-gray-500">{payment.tree_count} شجرة</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {getTypeBadge(payment.maintenance_type)}
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600">{payment.maintenance_date}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-700">
                          {payment.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{payment.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">المستحق:</span>
                        <span className="text-sm font-bold text-gray-900">{payment.amount_due.toFixed(2)} ر.س</span>
                      </div>
                      {payment.amount_paid > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-600">المسدد:</span>
                          <span className="text-sm font-bold text-green-600">{payment.amount_paid.toFixed(2)} ر.س</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(payment.payment_status)}</td>
                  <td className="px-6 py-4">
                    {payment.payment_status === 'pending' && (
                      <button
                        onClick={() => handleMarkAsPaid(payment.id, payment.amount_due)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-semibold"
                      >
                        تسجيل السداد
                      </button>
                    )}
                    {payment.payment_status === 'paid' && payment.payment_date && (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <div className="text-xs text-green-700 font-medium">تم السداد</div>
                        <div className="text-xs text-green-600 mt-1">
                          {new Date(payment.payment_date).toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">لا توجد نتائج تطابق البحث</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4">ملخص مالي</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">إجمالي المستحقات</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalAmount.toFixed(2)} ر.س</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">إجمالي المحصل</p>
            <p className="text-2xl font-bold text-green-600">{stats.paidAmount.toFixed(2)} ر.س</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">المتبقي</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingAmount.toFixed(2)} ر.س</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">نسبة التحصيل</span>
              <span className="text-sm font-bold text-gray-900">
                {stats.totalAmount > 0 ? ((stats.paidAmount / stats.totalAmount) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${stats.totalAmount > 0 ? (stats.paidAmount / stats.totalAmount) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
