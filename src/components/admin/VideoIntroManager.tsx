import { useState, useEffect } from 'react';
import { Upload, Video, Trash2, Eye, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { videoIntroService, type VideoIntro } from '../../services/videoIntroService';

export default function VideoIntroManager() {
  const [video, setVideo] = useState<VideoIntro | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileSize, setFileSize] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [formData, setFormData] = useState({
    title: 'تعرّف على جود',
    description: 'استثمار زراعي حقيقي في مزارع طبيعية'
  });

  useEffect(() => {
    loadVideo();
  }, []);

  async function loadVideo() {
    try {
      setLoading(true);
      const data = await videoIntroService.getActiveVideo();
      setVideo(data);
      setShowUploadForm(!data);
      if (data) {
        setFormData({
          title: data.title,
          description: data.description || ''
        });
      }
    } catch (err) {
      console.error('Error loading video:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📹 Selected file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!file.type.startsWith('video/')) {
      setError('الرجاء اختيار ملف فيديو صالح (MP4, MOV, AVI, WebM)');
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    setFileSize(`${fileSizeMB.toFixed(2)} ميجابايت`);

    const maxSize = 1024 * 1024 * 1024; // 1 GB
    if (file.size > maxSize) {
      setError(`حجم الفيديو (${fileSizeMB.toFixed(2)} ميجابايت) يجب ألا يتجاوز 1024 ميجابايت (1 جيجابايت)`);
      return;
    }

    // تحذير للملفات الكبيرة جداً
    if (fileSizeMB > 200) {
      console.warn(`⚠️ Large file detected: ${fileSizeMB.toFixed(2)} MB - Upload may take 3-5 minutes`);
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      setSuccess(null);

      console.log('🗑️ Cleaning up old video if exists...');
      if (video) {
        if (video.video_type === 'upload' && video.video_url) {
          await videoIntroService.deleteVideoFile(video.video_url);
        }
        await videoIntroService.deleteVideo(video.id);
      }

      setUploadProgress(5);
      console.log('⬆️ Starting upload...');

      const videoUrl = await videoIntroService.uploadVideoFile(file, (progress) => {
        setUploadProgress(progress);
        console.log(`📊 Upload progress: ${progress}%`);
      });

      if (!videoUrl) {
        throw new Error('فشل رفع الفيديو - لم يتم الحصول على رابط');
      }

      console.log('✅ Video uploaded, creating record...');
      const newVideo = await videoIntroService.createVideo({
        video_type: 'upload',
        video_url: videoUrl,
        title: formData.title,
        description: formData.description,
        is_active: true,
        display_order: 0
      });

      setVideo(newVideo);
      setShowUploadForm(false);
      setSuccess(`تم رفع الفيديو بنجاح (${fileSize})`);
      console.log('✅ Video upload completed successfully');
    } catch (err: any) {
      console.error('❌ Error uploading video:', err);
      const errorMessage = err?.message || 'حدث خطأ أثناء رفع الفيديو';
      setError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setFileSize('');
    }
  }

  async function handleUpdateInfo() {
    if (!video) return;

    try {
      setError(null);
      setSuccess(null);

      await videoIntroService.updateVideo(video.id, {
        title: formData.title,
        description: formData.description
      });

      setSuccess('تم تحديث معلومات الفيديو');
      await loadVideo();
    } catch (err) {
      console.error('Error updating video:', err);
      setError('حدث خطأ أثناء تحديث البيانات');
    }
  }

  async function handleDelete() {
    if (!video) return;

    if (!confirm('هل أنت متأكد من حذف الفيديو التعريفي؟')) return;

    try {
      setError(null);
      setSuccess(null);

      if (video.video_type === 'upload' && video.video_url) {
        await videoIntroService.deleteVideoFile(video.video_url);
      }

      await videoIntroService.deleteVideo(video.id);
      setVideo(null);
      setShowUploadForm(true);
      setSuccess('تم حذف الفيديو بنجاح');
    } catch (err) {
      console.error('Error deleting video:', err);
      setError('حدث خطأ أثناء حذف الفيديو');
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-darkgreen animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-darkgreen to-lightgreen flex items-center justify-center">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">الفيديو التعريفي</h3>
            <p className="text-sm text-gray-600">يظهر للزوار عند دخولهم المنصة لأول مرة</p>
          </div>
        </div>

        {video && !showUploadForm ? (
          <div className="space-y-6">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <video
                src={video.video_url}
                controls
                className="w-full h-full object-contain"
                poster={video.thumbnail_url}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان الفيديو
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                  placeholder="مثال: تعرّف على جود"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وصف الفيديو
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent resize-none"
                  placeholder="مثال: استثمار زراعي حقيقي في مزارع طبيعية"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdateInfo}
                  className="flex-1 px-6 py-3 bg-darkgreen text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all"
                >
                  حفظ التعديلات
                </button>

                <button
                  onClick={() => setShowUploadForm(true)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  استبدال الفيديو
                </button>

                <button
                  onClick={handleDelete}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  حذف
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-darkgreen hover:bg-gray-50 transition-all">
                {uploading ? (
                  <div className="space-y-4">
                    <Loader2 className="w-12 h-12 text-darkgreen mx-auto animate-spin" />
                    <p className="text-gray-600 font-medium">جاري رفع الفيديو...</p>

                    {fileSize && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">حجم الملف: {fileSize}</p>
                        {parseFloat(fileSize) > 100 && (
                          <p className="text-xs text-amber-600 font-medium">
                            ملف كبير - قد يستغرق 3-5 دقائق
                          </p>
                        )}
                      </div>
                    )}

                    <div className="w-full max-w-md mx-auto">
                      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-darkgreen to-lightgreen transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2 font-medium">{uploadProgress}%</p>
                    </div>

                    <p className="text-xs text-blue-600 mt-3 font-medium">
                      ⚠️ الرجاء عدم إغلاق الصفحة أو تبديل التطبيق حتى اكتمال الرفع
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 mb-2">
                        اضغط لرفع فيديو تعريفي
                      </p>
                      <p className="text-sm text-gray-600">
                        يمكنك رفع فيديو من الجوال أو الكمبيوتر
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        الحد الأقصى: 1 جيجابايت (1024 ميجابايت) • صيغ مدعومة: MP4, MOV, AVI, WebM
                      </p>
                      <p className="text-xs text-emerald-600 mt-1 font-medium">
                        📱 مدعوم من الجوال • ⚡ رفع ذكي للملفات الكبيرة
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </label>

            {!uploading && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان الفيديو
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                    placeholder="مثال: تعرّف على جود"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وصف الفيديو
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent resize-none"
                    placeholder="مثال: استثمار زراعي حقيقي في مزارع طبيعية"
                  />
                </div>

                {video && (
                  <button
                    onClick={() => {
                      setShowUploadForm(false);
                      setError(null);
                    }}
                    className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">نصائح لفيديو تعريفي ناجح</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>اجعل الفيديو قصيراً ومباشراً (30-60 ثانية مثالي)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>ابدأ بعرض فكرة المنصة بشكل واضح وجذاب</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>استخدم صور حقيقية من المزارع لبناء الثقة</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>اختم بدعوة واضحة للعمل (مثل: ابدأ مزرعتك الآن)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">نصائح الرفع من الجوال</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">•</span>
                  <span>تأكد من اتصال Wi-Fi قوي (لا تستخدم بيانات الجوال)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">•</span>
                  <span>لا تغلق الصفحة أو تبديل التطبيق أثناء الرفع</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">•</span>
                  <span>قد يستغرق الرفع 1-5 دقائق حسب حجم الفيديو</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">•</span>
                  <span>الحد الأقصى: 1 جيجابايت (كافي لفيديو 10 دقائق عالي الجودة)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
