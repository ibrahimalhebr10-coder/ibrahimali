import { useState, useEffect, useRef } from 'react';
import { X, Play, Volume2, VolumeX, Leaf } from 'lucide-react';
import { videoIntroService, type VideoIntro as VideoIntroData } from '../services/videoIntroService';

interface VideoIntroProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFarm: () => void;
}

export default function VideoIntro({ isOpen, onClose, onStartFarm }: VideoIntroProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [videoData, setVideoData] = useState<VideoIntroData | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadVideo();
    } else {
      setIsPlaying(false);
      setShowCTA(false);
    }
  }, [isOpen]);

  async function loadVideo() {
    setLoadingVideo(true);
    const data = await videoIntroService.getActiveVideo();
    setVideoData(data);
    setLoadingVideo(false);
  }

  const handlePlay = () => {
    setIsPlaying(true);
    setShowCTA(false);

    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleStartFarm = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onClose();
    onStartFarm();
  };

  const handleVideoEnd = () => {
    setShowCTA(true);
    setIsPlaying(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  if (!isOpen) return null;

  if (!videoData) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-darkgreen to-lightgreen animate-fade-in" dir="rtl">
        <div className="absolute top-0 left-0 right-0 z-[200] p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">جود</span>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #3AA17E 0%, #2F5233 100%)',
                boxShadow: '0 2px 8px rgba(58,161,126,0.5)'
              }}
            >
              <Leaf className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div className="text-center animate-scale-in pointer-events-auto">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
                backdropFilter: 'blur(10px)',
                border: '3px solid rgba(255,255,255,0.5)'
              }}
            >
              <Leaf className="w-10 h-10 text-white" />
            </div>
            <h2
              className="text-3xl font-bold text-white mb-3"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
            >
              مرحباً بك في جود
            </h2>
            <p
              className="text-lg text-white/90 mb-8"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
            >
              منصة الاستثمار الزراعي الحقيقي
            </p>
            <button
              onClick={handleStartFarm}
              className="px-10 py-4 rounded-2xl font-bold text-lg text-white transition-transform active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F9A825 50%, #D4AF37 100%)',
                boxShadow: '0 8px 32px rgba(212,175,55,0.5)'
              }}
            >
              ابدأ تأسيس مزرعتك
            </button>
            <button
              onClick={onClose}
              className="block mx-auto mt-4 text-white/70 text-sm hover:text-white transition-colors"
            >
              أو تصفح المزارع المتاحة
            </button>
          </div>
        </div>

        <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
          .animate-scale-in {
            animation: scale-in 0.5s ease-out;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black animate-fade-in" dir="rtl">
      <div className="absolute inset-0">
        {videoData.video_type === 'upload' && (
          <video
            ref={videoRef}
            src={videoData.video_url}
            className="w-full h-full object-cover"
            muted={isMuted}
            playsInline
            onEnded={handleVideoEnd}
            poster={videoData.thumbnail_url}
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isPlaying ? 'transparent' : 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 100%)'
          }}
        />
      </div>

      <div className="absolute top-0 left-0 right-0 z-[200] p-4 flex items-center justify-between pointer-events-none">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 pointer-events-auto"
          style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">جود</span>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #3AA17E 0%, #2F5233 100%)',
              boxShadow: '0 2px 8px rgba(58,161,126,0.5)'
            }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 pointer-events-none">
        {!isPlaying && !showCTA && (
          <div className="text-center animate-fade-in pointer-events-auto">
            {loadingVideo ? (
              <div className="mb-8">
                <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                </div>
                <p className="text-white/80">جاري تحميل الفيديو...</p>
              </div>
            ) : (
              <button
                onClick={handlePlay}
                className="w-24 h-24 rounded-full flex items-center justify-center mb-8 mx-auto transition-transform active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '3px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}
              >
                <Play className="w-12 h-12 text-white mr-[-4px]" fill="white" />
              </button>
            )}
            <h2 className="text-2xl font-bold text-white mb-2">
              {videoData.title}
            </h2>
            <p className="text-white/80">
              {videoData.description || 'اضغط لمشاهدة العرض التعريفي'}
            </p>
          </div>
        )}

        {showCTA && (
          <div className="text-center animate-scale-in pointer-events-auto">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: 'linear-gradient(135deg, #3AA17E 0%, #2F5233 100%)',
                boxShadow: '0 8px 32px rgba(58,161,126,0.5)'
              }}
            >
              <Leaf className="w-10 h-10 text-white" />
            </div>
            <h2
              className="text-3xl font-bold text-white mb-3"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
            >
              مستعد تبدأ؟
            </h2>
            <p
              className="text-lg text-white/90 mb-8"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
            >
              أسس مزرعتك الآن في 3 خطوات بسيطة
            </p>
            <button
              onClick={handleStartFarm}
              className="px-10 py-4 rounded-2xl font-bold text-lg text-white transition-transform active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F9A825 50%, #D4AF37 100%)',
                boxShadow: '0 8px 32px rgba(212,175,55,0.5)'
              }}
            >
              ابدأ تأسيس مزرعتك
            </button>
            <button
              onClick={onClose}
              className="block mx-auto mt-4 text-white/70 text-sm hover:text-white transition-colors"
            >
              أو تصفح المزارع المتاحة
            </button>
          </div>
        )}
      </div>

      {isPlaying && (
        <div className="absolute bottom-8 left-0 right-0 z-[100] flex justify-center pointer-events-none">
          <button
            onClick={toggleMute}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 pointer-events-auto"
            style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
