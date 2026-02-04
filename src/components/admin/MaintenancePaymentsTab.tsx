import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  TreeDeciduous,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { operationsService } from '../../services/operationsService';

interface FarmWithPaths {
  farm_id: string;
  farm_name: string;
  agricultural_trees: number;
  investment_trees: number;
  has_agricultural: boolean;
  has_investment: boolean;
}

interface PathSummary {
  total_trees: number;
  total_investors: number;
  total_fees: number;
  total_collected: number;
  total_pending: number;
  paid_count: number;
  pending_count: number;
  collection_rate: number;
}

interface PaymentDetail {
  payment_id: string;
  user_id: string;
  full_name: string;
  tree_count: number;
  amount_due: number;
  amount_paid: number;
  payment_status: string;
  payment_date: string | null;
  maintenance_type: string;
  maintenance_date: string;
  created_at: string;
}

export default function MaintenancePaymentsTab() {
  const [farms, setFarms] = useState<FarmWithPaths[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [selectedPath, setSelectedPath] = useState<'agricultural' | 'investment' | null>(null);

  const [agriculturalSummary, setAgriculturalSummary] = useState<PathSummary | null>(null);
  const [investmentSummary, setInvestmentSummary] = useState<PathSummary | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);

  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadFarmSummaries();
      setSelectedPath(null);
      setPaymentDetails([]);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    if (selectedFarmId && selectedPath) {
      loadPaymentDetails();
    }
  }, [selectedFarmId, selectedPath, statusFilter]);

  const loadFarms = async () => {
    try {
      setLoading(true);
      const data = await operationsService.getFarmsWithPathStats();
      setFarms(data);
    } catch (error) {
      console.error('Error loading farms:', error);
      alert('خطأ في تحميل المزارع');
    } finally {
      setLoading(false);
    }
  };

  const loadFarmSummaries = async () => {
    if (!selectedFarmId) return;

    try {
      const selectedFarm = farms.find(f => f.farm_id === selectedFarmId);

      if (selectedFarm?.has_agricultural) {
        const agricData = await operationsService.getFarmPathPaymentSummary(selectedFarmId, 'agricultural');
        setAgriculturalSummary(agricData);
      } else {
        setAgriculturalSummary(null);
      }

      if (selectedFarm?.has_investment) {
        const investData = await operationsService.getFarmPathPaymentSummary(selectedFarmId, 'investment');
        setInvestmentSummary(investData);
      } else {
        setInvestmentSummary(null);
      }
    } catch (error) {
      console.error('Error loading summaries:', error);
    }
  };

  const loadPaymentDetails = async () => {
    if (!selectedFarmId || !selectedPath) return;

    try {
      setLoadingDetails(true);
      const data = await operationsService.getFarmPathPaymentsDetail(
        selectedFarmId,
        selectedPath,
        statusFilter
      );
      setPaymentDetails(data);
    } catch (error) {
      console.error('Error loading payment details:', error);
      alert('خطأ في تحميل تفاصيل السداد');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleMarkAsPaid = async (paymentId: string, amountDue: number) => {
    if (!confirm('هل أنت متأكد من تسجيل السداد؟')) return;

    try {
      await operationsService.updatePaymentStatus(paymentId, amountDue);
      alert('تم تسجيل السداد بنجاح');
      loadFarmSummaries();
      loadPaymentDetails();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('خطأ في تسجيل السداد');
    }
  };

  const handlePathSelect = (path: 'agricultural' | 'investment') => {
    setSelectedPath(path);
    setStatusFilter('all');
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

  const selectedFarm = farms.find(f => f.farm_id === selectedFarmId);

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
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-blue-900 mb-2 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          متابعة السداد المتقدمة
        </h3>
        <p className="text-sm text-blue-700">
          نظام متابعة مبتكر يفصل بين المسارين (الأشجار الخضراء والذهبية) لضمان الدقة والوضوح التام
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
        <label className="block text-lg font-bold text-gray-900 mb-3">
          1. اختر المزرعة
        </label>
        <select
          value={selectedFarmId}
          onChange={(e) => setSelectedFarmId(e.target.value)}
          className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- اختر مزرعة --</option>
          {farms.map(farm => (
            <option key={farm.farm_id} value={farm.farm_id}>
              {farm.farm_name} (خضراء: {farm.agricultural_trees} | ذهبية: {farm.investment_trees})
            </option>
          ))}
        </select>
      </div>

      {selectedFarmId && selectedFarm && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">2. اختر المسار</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedFarm.has_agricultural && (
                <button
                  onClick={() => handlePathSelect('agricultural')}
                  className={`relative overflow-hidden rounded-2xl border-3 transition-all duration-300 ${
                    selectedPath === 'agricultural'
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-xl scale-105'
                      : 'border-gray-300 bg-white hover:border-green-300 hover:shadow-lg'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-600 rounded-xl">
                          <TreeDeciduous className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-right">
                          <h5 className="text-xl font-bold text-gray-900">أشجاري الخضراء</h5>
                          <p className="text-sm text-gray-600">المسار الزراعي</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-6 h-6 transition-transform ${selectedPath === 'agricultural' ? 'rotate-90 text-green-600' : 'text-gray-400'}`} />
                    </div>

                    {agriculturalSummary && (
                      <div className="space-y-3 bg-white rounded-xl p-4 border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">عدد الأشجار:</span>
                          <span className="text-lg font-bold text-green-700">{agriculturalSummary.total_trees.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">إجمالي الرسوم:</span>
                          <span className="text-lg font-bold text-gray-900">{agriculturalSummary.total_fees.toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">المحصل:</span>
                          <span className="text-lg font-bold text-green-600">{agriculturalSummary.total_collected.toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">المتبقي:</span>
                          <span className="text-lg font-bold text-yellow-600">{agriculturalSummary.total_pending.toFixed(2)} ر.س</span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              )}

              {selectedFarm.has_investment && (
                <button
                  onClick={() => handlePathSelect('investment')}
                  className={`relative overflow-hidden rounded-2xl border-3 transition-all duration-300 ${
                    selectedPath === 'investment'
                      ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 shadow-xl scale-105'
                      : 'border-gray-300 bg-white hover:border-amber-300 hover:shadow-lg'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-right">
                          <h5 className="text-xl font-bold text-gray-900">أشجاري الذهبية</h5>
                          <p className="text-sm text-gray-600">المسار الاستثماري</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-6 h-6 transition-transform ${selectedPath === 'investment' ? 'rotate-90 text-amber-600' : 'text-gray-400'}`} />
                    </div>

                    {investmentSummary && (
                      <div className="space-y-3 bg-white rounded-xl p-4 border border-amber-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">عدد الأشجار:</span>
                          <span className="text-lg font-bold text-amber-700">{investmentSummary.total_trees.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">إجمالي الرسوم:</span>
                          <span className="text-lg font-bold text-gray-900">{investmentSummary.total_fees.toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">المحصل:</span>
                          <span className="text-lg font-bold text-green-600">{investmentSummary.total_collected.toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">المتبقي:</span>
                          <span className="text-lg font-bold text-yellow-600">{investmentSummary.total_pending.toFixed(2)} ر.س</span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              )}
            </div>
          </div>

          {selectedPath && (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-gray-900">
                  3. التفاصيل المالية - {selectedPath === 'agricultural' ? 'الأشجار الخضراء' : 'الأشجار الذهبية'}
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      statusFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => setStatusFilter('paid')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      statusFilter === 'paid'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    المسددين
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      statusFilter === 'pending'
                        ? 'bg-yellow-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    غير المسددين
                  </button>
                </div>
              </div>

              {(() => {
                const summary = selectedPath === 'agricultural' ? agriculturalSummary : investmentSummary;
                if (!summary) return null;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div className="text-right">
                          <p className="text-sm text-blue-600 font-medium">عدد المستثمرين</p>
                          <p className="text-3xl font-bold text-blue-900">{summary.total_investors}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div className="text-right">
                          <p className="text-sm text-green-600 font-medium">المسددين</p>
                          <p className="text-3xl font-bold text-green-900">{summary.paid_count}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <Clock className="w-8 h-8 text-yellow-600" />
                        <div className="text-right">
                          <p className="text-sm text-yellow-600 font-medium">غير المسددين</p>
                          <p className="text-3xl font-bold text-yellow-900">{summary.pending_count}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const summary = selectedPath === 'agricultural' ? agriculturalSummary : investmentSummary;
                if (!summary) return null;

                return (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">نسبة التحصيل</span>
                      <span className="text-2xl font-bold text-gray-900">{summary.collection_rate}%</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${
                          selectedPath === 'agricultural'
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gradient-to-r from-amber-500 to-yellow-600'
                        }`}
                        style={{ width: `${summary.collection_rate}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {loadingDetails ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">جاري التحميل...</p>
                </div>
              ) : paymentDetails.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">لا توجد بيانات سداد لهذا المسار</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gradient-to-b from-gray-100 to-gray-200 border-b-2 border-gray-300">
                      <tr>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">العميل</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">عدد الأشجار</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">المبلغ المستحق</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">الحالة</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {paymentDetails.map((payment) => (
                        <tr key={payment.payment_id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                selectedPath === 'agricultural' ? 'bg-green-100' : 'bg-amber-100'
                              }`}>
                                <span className={`text-sm font-bold ${
                                  selectedPath === 'agricultural' ? 'text-green-700' : 'text-amber-700'
                                }`}>
                                  {payment.full_name.charAt(0)}
                                </span>
                              </div>
                              <span className="font-semibold text-gray-900">{payment.full_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-900 font-semibold">{payment.tree_count}</td>
                          <td className="px-6 py-4">
                            <span className="text-lg font-bold text-gray-900">{payment.amount_due.toFixed(2)} ر.س</span>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(payment.payment_status)}</td>
                          <td className="px-6 py-4">
                            {payment.payment_status === 'pending' ? (
                              <button
                                onClick={() => handleMarkAsPaid(payment.payment_id, payment.amount_due)}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                              >
                                تسجيل السداد
                              </button>
                            ) : payment.payment_date ? (
                              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                <div className="text-xs text-green-700 font-medium">تم السداد</div>
                                <div className="text-xs text-green-600 mt-1">
                                  {new Date(payment.payment_date).toLocaleDateString('ar-SA')}
                                </div>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!selectedFarmId && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-4">
            <DollarSign className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">ابدأ بتحديد المزرعة</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            اختر المزرعة من القائمة أعلاه لعرض ملخص مالي منفصل للأشجار الخضراء والذهبية
          </p>
        </div>
      )}
    </div>
  );
}
