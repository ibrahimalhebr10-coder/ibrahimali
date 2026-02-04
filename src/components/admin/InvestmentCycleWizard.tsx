import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, AlertCircle, TrendingUp, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { investmentCyclesService, InvestmentCycle, InvestmentCycleReadiness } from '../../services/investmentCyclesService';
import { farmService } from '../../services/farmService';

interface InvestmentCycleWizardProps {
  cycleId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InvestmentCycleWizard({ cycleId, onClose, onSuccess }: InvestmentCycleWizardProps) {
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [readiness, setReadiness] = useState<InvestmentCycleReadiness | null>(null);

  const [formData, setFormData] = useState({
    farm_id: '',
    cycle_types: [] as string[],
    cycle_date: new Date().toISOString().split('T')[0],
    description: '',
    total_amount: 0,
    images: [] as string[],
    videos: [] as string[],
    status: 'draft' as 'draft' | 'published',
    visible_to_client: true
  });

  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);

  useEffect(() => {
    loadFarms();
    if (cycleId) {
      loadCycle();
    }
  }, [cycleId]);

  useEffect(() => {
    if (cycleId) {
      checkReadiness();
    }
  }, [formData, cycleId]);

  const loadFarms = async () => {
    try {
      const data = await farmService.getAllFarms();
      setFarms(data || []);
    } catch (error) {
      console.error('Error loading farms:', error);
    }
  };

  const loadCycle = async () => {
    if (!cycleId) return;
    try {
      const data = await investmentCyclesService.getCycleById(cycleId);
      if (data) {
        setFormData({
          farm_id: data.farm_id,
          cycle_types: data.cycle_types,
          cycle_date: data.cycle_date,
          description: data.description,
          total_amount: data.total_amount,
          images: data.images || [],
          videos: data.videos || [],
          status: data.status,
          visible_to_client: data.visible_to_client
        });
      }
    } catch (error) {
      console.error('Error loading cycle:', error);
    }
  };

  const checkReadiness = async () => {
    if (!cycleId) return;
    try {
      const data = await investmentCyclesService.checkReadiness(cycleId);
      setReadiness(data);
    } catch (error) {
      console.error('Error checking readiness:', error);
    }
  };

  const handleCycleTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      cycle_types: prev.cycle_types.includes(type)
        ? prev.cycle_types.filter(t => t !== type)
        : [...prev.cycle_types, type]
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(file =>
        investmentCyclesService.uploadImage(file, cycleId || 'temp')
      );

      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('فشل رفع الصور');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingVideos(true);
    try {
      const uploadPromises = Array.from(files).map(file =>
        investmentCyclesService.uploadVideo(file, cycleId || 'temp')
      );

      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, ...urls]
      }));
    } catch (error) {
      console.error('Error uploading videos:', error);
      alert('فشل رفع الفيديو');
    } finally {
      setUploadingVideos(false);
    }
  };

  const handleSave = async () => {
    if (!formData.farm_id) {
      alert('يرجى اختيار المزرعة');
      return;
    }

    if (formData.cycle_types.length === 0) {
      alert('يرجى اختيار نوع الدورة');
      return;
    }

    if (!formData.description.trim()) {
      alert('يرجى كتابة وصف');
      return;
    }

    setLoading(true);
    try {
      if (cycleId) {
        await investmentCyclesService.updateCycle(cycleId, formData);
      } else {
        await investmentCyclesService.createCycle(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving cycle:', error);
      alert('فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!cycleId) {
      alert('يرجى حفظ السجل أولاً');
      return;
    }

    if (!readiness?.ready) {
      alert('يرجى استكمال جميع العناصر الأساسية قبل النشر');
      return;
    }

    setLoading(true);
    try {
      await investmentCyclesService.publishCycle(cycleId);
      onSuccess();
    } catch (error) {
      console.error('Error publishing cycle:', error);
      alert('فشل النشر');
    } finally {
      setLoading(false);
    }
  };

  const selectedFarm = farms.find(f => f.id === formData.farm_id);
  const costPerTree = selectedFarm && selectedFarm.total_trees > 0
    ? (formData.total_amount / selectedFarm.total_trees).toFixed(2)
    : '0.00';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {cycleId ? 'تعديل' : 'إضافة'} دورة استثمار
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {readiness && (
            <div className={`p-4 rounded-xl border-2 ${readiness.ready ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'}`}>
              <div className="flex items-center gap-3 mb-3">
                {readiness.ready ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
                <span className="font-bold text-lg">
                  {readiness.ready ? 'جاهز للنشر' : 'يحتاج استكمال'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className={`flex items-center gap-2 ${readiness.has_farm ? 'text-green-700' : 'text-gray-500'}`}>
                  {readiness.has_farm ? '✓' : '○'} المزرعة
                </div>
                <div className={`flex items-center gap-2 ${readiness.has_description ? 'text-green-700' : 'text-gray-500'}`}>
                  {readiness.has_description ? '✓' : '○'} الوصف
                </div>
                <div className={`flex items-center gap-2 ${readiness.has_cycle_types ? 'text-green-700' : 'text-gray-500'}`}>
                  {readiness.has_cycle_types ? '✓' : '○'} نوع الدورة
                </div>
                <div className={`flex items-center gap-2 ${readiness.has_documentation ? 'text-green-700' : 'text-gray-500'}`}>
                  {readiness.has_documentation ? '✓' : '○'} التوثيق
                </div>
                <div className={`flex items-center gap-2 ${readiness.has_cost ? 'text-green-700' : 'text-gray-500'}`}>
                  {readiness.has_cost ? '✓' : '○'} الرسوم
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختيار المزرعة <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.farm_id}
              onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع الدورة <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['maintenance', 'waste', 'factory'].map(type => (
                <button
                  key={type}
                  onClick={() => handleCycleTypeToggle(type)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.cycle_types.includes(type)
                      ? 'bg-amber-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'maintenance' && 'صيانة أشجار'}
                  {type === 'waste' && 'مخلفات مزرعة'}
                  {type === 'factory' && 'مصنع (تمر/زيت)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ الدورة
            </label>
            <input
              type="date"
              value={formData.cycle_date}
              onChange={(e) => setFormData({ ...formData, cycle_date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وصف مختصر <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="اكتب وصف واضح ومختصر (جملة أو جملتين)"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المبلغ الإجمالي (ريال) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              required
            />
            {selectedFarm && (
              <div className="mt-2 p-3 bg-amber-50 rounded-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-amber-900">
                  <strong>تكلفة الشجرة:</strong> {costPerTree} ريال
                  (المبلغ ÷ {selectedFarm.total_trees} شجرة)
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رفع صور
            </label>
            <label className="flex items-center justify-center gap-3 w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-amber-500 transition-colors cursor-pointer bg-gray-50 hover:bg-amber-50">
              <ImageIcon className="w-6 h-6 text-gray-500" />
              <span className="text-gray-700">
                {uploadingImages ? 'جاري الرفع...' : 'اضغط لرفع الصور'}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImages}
                className="hidden"
              />
            </label>
            {formData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`صورة ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        images: prev.images.filter((_, i) => i !== index)
                      }))}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رفع فيديو (اختياري)
            </label>
            <label className="flex items-center justify-center gap-3 w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-amber-500 transition-colors cursor-pointer bg-gray-50 hover:bg-amber-50">
              <VideoIcon className="w-6 h-6 text-gray-500" />
              <span className="text-gray-700">
                {uploadingVideos ? 'جاري الرفع...' : 'اضغط لرفع فيديو'}
              </span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                disabled={uploadingVideos}
                className="hidden"
              />
            </label>
            {formData.videos.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.videos.map((url, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                    <VideoIcon className="w-5 h-5 text-gray-600" />
                    <span className="flex-1 text-sm text-gray-700">فيديو {index + 1}</span>
                    <button
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        videos: prev.videos.filter((_, i) => i !== index)
                      }))}
                      className="p-1 bg-red-500 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            إلغاء
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            {cycleId && readiness?.ready && (
              <button
                onClick={handlePublish}
                disabled={loading}
                className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>جاهز للنشر</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
