import { useState, useEffect, useRef } from 'react';
import { Upload, Video, Play, Trash2, Eye, CheckCircle, AlertCircle, X, Loader, Film, Monitor, Smartphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VideoItem {
  id: string;
  title: string;
  description: string;
  file_url: string;
  thumbnail_url?: string;
  duration?: number;
  file_size: number;
  is_active: boolean;
  device_type: 'all' | 'mobile' | 'desktop';
  created_at: string;
}

export default function IntroVideoManager() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    device_type: 'all' as 'all' | 'mobile' | 'desktop',
    is_active: true
  });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('intro_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('الرجاء اختيار ملف فيديو فقط');
      return;
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('حجم الفيديو يجب أن يكون أقل من 500 ميجابايت');
      return;
    }

    setSelectedFile(file);
    const videoUrl = URL.createObjectURL(file);
    setPreviewVideo(videoUrl);

    const video = document.createElement('video');
    video.src = videoUrl;
    video.onloadedmetadata = () => {
      console.log('Duration:', Math.round(video.duration), 'seconds');
    };
  };

  const uploadVideo = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      console.log('Starting upload for file:', file.name, 'Size:', file.size);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `intro-videos/${fileName}`;

      console.log('Uploading to path:', filePath);

      setUploadProgress(10);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('farm-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully:', uploadData);
      setUploadProgress(95);

      const { data: { publicUrl } } = supabase.storage
        .from('farm-videos')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      const { data: dbData, error: dbError } = await supabase
        .from('intro_videos')
        .insert({
          title: formData.title,
          description: formData.description,
          file_url: publicUrl,
          file_size: file.size,
          device_type: formData.device_type,
          is_active: formData.is_active
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Video saved to database:', dbData);
      setUploadProgress(100);

      setFormData({
        title: '',
        description: '',
        device_type: 'all',
        is_active: true
      });
      setPreviewVideo(null);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await loadVideos();

      alert('تم رفع الفيديو بنجاح!');
    } catch (error: any) {
      console.error('Error uploading video:', error);
      alert(`حدث خطأ أثناء رفع الفيديو: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const toggleVideoStatus = async (videoId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('intro_videos')
        .update({ is_active: !currentStatus })
        .eq('id', videoId);

      if (error) throw error;
      await loadVideos();
    } catch (error) {
      console.error('Error toggling video status:', error);
    }
  };

  const deleteVideo = async (video: VideoItem) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;

    try {
      const filePath = video.file_url.split('/').slice(-2).join('/');

      await supabase.storage
        .from('farm-videos')
        .remove([filePath]);

      const { error } = await supabase
        .from('intro_videos')
        .delete()
        .eq('id', video.id);

      if (error) throw error;
      await loadVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('حدث خطأ أثناء حذف الفيديو');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} كيلوبايت`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Film className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">إدارة الفيديوهات التعريفية</h2>
            <p className="text-blue-100 text-lg">نظام رفع متطور يدعم الموبايل والكمبيوتر</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <Video className="w-12 h-12" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-blue-100 text-sm mb-1">إجمالي الفيديوهات</p>
            <p className="text-3xl font-bold">{videos.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-blue-100 text-sm mb-1">الفيديوهات النشطة</p>
            <p className="text-3xl font-bold">{videos.filter(v => v.is_active).length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-blue-100 text-sm mb-1">الحجم الكلي</p>
            <p className="text-xl font-bold">
              {formatFileSize(videos.reduce((sum, v) => sum + v.file_size, 0))}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-600" />
            رفع فيديو جديد
          </h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان الفيديو
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="مثال: مقدمة عن المنصة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الجهاز
              </label>
              <select
                value={formData.device_type}
                onChange={(e) => setFormData({ ...formData, device_type: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الأجهزة</option>
                <option value="mobile">موبايل فقط</option>
                <option value="desktop">كمبيوتر فقط</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوصف
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="وصف مختصر للفيديو..."
            />
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {previewVideo ? (
              <div className="space-y-4">
                <video
                  src={previewVideo}
                  controls
                  className="mx-auto max-h-64 rounded-xl shadow-lg"
                />
                {selectedFile && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p>{formatFileSize(selectedFile.size)}</p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setPreviewVideo(null);
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  <X className="w-5 h-5 inline ml-2" />
                  إلغاء
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    اسحب الفيديو هنا أو انقر للاختيار
                  </p>
                  <p className="text-sm text-gray-500">
                    يدعم جميع صيغ الفيديو - الحد الأقصى 500 ميجابايت
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  اختيار ملف فيديو
                </button>
              </div>
            )}
          </div>

          {uploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">جاري الرفع...</span>
                <span className="text-blue-600 font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {previewVideo && !uploading && (
            <button
              onClick={() => {
                if (!formData.title.trim()) {
                  alert('الرجاء إدخال عنوان للفيديو');
                  return;
                }
                if (selectedFile) {
                  uploadVideo(selectedFile);
                }
              }}
              disabled={!formData.title.trim() || !selectedFile}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
            >
              <Upload className="w-5 h-5 inline ml-2" />
              رفع الفيديو الآن
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Film className="w-6 h-6 text-blue-600" />
            الفيديوهات المرفوعة ({videos.length})
          </h3>
        </div>

        <div className="p-6">
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد فيديوهات مرفوعة حتى الآن</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                            <Play className="w-8 h-8 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-lg font-bold text-gray-800">{video.title}</h4>
                            <div className="flex items-center gap-2">
                              {video.is_active ? (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  نشط
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  غير نشط
                                </span>
                              )}
                            </div>
                          </div>
                          {video.description && (
                            <p className="text-sm text-gray-600 mb-3">{video.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              {getDeviceIcon(video.device_type)}
                              {video.device_type === 'all' ? 'جميع الأجهزة' :
                               video.device_type === 'mobile' ? 'موبايل' : 'كمبيوتر'}
                            </span>
                            <span>{formatFileSize(video.file_size)}</span>
                            <span>{new Date(video.created_at).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedVideo(video)}
                        className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                        title="معاينة"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => toggleVideoStatus(video.id, video.is_active)}
                        className={`p-3 rounded-xl transition-colors ${
                          video.is_active
                            ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                        title={video.is_active ? 'إيقاف' : 'تفعيل'}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteVideo(video)}
                        className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">{selectedVideo.title}</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <video
                src={selectedVideo.file_url}
                controls
                autoPlay
                className="w-full rounded-xl shadow-lg"
              />
              {selectedVideo.description && (
                <p className="mt-4 text-gray-600">{selectedVideo.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
