import { useState, useEffect, useRef } from 'react';
import { X, Play, Volume2, VolumeX, Leaf, AlertCircle } from 'lucide-react';
import { videoIntroService, type VideoIntro as VideoIntroData } from '../services/videoIntroService';

interface VideoIntroProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFarm: () => void;
}

interface Scene {
  id: number;
  text: string;
  subText?: string;
  image: string;
  duration: number;
}

const scenes: Scene[] = [
  {
    id: 1,
    text: 'فكرتك تبدأ من شجرة...',
    subText: 'استثمار حقيقي في مزارع طبيعية',
    image: 'https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=1920',
    duration: 5000
  },
  {
    id: 2,
    text: 'تختار نوعها، مدتها، ومحصولها',
    subText: 'حاسبة ذكية تساعدك في اتخاذ القرار',
    image: 'https://images.pexels.com/photos/1084540/pexels-photo-1084540.jpeg?auto=compress&cs=tinysrgb&w=1920',
    duration: 7000
  },
  {
    id: 3,
    text: 'والمنصة تدير كل شيء عنك',
    subText: 'رعاية • حصاد • تعبئة • توصيل',
    image: 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1920',
    duration: 8000
  }
];

export default function VideoIntro({ isOpen, onClose, onStartFarm }: VideoIntroProps) {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showCTA, setShowCTA] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoData, setVideoData] = useState<VideoIntroData | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadVideo();
    } else {
      setCurrentScene(0);
      setIsPlaying(false);
      setShowCTA(false);
      setProgress(0);
      setVideoError(false);
    }
  }, [isOpen]);

  async function loadVideo() {
    setLoadingVideo(true);
    setVideoError(false);
    const data = await videoIntroService.getActiveVideo();
    setVideoData(data);
    setLoadingVideo(false);
    if (!data) {
      setVideoError(true);
    }
  }

  useEffect(() => {
    if (!isPlaying || showCTA) return;

    const scene = scenes[currentScene];
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const sceneProgress = Math.min((elapsed / scene.duration) * 100, 100);
      setProgress(sceneProgress);
    }, 50);

    const timer = setTimeout(() => {
      if (currentScene < scenes.length - 1) {
        setCurrentScene(prev => prev + 1);
        setProgress(0);
      } else {
        setShowCTA(true);
        setIsPlaying(false);
      }
    }, scene.duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [isPlaying, currentScene, showCTA]);

  const handlePlay = () => {
    setIsPlaying(true);
    setShowCTA(false);

    if (videoData?.video_type === 'upload' && videoRef.current) {
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

  const scene = scenes[currentScene];
  const hasVideo = videoData && !videoError;
  const embedUrl = videoData && (videoData.video_type === 'youtube' || videoData.video_type === 'tiktok')
    ? videoIntroService.getEmbedUrl(videoData.video_type, videoData.video_url)
    : null;

  return (
    <div className="fixed inset-0 z-[100] bg-black animate-fade-in" dir="rtl">
      {hasVideo && videoData ? (
        <div className="absolute inset-0">
          {videoData.video_type === 'upload' && (
            <video
              ref={videoRef}
              src={videoData.video_url}
              className="w-full h-full object-cover"
              muted={isMuted}
              playsInline
              onEnded={handleVideoEnd}
            />
          )}
          {(videoData.video_type === 'youtube' || videoData.video_type === 'tiktok') && embedUrl && (
            <iframe
              ref={iframeRef}
              src={isPlaying ? embedUrl : ''}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isPlaying ? 'transparent' : 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 100%)'
            }}
          />
        </div>
      ) : (
        scenes.map((s, idx) => (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              opacity: idx === currentScene ? 1 : 0,
              zIndex: idx === currentScene ? 1 : 0
            }}
          >
            <img
              src={s.image}
              alt=""
              className="w-full h-full object-cover"
              style={{
                transform: isPlaying ? 'scale(1.1)' : 'scale(1)',
                transition: `transform ${s.duration}ms ease-out`
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 100%)'
              }}
            />
          </div>
        ))
      )}

      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
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

      {isPlaying && (
        <div className="absolute top-16 left-4 right-4 z-10">
          <div className="flex gap-1">
            {scenes.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-1 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.3)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    background: 'white',
                    width: idx < currentScene ? '100%' : idx === currentScene ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6">
        {!isPlaying && !showCTA && (
          <div className="text-center animate-fade-in">
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
            ) : videoError ? (
              <div className="mb-8">
                <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '3px solid rgba(239, 68, 68, 0.5)'
                  }}
                >
                  <AlertCircle className="w-12 h-12 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">لم يتم إضافة فيديو تعريفي</h2>
                <p className="text-white/80">سيتم عرض الشرائح الافتراضية</p>
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
              {hasVideo && videoData ? videoData.title : 'تعرّف على جود'}
            </h2>
            <p className="text-white/80">
              {hasVideo && videoData ? videoData.description || 'اضغط لمشاهدة العرض التعريفي' : 'اضغط لمشاهدة العرض التعريفي'}
            </p>
          </div>
        )}

        {isPlaying && (
          <div className="text-center max-w-lg animate-fade-in-up">
            <h2
              className="text-3xl lg:text-4xl font-bold text-white mb-4"
              style={{
                textShadow: '0 2px 20px rgba(0,0,0,0.5)'
              }}
            >
              {scene.text}
            </h2>
            {scene.subText && (
              <p
                className="text-lg text-white/90"
                style={{
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}
              >
                {scene.subText}
              </p>
            )}
          </div>
        )}

        {showCTA && (
          <div className="text-center animate-scale-in">
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

      {isPlaying && hasVideo && videoData?.video_type === 'upload' && (
        <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center">
          <button
            onClick={toggleMute}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95"
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
