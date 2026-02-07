import { useState, useEffect } from 'react';
import { Upload, Video, Trash2, Eye, AlertCircle, CheckCircle, Loader2, Zap, Clock, HardDrive, TrendingUp } from 'lucide-react';
import { videoIntroService, type VideoIntro } from '../../services/videoIntroService';
import { advancedVideoUploadService } from '../../services/advancedVideoUploadService';

export default function VideoIntroManager() {
  const [video, setVideo] = useState<VideoIntro | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileSize, setFileSize] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Advanced upload stats
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [chunksCompleted, setChunksCompleted] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [uploadedMB, setUploadedMB] = useState<number>(0);
  const [totalMB, setTotalMB] = useState<number>(0);

  const [formData, setFormData] = useState({
    title: 'تعرّف على جود',
    description: 'استثمار زراعي حقيقي في مزارع طبيعية'
  });

  useEffect(() => {
    loadVideo();
  }, []);

  function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '--:--';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    if (mins > 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}س ${remainingMins}د`;
    }

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

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

    // التحقق باستخدام النظام المتقدم
    const validation = advancedVideoUploadService.validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'ملف غير صالح');
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    setFileSize(`${fileSizeMB.toFixed(2)} ميجابايت`);
    setTotalMB(fileSizeMB);

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      setSuccess(null);
      setUploadSpeed(0);
      setTimeRemaining(0);
      setChunksCompleted(0);
      setTotalChunks(0);
      setUploadedMB(0);

      console.log('🗑️ Cleaning up old video if exists...');
      if (video) {
        if (video.video_type === 'upload' && video.video_url) {
          await videoIntroService.deleteVideoFile(video.video_url);
        }
        await videoIntroService.deleteVideo(video.id);
      }

      console.log('🚀 Starting advanced upload...');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      let videoUrl: string;

      // اختيار طريقة الرفع بناءً على حجم الملف
      // استخدام chunked upload للملفات أكبر من 15 MB لموثوقية أفضل
      // (فيديو 45 ثانية غالباً 15-40 MB حسب الجودة)
      if (fileSizeMB > 15) {
        console.log('📦 Using advanced chunked upload for medium/large file');

        videoUrl = await advancedVideoUploadService.uploadWithChunking(
          file,
          filePath,
          (progress) => {
            setUploadProgress(progress.percentage);
            setUploadSpeed(progress.speed);
            setTimeRemaining(progress.timeRemaining);
            setChunksCompleted(progress.chunksCompleted);
            setTotalChunks(progress.totalChunks);
            setUploadedMB(progress.loaded / (1024 * 1024));

            console.log(`📊 Progress: ${progress.percentage.toFixed(1)}% | Speed: ${(progress.speed / 1024 / 1024).toFixed(2)} MB/s | Chunks: ${progress.chunksCompleted}/${progress.totalChunks}`);
          }
        );
      } else {
        console.log('📤 Using simple upload for small file');

        videoUrl = await advancedVideoUploadService.uploadSimple(
          file,
          filePath,
          (progress) => {
            setUploadProgress(progress);
          }
        );
      }

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
      setUploadSpeed(0);
      setTimeRemaining(0);
      setChunksCompleted(0);
      setTotalChunks(0);
      setUploadedMB(0);
      setTotalMB(0);
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

      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">⚠️ سياسة صارمة للفيديو التعريفي</h3>
            <div className="space-y-1 text-white/95 text-sm">
              <p>✓ <strong>المدة القصوى:</strong> 30 ثانية فقط (لا استثناءات)</p>
              <p>✓ <strong>الصيغة:</strong> MP4 فقط</p>
              <p>✓ <strong>الحجم الأقصى:</strong> 50 MB</p>
              <p>✓ <strong>الجودة الموصى بها:</strong> 1080p @ 30fps، H.264 codec</p>
            </div>
            <p className="text-xs text-white/80 mt-3 bg-white/10 px-3 py-2 rounded-lg">
              ملاحظة: هذه السياسة مبنية على الواقع الفعلي لنظام الرفع. فيديو 45 ثانية يفشل دائماً.
            </p>
          </div>
        </div>
      </div>

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
                  <div className="space-y-6">
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-darkgreen mx-auto animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-lightgreen border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xl font-bold text-gray-900 mb-2">جاري رفع الفيديو</p>
                      <p className="text-sm text-gray-600">رفع احترافي متقدم مع استئناف تلقائي</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-2xl mx-auto space-y-3">
                      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-green-500 to-lightgreen transition-all duration-500 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-2xl text-darkgreen">{uploadProgress.toFixed(1)}%</span>
                        {totalChunks > 0 && (
                          <span className="text-gray-600 font-medium">
                            {chunksCompleted}/{totalChunks} أجزاء
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                      {/* Upload Speed */}
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">سرعة الرفع</p>
                            <p className="text-lg font-bold text-gray-900">
                              {uploadSpeed > 0 ? `${(uploadSpeed / 1024 / 1024).toFixed(2)} MB/s` : '...'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Time Remaining */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">الوقت المتبقي</p>
                            <p className="text-lg font-bold text-gray-900">
                              {timeRemaining > 0 ? formatTime(timeRemaining) : '...'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Data Uploaded */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <HardDrive className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">تم الرفع</p>
                            <p className="text-lg font-bold text-gray-900">
                              {uploadedMB.toFixed(1)} / {totalMB.toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Chunks Progress */}
                      {totalChunks > 0 && (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600 mb-1">التقدم</p>
                              <p className="text-lg font-bold text-gray-900">
                                {chunksCompleted}/{totalChunks}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Warning */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 max-w-2xl mx-auto">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-900 mb-1">
                            الرجاء عدم إغلاق الصفحة
                          </p>
                          <p className="text-xs text-blue-700">
                            النظام يدعم الاستئناف التلقائي - إذا انقطع الاتصال سيتم استكمال الرفع تلقائياً
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tech Info */}
                    {totalChunks > 0 && (
                      <div className="text-xs text-gray-500 max-w-2xl mx-auto">
                        <p className="font-medium mb-1">تقنيات متقدمة:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <span className="px-3 py-1 bg-gray-100 rounded-full">Chunked Upload ✓</span>
                          <span className="px-3 py-1 bg-gray-100 rounded-full">Multi-threaded ✓</span>
                          <span className="px-3 py-1 bg-gray-100 rounded-full">Auto Resume ✓</span>
                          <span className="px-3 py-1 bg-gray-100 rounded-full">5MB Chunks ✓</span>
                        </div>
                      </div>
                    )}
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
                      <p className="text-xs font-semibold text-red-600 mt-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200 inline-block">
                        ⚠️ المدة القصوى: 30 ثانية • الصيغة: MP4 فقط • الحجم: حتى 50 MB
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mt-3">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                          ✅ MP4 فقط
                        </span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                          ⏱️ حتى 30 ثانية
                        </span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-200">
                          📦 حتى 50 MB
                        </span>
                      </div>
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

      {/* Feature Comparison Banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">نظام رفع احترافي متقدم</h3>
              <p className="text-white/90 text-sm">تقنيات حديثة لأفضل أداء وسرعة</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">30 ثانية</div>
                <div className="text-white/80 text-sm">المدة القصوى</div>
                <div className="text-white/60 text-xs mt-1">سياسة واقعية</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">50 MB</div>
                <div className="text-white/80 text-sm">الحجم الأقصى</div>
                <div className="text-white/60 text-xs mt-1">MP4 فقط</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">100%</div>
                <div className="text-white/80 text-sm">موثوق</div>
                <div className="text-white/60 text-xs mt-1">3 محاولات</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
              ⚠️ 30 ثانية فقط
            </span>
            <span className="px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
              ⚠️ MP4 فقط
            </span>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
              ✓ 50 MB حد أقصى
            </span>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
              ✓ 3 محاولات
            </span>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
              ✓ H.264 موصى به
            </span>
          </div>
        </div>
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
                  <span>اجعل الفيديو قصيراً ومباشراً (الحد الأقصى: 30 ثانية)</span>
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
              <h4 className="font-semibold text-gray-900 mb-2">متطلبات الفيديو التعريفي</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">⚠️</span>
                  <span><strong>المدة القصوى:</strong> 30 ثانية (سياسة صارمة)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">📹</span>
                  <span><strong>الصيغة:</strong> MP4 فقط (لا MOV، لا AVI، لا WebM)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">📦</span>
                  <span><strong>الحجم الأقصى:</strong> 50 MB (فيديو 30 ثانية عادة 20-40 MB)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">✅</span>
                  <span><strong>الجودة الموصى بها:</strong> 1080p @ 30fps، H.264 codec</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">🔁</span>
                  <span><strong>محاولات متعددة:</strong> 3 محاولات تلقائية عند الفشل</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">⏱️</span>
                  <span><strong>Timeout:</strong> 10 دقائق كحد أقصى للرفع</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
