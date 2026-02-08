import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Play, Shield, TrendingUp, Star, Handshake, User, Sprout, Bot, CheckCircle, ChevronLeft, Users, TreePine, Calendar, Award, Zap, Bell, X, Plus } from 'lucide-react';
import IntroVideoPlayer from './IntroVideoPlayer';
import NotificationCenter from './NotificationCenter';
import { supabase } from '../lib/supabase';
import { partnerShareMessageService } from '../services/partnerShareMessageService';
import { getUnreadCount } from '../services/messagesService';

interface NewHomePageProps {
  onStartInvestment: () => void;
  onOpenPartnerProgram: () => void;
  onOpenAccount: () => void;
  onOpenAssistant: () => void;
  onOfferFarm: () => void;
  hideFooter?: boolean;
}

interface PlatformStats {
  totalReservations: number;
  totalUsers: number;
  totalFarms: number;
  recentReservations: number;
}

interface IntroVideo {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  thumbnail_url: string | null;
  duration: number | null;
}

const NewHomePage: React.FC<NewHomePageProps> = ({
  onStartInvestment,
  onOpenPartnerProgram,
  onOpenAccount,
  onOpenAssistant,
  onOfferFarm,
  hideFooter = false
}) => {
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [introVideo, setIntroVideo] = useState<IntroVideo | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [showPartnerBanner, setShowPartnerBanner] = useState(true);
  const [partnerBannerEnabled, setPartnerBannerEnabled] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [stats, setStats] = useState<PlatformStats>({
    totalReservations: 0,
    totalUsers: 0,
    totalFarms: 0,
    recentReservations: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total reservations
        const { count: totalReservations } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true });

        // Get total users
        const { count: totalUsers } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });

        // Get total farms
        const { count: totalFarms } = await supabase
          .from('farms')
          .select('*', { count: 'exact', head: true });

        // Get recent reservations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: recentReservations } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString());

        setStats({
          totalReservations: totalReservations || 0,
          totalUsers: totalUsers || 0,
          totalFarms: totalFarms || 0,
          recentReservations: recentReservations || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Fetch partner banner status
  useEffect(() => {
    const fetchPartnerBannerStatus = async () => {
      try {
        const template = await partnerShareMessageService.getTemplate();
        setPartnerBannerEnabled(template.enabled);
      } catch (error) {
        console.error('Error fetching partner banner status:', error);
      }
    };

    fetchPartnerBannerStatus();
  }, []);

  // Fetch active intro video
  useEffect(() => {
    const fetchIntroVideo = async () => {
      try {
        setLoadingVideo(true);

        // Detect device type
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const deviceType = isMobile ? 'mobile' : 'desktop';

        // Get active intro video for this device
        const { data, error } = await supabase
          .rpc('get_active_intro_video', { p_device_type: deviceType });

        if (error) {
          console.error('Error fetching intro video:', error);
          return;
        }

        if (data && data.length > 0) {
          setIntroVideo(data[0]);
          console.log('✅ Loaded intro video:', data[0].title);
        } else {
          console.log('ℹ️ No active intro video found for', deviceType);
        }
      } catch (error) {
        console.error('Error fetching intro video:', error);
      } finally {
        setLoadingVideo(false);
      }
    };

    fetchIntroVideo();
  }, []);

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleVideoPlay = async () => {
    if (!introVideo) {
      console.warn('⚠️ No intro video available');
      return;
    }

    console.log('🎬 Playing intro video:', {
      id: introVideo.id,
      title: introVideo.title,
      url: introVideo.file_url
    });

    // Increment view count
    try {
      await supabase.rpc('increment_video_views', { video_id: introVideo.id });
      console.log('📊 Video view count incremented');
    } catch (error) {
      console.error('❌ Error incrementing view count:', error);
    }

    setShowVideoPlayer(true);
    console.log('✅ Video player opened');
  };

  const handleUnreadCountChange = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  useEffect(() => {
    handleUnreadCountChange();
  }, []);

  return (
    <div className="scrollbar-hide" style={{ minHeight: '100dvh', position: 'relative', overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
      {/* Header */}
      <header
        className="h-14 lg:h-16 px-4 lg:px-12 flex items-center justify-between backdrop-blur-2xl flex-shrink-0 fixed left-0 right-0 top-0"
        style={{
          background: 'linear-gradient(135deg, rgba(248, 250, 249, 0.98) 0%, rgba(242, 247, 244, 0.96) 100%)',
          borderBottom: '3px solid rgba(58,161,126,0.4)',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.1), inset 0 -1px 0 rgba(255,255,255,0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          zIndex: 9999
        }}
      >
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 lg:gap-4 transition-all duration-300 hover:scale-105 active:scale-95 group"
        >
          <div
            className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:shadow-xl"
            style={{
              background: 'linear-gradient(145deg, #3AA17E 0%, #2F8266 50%, #3AA17E 100%)',
              boxShadow: '0 4px 12px rgba(58,161,126,0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/20 pointer-events-none"></div>
            <Sprout className="w-5 h-5 lg:w-7 lg:h-7 text-white drop-shadow-2xl relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
          </div>
          <div className="flex flex-col leading-none">
            <h1
              className="text-sm lg:text-2xl font-black transition-all duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #3AA17E 0%, #2F8266 50%, #3AA17E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.01em'
              }}
            >
              حصص زراعية
            </h1>
            <p className="text-[8px] lg:text-sm text-darkgreen/70 font-bold mt-0.5">
              استثمر واربح
            </p>
          </div>
        </button>
      </header>

      {/* Partner Success Banner */}
      {partnerBannerEnabled && showPartnerBanner && (
        <div
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            zIndex: 9998,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.98) 0%, rgba(217, 119, 6, 0.98) 100%)',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
          }}
          className="lg:top-16"
        >
          <div className="max-w-7xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('Partner banner clicked!');
                if (onOpenPartnerProgram) {
                  onOpenPartnerProgram();
                }
              }}
              className="flex items-center gap-2 flex-1 min-w-0 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '8px 12px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Handshake className="w-5 h-5 lg:w-6 lg:h-6 text-white drop-shadow-lg flex-shrink-0" />
              <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                <span className="text-white font-black text-xs sm:text-sm lg:text-base whitespace-nowrap tracking-tight">
                  برنامج شركاء النجاح
                </span>
                <span className="text-white/90 font-bold text-xs sm:text-sm hidden sm:inline whitespace-nowrap">
                  •
                </span>
                <span className="text-white/90 font-semibold text-xs sm:text-sm hidden sm:inline whitespace-nowrap">
                  اربح من كل حجز
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-white/95 font-bold text-xs hidden md:inline whitespace-nowrap">
                  انضم الآن
                </span>
                <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5 text-white/95 flex-shrink-0" />
              </div>
            </button>
            <button
              onClick={() => setShowPartnerBanner(false)}
              className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-all duration-200 flex-shrink-0"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <X className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Background Image with Gradient Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url('https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(255,255,255,0.1), rgba(255,255,255,0.8))' }}></div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, white, transparent, transparent)', opacity: 0.6 }}></div>
      </div>

      {/* Content */}
      <div className="scrollbar-hide" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100dvh', paddingTop: partnerBannerEnabled && showPartnerBanner ? '96px' : '56px', overflowX: 'hidden', width: '100%' }}>
        {/* Hero Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', paddingBottom: '100px' }}>
          <div className="w-full max-w-lg space-y-3">
            {/* Main Heading - Compact */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center leading-tight drop-shadow-md">
              استثمر في الزراعة بثقة
            </h1>

            {/* Subtitle - Compact */}
            <p className="text-base md:text-lg text-gray-800 font-medium text-center drop-shadow-sm">
              أصول حقيقية • إدارة احترافية
            </p>

            {/* Live Stats Ticker - Scrolling */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl py-2 shadow-xl border border-white/60 overflow-hidden">
              <div className="relative w-full">
                <div className="flex animate-scroll-ltr whitespace-nowrap">
                  {/* First Set of Stats */}
                  <div className="flex items-center gap-4 px-4">
                    {/* Total Reservations */}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-green-600 drop-shadow-md flex-shrink-0" />
                      <span className="text-gray-900 font-bold text-xs">{stats.totalReservations}</span>
                      <span className="text-gray-700 text-xs">حجز</span>
                    </div>

                    <div className="w-px h-4 bg-gray-300"></div>

                    {/* Total Users */}
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600 drop-shadow-md flex-shrink-0" />
                      <span className="text-gray-900 font-bold text-xs">{stats.totalUsers}</span>
                      <span className="text-gray-700 text-xs">مستثمر</span>
                    </div>

                    <div className="w-px h-4 bg-gray-300"></div>

                    {/* Total Farms */}
                    <div className="flex items-center gap-1.5">
                      <TreePine className="w-4 h-4 text-green-700 drop-shadow-md flex-shrink-0" />
                      <span className="text-gray-900 font-bold text-xs">{stats.totalFarms}</span>
                      <span className="text-gray-700 text-xs">مزرعة</span>
                    </div>

                    <div className="w-px h-4 bg-gray-300"></div>

                    {/* Recent Reservations */}
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500 drop-shadow-md flex-shrink-0" />
                      <span className="text-gray-900 font-bold text-xs">{stats.recentReservations}</span>
                      <span className="text-gray-700 text-xs">حجز خلال 30 يوم</span>
                    </div>

                    <div className="w-px h-4 bg-gray-300"></div>

                    {/* Platform Active */}
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600 drop-shadow-md flex-shrink-0" />
                      <span className="text-gray-900 font-bold text-xs">منصة موثوقة</span>
                      <CheckCircle className="w-3.5 h-3.5 text-green-600 drop-shadow-md flex-shrink-0" />
                    </div>
                  </div>

                  {/* Duplicate Set for Seamless Loop */}
                  <div className="flex items-center gap-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-green-600 drop-shadow-md flex-shrink-0" />
                      <span className="text-gray-900 font-bold text-xs">{stats.totalReservations}</span>
                      <span className="text-gray-700 text-xs">حجز</span>
                    </div>

                    <div className="w-px h-4 bg-gray-300"></div>

                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600 drop-shadow-md flex-shrink-0" />
                      <span className="text-gray-900 font-bold text-xs">{stats.totalUsers}</span>
                      <span className="text-gray-700 text-xs">مستثمر</span>
                    </div>

                    <div className="w-px h-4 bg-gray-300"></div>

                    <div className="flex items-center gap-1.5">
                      <TreePine className="w-4 h-4 text-green-700 drop-shadow-md flex-shrink-0" />
                      <span className="text-gray-900 font-bold text-xs">{stats.totalFarms}</span>
                      <span className="text-gray-700 text-xs">مزرعة</span>
                    </div>

                    <div className="w-px h-4 bg-gray-300"></div>

                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500 drop-shadow-md flex-shrink-0" />
                      <span className="text-gray-900 font-bold text-xs">{stats.recentReservations}</span>
                      <span className="text-gray-700 text-xs">حجز خلال 30 يوم</span>
                    </div>

                    <div className="w-px h-4 bg-gray-300"></div>

                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600 drop-shadow-md flex-shrink-0" />
                      <span className="text-gray-900 font-bold text-xs">منصة موثوقة</span>
                      <CheckCircle className="w-3.5 h-3.5 text-green-600 drop-shadow-md flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Button - Compact */}
            {!loadingVideo && introVideo && (
              <button
                onClick={handleVideoPlay}
                className="bg-white/80 backdrop-blur-md rounded-full px-5 py-2.5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 border border-white/60 w-full justify-center"
              >
                <div className="bg-green-700 rounded-full p-1.5 shadow-lg">
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                </div>
                <span className="text-gray-900 font-bold text-sm">
                  {introVideo.title}
                </span>
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
            )}

            {/* What Are You Looking For Section - Compact */}
            <h2 className="text-lg md:text-xl font-bold text-gray-900 text-center pt-2 drop-shadow-sm">
              ما الذي تبحث عنه؟
            </h2>

            {/* Three Cards - Compact */}
            <div className="grid grid-cols-3 gap-2 w-full">
              {/* Card 1: Stable Income */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-xl border border-white/60 flex flex-col items-center justify-center min-h-[100px] hover:scale-105 transition-transform duration-300">
                <div className="relative mb-1.5">
                  <Shield className="w-8 h-8 text-amber-500 drop-shadow-lg" />
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 absolute -top-0.5 -right-0.5 bg-white rounded-full shadow-md" />
                </div>
                <p className="text-gray-900 font-bold text-center text-xs leading-tight">
                  دخل ثابت
                </p>
                <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-1.5 drop-shadow-md" />
              </div>

              {/* Card 2: Annual Returns */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-xl border border-white/60 flex flex-col items-center justify-center min-h-[100px] hover:scale-105 transition-transform duration-300">
                <div className="relative mb-1.5">
                  <TrendingUp className="w-8 h-8 text-green-700 drop-shadow-lg" />
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 absolute -top-0.5 -right-0.5 bg-white rounded-full shadow-md" />
                </div>
                <p className="text-gray-900 font-bold text-center text-xs leading-tight">
                  عوائد سنوية
                </p>
                <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-1.5 drop-shadow-md" />
              </div>

              {/* Card 3: Safe First Experience */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-xl border border-white/60 flex flex-col items-center justify-center min-h-[100px] hover:scale-105 transition-transform duration-300">
                <div className="relative mb-1.5">
                  <Star className="w-8 h-8 text-amber-500 fill-amber-500 drop-shadow-lg" />
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 absolute -top-0.5 -right-0.5 bg-white rounded-full shadow-md" />
                </div>
                <p className="text-gray-900 font-bold text-center text-xs leading-tight">
                  تجربة أولى آمنة
                </p>
                <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-1.5 drop-shadow-md" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Fixed Bottom Footer - Unified Design for Mobile & Desktop */}
      {!hideFooter && ReactDOM.createPortal(
        <div
          id="home-footer-portal"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2147483647,
            background: '#ffffff',
            borderTop: '1px solid #e5e7eb',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
            WebkitTransform: 'translate3d(0, 0, 0)',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
              maxWidth: '600px',
              margin: '0 auto',
              gap: '8px'
            }}
          >
            <button
              onClick={onStartInvestment}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '8px' : '12px',
                padding: isMobile ? '14px 16px' : '18px 24px',
                borderRadius: isMobile ? '16px' : '20px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 25%, #065f46 50%, #064e3b 75%, #14532d 100%)',
                boxShadow: `
                  0 0 40px rgba(16, 185, 129, 0.6),
                  0 8px 32px rgba(5, 150, 105, 0.5),
                  0 4px 16px rgba(4, 120, 87, 0.4),
                  inset 0 2px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -4px 0 rgba(0, 0, 0, 0.3),
                  0 0 0 1px rgba(16, 185, 129, 0.5)
                `,
                border: '2px solid rgba(52, 211, 153, 0.6)',
                cursor: 'pointer',
                position: 'relative',
                transform: 'translateY(0) perspective(1000px) rotateX(0deg)',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                overflow: 'visible',
                minHeight: isMobile ? '56px' : '64px',
                transformStyle: 'preserve-3d'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) perspective(1000px) rotateX(5deg) scale(1.02)';
                e.currentTarget.style.boxShadow = `
                  0 0 60px rgba(16, 185, 129, 0.8),
                  0 12px 48px rgba(5, 150, 105, 0.6),
                  0 6px 24px rgba(4, 120, 87, 0.5),
                  inset 0 2px 0 rgba(255, 255, 255, 0.4),
                  inset 0 -4px 0 rgba(0, 0, 0, 0.3),
                  0 0 0 2px rgba(52, 211, 153, 0.8),
                  0 0 20px rgba(52, 211, 153, 0.6)
                `;
                e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) perspective(1000px) rotateX(0deg) scale(1)';
                e.currentTarget.style.boxShadow = `
                  0 0 40px rgba(16, 185, 129, 0.6),
                  0 8px 32px rgba(5, 150, 105, 0.5),
                  0 4px 16px rgba(4, 120, 87, 0.4),
                  inset 0 2px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -4px 0 rgba(0, 0, 0, 0.3),
                  0 0 0 1px rgba(16, 185, 129, 0.5)
                `;
                e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.6)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(2px) perspective(1000px) rotateX(-2deg) scale(0.98)';
                e.currentTarget.style.boxShadow = `
                  0 0 20px rgba(16, 185, 129, 0.5),
                  0 4px 16px rgba(5, 150, 105, 0.4),
                  0 2px 8px rgba(4, 120, 87, 0.3),
                  inset 0 4px 12px rgba(0, 0, 0, 0.4)
                `;
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) perspective(1000px) rotateX(5deg) scale(1.02)';
                e.currentTarget.style.boxShadow = `
                  0 0 60px rgba(16, 185, 129, 0.8),
                  0 12px 48px rgba(5, 150, 105, 0.6),
                  0 6px 24px rgba(4, 120, 87, 0.5),
                  inset 0 2px 0 rgba(255, 255, 255, 0.4),
                  inset 0 -4px 0 rgba(0, 0, 0, 0.3),
                  0 0 0 2px rgba(52, 211, 153, 0.8)
                `;
              }}
            >
              {/* Animated Background Particles */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
                  radial-gradient(circle at 80% 50%, rgba(52, 211, 153, 0.3) 0%, transparent 50%),
                  radial-gradient(circle at 50% 20%, rgba(110, 231, 183, 0.2) 0%, transparent 50%)
                `,
                animation: 'pulse 3s ease-in-out infinite',
                pointerEvents: 'none',
                zIndex: 1
              }} />

              {/* Glass Morphism Layer */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, transparent 30%, rgba(0, 0, 0, 0.2) 100%)',
                borderRadius: '18px',
                pointerEvents: 'none',
                zIndex: 2
              }} />

              {/* Animated Light Wave */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-100%',
                width: '300%',
                height: '300%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                transform: 'rotate(30deg)',
                animation: 'wave 4s linear infinite',
                pointerEvents: 'none',
                zIndex: 3
              }} />

              {/* Pulsing Neon Border */}
              <div style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.6), rgba(16, 185, 129, 0.6), rgba(5, 150, 105, 0.6))',
                filter: 'blur(4px)',
                animation: 'neonPulse 2s ease-in-out infinite',
                pointerEvents: 'none',
                zIndex: 0
              }} />

              {/* Animated Icon */}
              <div style={{
                position: 'relative',
                zIndex: 5,
                animation: 'iconBounce 2s ease-in-out infinite',
                flexShrink: 0
              }}>
                <Sprout style={{
                  width: isMobile ? '22px' : '28px',
                  height: isMobile ? '22px' : '28px',
                  color: '#ffffff',
                  filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))'
                }} />
              </div>

              {/* Glowing Text */}
              <span style={{
                fontWeight: 900,
                color: '#ffffff',
                fontSize: isMobile ? '15px' : '18px',
                textShadow: `
                  0 0 20px rgba(52, 211, 153, 0.8),
                  0 0 10px rgba(16, 185, 129, 0.6),
                  0 2px 8px rgba(0, 0, 0, 0.6),
                  0 1px 3px rgba(0, 0, 0, 0.8)
                `,
                letterSpacing: isMobile ? '0.2px' : '0.5px',
                position: 'relative',
                zIndex: 5,
                whiteSpace: 'nowrap',
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                احجز أشجارك المثمرة
              </span>

              {/* Sparkle Effects */}
              <div style={{
                position: 'absolute',
                top: '10%',
                right: '10%',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
                animation: 'sparkle 1.5s ease-in-out infinite',
                pointerEvents: 'none',
                zIndex: 4
              }} />
              <div style={{
                position: 'absolute',
                bottom: '20%',
                left: '15%',
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
                animation: 'sparkle 2s ease-in-out infinite 0.5s',
                pointerEvents: 'none',
                zIndex: 4
              }} />

              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 0.5; transform: scale(1); }
                  50% { opacity: 1; transform: scale(1.1); }
                }
                @keyframes wave {
                  0% { transform: translateX(-100%) rotate(30deg); }
                  100% { transform: translateX(100%) rotate(30deg); }
                }
                @keyframes neonPulse {
                  0%, 100% { opacity: 0.6; }
                  50% { opacity: 1; }
                }
                @keyframes iconBounce {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-3px); }
                }
                @keyframes sparkle {
                  0%, 100% { opacity: 0; transform: scale(0); }
                  50% { opacity: 1; transform: scale(1); }
                }
              `}</style>
            </button>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ minWidth: '60px', display: 'flex', justifyContent: 'center' }}>
                <NotificationCenter
                  unreadCount={unreadMessagesCount}
                  onCountChange={handleUnreadCountChange}
                  onOpenChange={() => {}}
                />
              </div>

              <button
                onClick={onOpenAssistant}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: '60px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <Bot style={{ width: '24px', height: '24px', color: '#374151' }} />
                <span style={{ fontSize: '11px', color: '#374151', fontWeight: 500 }}>المساعد الذكي</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Video Player Modal */}
      {showVideoPlayer && introVideo && (
        <IntroVideoPlayer
          videoUrl={introVideo.file_url}
          videoTitle={introVideo.title}
          onClose={() => setShowVideoPlayer(false)}
        />
      )}
    </div>
  );
};

export default NewHomePage;
