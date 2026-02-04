import React, { useState, useEffect } from 'react';
import { Upload, Image, Video, Trash2, Search, FileVideo, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Documentation {
  id: string;
  farm_id: string;
  media_type: 'صورة' | 'فيديو';
  media_url: string;
  linked_to_type: 'operation' | 'growth_stage';
  linked_to_id: string;
  caption: string | null;
  upload_date: string;
}

interface Farm {
  id: string;
  name_ar: string;
}

interface Operation {
  id: string;
  operation_type: string;
  operation_date: string;
}

interface GrowthStage {
  id: string;
  tree_type: string;
  current_stage: string;
}

const AgriculturalDocumentationTab: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [documentation, setDocumentation] = useState<Documentation[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [growthStages, setGrowthStages] = useState<GrowthStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    media_type: 'صورة' as Documentation['media_type'],
    linked_to_type: 'operation' as Documentation['linked_to_type'],
    linked_to_id: '',
    caption: '',
  });

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadDocumentation();
      loadOperations();
      loadGrowthStages();
    }
  }, [selectedFarmId]);

  const loadFarms = async () => {
    const { data } = await supabase
      .from('farms')
      .select('id, name_ar')
      .order('name_ar');
    if (data) setFarms(data);
  };

  const loadDocumentation = async () => {
    if (!selectedFarmId) return;

    setLoading(true);
    const { data } = await supabase
      .from('agricultural_documentation')
      .select('*')
      .eq('farm_id', selectedFarmId)
      .order('upload_date', { ascending: false });

    if (data) setDocumentation(data);
    setLoading(false);
  };

  const loadOperations = async () => {
    if (!selectedFarmId) return;

    const { data } = await supabase
      .from('agricultural_operations')
      .select('id, operation_type, operation_date')
      .eq('farm_id', selectedFarmId)
      .order('operation_date', { ascending: false });

    if (data) setOperations(data);
  };

  const loadGrowthStages = async () => {
    if (!selectedFarmId) return;

    const { data } = await supabase
      .from('agricultural_growth_stages')
      .select('id, tree_type, current_stage')
      .eq('farm_id', selectedFarmId);

    if (data) setGrowthStages(data);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    if (formData.media_type === 'فيديو') {
      const videoFile = files[0];
      if (videoFile.size > 50 * 1024 * 1024) {
        alert('حجم الفيديو يجب أن يكون أقل من 50 ميجابايت');
        return;
      }
      setSelectedFiles([videoFile]);
      const previewUrl = URL.createObjectURL(videoFile);
      setPreviewUrls([previewUrl]);
    } else {
      const imageFiles = files.filter(f => f.type.startsWith('image/'));
      setSelectedFiles(imageFiles);
      const previews = imageFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(previews);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);

    URL.revokeObjectURL(previewUrls[index]);

    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId || !formData.linked_to_id || selectedFiles.length === 0) {
      alert('الرجاء اختيار ملف واحد على الأقل');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const { data: { user } } = await supabase.auth.getUser();

    try {
      const totalFiles = selectedFiles.length;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedFarmId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('agricultural-documentation')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('agricultural-documentation')
          .getPublicUrl(fileName);

        const payload = {
          media_type: formData.media_type,
          media_url: publicUrl,
          linked_to_type: formData.linked_to_type,
          linked_to_id: formData.linked_to_id,
          caption: formData.caption || null,
          farm_id: selectedFarmId,
          uploaded_by: user?.id,
        };

        await supabase
          .from('agricultural_documentation')
          .insert([payload]);

        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      resetForm();
      loadDocumentation();
      alert(`تم رفع ${totalFiles} ملف بنجاح!`);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('حدث خطأ أثناء رفع الملفات');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string, mediaUrl: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التوثيق؟')) {
      try {
        const filePath = mediaUrl.split('/agricultural-documentation/')[1];

        if (filePath) {
          await supabase.storage
            .from('agricultural-documentation')
            .remove([filePath]);
        }

        await supabase
          .from('agricultural_documentation')
          .delete()
          .eq('id', id);

        loadDocumentation();
      } catch (error) {
        console.error('Error deleting documentation:', error);
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      media_type: 'صورة',
      linked_to_type: 'operation',
      linked_to_id: '',
      caption: '',
    });

    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setUploadProgress(0);
    setShowAddForm(false);
  };

  const filteredDocumentation = documentation.filter(doc =>
    doc.caption?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-darkgreen">التوثيق الزراعي</h2>
          <p className="text-gray-600 text-sm mt-1">رفع صور وفيديوهات مرتبطة بالعمليات والمراحل</p>
        </div>
        {selectedFarmId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>رفع ملف</span>
          </button>
        )}
      </div>

      {/* Farm Selector */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">اختر المزرعة</label>
        <select
          value={selectedFarmId}
          onChange={(e) => setSelectedFarmId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          <option value="">-- اختر مزرعة --</option>
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>
              {farm.name_ar}
            </option>
          ))}
        </select>
      </div>

      {selectedFarmId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">إجمالي الملفات</p>
              <p className="text-2xl font-bold text-darkgreen">{documentation.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Image className="w-4 h-4 text-amber-600" />
                <p className="text-xs text-gray-600">صور</p>
              </div>
              <p className="text-2xl font-bold text-amber-700">{documentation.filter(d => d.media_type === 'صورة').length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Video className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-600">فيديوهات</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{documentation.filter(d => d.media_type === 'فيديو').length}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في التعليقات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Documentation List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : filteredDocumentation.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا يوجد توثيق مرفوع</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                رفع أول ملف
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocumentation.map((doc) => (
                <div key={doc.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative">
                    {doc.media_type === 'صورة' ? (
                      <img
                        src={doc.media_url}
                        alt={doc.caption || 'صورة زراعية'}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <video
                        src={doc.media_url}
                        controls
                        className="w-full h-48 bg-black"
                      />
                    )}
                    <button
                      onClick={() => handleDelete(doc.id, doc.media_url)}
                      className="absolute top-2 left-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded text-xs font-medium shadow-sm">
                        {doc.media_type}
                      </span>
                      <span className="px-2 py-1 bg-green-600/90 backdrop-blur-sm text-white rounded text-xs font-medium shadow-sm">
                        {doc.linked_to_type === 'operation' ? 'عملية' : 'مرحلة'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {doc.caption && (
                      <p className="text-sm text-gray-700 line-clamp-2">{doc.caption}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(doc.upload_date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-darkgreen">رفع توثيق زراعي</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>مهم:</strong> جميع الملفات يجب أن تكون مرتبطة بعملية زراعية أو مرحلة نمو محددة
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الملف *</label>
                <select
                  required
                  value={formData.media_type}
                  onChange={(e) => {
                    setFormData({ ...formData, media_type: e.target.value as Documentation['media_type'] });
                    setSelectedFiles([]);
                    previewUrls.forEach(url => URL.revokeObjectURL(url));
                    setPreviewUrls([]);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="صورة">صورة (يمكن اختيار عدة صور)</option>
                  <option value="فيديو">فيديو (ملف واحد فقط)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اختر الملف *</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept={formData.media_type === 'صورة' ? 'image/*' : 'video/*'}
                    multiple={formData.media_type === 'صورة'}
                    className="hidden"
                    id="file-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed ${
                      selectedFiles.length > 0 ? 'border-amber-500 bg-amber-50' : 'border-gray-300 bg-gray-50'
                    } rounded-lg cursor-pointer hover:bg-amber-50 hover:border-amber-500 transition-colors ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {formData.media_type === 'صورة' ? (
                      <Image className="w-8 h-8 text-amber-600" />
                    ) : (
                      <FileVideo className="w-8 h-8 text-blue-600" />
                    )}
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        {selectedFiles.length > 0
                          ? `تم اختيار ${selectedFiles.length} ملف`
                          : formData.media_type === 'صورة'
                          ? 'اضغط لاختيار صور'
                          : 'اضغط لاختيار فيديو'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.media_type === 'صورة'
                          ? 'JPG, PNG, WebP (عدة صور)'
                          : 'MP4, MOV (حد أقصى 50MB)'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {previewUrls.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">المعاينة:</label>
                  <div className={`grid ${formData.media_type === 'صورة' ? 'grid-cols-3' : 'grid-cols-1'} gap-3`}>
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200">
                        {formData.media_type === 'صورة' ? (
                          <img src={url} alt={`معاينة ${index + 1}`} className="w-full h-32 object-cover" />
                        ) : (
                          <video src={url} className="w-full h-48" controls />
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 left-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          disabled={uploading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">جاري الرفع...</span>
                    <span className="text-amber-600 font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ربط بـ *</label>
                <select
                  required
                  value={formData.linked_to_type}
                  onChange={(e) => setFormData({ ...formData, linked_to_type: e.target.value as Documentation['linked_to_type'], linked_to_id: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="operation">عملية زراعية</option>
                  <option value="growth_stage">مرحلة نمو</option>
                </select>
              </div>

              {formData.linked_to_type === 'operation' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اختر العملية *</label>
                  <select
                    required
                    value={formData.linked_to_id}
                    onChange={(e) => setFormData({ ...formData, linked_to_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">-- اختر عملية --</option>
                    {operations.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.operation_type} - {new Date(op.operation_date).toLocaleDateString('ar-SA')}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اختر المرحلة *</label>
                  <select
                    required
                    value={formData.linked_to_id}
                    onChange={(e) => setFormData({ ...formData, linked_to_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">-- اختر مرحلة --</option>
                    {growthStages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.tree_type} - {stage.current_stage}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تعليق</label>
                <textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="إضافة تعليق على الملف..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploading || selectedFiles.length === 0}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    uploading || selectedFiles.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                >
                  {uploading ? 'جاري الرفع...' : `رفع ${selectedFiles.length > 1 ? `${selectedFiles.length} ملفات` : 'الملف'}`}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={uploading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    uploading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgriculturalDocumentationTab;
