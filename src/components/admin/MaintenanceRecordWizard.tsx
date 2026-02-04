import React, { useState } from 'react';
import { Plus, ArrowRight, ArrowLeft, Calendar, FileText, Image, Video, DollarSign, Check, X, Trash2 } from 'lucide-react';

interface Farm {
  id: string;
  name_ar: string;
  total_trees: number;
}

interface MaintenanceStageInput {
  id: string;
  stage_title: string;
  stage_note: string;
  stage_date: string;
}

interface MediaFileInput {
  id: string;
  file: File;
  type: 'image' | 'video';
  preview?: string;
}

interface MaintenanceRecordData {
  farm_id: string;
  maintenance_type: 'periodic' | 'seasonal' | 'emergency';
  maintenance_date: string;
  status: 'draft' | 'published' | 'completed';
  stages: MaintenanceStageInput[];
  mediaFiles: MediaFileInput[];
  total_amount: string;
}

interface Props {
  farms: Farm[];
  onSubmit: (data: MaintenanceRecordData) => Promise<void>;
  onCancel: () => void;
}

export default function MaintenanceRecordWizard({ farms, onSubmit, onCancel }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<MaintenanceRecordData>({
    farm_id: '',
    maintenance_type: 'periodic',
    maintenance_date: new Date().toISOString().split('T')[0],
    status: 'published',
    stages: [],
    mediaFiles: [],
    total_amount: ''
  });

  const [tempStage, setTempStage] = useState({
    stage_title: '',
    stage_note: '',
    stage_date: new Date().toISOString().split('T')[0]
  });

  const selectedFarm = farms.find(f => f.id === formData.farm_id);
  const costPerTree = formData.total_amount && selectedFarm
    ? (parseFloat(formData.total_amount) / selectedFarm.total_trees).toFixed(2)
    : '0.00';

  const handleAddStage = () => {
    if (!tempStage.stage_title) return;

    const newStage: MaintenanceStageInput = {
      id: Math.random().toString(36).substr(2, 9),
      ...tempStage
    };

    setFormData({
      ...formData,
      stages: [...formData.stages, newStage]
    });

    setTempStage({
      stage_title: '',
      stage_note: '',
      stage_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleRemoveStage = (id: string) => {
    setFormData({
      ...formData,
      stages: formData.stages.filter(s => s.id !== id)
    });
  };

  const handleAddMedia = (file: File, type: 'image' | 'video') => {
    const newMedia: MediaFileInput = {
      id: Math.random().toString(36).substr(2, 9),
      file,
      type,
      preview: type === 'image' ? URL.createObjectURL(file) : undefined
    };

    setFormData({
      ...formData,
      mediaFiles: [...formData.mediaFiles, newMedia]
    });
  };

  const handleRemoveMedia = (id: string) => {
    const media = formData.mediaFiles.find(m => m.id === id);
    if (media?.preview) {
      URL.revokeObjectURL(media.preview);
    }

    setFormData({
      ...formData,
      mediaFiles: formData.mediaFiles.filter(m => m.id !== id)
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.farm_id && formData.maintenance_type && formData.maintenance_date;
    }
    return true;
  };

  const steps = [
    { number: 1, title: 'المعلومات الأساسية', icon: FileText },
    { number: 2, title: 'المراحل', icon: Calendar },
    { number: 3, title: 'التوثيق البصري', icon: Image },
    { number: 4, title: 'الرسوم', icon: DollarSign },
    { number: 5, title: 'المراجعة', icon: Check }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">إنشاء سجل صيانة جديد</h3>
            <p className="text-green-100 mt-1">املأ جميع البيانات المطلوبة لإنشاء سجل صيانة شامل</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  currentStep === step.number
                    ? 'bg-green-600 text-white shadow-lg scale-110'
                    : currentStep > step.number
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <p className={`text-xs mt-2 font-medium ${
                  currentStep === step.number
                    ? 'text-green-600'
                    : currentStep > step.number
                    ? 'text-green-500'
                    : 'text-gray-400'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${
                  currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">المزرعة *</label>
                <select
                  value={formData.farm_id}
                  onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                  required
                >
                  <option value="">اختر المزرعة</option>
                  {farms.map(farm => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name_ar} ({farm.total_trees} شجرة)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">نوع الصيانة *</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'periodic', label: 'دورية', color: 'orange' },
                    { value: 'seasonal', label: 'موسمية', color: 'yellow' },
                    { value: 'emergency', label: 'طارئة', color: 'red' }
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, maintenance_type: type.value as any })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.maintenance_type === type.value
                          ? `border-${type.color}-600 bg-${type.color}-50 shadow-md scale-105`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <p className={`font-semibold ${
                        formData.maintenance_type === type.value
                          ? `text-${type.color}-600`
                          : 'text-gray-700'
                      }`}>
                        {type.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">تاريخ الصيانة *</label>
                <input
                  type="date"
                  value={formData.maintenance_date}
                  onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">حالة السجل *</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'draft', label: 'مسودة', icon: FileText },
                    { value: 'published', label: 'منشور', icon: Check },
                    { value: 'completed', label: 'مكتمل', icon: Check }
                  ].map(status => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: status.value as any })}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                        formData.status === status.value
                          ? 'border-green-600 bg-green-50 shadow-md scale-105'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <status.icon className="w-5 h-5" />
                      <p className="font-semibold">{status.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">مراحل الصيانة المتعددة</h4>
                <p className="text-sm text-blue-700">
                  أضف مراحل متعددة لتوثيق خطوات العمل (مثال: تحضير، تنفيذ، مراجعة)
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h5 className="font-semibold text-gray-900">إضافة مرحلة جديدة</h5>
                <input
                  type="text"
                  placeholder="عنوان المرحلة (مثال: تسميد الأشجار)"
                  value={tempStage.stage_title}
                  onChange={(e) => setTempStage({ ...tempStage, stage_title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStage()}
                />
                <textarea
                  placeholder="ملاحظات (اختياري)"
                  value={tempStage.stage_note}
                  onChange={(e) => setTempStage({ ...tempStage, stage_note: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
                <div className="flex gap-3">
                  <input
                    type="date"
                    value={tempStage.stage_date}
                    onChange={(e) => setTempStage({ ...tempStage, stage_date: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddStage}
                    disabled={!tempStage.stage_title}
                    className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    إضافة
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-semibold text-gray-900">المراحل المضافة ({formData.stages.length})</h5>
                {formData.stages.map((stage) => (
                  <div key={stage.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h6 className="font-semibold text-gray-900 text-lg">{stage.stage_title}</h6>
                        {stage.stage_note && (
                          <p className="text-sm text-gray-600 mt-2">{stage.stage_note}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {stage.stage_date}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStage(stage.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {formData.stages.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">لم تتم إضافة أي مراحل بعد</p>
                    <p className="text-sm text-gray-400 mt-1">يمكنك المتابعة بدون مراحل</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">التوثيق البصري</h4>
                <p className="text-sm text-blue-700">
                  أضف صور وفيديوهات لتوثيق عملية الصيانة
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleAddMedia(file, 'image');
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                  id="image-upload-wizard"
                  multiple
                />
                <label
                  htmlFor="image-upload-wizard"
                  className="flex flex-col items-center justify-center gap-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-8 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <Image className="w-12 h-12 text-blue-600" />
                  <div className="text-center">
                    <p className="font-semibold text-blue-900">رفع صور</p>
                    <p className="text-xs text-blue-600 mt-1">JPG, PNG, GIF</p>
                  </div>
                </label>

                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleAddMedia(file, 'video');
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                  id="video-upload-wizard"
                />
                <label
                  htmlFor="video-upload-wizard"
                  className="flex flex-col items-center justify-center gap-3 bg-orange-50 border-2 border-dashed border-orange-300 rounded-xl p-8 hover:bg-orange-100 transition-colors cursor-pointer"
                >
                  <Video className="w-12 h-12 text-orange-600" />
                  <div className="text-center">
                    <p className="font-semibold text-orange-900">رفع فيديو</p>
                    <p className="text-xs text-orange-600 mt-1">MP4, MOV, AVI</p>
                  </div>
                </label>
              </div>

              <div className="space-y-3">
                <h5 className="font-semibold text-gray-900">الملفات المرفوعة ({formData.mediaFiles.length})</h5>
                <div className="grid grid-cols-2 gap-4">
                  {formData.mediaFiles.map((media) => (
                    <div key={media.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(media.id)}
                        className="absolute top-2 left-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {media.type === 'image' && media.preview && (
                        <img src={media.preview} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                      )}
                      {media.type === 'video' && (
                        <div className="w-full h-32 bg-orange-50 rounded-lg flex items-center justify-center mb-2">
                          <Video className="w-12 h-12 text-orange-600" />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          media.type === 'image'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {media.type === 'image' ? 'صورة' : 'فيديو'}
                        </span>
                        <p className="text-xs text-gray-600 truncate flex-1">{media.file.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {formData.mediaFiles.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">لم يتم رفع أي ملفات بعد</p>
                    <p className="text-sm text-gray-400 mt-1">يمكنك المتابعة بدون ملفات</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">رسوم الصيانة</h4>
                <p className="text-sm text-blue-700">
                  أدخل إجمالي رسوم الصيانة، سيتم حساب تكلفة الشجرة تلقائياً
                </p>
              </div>

              {selectedFarm && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900 text-lg">{selectedFarm.name_ar}</h5>
                      <p className="text-green-700">إجمالي الأشجار: {selectedFarm.total_trees} شجرة</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    إجمالي رسوم الصيانة (ريال سعودي)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-2xl font-bold text-center"
                  />
                </div>

                {formData.total_amount && parseFloat(formData.total_amount) > 0 && selectedFarm && (
                  <div className="bg-white border-2 border-green-300 rounded-xl p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">إجمالي الرسوم</p>
                        <p className="text-3xl font-bold text-green-600">{formData.total_amount} ر.س</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">تكلفة الشجرة الواحدة</p>
                        <p className="text-3xl font-bold text-blue-600">{costPerTree} ر.س</p>
                      </div>
                    </div>
                  </div>
                )}

                {(!formData.total_amount || parseFloat(formData.total_amount) === 0) && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">لم يتم تحديد رسوم بعد</p>
                    <p className="text-sm text-gray-400 mt-1">يمكنك المتابعة بدون رسوم</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-semibold text-green-900 mb-2">مراجعة البيانات</h4>
                <p className="text-sm text-green-700">
                  راجع جميع البيانات قبل الحفظ النهائي
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h5 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    المعلومات الأساسية
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">المزرعة:</p>
                      <p className="font-semibold text-gray-900">{selectedFarm?.name_ar}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">نوع الصيانة:</p>
                      <p className="font-semibold text-gray-900">
                        {formData.maintenance_type === 'periodic' && 'دورية'}
                        {formData.maintenance_type === 'seasonal' && 'موسمية'}
                        {formData.maintenance_type === 'emergency' && 'طارئة'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">التاريخ:</p>
                      <p className="font-semibold text-gray-900">{formData.maintenance_date}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">الحالة:</p>
                      <p className="font-semibold text-gray-900">
                        {formData.status === 'draft' && 'مسودة'}
                        {formData.status === 'published' && 'منشور'}
                        {formData.status === 'completed' && 'مكتمل'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h5 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    المراحل ({formData.stages.length})
                  </h5>
                  {formData.stages.length > 0 ? (
                    <div className="space-y-2">
                      {formData.stages.map((stage, index) => (
                        <div key={stage.id} className="flex items-start gap-3 text-sm">
                          <span className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center font-semibold flex-shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">{stage.stage_title}</p>
                            {stage.stage_note && (
                              <p className="text-gray-600 text-xs mt-1">{stage.stage_note}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">{stage.stage_date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">لا توجد مراحل</p>
                  )}
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h5 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    الملفات ({formData.mediaFiles.length})
                  </h5>
                  {formData.mediaFiles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.mediaFiles.map((media) => (
                        <span key={media.id} className={`px-3 py-1 rounded-full text-xs font-medium ${
                          media.type === 'image'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {media.type === 'image' ? 'صورة' : 'فيديو'}: {media.file.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">لا توجد ملفات</p>
                  )}
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h5 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    الرسوم
                  </h5>
                  {formData.total_amount && parseFloat(formData.total_amount) > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">إجمالي الرسوم:</p>
                        <p className="text-2xl font-bold text-green-600">{formData.total_amount} ر.س</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">تكلفة الشجرة:</p>
                        <p className="text-2xl font-bold text-blue-600">{costPerTree} ر.س</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">لم يتم تحديد رسوم</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
          <button
            type="button"
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
              } else {
                onCancel();
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            {currentStep === 1 ? 'إلغاء' : 'السابق'}
          </button>

          <div className="text-sm text-gray-600">
            خطوة {currentStep} من {steps.length}
          </div>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              التالي
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  حفظ السجل
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
