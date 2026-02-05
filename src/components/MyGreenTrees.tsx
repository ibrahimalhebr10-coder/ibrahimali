import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sprout, Calendar, DollarSign, Image as ImageIcon, Video, CheckCircle, AlertCircle, Eye, X, Play, Heart } from 'lucide-react';
import { clientMaintenanceService, ClientMaintenanceRecord, MaintenanceDetails } from '../services/clientMaintenanceService';
import { useAuth } from '../contexts/AuthContext';
import { useDemoMode } from '../contexts/DemoModeContext';
import { getDemoGreenTreesData, getDemoGoldenTreesData, sortMaintenanceRecordsByPriority, getMaintenanceTypeLabel } from '../services/demoDataService';
import DemoActionModal from './DemoActionModal';
import InvestmentAssetsView from './InvestmentAssetsView';

interface MyGreenTreesProps {
  onNavigateToPayment?: (maintenanceId: string) => void;
  onShowAuth?: (mode: 'login' | 'register') => void;
}

export default function MyGreenTrees({ onNavigateToPayment, onShowAuth }: MyGreenTreesProps) {
  const { identity, user } = useAuth();
  const { isDemoMode, demoType } = useDemoMode();
  const [records, setRecords] = useState<ClientMaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [maintenanceDetails, setMaintenanceDetails] = useState<MaintenanceDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [showDemoActionModal, setShowDemoActionModal] = useState(false);
  const [generalStatus, setGeneralStatus] = useState<any>(null);

  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadMaintenanceRecords();
  }, [identity, isDemoMode]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      loadingRef.current = false;
    };
  }, []);

  const loadMaintenanceRecords = async () => {
    try {
      setLoading(true);

      if (isDemoMode) {
        const demoData = demoType === 'green'
          ? getDemoGreenTreesData()
          : getDemoGoldenTreesData();

        setGeneralStatus(demoData.generalStatus || null);

        let demoRecords: ClientMaintenanceRecord[] = demoData.maintenanceRecords.map((record: any) => ({
          maintenance_id: record.id,
          farm_id: 'demo-farm-id',
          farm_name: demoData.farmName,
          maintenance_type: record.maintenance_type,
          maintenance_date: record.maintenance_date,
          status: record.status,
          total_amount: record.total_amount,
          cost_per_tree: record.cost_per_tree,
          client_tree_count: record.client_tree_count,
          client_due_amount: record.client_due_amount,
          payment_status: record.payment_status,
          payment_id: record.payment_status === 'paid' ? 'demo-payment-id' : null
        }));

        if (demoType === 'green') {
          demoRecords = sortMaintenanceRecordsByPriority(demoRecords);
        }

        setRecords(demoRecords);
        setLoading(false);
        return;
      }

      if (!user) {
        console.log('No user found, skipping maintenance records load');
        setRecords([]);
        setLoading(false);
        return;
      }

      const pathType = identity === 'agricultural' ? 'agricultural' : 'investment';
      const data = await clientMaintenanceService.getClientMaintenanceRecords(pathType);

      if (identity === 'agricultural') {
        setRecords(sortMaintenanceRecordsByPriority(data));
      } else {
        setRecords(data);
      }
    } catch (error) {
      console.error('Error loading maintenance records:', error);
      alert('خطأ في تحميل بيانات الصيانة');
    } finally {
      setLoading(false);
    }
  };

  const loadMaintenanceDetails = useCallback(async (maintenanceId: string) => {
    if (loadingRef.current) {
      console.log('Already loading, skipping...');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    loadingRef.current = true;

    try {
      setLoadingDetails(true);

      if (isDemoMode) {
        const demoData = demoType === 'green'
          ? getDemoGreenTreesData()
          : getDemoGoldenTreesData();

        const record = demoData.maintenanceRecords.find((r: any) => r.id === maintenanceId);

        if (record) {
          const details: MaintenanceDetails = {
            maintenance_id: record.id,
            farm_name: demoData.farmName,
            maintenance_type: record.maintenance_type,
            maintenance_date: record.maintenance_date,
            status: record.status,
            description: record.description,
            cost_per_tree: record.cost_per_tree,
            total_amount: record.total_amount,
            client_tree_count: record.client_tree_count,
            client_due_amount: record.client_due_amount,
            payment_status: record.payment_status,
            images: record.images.map((url: string, idx: number) => ({
              id: `demo-img-${idx}`,
              media_url: url,
              media_type: 'image'
            })),
            videos: record.videos || []
          };
          setMaintenanceDetails(details);
        }
        setLoadingDetails(false);
        loadingRef.current = false;
        return;
      }

      if (!user) {
        console.log('No user found, cannot load maintenance details');
        return;
      }

      const details = await clientMaintenanceService.getMaintenanceDetails(maintenanceId);

      if (!abortControllerRef.current?.signal.aborted) {
        setMaintenanceDetails(details);
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError' && !abortControllerRef.current?.signal.aborted) {
        console.error('Error loading maintenance details:', error);
        alert('خطأ في تحميل تفاصيل الصيانة');
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoadingDetails(false);
      }
      loadingRef.current = false;
    }
  }, [isDemoMode, demoType]);

  const handleViewDetails = useCallback(async (record: ClientMaintenanceRecord) => {
    if (loadingRef.current) {
      console.log('Still loading previous details, please wait...');
      return;
    }

    setSelectedRecord(record.maintenance_id);
    setMaintenanceDetails(null);
    setImageErrors(new Set());

    await loadMaintenanceDetails(record.maintenance_id);
  }, [loadMaintenanceDetails]);

  const handlePayFee = (record: ClientMaintenanceRecord) => {
    if (isDemoMode) {
      setShowDemoActionModal(true);
      return;
    }

    if (!user) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    if (!record.maintenance_id) {
      alert('معرف الصيانة غير صالح');
      return;
    }

    if (record.payment_status === 'paid') {
      alert('تم سداد رسوم هذه الصيانة مسبقاً');
      return;
    }

    if (onNavigateToPayment) {
      onNavigateToPayment(record.maintenance_id);
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      pruning: 'bg-green-100 text-green-800',
      fertilization: 'bg-emerald-100 text-emerald-800',
      irrigation: 'bg-blue-100 text-blue-800',
      pest_control: 'bg-amber-100 text-amber-800',
      seasonal_pruning: 'bg-teal-100 text-teal-800',
      soil_improvement: 'bg-brown-100 text-brown-800',
      periodic: 'bg-emerald-100 text-emerald-800',
      seasonal: 'bg-amber-100 text-amber-800',
      emergency: 'bg-rose-100 text-rose-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const closeDetails = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setSelectedRecord(null);
    setMaintenanceDetails(null);
    setImageErrors(new Set());
    setLoadingDetails(false);
    loadingRef.current = false;
  }, []);

  const handleImageError = useCallback((mediaId: string) => {
    setImageErrors(prev => new Set(prev).add(mediaId));
  }, []);

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

  if (selectedRecord) {
    if (loadingDetails || !maintenanceDetails) {
      return (
        <div
          key="loading-details"
          className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4 pb-32"
          dir="rtl"
        >
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
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Sprout className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">تفاصيل الصيانة</h1>
                    <p className="text-green-100 mt-1">جاري التحميل...</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg">جاري تحميل التفاصيل...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const currentRecord = records.find(r => r.maintenance_id === selectedRecord);

    return (
      <div
        key={`details-${selectedRecord}-${maintenanceDetails.id}`}
        className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4 pb-32"
        dir="rtl"
      >
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
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-1">تفاصيل الصيانة</h1>
                  <p className="text-green-100">
                    {clientMaintenanceService.getMaintenanceTypeLabel(maintenanceDetails.maintenance_type)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-green-100">
                  <Calendar className="w-4 h-4" />
                  <span>{maintenanceDetails.maintenance_date}</span>
                </div>
                <div className="flex items-center gap-2 text-green-100">
                  <Sprout className="w-4 h-4" />
                  <span>مزرعة {maintenanceDetails.farm_name}</span>
                </div>
                <div className="flex items-center gap-2 text-green-100">
                  <Sprout className="w-4 h-4" />
                  <span>{maintenanceDetails.client_tree_count} شجرة</span>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {maintenanceDetails.cost_per_tree && maintenanceDetails.maintenance_fee_id && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">رسوم الصيانة</h3>
                        <p className="text-sm text-gray-600">تفاصيل التكلفة المستحقة</p>
                      </div>
                    </div>
                    {maintenanceDetails.payment_status === 'paid' ? (
                      <span className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold">
                        <CheckCircle className="w-5 h-5" />
                        مسدد
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-bold">
                        <AlertCircle className="w-5 h-5" />
                        غير مسدد
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">تكلفة الشجرة</div>
                      <div className="text-2xl font-bold text-gray-900">{maintenanceDetails.cost_per_tree} ر.س</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">عدد أشجارك</div>
                      <div className="text-2xl font-bold text-gray-900">{maintenanceDetails.client_tree_count}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">المبلغ المستحق</div>
                      <div className="text-2xl font-bold text-blue-600">{maintenanceDetails.client_due_amount} ر.س</div>
                    </div>
                  </div>
                  {maintenanceDetails.payment_status === 'pending' && currentRecord && (
                    <button
                      onClick={() => currentRecord && handlePayFee(currentRecord)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-lg"
                    >
                      <DollarSign className="w-6 h-6" />
                      سداد الرسوم الآن
                    </button>
                  )}
                </div>
              )}

              {maintenanceDetails.stages && maintenanceDetails.stages.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-purple-600" />
                    مراحل الصيانة
                  </h3>
                  <div className="space-y-4">
                    {maintenanceDetails.stages.map((stage, index) => (
                      <div
                        key={stage.id}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-1">{stage.stage_title}</h4>
                            <p className="text-gray-700 mb-2">{stage.stage_note}</p>
                            <div className="flex items-center gap-2 text-sm text-purple-600">
                              <Calendar className="w-4 h-4" />
                              <span>{stage.stage_date}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {maintenanceDetails.media && maintenanceDetails.media.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-blue-600" />
                    صور وفيديوهات الصيانة
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {maintenanceDetails.media.map((media) => (
                      <div
                        key={media.id}
                        className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                      >
                        {media.media_type === 'image' ? (
                          <div className="aspect-video bg-gray-200 flex items-center justify-center relative group">
                            {media.media_url && !imageErrors.has(media.id) ? (
                              <>
                                <img
                                  src={media.media_url}
                                  alt="صورة الصيانة"
                                  className="w-full h-full object-cover"
                                  onError={() => handleImageError(media.id)}
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-gray-400">
                                <ImageIcon className="w-12 h-12" />
                                <span className="text-sm">الصورة غير متوفرة</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-video bg-gray-900 flex items-center justify-center relative group cursor-pointer">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                              فيديو
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!maintenanceDetails.media || maintenanceDetails.media.length === 0) &&
               (!maintenanceDetails.stages || maintenanceDetails.stages.length === 0) && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg">لا توجد تفاصيل إضافية لهذه الصيانة</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 px-4 pb-32 bg-gradient-to-br from-green-50 via-white to-emerald-50"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto">
        {generalStatus && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl shadow-lg p-8 mb-8 border-2 border-green-200">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-green-900">{generalStatus.overall}</h2>
            </div>
            <p className="text-xl text-center text-green-800 font-semibold mb-3">
              {generalStatus.message}
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-green-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>الصحة: {generalStatus.healthLevel}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span>{generalStatus.careStage}</span>
              </div>
            </div>
          </div>
        )}

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
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTypeBadge(record.maintenance_type)}`}>
                        {identity === 'agricultural'
                          ? getMaintenanceTypeLabel(record.maintenance_type)
                          : clientMaintenanceService.getMaintenanceTypeLabel(record.maintenance_type)
                        }
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
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold"
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

      {showDemoActionModal && (
        <DemoActionModal
          onClose={() => setShowDemoActionModal(false)}
          onLogin={() => {
            setShowDemoActionModal(false);
            if (onShowAuth) {
              onShowAuth('login');
            }
          }}
          onRegister={() => {
            setShowDemoActionModal(false);
            if (onShowAuth) {
              onShowAuth('register');
            }
          }}
        />
      )}
    </div>
  );
}
