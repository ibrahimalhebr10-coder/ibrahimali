import React, { useState, useEffect } from 'react';
import { Plus, Calendar, FileText, Image, Video, DollarSign, Edit, Trash2, Eye, Save, X, Link, Unlink, Package } from 'lucide-react';
import { operationsService, MaintenanceFullDetails, MaintenanceStage, MaintenanceMedia, GroupedFeeWithRecords } from '../../services/operationsService';
import MaintenanceRecordWizard from './MaintenanceRecordWizard';

export default function GreenTreesTab() {
  const [records, setRecords] = useState<MaintenanceFullDetails[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'stages' | 'media' | 'fees' | 'grouped-fees'>('list');

  const [stages, setStages] = useState<MaintenanceStage[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MaintenanceMedia[]>([]);
  const [fee, setFee] = useState<any>(null);

  const [groupedFees, setGroupedFees] = useState<GroupedFeeWithRecords[]>([]);
  const [linkedFees, setLinkedFees] = useState<GroupedFeeWithRecords[]>([]);
  const [showCreateGroupedFee, setShowCreateGroupedFee] = useState(false);

  const [formData, setFormData] = useState({
    farm_id: '',
    maintenance_type: 'periodic' as 'periodic' | 'seasonal' | 'emergency',
    maintenance_date: new Date().toISOString().split('T')[0],
    status: 'draft' as 'draft' | 'published' | 'completed'
  });

  const [stageForm, setStageForm] = useState({
    stage_title: '',
    stage_note: '',
    stage_date: new Date().toISOString().split('T')[0]
  });

  const [feeForm, setFeeForm] = useState({
    total_amount: ''
  });

  const [groupedFeeForm, setGroupedFeeForm] = useState({
    fee_title: '',
    fee_period: '',
    total_amount: '',
    status: 'draft' as 'draft' | 'published' | 'paid'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsData, farmsData] = await Promise.all([
        operationsService.getMaintenanceRecords(),
        operationsService.getFarms()
      ]);
      setRecords(recordsData);
      setFarms(farmsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadRecordDetails = async (recordId: string) => {
    try {
      const [stagesData, mediaData, feeData, linkedFeesData, groupedFeesData] = await Promise.all([
        operationsService.getMaintenanceStages(recordId),
        operationsService.getMaintenanceMedia(recordId),
        operationsService.getMaintenanceFee(recordId),
        operationsService.getMaintenanceLinkedFees(recordId),
        operationsService.getGroupedFees()
      ]);
      setStages(stagesData);
      setMediaFiles(mediaData);
      setFee(feeData);
      setLinkedFees(linkedFeesData);
      setGroupedFees(groupedFeesData);
    } catch (error) {
      console.error('Error loading record details:', error);
    }
  };

  const handleCreateRecord = async (data: any) => {
    try {
      await operationsService.createFullMaintenanceRecord(data);
      alert('تم إنشاء سجل الصيانة بنجاح مع جميع التفاصيل');
      setShowAddForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating record:', error);
      alert('خطأ في إنشاء السجل');
      throw error;
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await operationsService.updateMaintenanceRecord(id, { status } as any);
      alert('تم تحديث الحالة');
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('خطأ في تحديث الحالة');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;

    try {
      await operationsService.deleteMaintenanceRecord(id);
      alert('تم حذف السجل');
      loadData();
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('خطأ في حذف السجل');
    }
  };

  const handleAddStage = async () => {
    if (!selectedRecord || !stageForm.stage_title) return;

    try {
      await operationsService.createMaintenanceStage({
        maintenance_id: selectedRecord,
        ...stageForm
      });
      alert('تم إضافة المرحلة');
      setStageForm({
        stage_title: '',
        stage_note: '',
        stage_date: new Date().toISOString().split('T')[0]
      });
      loadRecordDetails(selectedRecord);
    } catch (error) {
      console.error('Error adding stage:', error);
      alert('خطأ في إضافة المرحلة');
    }
  };

  const handleDeleteStage = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المرحلة؟')) return;

    try {
      await operationsService.deleteMaintenanceStage(id);
      alert('تم حذف المرحلة');
      if (selectedRecord) loadRecordDetails(selectedRecord);
    } catch (error) {
      console.error('Error deleting stage:', error);
      alert('خطأ في حذف المرحلة');
    }
  };

  const handleUploadMedia = async (file: File, type: 'image' | 'video') => {
    if (!selectedRecord) return;

    try {
      await operationsService.uploadMaintenanceMedia(file, selectedRecord, type);
      alert('تم رفع الملف');
      loadRecordDetails(selectedRecord);
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('خطأ في رفع الملف');
    }
  };

  const handleDeleteMedia = async (id: string, filePath: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;

    try {
      await operationsService.deleteMaintenanceMedia(id, filePath);
      alert('تم حذف الملف');
      if (selectedRecord) loadRecordDetails(selectedRecord);
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('خطأ في حذف الملف');
    }
  };

  const handleSaveFee = async () => {
    if (!selectedRecord || !feeForm.total_amount) return;

    const record = records.find(r => r.id === selectedRecord);
    if (!record) return;

    try {
      if (fee) {
        await operationsService.updateMaintenanceFee(fee.id, parseFloat(feeForm.total_amount));
      } else {
        await operationsService.createMaintenanceFee({
          maintenance_id: selectedRecord,
          farm_id: record.farm_id,
          total_amount: parseFloat(feeForm.total_amount)
        });
      }
      alert('تم حفظ رسوم الصيانة');
      loadRecordDetails(selectedRecord);
      loadData();
    } catch (error) {
      console.error('Error saving fee:', error);
      alert('خطأ في حفظ الرسوم');
    }
  };

  const handleViewRecord = (recordId: string) => {
    setSelectedRecord(recordId);
    setActiveTab('stages');
    loadRecordDetails(recordId);
  };

  const handleCreateGroupedFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const record = records.find(r => r.id === selectedRecord);
    if (!record) return;

    try {
      const newFee = await operationsService.createGroupedFee({
        fee_title: groupedFeeForm.fee_title,
        fee_period: groupedFeeForm.fee_period || null,
        total_amount: parseFloat(groupedFeeForm.total_amount),
        status: groupedFeeForm.status
      }, record.farm_id);

      await operationsService.linkMaintenanceToFee(newFee.id, selectedRecord);

      alert('تم إنشاء التجميع المالي وربط السجل به');
      setShowCreateGroupedFee(false);
      setGroupedFeeForm({
        fee_title: '',
        fee_period: '',
        total_amount: '',
        status: 'draft'
      });
      loadRecordDetails(selectedRecord);
    } catch (error) {
      console.error('Error creating grouped fee:', error);
      alert('خطأ في إنشاء التجميع المالي');
    }
  };

  const handleLinkToExistingFee = async (feeId: string) => {
    if (!selectedRecord) return;

    try {
      await operationsService.linkMaintenanceToFee(feeId, selectedRecord);
      alert('تم ربط السجل بالتجميع المالي');
      loadRecordDetails(selectedRecord);
    } catch (error) {
      console.error('Error linking to fee:', error);
      alert('خطأ في الربط');
    }
  };

  const handleUnlinkFromFee = async (feeId: string) => {
    if (!selectedRecord) return;
    if (!confirm('هل تريد فك الارتباط من هذا التجميع المالي؟')) return;

    try {
      await operationsService.unlinkMaintenanceFromFee(feeId, selectedRecord);
      alert('تم فك الارتباط');
      loadRecordDetails(selectedRecord);
    } catch (error) {
      console.error('Error unlinking:', error);
      alert('خطأ في فك الارتباط');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };
    const labels = {
      draft: 'مسودة',
      published: 'منشور',
      completed: 'مكتمل'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
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
      <span className={`px-3 py-1 rounded-full text-sm ${colors[type as keyof typeof colors]}`}>
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">أشجاري الخضراء</h3>
          <p className="text-gray-600 mt-1">إدارة الصيانة الزراعية ورسوم الصيانة للمزارع</p>
        </div>
        {!selectedRecord && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            سجل صيانة جديد
          </button>
        )}
        {selectedRecord && (
          <button
            onClick={() => {
              setSelectedRecord(null);
              setActiveTab('list');
            }}
            className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
            رجوع للقائمة
          </button>
        )}
      </div>

      {showAddForm && !selectedRecord && (
        <MaintenanceRecordWizard
          farms={farms}
          onSubmit={handleCreateRecord}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {!selectedRecord ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">المزرعة</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">النوع</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">التاريخ</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">الرسوم</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">المراحل</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">الملفات</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{record.farm_name}</td>
                    <td className="px-6 py-4">{getTypeBadge(record.maintenance_type)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.maintenance_date}</td>
                    <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                    <td className="px-6 py-4 text-sm">
                      {record.total_amount ? (
                        <div>
                          <div className="font-semibold text-green-600">{record.total_amount} ر.س</div>
                          <div className="text-xs text-gray-500">{record.cost_per_tree} ر.س/شجرة</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">لم يتم تحديد</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.stages_count}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.media_count}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewRecord(record.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-gray-900">
                {records.find(r => r.id === selectedRecord)?.farm_name}
              </h4>
              <div className="flex items-center gap-3">
                {getTypeBadge(records.find(r => r.id === selectedRecord)?.maintenance_type || '')}
                {getStatusBadge(records.find(r => r.id === selectedRecord)?.status || '')}
              </div>
            </div>

            <div className="flex gap-2 border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('stages')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'stages'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4 inline ml-2" />
                المراحل
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'media'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Image className="w-4 h-4 inline ml-2" />
                الملفات ({mediaFiles.length})
              </button>
              <button
                onClick={() => setActiveTab('fees')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'fees'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <DollarSign className="w-4 h-4 inline ml-2" />
                رسوم الصيانة
              </button>
              <button
                onClick={() => setActiveTab('grouped-fees')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'grouped-fees'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="w-4 h-4 inline ml-2" />
                التجميع المالي ({linkedFees.length})
              </button>
            </div>

            {activeTab === 'stages' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-4">إضافة مرحلة جديدة</h5>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="عنوان المرحلة"
                      value={stageForm.stage_title}
                      onChange={(e) => setStageForm({ ...stageForm, stage_title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <textarea
                      placeholder="ملاحظات"
                      value={stageForm.stage_note}
                      onChange={(e) => setStageForm({ ...stageForm, stage_note: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={2}
                    />
                    <div className="flex gap-3">
                      <input
                        type="date"
                        value={stageForm.stage_date}
                        onChange={(e) => setStageForm({ ...stageForm, stage_date: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddStage}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4 inline ml-2" />
                        إضافة
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {stages.map((stage) => (
                    <div key={stage.id} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h6 className="font-semibold text-gray-900">{stage.stage_title}</h6>
                          {stage.stage_note && (
                            <p className="text-sm text-gray-600 mt-1">{stage.stage_note}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            <Calendar className="w-3 h-3 inline ml-1" />
                            {stage.stage_date}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteStage(stage.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {stages.length === 0 && (
                    <p className="text-center text-gray-500 py-8">لا توجد مراحل</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-4">رفع ملفات جديدة</h5>
                  <div className="flex gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadMedia(file, 'image');
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <Image className="w-5 h-5" />
                      رفع صورة
                    </label>

                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadMedia(file, 'video');
                      }}
                      className="hidden"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors cursor-pointer"
                    >
                      <Video className="w-5 h-5" />
                      رفع فيديو
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mediaFiles.map((media) => (
                    <div key={media.id} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          media.media_type === 'image'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {media.media_type === 'image' ? 'صورة' : 'فيديو'}
                        </span>
                        <button
                          onClick={() => handleDeleteMedia(media.id, media.file_path)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{media.file_path}</p>
                    </div>
                  ))}
                  {mediaFiles.length === 0 && (
                    <p className="col-span-full text-center text-gray-500 py-8">لا توجد ملفات</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'fees' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h5 className="font-semibold text-gray-900 mb-4">رسوم الصيانة</h5>

                  {fee && (
                    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">إجمالي الرسوم</p>
                          <p className="text-2xl font-bold text-green-600">{fee.total_amount} ر.س</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">تكلفة الشجرة</p>
                          <p className="text-2xl font-bold text-blue-600">{fee.cost_per_tree} ر.س</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      إجمالي رسوم الصيانة (ريال سعودي)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="أدخل المبلغ الإجمالي"
                      value={feeForm.total_amount}
                      onChange={(e) => setFeeForm({ total_amount: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-600">
                      سيتم حساب تكلفة الشجرة تلقائياً: {feeForm.total_amount && records.find(r => r.id === selectedRecord)?.total_trees
                        ? `${(parseFloat(feeForm.total_amount) / records.find(r => r.id === selectedRecord)!.total_trees).toFixed(2)} ر.س/شجرة`
                        : '---'}
                    </p>
                    <button
                      onClick={handleSaveFee}
                      disabled={!feeForm.total_amount}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4 inline ml-2" />
                      حفظ الرسوم
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'grouped-fees' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <h5 className="font-semibold text-blue-900 mb-2">التجميع المالي</h5>
                  <p className="text-sm text-blue-700">
                    يمكنك ربط هذا السجل مع سجلات صيانة أخرى تحت رسوم واحدة. مثال: رسوم شهر يناير تشمل (ري + تسميد + تقليم)
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-gray-900">الرسوم المرتبطة</h5>
                    <button
                      onClick={() => setShowCreateGroupedFee(!showCreateGroupedFee)}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      {showCreateGroupedFee ? 'إلغاء' : 'إنشاء تجميع جديد'}
                    </button>
                  </div>

                  {showCreateGroupedFee && (
                    <form onSubmit={handleCreateGroupedFee} className="bg-white rounded-lg p-4 mb-4 border border-gray-200 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">عنوان التجميع *</label>
                        <input
                          type="text"
                          placeholder="مثال: رسوم صيانة يناير 2024"
                          value={groupedFeeForm.fee_title}
                          onChange={(e) => setGroupedFeeForm({ ...groupedFeeForm, fee_title: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الفترة</label>
                        <input
                          type="text"
                          placeholder="مثال: يناير 2024"
                          value={groupedFeeForm.fee_period}
                          onChange={(e) => setGroupedFeeForm({ ...groupedFeeForm, fee_period: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">إجمالي المبلغ (ريال) *</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={groupedFeeForm.total_amount}
                          onChange={(e) => setGroupedFeeForm({ ...groupedFeeForm, total_amount: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          تكلفة الشجرة: {groupedFeeForm.total_amount && records.find(r => r.id === selectedRecord)?.total_trees
                            ? `${(parseFloat(groupedFeeForm.total_amount) / records.find(r => r.id === selectedRecord)!.total_trees).toFixed(2)} ر.س`
                            : '---'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                        <select
                          value={groupedFeeForm.status}
                          onChange={(e) => setGroupedFeeForm({ ...groupedFeeForm, status: e.target.value as any })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="draft">مسودة</option>
                          <option value="published">منشور</option>
                          <option value="paid">مدفوع</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        إنشاء وربط
                      </button>
                    </form>
                  )}

                  {linkedFees.length > 0 ? (
                    <div className="space-y-3">
                      {linkedFees.map((linkedFee) => (
                        <div key={linkedFee.fee_id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h6 className="font-semibold text-gray-900">{linkedFee.fee_title}</h6>
                              {linkedFee.fee_period && (
                                <p className="text-sm text-gray-600 mt-1">{linkedFee.fee_period}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm">
                                  <span className="font-semibold text-green-600">{linkedFee.total_amount}</span> ر.س
                                </span>
                                <span className="text-sm text-gray-600">
                                  {linkedFee.cost_per_tree} ر.س/شجرة
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {linkedFee.records_count} سجل
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnlinkFromFee(linkedFee.fee_id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="فك الارتباط"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">لا توجد رسوم مرتبطة</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h5 className="font-semibold text-gray-900 mb-4">ربط بتجميع موجود</h5>
                  <div className="space-y-3">
                    {groupedFees
                      .filter(gf => !linkedFees.some(lf => lf.fee_id === gf.id))
                      .filter(gf => gf.farm_id === records.find(r => r.id === selectedRecord)?.farm_id)
                      .map((gf) => (
                        <div key={gf.id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h6 className="font-semibold text-gray-900">{gf.fee_title}</h6>
                              {gf.fee_period && (
                                <p className="text-xs text-gray-600">{gf.fee_period}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-green-600 font-semibold">{gf.total_amount} ر.س</span>
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {gf.records_count} سجل
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleLinkToExistingFee(gf.id)}
                              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              <Link className="w-4 h-4" />
                              ربط
                            </button>
                          </div>
                        </div>
                      ))}
                    {groupedFees.filter(gf =>
                      !linkedFees.some(lf => lf.fee_id === gf.id) &&
                      gf.farm_id === records.find(r => r.id === selectedRecord)?.farm_id
                    ).length === 0 && (
                      <p className="text-center text-gray-500 py-4">لا توجد تجميعات متاحة للربط</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
