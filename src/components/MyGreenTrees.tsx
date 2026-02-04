import React, { useState, useEffect } from 'react';
import { Sprout, Calendar, DollarSign, Image as ImageIcon, Video, CheckCircle, AlertCircle, Eye, X, Play } from 'lucide-react';
import { clientMaintenanceService, ClientMaintenanceRecord, MaintenanceDetails } from '../services/clientMaintenanceService';
import { useAuth } from '../contexts/AuthContext';

export default function MyGreenTrees() {
  const { identity } = useAuth();
  const [records, setRecords] = useState<ClientMaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [maintenanceDetails, setMaintenanceDetails] = useState<MaintenanceDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadMaintenanceRecords();
  }, [identity]);

  const loadMaintenanceRecords = async () => {
    try {
      setLoading(true);
      const pathType = identity === 'agricultural' ? 'agricultural' : 'investment';
      const data = await clientMaintenanceService.getClientMaintenanceRecords(pathType);
      setRecords(data);
    } catch (error) {
      console.error('Error loading maintenance records:', error);
      alert('خطأ في تحميل بيانات الصيانة');
    } finally {
      setLoading(false);
    }
  };

  const loadMaintenanceDetails = async (maintenanceId: string) => {
    try {
      setLoadingDetails(true);
      const details = await clientMaintenanceService.getMaintenanceDetails(maintenanceId);
      setMaintenanceDetails(details);
    } catch (error) {
      console.error('Error loading maintenance details:', error);
      alert('خطأ في تحميل تفاصيل الصيانة');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = async (record: ClientMaintenanceRecord) => {
    setSelectedRecord(record.maintenance_id);
    await loadMaintenanceDetails(record.maintenance_id);
  };

  const handlePayFee = async (record: ClientMaintenanceRecord) => {
    if (!record.total_amount || !record.cost_per_tree || !record.maintenance_fee_id) {
      alert('هذه الصيانة لا تحتوي على رسوم');
      return;
    }

    if (record.payment_status === 'paid') {
      alert('تم سداد رسوم هذه الصيانة مسبقاً');
      return;
    }

    try {
      setProcessingPayment(true);

      const existingPayment = await clientMaintenanceService.checkExistingPayment(
        record.maintenance_fee_id
      );

      if (existingPayment) {
        if (existingPayment.payment_status === 'paid') {
          alert('تم سداد رسوم هذه الصيانة مسبقاً');
          return;
        }

        const confirmPayment = confirm(
          `سداد رسوم الصيانة\n\nالمبلغ المستحق: ${record.client_due_amount} ر.س\nعدد الأشجار: ${record.client_tree_count}\n\nهل تريد المتابعة؟`
        );

        if (confirmPayment) {
          await clientMaintenanceService.updatePaymentStatus(
            existingPayment.id,
            'paid',
            record.client_due_amount!
          );
          alert('تم تسجيل السداد بنجاح');
          loadMaintenanceRecords();
        }
      } else {
        const confirmPayment = confirm(
          `سداد رسوم الصيانة\n\nالمبلغ المستحق: ${record.client_due_amount} ر.س\nعدد الأشجار: ${record.client_tree_count}\n\nهل تريد المتابعة؟`
        );

        if (confirmPayment) {
          const payment = await clientMaintenanceService.createMaintenancePayment(
            record.maintenance_fee_id,
            record.farm_id,
            record.client_tree_count,
            record.client_due_amount!
          );

          await clientMaintenanceService.updatePaymentStatus(
            payment.id,
            'paid',
            record.client_due_amount!
          );

          alert('تم تسجيل السداد بنجاح');
          loadMaintenanceRecords();
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('خطأ في معالجة السداد');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      periodic: 'bg-emerald-100 text-emerald-800',
      seasonal: 'bg-amber-100 text-amber-800',
      emergency: 'bg-rose-100 text-rose-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const closeDetails = () => {
    setSelectedRecord(null);
    setMaintenanceDetails(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">جاري تحميل بيانات أشجارك...</p>
        </div>
      </div>
    );
  }

  if (selectedRecord && maintenanceDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={closeDetails}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <X className="w-5 h-5" />
            العودة للقائمة
          </button>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Sprout className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">تفاصيل الصيانة</h1>
                  <p className="text-green-100 mt-1">
                    {clientMaintenanceService.getMaintenanceTypeLabel(maintenanceDetails.maintenance_type)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-100">
                <Calendar className="w-5 h-5" />
                <span>{maintenanceDetails.maintenance_date}</span>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {maintenanceDetails.media && maintenanceDetails.media.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-blue-600" />
                    صور وفيديوهات
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {maintenanceDetails.media.map((media) => (
                      <div
                        key={media.id}
                        className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200"
                      >
                        {media.media_type === 'image' ? (
                          <div className="aspect-video bg-gray-200 flex items-center justify-center">
                            {media.media_url ? (
                              <img
                                src={media.media_url}
                                alt="صورة الصيانة"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-12 h-12 text-gray-400" />
                            )}
                          </div>
                        ) : (
                          <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                            <Play className="w-16 h-16 text-white opacity-80" />
                            <span className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
                              فيديو
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!maintenanceDetails.media?.length && (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد صور أو فيديوهات لهذه الصيانة</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAgricultural = identity === 'agricultural';

  return (
    <div
      className={`min-h-screen py-8 px-4 ${
        isAgricultural
          ? 'bg-gradient-to-br from-green-50 via-white to-emerald-50'
          : 'bg-gradient-to-br from-amber-50 via-white to-blue-50'
      }`}
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg ${
                isAgricultural
                  ? 'bg-gradient-to-br from-green-600 to-emerald-600'
                  : 'bg-gradient-to-br from-amber-600 to-yellow-600'
              }`}
            >
              <Sprout className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {isAgricultural ? 'أشجاري الخضراء' : 'أشجاري الذهبية'}
          </h1>
          <p className="text-xl text-gray-600">تابع صيانة أشجارك وتحديثات المزرعة</p>
        </div>

        {records.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sprout className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">لا توجد تحديثات حالياً</h3>
            <p className="text-gray-600 text-lg">
              سيتم عرض تحديثات الصيانة والعناية بأشجارك هنا
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {records.map((record) => (
              <div
                key={record.maintenance_id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{record.farm_name}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${getTypeBadge(record.maintenance_type)}`}>
                        {clientMaintenanceService.getMaintenanceTypeLabel(record.maintenance_type)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-100">عدد أشجارك</div>
                      <div className="text-3xl font-bold">{record.client_tree_count}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-100">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{record.maintenance_date}</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {record.total_amount && record.cost_per_tree && record.maintenance_fee_id && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-gray-700">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold">رسوم الصيانة</span>
                        </div>
                        {record.payment_status === 'paid' ? (
                          <span className="flex items-center gap-1 text-green-600 font-semibold">
                            <CheckCircle className="w-5 h-5" />
                            مسدد
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 font-semibold">
                            <AlertCircle className="w-5 h-5" />
                            غير مسدد
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">تكلفة الشجرة الواحدة</span>
                          <span className="font-semibold text-gray-900">{record.cost_per_tree} ر.س</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">عدد أشجارك</span>
                          <span className="font-semibold text-gray-900">{record.client_tree_count}</span>
                        </div>
                        <div className="h-px bg-gray-200 my-2"></div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">المبلغ المستحق</span>
                          <span className="text-xl font-bold text-blue-600">
                            {record.client_due_amount} ر.س
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewDetails(record)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold"
                    >
                      <Eye className="w-5 h-5" />
                      عرض التفاصيل
                    </button>

                    {record.total_amount && record.cost_per_tree && record.maintenance_fee_id && record.payment_status === 'pending' && (
                      <button
                        onClick={() => handlePayFee(record)}
                        disabled={processingPayment}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <DollarSign className="w-5 h-5" />
                        سداد الرسوم
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
