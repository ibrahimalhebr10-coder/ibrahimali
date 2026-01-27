import { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, Youtube, Video, Plus, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { videoIntroService, type VideoIntro, type CreateVideoIntroInput } from '../../services/videoIntroService';

export default function VideoIntroManagement() {
  const [videos, setVideos] = useState<VideoIntro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadType, setUploadType] = useState<'upload' | 'youtube' | 'tiktok'>('upload');
  const [formData, setFormData] = useState<CreateVideoIntroInput>({
    video_type: 'upload',
    video_url: '',
    title: '',
    description: '',
    is_active: true,
    display_order: 0
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    setLoading(true);
    const data = await videoIntroService.getAllVideos();
    setVideos(data);
    setLoading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        setError('حجم الفيديو يجب أن يكون أقل من 500 ميجابايت');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);

    try {
      let videoUrl = formData.video_url;

      if (uploadType === 'upload') {
        if (!selectedFile) {
          setError('يرجى اختيار ملف فيديو');
          setUploading(false);
          return;
        }

        videoUrl = await videoIntroService.uploadVideoFile(selectedFile) || '';
        if (!videoUrl) {
          setError('فشل رفع الفيديو');
          setUploading(false);
          return;
        }
      } else if (uploadType === 'youtube') {
        const videoId = videoIntroService.extractYouTubeId(videoUrl);
        if (!videoId) {
          setError('رابط يوتيوب غير صالح');
          setUploading(false);
          return;
        }
      } else if (uploadType === 'tiktok') {
        const videoId = videoIntroService.extractTikTokId(videoUrl);
        if (!videoId) {
          setError('رابط تيك توك غير صالح');
          setUploading(false);
          return;
        }
      }

      const input: CreateVideoIntroInput = {
        ...formData,
        video_type: uploadType,
        video_url: videoUrl
      };

      await videoIntroService.createVideo(input);
      setSuccess('تم إضافة الفيديو بنجاح');
      setShowAddForm(false);
      resetForm();
      loadVideos();
    } catch (err) {
      console.error('Error creating video:', err);
      setError('حدث خطأ أثناء إضافة الفيديو');
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setFormData({
      video_type: 'upload',
      video_url: '',
      title: '',
      description: '',
      is_active: true,
      display_order: 0
    });
    setSelectedFile(null);
    setUploadType('upload');
  }

  async function handleToggleActive(video: VideoIntro) {
    try {
      await videoIntroService.updateVideo(video.id, {
        is_active: !video.is_active
      });
      setSuccess('تم تحديث حالة الفيديو');
      loadVideos();
    } catch (err) {
      console.error('Error toggling video active state:', err);
      setError('فشل تحديث حالة الفيديو');
    }
  }

  async function handleDelete(video: VideoIntro) {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;

    try {
      if (video.video_type === 'upload') {
        await videoIntroService.deleteVideoFile(video.video_url);
      }
      await videoIntroService.deleteVideo(video.id);
      setSuccess('تم حذف الفيديو بنجاح');
      loadVideos();
    } catch (err) {
      console.error('Error deleting video:', err);
      setError('فشل حذف الفيديو');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-darkgreen border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6" dir="rtl">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-darkgreen">إدارة الفيديو التعريفي</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-darkgreen text-white rounded-lg hover:bg-darkgreen/90 transition-colors"
          >
            {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            <span>{showAddForm ? 'إلغاء' : 'إضافة فيديو جديد'}</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-50 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                نوع الفيديو
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setUploadType('upload')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    uploadType === 'upload'
                      ? 'border-darkgreen bg-darkgreen/10 text-darkgreen'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-bold">رفع ملف</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('youtube')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    uploadType === 'youtube'
                      ? 'border-darkgreen bg-darkgreen/10 text-darkgreen'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Youtube className="w-5 h-5" />
                  <span className="font-bold">يوتيوب</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('tiktok')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    uploadType === 'tiktok'
                      ? 'border-darkgreen bg-darkgreen/10 text-darkgreen'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Video className="w-5 h-5" />
                  <span className="font-bold">تيك توك</span>
                </button>
              </div>
            </div>

            {uploadType === 'upload' ? (
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  اختر ملف الفيديو (حد أقصى 500 ميجابايت)
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                  onChange={handleFileChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    ملف محدد: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} ميجابايت)
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  رابط الفيديو من {uploadType === 'youtube' ? 'يوتيوب' : 'تيك توك'}
                </label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder={
                    uploadType === 'youtube'
                      ? 'https://www.youtube.com/watch?v=...'
                      : 'https://www.tiktok.com/@username/video/...'
                  }
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                عنوان الفيديو
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                وصف الفيديو
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-darkgreen focus:border-transparent"
              />
            </div>

            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 text-darkgreen focus:ring-darkgreen rounded"
              />
              <label htmlFor="is_active" className="text-sm font-bold text-gray-700">
                تفعيل الفيديو
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-darkgreen text-white rounded-lg hover:bg-darkgreen/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>جاري الرفع...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>حفظ الفيديو</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {videos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-bold mb-2">لا توجد فيديوهات</p>
              <p>قم بإضافة فيديو تعريفي جديد</p>
            </div>
          ) : (
            videos.map((video) => (
              <div
                key={video.id}
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0">
                  {video.video_type === 'upload' && (
                    <div className="w-16 h-16 bg-darkgreen/10 rounded-lg flex items-center justify-center">
                      <Upload className="w-8 h-8 text-darkgreen" />
                    </div>
                  )}
                  {video.video_type === 'youtube' && (
                    <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center">
                      <Youtube className="w-8 h-8 text-red-600" />
                    </div>
                  )}
                  {video.video_type === 'tiktok' && (
                    <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-lg text-darkgreen mb-1">{video.title}</h3>
                  {video.description && (
                    <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>النوع: {video.video_type === 'upload' ? 'مرفوع' : video.video_type === 'youtube' ? 'يوتيوب' : 'تيك توك'}</span>
                    <span className={`px-2 py-1 rounded ${video.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {video.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(video)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={video.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                  >
                    {video.is_active ? (
                      <Eye className="w-5 h-5 text-green-600" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(video)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
