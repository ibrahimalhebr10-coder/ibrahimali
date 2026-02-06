import { useState, useEffect } from 'react';
import { Upload, Video, Trash2, Eye, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { videoIntroService, type VideoIntro } from '../../services/videoIntroService';

export default function VideoIntroManager() {
  const [video, setVideo] = useState<VideoIntro | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

    if (!file.type.startsWith('video/')) {
      setError('الرجاء اختيار ملف فيديو صالح');
      return;
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('حجم الفيديو يجب ألا يتجاوز 100 ميجابايت');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      if (video) {
        if (video.video_type === 'upload' && video.video_url) {
          await videoIntroService.deleteVideoFile(video.video_url);
        }
        await videoIntroService.deleteVideo(video.id);
      }

      const videoUrl = await videoIntroService.uploadVideoFile(file);
      if (!videoUrl) {
        throw new Error('فشل رفع الفيديو');
      }

      const newVideo = await videoIntroService.createVideo({
        video_type: 'upload',
        video_url: videoUrl,
        title: formData.title,
        description: formData.description,
        is_active: true,
        display_order: 0
      });

      setVideo(newVideo);
      setPreviewUrl(URL.createObjectURL(file));
      setSuccess('تم رفع الفيديو بنجاح');
    } catch (err) {
      console.error('Error uploading video:', err);
      setError('حدث خطأ أثناء رفع الفيديو');
    } finally {
      setUploading(false);
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
      setPreviewUrl(null);
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

        {video ? (
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
                  onClick={handleDelete}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  حذف الفيديو
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
                        الحد الأقصى: 100 ميجابايت • صيغ مدعومة: MP4, MOV, AVI
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
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}
