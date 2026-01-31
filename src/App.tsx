import { User, Calculator, Sprout, Wheat, Apple, Grape, Leaf, Video, HelpCircle, Home, Sparkles, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import VideoIntro from './components/VideoIntro';
import HowToStart from './components/HowToStart';
import SmartAssistant from './components/SmartAssistant';
import NotificationCenter from './components/NotificationCenter';
import AccountProfile from './components/AccountProfile';
import StandaloneAccountRegistration from './components/StandaloneAccountRegistration';
import WelcomeToAccountScreen from './components/WelcomeToAccountScreen';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import AppModeSelector, { type AppMode } from './components/AppModeSelector';
import InvestmentFarmPage from './components/InvestmentFarmPage';
import AgriculturalFarmPage from './components/AgriculturalFarmPage';
import { farmService, type FarmCategory, type FarmProject } from './services/farmService';
import { getUnreadCount } from './services/messagesService';
import { useAuth } from './contexts/AuthContext';
import { initializeSupabase } from './lib/supabase';

function App() {
  const { user } = useAuth();
  const [appMode, setAppMode] = useState<AppMode>(() => {
    const savedMode = localStorage.getItem('appMode');
    return (savedMode === 'agricultural' || savedMode === 'investment') ? savedMode : 'agricultural';
  });
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [categories, setCategories] = useState<FarmCategory[]>([]);
  const [farmProjects, setFarmProjects] = useState<Record<string, FarmProject[]>>({});
  const [loading, setLoading] = useState(true);
  const [showVideoIntro, setShowVideoIntro] = useState(false);
  const [showHowToStart, setShowHowToStart] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showAccountProfile, setShowAccountProfile] = useState(false);
  const [showStandaloneRegistration, setShowStandaloneRegistration] = useState(false);
  const [showWelcomeToAccount, setShowWelcomeToAccount] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [selectedInvestmentFarm, setSelectedInvestmentFarm] = useState<FarmProject | null>(null);

  const handleAppModeChange = (mode: AppMode) => {
    setAppMode(mode);
    localStorage.setItem('appMode', mode);
    setCurrentSlideIndex(0);
  };

  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let refreshInterval: NodeJS.Timeout;
    let isFirstLoad = true;

    async function loadData(isRetry: boolean = false) {
      const wasFirstLoad = isFirstLoad;

      if (!isRetry && wasFirstLoad) {
        console.log('[App] Initial load: Starting to load farm data...')
        setLoading(true);
      } else if (isRetry) {
        console.log(`[App] Retrying to load farm data... (Attempt ${retryCount + 1}/${MAX_RETRIES})`)
      } else {
        console.log('[App] Background refresh: Updating farm data...')
      }

      try {
        const [cats, allProjects] = await Promise.all([
          farmService.getDisplayCategories(),
          farmService.getAllDisplayProjects()
        ]);

        console.log('[App] Loaded categories:', cats?.length || 0)
        console.log('[App] Loaded projects:', Object.keys(allProjects).length)

        if (!cats || cats.length === 0) {
          console.warn('[App] No categories found');
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
            console.log(`[App] Retrying in ${retryDelay}ms...`);
            setTimeout(() => loadData(true), retryDelay);
            return;
          }

          if (wasFirstLoad) {
            setCategories([]);
            setFarmProjects({});
            setLoading(false);
          } else {
            console.warn('[App] Background refresh failed, keeping existing data');
          }
          return;
        }

        retryCount = 0;
        setCategories(cats);

        if (wasFirstLoad) {
          const firstCategorySlug = cats[0].slug;
          setActiveCategory(firstCategorySlug);
          console.log('[App] Initial load: Setting active category to:', firstCategorySlug);
          isFirstLoad = false;
        }

        setFarmProjects(allProjects);
        console.log('[App] Farm data loaded successfully')
        console.log('[App] Available farm categories:', Object.keys(allProjects))
      } catch (error) {
        console.error('[App] Error loading farm data:', error);

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          console.log(`[App] Retrying in ${retryDelay}ms...`);
          setTimeout(() => loadData(true), retryDelay);
          return;
        }

        if (wasFirstLoad) {
          console.error('[App] Max retries reached. Using empty data.');
          setCategories([]);
          setFarmProjects({});
        } else {
          console.warn('[App] Background refresh failed, keeping existing data');
        }
      } finally {
        if (wasFirstLoad || !isRetry) {
          setLoading(false);
          console.log('[App] Loading state set to false')
        }
      }
    }

    loadData();

    refreshInterval = setInterval(() => {
      console.log('[App] Auto-refreshing farm data...');
      loadData(false);
    }, 120000);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let mounted = true;

    async function loadUnreadCount() {
      if (!mounted) {
        return;
      }

      try {
        await initializeSupabase();
        await new Promise(resolve => setTimeout(resolve, 500));

        const count = await getUnreadCount();
        if (mounted) {
          setUnreadMessagesCount(count);
        }
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    }

    const startLoadingMessages = async () => {
      await loadUnreadCount();

      if (mounted) {
        interval = setInterval(loadUnreadCount, 30000);
      }
    };

    startLoadingMessages();

    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const iconMap: Record<string, any> = {
    leaf: Leaf,
    wheat: Wheat,
    grape: Grape,
    apple: Apple,
    palm: Wheat,
    Leaf: Leaf,
    Wheat: Wheat,
    Grape: Grape,
    Apple: Apple
  };

  const colorScheme: Record<string, Record<AppMode, {
    iconGradient: string;
    cardGradient: string;
    border: string;
    shadow: string;
  }>> = {
    leaf: {
      agricultural: {
        iconGradient: 'linear-gradient(145deg, rgba(180, 240, 180, 0.95) 0%, rgba(200, 255, 200, 0.90) 50%, rgba(180, 240, 180, 0.95) 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(200, 255, 200, 0.85) 0%, rgba(220, 255, 220, 0.80) 50%, rgba(200, 255, 200, 0.85) 100%)',
        border: 'rgba(58, 161, 126, 0.70)',
        shadow: 'rgba(58, 161, 126, 0.45)'
      },
      investment: {
        iconGradient: 'linear-gradient(145deg, rgba(255, 245, 210, 0.95) 0%, rgba(255, 250, 230, 0.90) 50%, rgba(255, 245, 210, 0.95) 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(255, 250, 230, 0.85) 0%, rgba(255, 255, 245, 0.80) 50%, rgba(255, 250, 230, 0.85) 100%)',
        border: 'rgba(212, 175, 55, 0.70)',
        shadow: 'rgba(212, 175, 55, 0.45)'
      }
    },
    wheat: {
      agricultural: {
        iconGradient: 'linear-gradient(145deg, rgba(180, 240, 190, 0.95) 0%, rgba(200, 255, 210, 0.88) 50%, rgba(190, 248, 200, 0.92) 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(200, 255, 210, 0.72) 0%, rgba(220, 255, 225, 0.65) 50%, rgba(210, 255, 220, 0.70) 100%)',
        border: 'rgba(58, 161, 126, 0.60)',
        shadow: 'rgba(58, 161, 126, 0.38)'
      },
      investment: {
        iconGradient: 'linear-gradient(145deg, rgba(255, 248, 220, 0.95) 0%, rgba(255, 240, 190, 0.88) 50%, rgba(255, 245, 210, 0.92) 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(255, 245, 210, 0.72) 0%, rgba(255, 235, 180, 0.65) 50%, rgba(255, 241, 200, 0.70) 100%)',
        border: 'rgba(212, 175, 55, 0.60)',
        shadow: 'rgba(212, 175, 55, 0.38)'
      }
    },
    apple: {
      agricultural: {
        iconGradient: 'linear-gradient(145deg, rgba(200, 255, 220, 0.92) 0%, rgba(220, 255, 235, 0.88) 50%, rgba(210, 255, 228, 0.90) 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(210, 255, 228, 0.75) 0%, rgba(225, 255, 238, 0.68) 50%, rgba(218, 255, 233, 0.72) 100%)',
        border: 'rgba(58, 161, 126, 0.55)',
        shadow: 'rgba(58, 161, 126, 0.40)'
      },
      investment: {
        iconGradient: 'linear-gradient(145deg, rgba(255, 250, 225, 0.92) 0%, rgba(255, 245, 210, 0.88) 50%, rgba(255, 248, 218, 0.90) 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(255, 248, 218, 0.75) 0%, rgba(255, 242, 200, 0.68) 50%, rgba(255, 246, 212, 0.72) 100%)',
        border: 'rgba(212, 175, 55, 0.55)',
        shadow: 'rgba(212, 175, 55, 0.40)'
      }
    },
    grape: {
      agricultural: {
        iconGradient: 'linear-gradient(145deg, rgba(190, 250, 210, 0.95) 0%, rgba(210, 255, 225, 0.88) 50%, rgba(200, 253, 218, 0.92) 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(200, 253, 218, 0.72) 0%, rgba(220, 255, 230, 0.65) 50%, rgba(212, 254, 225, 0.70) 100%)',
        border: 'rgba(58, 161, 126, 0.58)',
        shadow: 'rgba(58, 161, 126, 0.35)'
      },
      investment: {
        iconGradient: 'linear-gradient(145deg, rgba(255, 242, 200, 0.95) 0%, rgba(255, 235, 180, 0.88) 50%, rgba(255, 240, 192, 0.92) 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(255, 240, 192, 0.72) 0%, rgba(255, 232, 170, 0.65) 50%, rgba(255, 237, 183, 0.70) 100%)',
        border: 'rgba(212, 175, 55, 0.58)',
        shadow: 'rgba(212, 175, 55, 0.35)'
      }
    },
    palm: {
      agricultural: {
        iconGradient: 'linear-gradient(145deg, rgba(185, 245, 200, 0.95) 0%, rgba(205, 255, 215, 0.88) 50%, rgba(195, 251, 208, 0.92) 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(195, 251, 208, 0.72) 0%, rgba(215, 255, 220, 0.65) 50%, rgba(207, 253, 215, 0.70) 100%)',
        border: 'rgba(58, 161, 126, 0.62)',
        shadow: 'rgba(58, 161, 126, 0.33)'
      },
      investment: {
        iconGradient: 'linear-gradient(145deg, rgba(255, 245, 205, 0.95) 0%, rgba(255, 238, 185, 0.88) 50%, rgba(255, 242, 196, 0.92) 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(255, 242, 196, 0.72) 0%, rgba(255, 235, 175, 0.65) 50%, rgba(255, 239, 188, 0.70) 100%)',
        border: 'rgba(212, 175, 55, 0.62)',
        shadow: 'rgba(212, 175, 55, 0.33)'
      }
    }
  };

  const getColorForIcon = (iconName: string, mode: AppMode) => {
    const normalizedName = iconName.toLowerCase();
    return colorScheme[normalizedName]?.[mode] || colorScheme.leaf[mode];
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setCurrentSlideIndex(0);
  };

  const currentFarms = farmProjects[activeCategory] || [];
  const activeIconName = categories.find(cat => cat.slug === activeCategory)?.icon || 'leaf';
  const activeColors = getColorForIcon(activeIconName, appMode);

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) =>
      prev === 0 ? currentFarms.length - 1 : prev - 1
    );
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) =>
      prev === currentFarms.length - 1 ? 0 : prev + 1
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      handleNextSlide();
    }

    if (touchStart - touchEnd < -75) {
      handlePrevSlide();
    }
  };

  const handleUnreadCountChange = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  const handleMyAccountClick = () => {
    if (user) {
      setShowAccountProfile(true);
    } else {
      setShowWelcomeToAccount(true);
    }
  };

  const handleWelcomeStartNow = () => {
    setShowWelcomeToAccount(false);
    setShowStandaloneRegistration(true);
  };

  const handleRegistrationSuccess = () => {
    setShowStandaloneRegistration(false);
    setShowAccountProfile(true);
  };

  return (
    <ErrorBoundary>
      <div
        className="h-screen flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(254, 254, 254, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <Header />

        <div
          className="flex-1 overflow-y-auto lg:pb-4 pt-14 lg:pt-16"
          style={{
            paddingBottom: '12rem'
          }}
        >
          <div className="max-w-7xl mx-auto">
        <section className="px-3 lg:px-6 pt-1 lg:pt-4 pb-0.5 lg:pb-2 flex-shrink-0">
          <div className="relative w-full h-14 lg:h-64 xl:h-72 overflow-hidden rounded-xl lg:rounded-3xl" style={{ border: '2px solid #3AA17E' }}>
            <div className="absolute inset-0">
              <img
                src="https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="مزرعة"
                className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-105"
              />
            </div>

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  linear-gradient(135deg, rgba(47,82,51,0.15) 0%, transparent 20%),
                  linear-gradient(225deg, rgba(58,161,126,0.15) 0%, transparent 20%),
                  linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)
                `,
                boxShadow: 'inset 0 0 30px rgba(47,82,51,0.3)'
              }}
            />

            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.8) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 50%, rgba(255,255,255,0.6) 0%, transparent 50%)`
              }}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 lg:px-8 text-center">
              <div
                className="relative px-4 py-2 lg:px-12 lg:py-6 rounded-xl lg:rounded-2xl backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}
              >
                <h1
                  className="text-xs lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-2xl"
                  style={{
                    textShadow: '0 2px 10px rgba(0,0,0,0.5), 0 0 20px rgba(58,161,126,0.3)'
                  }}
                >
                  استثمر في مزارع حقيقية
                </h1>
                <div
                  className="h-[2px] lg:h-1.5 mt-0.5 lg:mt-3 mx-auto rounded-full"
                  style={{
                    width: '60%',
                    background: 'linear-gradient(90deg, transparent 0%, #3AA17E 50%, transparent 100%)'
                  }}
                />
              </div>
            </div>

            <div className="absolute top-0 left-0 w-8 h-8 lg:w-16 lg:h-16" style={{
              background: 'linear-gradient(135deg, rgba(58,161,126,0.4) 0%, transparent 100%)',
              borderTopLeftRadius: '12px'
            }} />
            <div className="absolute top-0 right-0 w-8 h-8 lg:w-16 lg:h-16" style={{
              background: 'linear-gradient(225deg, rgba(58,161,126,0.4) 0%, transparent 100%)',
              borderTopRightRadius: '12px'
            }} />
          </div>
        </section>

        <section className="px-3 lg:px-6 py-0.5 lg:py-3 flex-shrink-0">
          <div className="flex gap-1.5 lg:gap-4 justify-between lg:max-w-4xl lg:mx-auto">
            {[
              { icon: Calculator, label: 'حاسبة مزرعتك', color: '#2F5233', onClick: () => alert('قريباً: حاسبة المزرعة') },
              { icon: Video, label: 'فيديو تعريفي', color: '#3D6B42', onClick: () => setShowVideoIntro(true) },
              { icon: HelpCircle, label: 'كيف تبدأ؟', color: '#2F5233', onClick: () => setShowHowToStart(true) }
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className="rounded-lg lg:rounded-xl flex-1 h-10 lg:h-24 xl:h-28 flex flex-col items-center justify-center bg-white relative group hover:scale-105 active:scale-95"
                style={{
                  boxShadow: `
                    0 6px 0 0 rgba(58,161,126,0.3),
                    0 8px 16px rgba(58,161,126,0.25),
                    inset 0 1px 0 rgba(255,255,255,0.8),
                    inset 0 -1px 0 rgba(58,161,126,0.1)
                  `,
                  border: '2px solid #3AA17E',
                  background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                  transform: 'translateY(0)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div className="absolute inset-0 rounded-lg lg:rounded-xl bg-gradient-to-br from-white/40 via-transparent to-black/5 pointer-events-none"></div>
                <action.icon
                  className="w-4 h-4 lg:w-8 lg:h-8 xl:w-9 xl:h-9 text-darkgreen mb-0 lg:mb-2 relative z-10 drop-shadow-md"
                  style={{ filter: 'drop-shadow(0 2px 3px rgba(47,82,51,0.3))' }}
                />
                <span className="text-[8px] lg:text-sm xl:text-base font-bold text-darkgreen relative z-10 text-center leading-tight px-1">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        <AppModeSelector
          activeMode={appMode}
          onModeChange={handleAppModeChange}
        />

        <section className="px-3 lg:px-6 py-0.5 lg:py-3 flex-shrink-0">
          <h3 className="text-[11px] lg:text-2xl xl:text-3xl font-bold mb-1 lg:mb-4 text-darkgreen text-center lg:text-right">المزارع المتاحة</h3>
          {categories.length === 0 ? (
            <div className="text-center py-4 text-darkgreen/70">
              <p className="text-sm">جاري تحميل الفئات...</p>
            </div>
          ) : (
          <div className="flex gap-1 lg:gap-4 justify-between lg:max-w-3xl lg:mx-auto">
            {categories.map((category) => {
              const Icon = iconMap[category.icon] || Leaf;
              const isActive = activeCategory === category.slug;
              const colors = getColorForIcon(category.icon, appMode);
              const iconColor = appMode === 'agricultural' ? '#3AA17E' : '#D4AF37';
              const textColor = appMode === 'agricultural' ? 'text-darkgreen' : 'text-[#B8942F]';

              return (
                <div key={category.slug} className="flex-1 flex flex-col items-center gap-0.5 lg:gap-2">
                  <button
                    onClick={() => handleCategoryChange(category.slug)}
                    className="rounded-lg lg:rounded-2xl w-full aspect-square flex items-center justify-center bg-white transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-lg relative overflow-hidden"
                    style={{
                      boxShadow: isActive
                        ? `0 3px 12px ${colors.shadow}, 0 6px 24px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.05)`
                        : '0 2px 6px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
                      background: isActive
                        ? colors.iconGradient
                        : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(249,249,249,0.8) 100%)',
                      border: `1.5px solid ${isActive ? colors.border : 'rgba(220,220,220,0.5)'}`,
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)'
                    }}
                  >
                    <Icon
                      className={`w-4 h-4 lg:w-9 lg:h-9 xl:w-11 xl:h-11 transition-colors duration-300 ${isActive ? 'drop-shadow-sm' : ''}`}
                      style={{ color: isActive ? iconColor : `${iconColor}60` }}
                    />
                  </button>
                  <span className={`text-[7px] lg:text-sm xl:text-base font-bold text-center leading-tight transition-colors duration-300 ${isActive ? textColor : `${textColor}/60`}`}>
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>
          )}
        </section>

        <section className="px-3 lg:px-6 py-0.5 lg:py-4 flex-shrink-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-darkgreen"></div>
              <p className="text-sm text-darkgreen/70">جاري تحميل المزارع...</p>
            </div>
          ) : currentFarms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Sprout className="w-16 h-16 text-darkgreen/30" />
              <p className="text-sm text-darkgreen/70 font-bold">لا توجد مزارع متاحة حالياً</p>
            </div>
          ) : (
            <>
              <div className="relative md:hidden">
                <div
                  className="overflow-hidden"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(${currentSlideIndex * -100}%)` }}
                  >
                    {currentFarms.map((farm) => {
                      const totalTrees = farm.availableTrees + farm.reservedTrees;
                      const reservationPercentage = (farm.reservedTrees / totalTrees) * 100;

                      return (
                        <div key={farm.id} className="w-full flex-shrink-0 px-0.5">
                          <div
                            onClick={() => {
                              setSelectedInvestmentFarm(farm);
                            }}
                            className="w-full rounded-xl overflow-hidden text-right backdrop-blur-xl relative cursor-pointer active:scale-95 transition-transform duration-200"
                            style={{
                              background: activeColors.cardGradient,
                              boxShadow: `0 8px 24px ${activeColors.shadow}, 0 4px 12px ${activeColors.shadow}, inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.03)`,
                              border: `2px solid ${activeColors.border}`,
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)'
                            }}
                          >
                            <div className="relative w-full h-16 overflow-hidden">
                              <img
                                src={farm.image}
                                alt={farm.name}
                                className="w-full h-full object-cover"
                              />
                              <div
                                className="absolute inset-0"
                                style={{
                                  background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 100%)'
                                }}
                              />
                              <div className="absolute top-1.5 right-1.5 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg">
                                <span className="text-[9px] font-black text-darkgreen">{farm.name}</span>
                              </div>
                              <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-lg border border-green-200">
                                <TrendingUp className="w-2.5 h-2.5 text-green-600" strokeWidth={2.5} />
                                <span className="text-[9px] font-black text-green-700">{farm.returnRate}</span>
                              </div>
                            </div>
                        <div className="p-2 space-y-1">
                          <div className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200 shadow-sm">
                            <Sparkles className="w-2 h-2 text-amber-500" strokeWidth={2.5} fill="currentColor" />
                            <span className="text-[8px] font-black text-amber-800">قريباً</span>
                          </div>

                          <div className="flex items-center justify-between gap-1 text-[7px]">
                            <div className="flex items-center gap-0.5 bg-green-50 rounded-md px-1.5 py-0.5 border border-green-200 shadow-sm flex-1">
                              <CheckCircle2 className="w-2 h-2 text-green-600" strokeWidth={2.5} />
                              <span className="font-black text-green-700 text-[8px]">{farm.availableTrees}</span>
                              <span className="font-bold text-green-600">متاح</span>
                            </div>
                            <div className="flex items-center gap-0.5 bg-amber-50 rounded-md px-1.5 py-0.5 border border-amber-200 shadow-sm flex-1">
                              <Clock className="w-2 h-2 text-amber-600" strokeWidth={2.5} />
                              <span className="font-black text-amber-700 text-[8px]">{farm.reservedTrees}</span>
                              <span className="font-bold text-amber-600">محجوز</span>
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 transition-all duration-700"
                                style={{
                                  width: `${reservationPercentage}%`,
                                  backgroundSize: '200% 100%'
                                }}
                              />
                            </div>
                            <p className="text-[7px] font-black text-amber-700 text-center">
                              نسبة الحجز: {reservationPercentage.toFixed(0)}%
                            </p>
                          </div>

                          <p className="text-[7px] leading-relaxed line-clamp-2 font-bold text-darkgreen/80">
                            {farm.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {currentFarms.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-6 h-6 bg-white/95 rounded-full flex items-center justify-center z-10 transition-all duration-300"
                  style={{
                    boxShadow: '0 2px 6px rgba(58,161,126,0.25)',
                    border: '1.5px solid #3AA17E'
                  }}
                >
                  <span className="text-darkgreen font-bold text-xs">→</span>
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-6 h-6 bg-white/95 rounded-full flex items-center justify-center z-10 transition-all duration-300"
                  style={{
                    boxShadow: '0 2px 6px rgba(58,161,126,0.25)',
                    border: '1.5px solid #3AA17E'
                  }}
                >
                  <span className="text-darkgreen font-bold text-xs">←</span>
                </button>
              </>
            )}
          </div>

          {currentFarms.length > 1 && (
            <div className="flex justify-center gap-1 mt-1.5">
              {currentFarms.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`rounded-full transition-all ${
                    index === currentSlideIndex
                      ? 'bg-darkgreen w-4 h-1'
                      : 'bg-darkgreen/30 w-1 h-1'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {currentFarms.map((farm) => {
              const totalTrees = farm.availableTrees + farm.reservedTrees;
              const reservationPercentage = (farm.reservedTrees / totalTrees) * 100;

              return (
                <div
                  key={farm.id}
                  onClick={() => {
                    setSelectedInvestmentFarm(farm);
                  }}
                  className="w-full rounded-xl overflow-hidden text-right backdrop-blur-xl relative cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200"
                  style={{
                    background: activeColors.cardGradient,
                    boxShadow: `0 8px 24px ${activeColors.shadow}, 0 4px 12px ${activeColors.shadow}, inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.03)`,
                    border: `2px solid ${activeColors.border}`,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                  }}
                >
                  <div className="relative w-full h-16 overflow-hidden">
                    <img
                      src={farm.image}
                      alt={farm.name}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 100%)'
                      }}
                    />
                    <div className="absolute top-1.5 right-1.5 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg">
                      <span className="text-[9px] font-black text-darkgreen">{farm.name}</span>
                    </div>
                    <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-lg border border-green-200">
                      <TrendingUp className="w-2.5 h-2.5 text-green-600" strokeWidth={2.5} />
                      <span className="text-[9px] font-black text-green-700">{farm.returnRate}</span>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <div className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200 shadow-sm">
                      <Sparkles className="w-2 h-2 text-amber-500" strokeWidth={2.5} fill="currentColor" />
                      <span className="text-[8px] font-black text-amber-800">قريباً</span>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[7px]">
                      <div className="flex items-center gap-0.5 bg-green-50 rounded-md px-1.5 py-0.5 border border-green-200 shadow-sm flex-1">
                        <CheckCircle2 className="w-2 h-2 text-green-600" strokeWidth={2.5} />
                        <span className="font-black text-green-700 text-[8px]">{farm.availableTrees}</span>
                        <span className="font-bold text-green-600">متاح</span>
                      </div>
                      <div className="flex items-center gap-0.5 bg-amber-50 rounded-md px-1.5 py-0.5 border border-amber-200 shadow-sm flex-1">
                        <Clock className="w-2 h-2 text-amber-600" strokeWidth={2.5} />
                        <span className="font-black text-amber-700 text-[8px]">{farm.reservedTrees}</span>
                        <span className="font-bold text-amber-600">محجوز</span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 transition-all duration-700"
                          style={{
                            width: `${reservationPercentage}%`,
                            backgroundSize: '200% 100%'
                          }}
                        />
                      </div>
                      <p className="text-[7px] font-black text-amber-700 text-center">
                        نسبة الحجز: {reservationPercentage.toFixed(0)}%
                      </p>
                    </div>

                    <p className="text-[7px] leading-relaxed line-clamp-2 font-bold text-darkgreen/80">
                      {farm.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
            </>
          )}
        </section>
        </div>
      </div>

      <nav
        className="hidden lg:flex fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl"
        style={{
          background: 'linear-gradient(180deg, rgba(230, 232, 235, 0.85) 0%, rgba(238, 239, 241, 0.80) 100%)',
          borderTop: '2px solid rgba(58,161,126,0.3)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        <div className="max-w-7xl mx-auto w-full px-6 py-4 pb-8 flex items-center justify-around">
          <button className="flex flex-col items-center gap-2 px-6 py-2 rounded-xl transition-all hover:bg-darkgreen/5">
            <Home className="w-6 h-6 text-darkgreen" />
            <span className="text-sm font-bold text-darkgreen">الرئيسية</span>
          </button>

          <button
            onClick={() => setShowAssistant(true)}
            className="flex flex-col items-center gap-2 px-6 py-2 rounded-xl transition-all hover:bg-darkgreen/5 relative"
          >
            <Sparkles className="w-6 h-6 text-darkgreen" />
            <span className="text-sm font-bold text-darkgreen">المساعد الذكي</span>
            <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-gold"></div>
          </button>

          <button
            onClick={() => alert(`قريباً: ${appMode === 'agricultural' ? 'محصولي الزراعي' : 'محصولي الاستثماري'}`)}
            className="flex items-center gap-3 px-8 py-3 rounded-2xl transition-all hover:scale-105"
            style={{
              background: appMode === 'agricultural'
                ? 'linear-gradient(145deg, #3AA17E 0%, #2F8266 50%, #3AA17E 100%)'
                : 'linear-gradient(145deg, #F4E4B8 0%, #D4AF37 50%, #B8942F 100%)',
              boxShadow: appMode === 'agricultural'
                ? '0 4px 16px rgba(58,161,126,0.4)'
                : '0 4px 16px rgba(212,175,55,0.4)',
              border: '2px solid #3AA17E'
            }}
          >
            {appMode === 'agricultural' ? (
              <Sprout className="w-7 h-7 text-white" />
            ) : (
              <TrendingUp className="w-7 h-7 text-white" />
            )}
            <span className="text-base font-bold text-white">
              {appMode === 'agricultural' ? 'محصولي الزراعي' : 'محصولي الاستثماري'}
            </span>
          </button>

          <NotificationCenter
            unreadCount={unreadMessagesCount}
            onCountChange={handleUnreadCountChange}
          />

          <button
            onClick={handleMyAccountClick}
            className="flex flex-col items-center gap-2 px-6 py-2 rounded-xl transition-all hover:bg-darkgreen/5"
          >
            <User className="w-6 h-6 text-darkgreen" />
            <span className="text-sm font-bold text-darkgreen">حسابي</span>
          </button>
        </div>
      </nav>

      <nav
        className="fixed left-0 right-0 lg:hidden backdrop-blur-xl"
        style={{
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(230, 232, 235, 0.95) 0%, rgba(238, 239, 241, 0.90) 100%)',
          borderTop: '2px solid rgba(58,161,126,0.3)',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingTop: '1rem',
          paddingBottom: '5.5rem',
          zIndex: 99999,
          position: 'fixed',
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)'
        }}
      >
        <div className="flex items-center justify-around px-3 relative" style={{ height: '4.5rem' }}>
          <button className="flex flex-col items-center justify-center gap-1 relative group">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300"
              style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)',
                border: '2px solid #3AA17E'
              }}
            >
              <Home className="w-6 h-6 text-darkgreen/70" />
            </div>
            <span className="text-[10px] font-semibold text-gray-600">الرئيسية</span>
          </button>

          <button
            onClick={() => setShowAssistant(true)}
            className="flex flex-col items-center justify-center gap-1 relative group"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative"
              style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8)',
                border: '2px solid #3AA17E'
              }}
            >
              <Sparkles className="w-6 h-6 text-darkgreen/70" />
              <div
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                style={{ background: '#D4AF37' }}
              />
            </div>
            <span className="text-[10px] font-semibold text-gray-600">المساعد</span>
          </button>

          <button
            onClick={() => alert(`قريباً: ${appMode === 'agricultural' ? 'محصولي الزراعي' : 'محصولي الاستثماري'}`)}
            className="flex flex-col items-center justify-center gap-1 relative -mt-4"
          >
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-300 active:scale-95"
              style={{
                background: appMode === 'agricultural'
                  ? 'linear-gradient(145deg, #3AA17E 0%, #2F8266 50%, #3AA17E 100%)'
                  : 'linear-gradient(145deg, #F4E4B8 0%, #D4AF37 50%, #B8942F 100%)',
                boxShadow: appMode === 'agricultural'
                  ? '0 8px 24px rgba(58,161,126,0.5), 0 4px 12px rgba(47,130,102,0.3), inset 0 2px 4px rgba(255,255,255,0.4)'
                  : '0 8px 24px rgba(212,175,55,0.5), 0 4px 12px rgba(184,148,47,0.3), inset 0 2px 4px rgba(255,255,255,0.4)',
                border: '2.5px solid #3AA17E'
              }}
            >
              {appMode === 'agricultural' ? (
                <Sprout className="w-8 h-8 text-white drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
              ) : (
                <TrendingUp className="w-8 h-8 text-white drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
              )}
            </div>
            <span className="text-[11px] font-bold text-darkgreen">
              {appMode === 'agricultural' ? 'زراعي' : 'استثماري'}
            </span>
          </button>

          <NotificationCenter
            unreadCount={unreadMessagesCount}
            onCountChange={handleUnreadCountChange}
          />

          <button
            onClick={handleMyAccountClick}
            className="flex flex-col items-center justify-center gap-1 relative group"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300"
              style={{
                background: 'linear-gradient(145deg, #f0f4f0 0%, #e8ede8 100%)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.12), inset 0 1px 2px rgba(255,255,255,0.8)',
                border: '2px solid #3AA17E'
              }}
            >
              <User className="w-6 h-6 text-darkgreen" />
            </div>
            <span className="text-[10px] font-bold text-darkgreen/80">حسابي</span>
          </button>
        </div>
      </nav>

      <VideoIntro
        isOpen={showVideoIntro}
        onClose={() => setShowVideoIntro(false)}
        onStartFarm={() => alert('قريباً')}
      />

      <HowToStart
        isOpen={showHowToStart}
        onClose={() => setShowHowToStart(false)}
        onStart={() => alert('قريباً')}
      />

      <SmartAssistant
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
      />

      {showWelcomeToAccount && (
        <WelcomeToAccountScreen
          onStartNow={handleWelcomeStartNow}
          onClose={() => setShowWelcomeToAccount(false)}
        />
      )}

      {showStandaloneRegistration && (
        <StandaloneAccountRegistration
          onSuccess={handleRegistrationSuccess}
          onBack={() => setShowStandaloneRegistration(false)}
        />
      )}

      <AccountProfile
        isOpen={showAccountProfile}
        onClose={() => setShowAccountProfile(false)}
        onOpenAuth={() => alert('قريباً: تسجيل الدخول')}
        onOpenReservations={() => alert('قريباً: حجوزاتي')}
        onStartInvestment={() => {
          setShowAccountProfile(false);
        }}
      />

      {selectedInvestmentFarm && (
        <>
          {appMode === 'investment' ? (
            <InvestmentFarmPage
              farm={selectedInvestmentFarm}
              onClose={() => setSelectedInvestmentFarm(null)}
              onGoToAccount={() => setShowAccountProfile(true)}
            />
          ) : (
            <AgriculturalFarmPage
              farm={selectedInvestmentFarm}
              onClose={() => setSelectedInvestmentFarm(null)}
              onGoToAccount={() => setShowAccountProfile(true)}
            />
          )}
        </>
      )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
