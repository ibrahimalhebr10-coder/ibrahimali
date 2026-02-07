import React, { useState, useEffect } from 'react';
import { Play, Link, Save, Power, Trash2, Plus, Video, ExternalLink } from 'lucide-react';
import { streamingVideoService, StreamingVideo } from '../../services/streamingVideoService';

const StreamingVideoManager: React.FC = () => {
  const [videos, setVideos] = useState<StreamingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    title: 'فيديو تعريفي',
    description: 'تعرف على منصة أشجاري',
    stream_url: '',
    thumbnail_url: '',
    display_order: 0
  });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    const data = await streamingVideoService.getAllVideos();
    setVideos(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stream_url.trim()) {
      alert('الرجاء إدخال رابط البث');
      return;
    }

    setSaving(true);
    await streamingVideoService.createVideo({
      ...formData,
      is_active: true
    });

    setFormData({
      title: 'فيديو تعريفي',
      description: 'تعرف على منصة أشجاري',
      stream_url: '',
      thumbnail_url: '',
      display_order: 0
    });

    setShowAddForm(false);
    await loadVideos();
    setSaving(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await streamingVideoService.toggleVideoStatus(id, !currentStatus);
    await loadVideos();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
    await streamingVideoService.deleteVideo(id);
    await loadVideos();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-darkgreen"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              نظام البث المباشر (Streaming)
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              الفيديو يتم رفعه على CDN أو Object Storage خارجياً، وتقوم المنصة باستقباله عبر رابط البث فقط
            </p>
            <div className="bg-white/70 rounded-lg p-3 space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>دعم HLS (.m3u8), MP4, YouTube, Vimeo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>تشغيل فوري بدون انتظار</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>دعم فيديوهات طويلة (90-120 ثانية+)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!showAddForm && videos.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا يوجد فيديو تعريفي</h3>
          <p className="text-gray-600 mb-6">أضف أول فيديو تعريفي للمنصة</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-darkgreen text-white rounded-xl hover:bg-darkgreen/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة فيديو تعريفي</span>
          </button>
        </div>
      )}

      {!showAddForm && videos.length > 0 && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-darkgreen hover:text-darkgreen transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة فيديو جديد</span>
        </button>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">إضافة فيديو تعريفي جديد</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              عنوان الفيديو
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-darkgreen focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              وصف الفيديو
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-darkgreen focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                <span>رابط البث (Stream URL)</span>
              </div>
            </label>
            <input
              type="url"
              value={formData.stream_url}
              onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
              placeholder="https://cdn.example.com/video.m3u8"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-darkgreen focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              يدعم: HLS (.m3u8), MP4, YouTube, Vimeo, وغيرها
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              صورة مصغرة (اختياري)
            </label>
            <input
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              placeholder="https://example.com/thumbnail.jpg"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-darkgreen focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-darkgreen text-white rounded-xl hover:bg-darkgreen/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ الفيديو'}</span>
          </button>
        </form>
      )}

      {videos.length > 0 && (
        <div className="space-y-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${video.is_active ? 'bg-green-100' : 'bg-gray-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Play className={`w-6 h-6 ${video.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{video.title}</h3>
                      <p className="text-sm text-gray-600">{video.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      video.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {video.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a
                        href={video.stream_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {video.stream_url}
                      </a>
                      <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleStatus(video.id, video.is_active)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        video.is_active
                          ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                      <span>{video.is_active ? 'إيقاف' : 'تفعيل'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(video.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StreamingVideoManager;
