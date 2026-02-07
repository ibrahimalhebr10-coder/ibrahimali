import React, { useEffect, useState, useRef } from 'react';
import { X, Play, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { streamingVideoService, StreamingVideo } from '../services/streamingVideoService';

interface StreamingVideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const StreamingVideoPlayer: React.FC<StreamingVideoPlayerProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [video, setVideo] = useState<StreamingVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadVideo();
    }
  }, [isOpen]);

  const loadVideo = async () => {
    setLoading(true);
    const activeVideo = await streamingVideoService.getActiveVideo();
    setVideo(activeVideo);
    setLoading(false);
  };

  const handleVideoEnd = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onClose();
  };

  const isYouTube = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 animate-fade-in">
      <div
        ref={containerRef}
        className="relative w-full max-w-6xl bg-black rounded-2xl overflow-hidden shadow-2xl"
      >
        {loading ? (
          <div className="aspect-video flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-lg">جاري التحميل...</p>
            </div>
          </div>
        ) : !video ? (
          <div className="aspect-video flex items-center justify-center">
            <div className="text-center p-8">
              <Play className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <p className="text-white text-xl mb-2">لا يوجد فيديو تعريفي</p>
              <p className="text-gray-400">لم يتم تفعيل أي فيديو تعريفي حالياً</p>
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="aspect-video relative group">
              {isYouTube(video.stream_url) ? (
                <iframe
                  src={getYouTubeEmbedUrl(video.stream_url)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  autoPlay
                  onEnded={handleVideoEnd}
                  poster={video.thumbnail_url}
                >
                  <source src={video.stream_url} type="application/x-mpegURL" />
                  <source src={video.stream_url} type="video/mp4" />
                  المتصفح لا يدعم تشغيل الفيديو
                </video>
              )}

              {!isYouTube(video.stream_url) && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={toggleMute}
                    className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>

            {video.title && (
              <div className="bg-gradient-to-t from-black/80 to-transparent p-6">
                <h2 className="text-2xl font-bold text-white mb-2">{video.title}</h2>
                {video.description && (
                  <p className="text-gray-300">{video.description}</p>
                )}
              </div>
            )}
          </>
        )}

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default StreamingVideoPlayer;
