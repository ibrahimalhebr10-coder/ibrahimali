import { User, Calculator, Sprout, Wheat, Apple, Grape, Leaf, Video, HelpCircle, Home, Sparkles, TrendingUp, CheckCircle2, Clock, Layers } from 'lucide-react';
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
  const [activeCategory, setActiveCategory] = useState<string>('all');
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
          setActiveCategory('all');
          console.log('[App] Initial load: Setting active category to: all');
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
    all: Layers,
    leaf: Leaf,
    wheat: Wheat,
    grape: Grape,
    apple: Apple,
    palm: Wheat,
    Leaf: Leaf,
    Wheat: Wheat,
    Grape: Grape,
    Apple: Apple,
    Layers: Layers
  };

  const colorScheme: Record<string, Record<AppMode, {
    iconGradient: string;
    cardGradient: string;
    border: string;
    shadow: string;
  }>> = {
    all: {
      agricultural: {
        iconGradient: 'linear-gradient(145deg, rgba(175, 245, 205, 0.95) 0%, rgba(195, 255, 220, 0.90) 50%, rgba(185, 250, 212, 0.95) 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(185, 250, 212, 0.85) 0%, rgba(205, 255, 225, 0.80) 50%, rgba(195, 252, 218, 0.85) 100%)',
        border: 'rgba(58, 161, 126, 0.75)',
        shadow: 'rgba(58, 161, 126, 0.50)'
      },
      investment: {
        iconGradient: 'linear-gradient(145deg, rgba(255, 238, 185, 0.95) 0%, rgba(255, 245, 210, 0.90) 50%, rgba(255, 242, 198, 0.95) 100%)',
        cardGradient: 'linear-gradient(135deg, rgba(255, 242, 198, 0.85) 0%, rgba(255, 250, 225, 0.80) 50%, rgba(255, 246, 212, 0.85) 100%)',
        border: 'rgba(212, 175, 55, 0.75)',
        shadow: 'rgba(212, 175, 55, 0.50)'
      }
    },
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
  };

  const currentFarms = activeCategory === 'all'
    ? Object.values(farmProjects).flat()
    : farmProjects[activeCategory] || [];
  const activeIconName = activeCategory === 'all' ? 'all' : categories.find(cat => cat.slug === activeCategory)?.icon || 'leaf';
  const activeColors = getColorForIcon(activeIconName, appMode);

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
        className="h-screen flex flex-col overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, rgba(250, 252, 251, 1) 0%, rgba(245, 250, 247, 1) 50%, rgba(248, 252, 250, 1) 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(58,161,126,0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(58,161,126,0.05) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(212,175,55,0.03) 0%, transparent 50%)
          `
        }}></div>

        {!selectedInvestmentFarm && <Header />}

        {!selectedInvestmentFarm && (
          <>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto lg:pb-4 pt-16 lg:pt-20" style={{ paddingBottom: '12rem' }}>
                <div className="max-w-7xl mx-auto">
        <section className="px-3 lg:px-6 py-3 lg:py-6 flex-shrink-0">
          <div className="flex gap-1.5 lg:gap-4 justify-between lg:max-w-4xl lg:mx-auto">
            {[
              { icon: Calculator, label: 'حاسبة مزرعتك', color: '#2F5233', onClick: () => alert('قريباً: حاسبة المزرعة'), delay: '0ms' },
              { icon: Video, label: 'فيديو تعريفي', color: '#3D6B42', onClick: () => setShowVideoIntro(true), delay: '100ms' },
              { icon: HelpCircle, label: 'كيف تبدأ؟', color: '#2F5233', onClick: () => setShowHowToStart(true), delay: '200ms' }
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className="rounded-lg lg:rounded-xl flex-1 h-10 lg:h-24 xl:h-28 flex flex-col items-center justify-center bg-white relative group overflow-hidden animate-fadeIn"
                style={{
                  boxShadow: `
                    0 6px 0 0 rgba(58,161,126,0.3),
                    0 8px 20px rgba(58,161,126,0.3),
                    inset 0 1px 0 rgba(255,255,255,0.9),
                    inset 0 -1px 0 rgba(58,161,126,0.15)
                  `,
                  border: '2.5px solid #3AA17E',
                  background: 'linear-gradient(145deg, #ffffff 0%, #f5fdf9 100%)',
                  transform: 'translateY(0)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  animationDelay: action.delay
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                  e.currentTarget.style.boxShadow = `
                    0 8px 0 0 rgba(58,161,126,0.4),
                    0 16px 32px rgba(58,161,126,0.4),
                    inset 0 2px 0 rgba(255,255,255,0.9),
                    inset 0 -2px 0 rgba(58,161,126,0.2)
                  `;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = `
                    0 6px 0 0 rgba(58,161,126,0.3),
                    0 8px 20px rgba(58,161,126,0.3),
                    inset 0 1px 0 rgba(255,255,255,0.9),
                    inset 0 -1px 0 rgba(58,161,126,0.15)
                  `;
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(2px) scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                }}
              >
                <div className="absolute inset-0 rounded-lg lg:rounded-xl bg-gradient-to-br from-white/60 via-emerald-50/30 to-green-50/20 pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-60"></div>
                <div className="absolute inset-0 rounded-lg lg:rounded-xl bg-gradient-to-t from-emerald-100/0 to-emerald-50/0 group-hover:from-emerald-100/30 group-hover:to-emerald-50/10 pointer-events-none transition-all duration-300"></div>
                <action.icon
                  className="w-4 h-4 lg:w-8 lg:h-8 xl:w-10 xl:h-10 text-darkgreen mb-0 lg:mb-2 relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:text-emerald-700"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(47,82,51,0.3))' }}
                />
                <span className="text-[8px] lg:text-sm xl:text-base font-bold text-darkgreen relative z-10 text-center leading-tight px-1 transition-colors duration-300 group-hover:text-emerald-700">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        <AppModeSelector
          activeMode={appMode}
          onModeChange={handleAppModeChange}
        />

        <section className="px-3 lg:px-6 py-2 lg:py-3">
          <h3 className="text-[11px] lg:text-3xl xl:text-4xl font-black mb-1 lg:mb-3 text-darkgreen text-center lg:text-right animate-slideInRight" style={{ letterSpacing: '-0.01em' }}>المزارع المتاحة</h3>
          {categories.length === 0 ? (
            <div className="text-center py-4 text-darkgreen/70 animate-pulse">
              <p className="text-sm">جاري تحميل الفئات...</p>
            </div>
          ) : (
          <div className="flex gap-1.5 lg:gap-5 justify-between lg:max-w-4xl lg:mx-auto">
            {[{ slug: 'all', name: 'الكل', icon: 'all' }, ...categories].map((category, idx) => {
              const Icon = iconMap[category.icon] || Leaf;
              const isActive = activeCategory === category.slug;
              const colors = getColorForIcon(category.icon, appMode);
              const iconColor = appMode === 'agricultural' ? '#3AA17E' : '#D4AF37';
              const textColor = appMode === 'agricultural' ? 'text-darkgreen' : 'text-[#B8942F]';

              return (
                <div key={category.slug} className="flex-1 flex flex-col items-center gap-1 lg:gap-3 animate-fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
                  <button
                    onClick={() => handleCategoryChange(category.slug)}
                    className="rounded-xl lg:rounded-2xl w-full aspect-square flex items-center justify-center bg-white transition-all duration-500 backdrop-blur-lg relative overflow-hidden group"
                    style={{
                      boxShadow: isActive
                        ? `0 4px 16px ${colors.shadow}, 0 8px 32px ${colors.shadow}, inset 0 2px 0 rgba(255,255,255,0.7), inset 0 -2px 0 rgba(0,0,0,0.05)`
                        : '0 3px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
                      background: isActive
                        ? colors.iconGradient
                        : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,252,251,0.9) 100%)',
                      border: `2.5px solid ${isActive ? colors.border : 'rgba(58,161,126,0.3)'}`,
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      transform: isActive ? 'scale(0.63)' : 'scale(0.6)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.transform = 'scale(0.66) translateY(-4px)';
                        e.currentTarget.style.boxShadow = `0 6px 20px ${colors.shadow}, 0 12px 40px ${colors.shadow}`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.transform = 'scale(0.6) translateY(0)';
                        e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)';
                      }
                    }}
                  >
                    <div className={`absolute inset-0 rounded-xl lg:rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-emerald-50/20 pointer-events-none transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}></div>
                    <Icon
                      className={`w-2 h-2 lg:w-5 lg:h-5 xl:w-6 xl:h-6 transition-all duration-500 ${isActive ? 'drop-shadow-lg scale-110' : 'group-hover:scale-125 group-hover:drop-shadow-md'}`}
                      style={{
                        color: isActive ? iconColor : `${iconColor}60`,
                        filter: isActive ? 'drop-shadow(0 2px 6px rgba(58,161,126,0.4))' : 'none'
                      }}
                    />
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl lg:rounded-2xl animate-pulse" style={{
                        background: `radial-gradient(circle at center, ${colors.shadow} 0%, transparent 70%)`,
                        opacity: 0.3
                      }}></div>
                    )}
                  </button>
                  <span className={`text-[7px] lg:text-sm xl:text-base font-bold text-center leading-tight transition-all duration-500 ${isActive ? `${textColor} scale-105` : `${textColor}/60`}`}>
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>
          )}
        </section>

        <section className="px-3 lg:px-6 py-2 lg:py-4 flex-shrink-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fadeIn">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-darkgreen border-t-transparent absolute inset-0"></div>
                <Sprout className="w-8 h-8 text-darkgreen absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-base text-darkgreen font-bold animate-pulse">جاري تحميل المزارع...</p>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-darkgreen rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-darkgreen rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-darkgreen rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : currentFarms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 animate-scaleIn">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <Sprout className="w-20 h-20 text-darkgreen/40 relative animate-float" />
              </div>
              <p className="text-lg text-darkgreen/80 font-bold">لا توجد مزارع متاحة حالياً</p>
              <p className="text-sm text-darkgreen/60">تحقق مرة أخرى قريباً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {currentFarms.map((farm, idx) => {
                const totalTrees = farm.availableTrees + farm.reservedTrees;
                const reservationPercentage = (farm.reservedTrees / totalTrees) * 100;

                return (
                  <div
                    key={farm.id}
                    onClick={() => {
                      setSelectedInvestmentFarm(farm);
                    }}
                    className="w-full rounded-2xl overflow-hidden text-right backdrop-blur-xl relative cursor-pointer transition-all duration-500 group animate-fadeIn"
                    style={{
                      background: activeColors.cardGradient,
                      boxShadow: `0 10px 30px ${activeColors.shadow}, 0 6px 15px ${activeColors.shadow}, inset 0 2px 0 rgba(255,255,255,0.8), inset 0 -2px 0 rgba(0,0,0,0.05)`,
                      border: `3px solid ${activeColors.border}`,
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      animationDelay: `${idx * 100}ms`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.03)';
                      e.currentTarget.style.boxShadow = `0 20px 50px ${activeColors.shadow}, 0 12px 25px ${activeColors.shadow}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = `0 10px 30px ${activeColors.shadow}, 0 6px 15px ${activeColors.shadow}`;
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.transform = 'scale(0.98)';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div className="relative w-full h-32 md:h-48 overflow-hidden">
                      <img
                        src={farm.image}
                        alt={farm.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-active:scale-110"
                      />
                      <div
                        className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-60 group-active:opacity-60"
                        style={{
                          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)'
                        }}
                      />
                      <div className="absolute top-2 md:top-4 right-2 md:right-4 bg-white/98 backdrop-blur-md rounded-xl px-2.5 md:px-4 py-1.5 md:py-2 shadow-xl md:shadow-2xl border-2 border-emerald-200">
                        <span className="text-[10px] md:text-base font-black text-darkgreen">{farm.name}</span>
                      </div>
                      <div className="absolute top-2 md:top-4 left-2 md:left-4 bg-gradient-to-r from-green-100 to-emerald-100 backdrop-blur-md rounded-full px-2.5 md:px-4 py-1.5 md:py-2 flex items-center gap-1 md:gap-2 shadow-xl md:shadow-2xl border-2 border-green-300 animate-pulse">
                        <TrendingUp className="w-3 md:w-5 h-3 md:h-5 text-green-700" strokeWidth={3} />
                        <span className="text-[10px] md:text-base font-black text-green-800">{farm.returnRate}</span>
                      </div>
                    </div>
                    <div className="p-2.5 md:p-5 space-y-1.5 md:space-y-3">
                      <div className="flex items-center justify-center gap-1.5 md:gap-2 py-1.5 md:py-2 px-2.5 md:px-4 rounded-xl bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 border-2 border-amber-300 shadow-md">
                        <Sparkles className="w-2.5 md:w-4 h-2.5 md:h-4 text-amber-600 animate-pulse" strokeWidth={3} fill="currentColor" />
                        <span className="text-[9px] md:text-sm font-black text-amber-900">قريباً</span>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 md:gap-2">
                        <div className="flex items-center gap-1 md:gap-2 bg-green-100 rounded-lg px-2 md:px-3 py-1 md:py-2 border-2 border-green-300 shadow-md flex-1">
                          <CheckCircle2 className="w-2.5 md:w-4 h-2.5 md:h-4 text-green-700" strokeWidth={3} />
                          <span className="font-black text-green-800 text-[9px] md:text-base">{farm.availableTrees}</span>
                          <span className="font-bold text-green-700 text-[7px] md:text-sm">متاح</span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 bg-amber-100 rounded-lg px-2 md:px-3 py-1 md:py-2 border-2 border-amber-300 shadow-md flex-1">
                          <Clock className="w-2.5 md:w-4 h-2.5 md:h-4 text-amber-700" strokeWidth={3} />
                          <span className="font-black text-amber-800 text-[9px] md:text-base">{farm.reservedTrees}</span>
                          <span className="font-bold text-amber-700 text-[7px] md:text-sm">محجوز</span>
                        </div>
                      </div>

                      <div className="space-y-1 md:space-y-2">
                        <div className="h-2 md:h-3 w-full bg-gray-300 rounded-full overflow-hidden shadow-inner border border-gray-400">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 transition-all duration-700 shadow-lg"
                            style={{
                              width: `${reservationPercentage}%`,
                              backgroundSize: '200% 100%',
                              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)'
                            }}
                          />
                        </div>
                        <p className="text-[8px] md:text-sm font-black text-amber-800 text-center">
                          نسبة الحجز: {reservationPercentage.toFixed(0)}%
                        </p>
                      </div>

                      <p className="text-[8px] md:text-sm leading-relaxed line-clamp-2 font-bold text-darkgreen/90 px-1 md:px-0">
                        {farm.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
                </div>
              </div>
            </div>
          </>
        )}

      {!selectedInvestmentFarm && (
        <nav
          className="hidden lg:flex fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl"
          style={{
            background: 'linear-gradient(180deg, rgba(248, 250, 249, 0.95) 0%, rgba(242, 247, 244, 0.92) 100%)',
            borderTop: '3px solid rgba(58,161,126,0.4)',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)'
          }}
        >
        <div className="max-w-7xl mx-auto w-full px-8 py-5 pb-8 flex items-center justify-around">
          <button className="flex flex-col items-center gap-2 px-8 py-3 rounded-2xl transition-all duration-300 hover:scale-105 group"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(145deg, rgba(58,161,126,0.08) 0%, rgba(58,161,126,0.12) 100%)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(58,161,126,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Home className="w-7 h-7 text-darkgreen transition-transform duration-300 group-hover:scale-110" />
            <span className="text-base font-bold text-darkgreen">الرئيسية</span>
          </button>

          <button
            onClick={() => setShowAssistant(true)}
            className="flex flex-col items-center gap-2 px-8 py-3 rounded-2xl transition-all duration-300 hover:scale-105 relative group"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(145deg, rgba(58,161,126,0.08) 0%, rgba(58,161,126,0.12) 100%)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(58,161,126,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Sparkles className="w-7 h-7 text-darkgreen transition-transform duration-300 group-hover:scale-110" />
            <span className="text-base font-bold text-darkgreen">المساعد الذكي</span>
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full animate-pulse" style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              boxShadow: '0 0 10px rgba(212,175,55,0.6)'
            }}></div>
          </button>

          <button
            onClick={() => alert(`قريباً: ${appMode === 'agricultural' ? 'محصولي الزراعي' : 'محصولي الاستثماري'}`)}
            className="flex items-center gap-2 px-5 py-2 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-2xl relative overflow-hidden group"
            style={{
              background: appMode === 'agricultural'
                ? 'linear-gradient(145deg, #3AA17E 0%, #2F8266 50%, #3AA17E 100%)'
                : 'linear-gradient(145deg, #F4E4B8 0%, #D4AF37 50%, #B8942F 100%)',
              boxShadow: appMode === 'agricultural'
                ? '0 6px 24px rgba(58,161,126,0.5), inset 0 2px 4px rgba(255,255,255,0.4)'
                : '0 6px 24px rgba(212,175,55,0.5), inset 0 2px 4px rgba(255,255,255,0.4)',
              border: '3px solid rgba(255,255,255,0.8)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/20 pointer-events-none"></div>
            {appMode === 'agricultural' ? (
              <Sprout className="w-7 h-7 text-white relative z-10 transition-transform duration-300 group-hover:scale-110" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
            ) : (
              <TrendingUp className="w-7 h-7 text-white relative z-10 transition-transform duration-300 group-hover:scale-110" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
            )}
            <span className="text-sm font-black text-white relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              {appMode === 'agricultural' ? 'محصولي الزراعي' : 'محصولي الاستثماري'}
            </span>
          </button>

          <NotificationCenter
            unreadCount={unreadMessagesCount}
            onCountChange={handleUnreadCountChange}
          />

          <button
            onClick={handleMyAccountClick}
            className="flex flex-col items-center gap-2 px-8 py-3 rounded-2xl transition-all duration-300 hover:scale-105 group"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(145deg, rgba(58,161,126,0.08) 0%, rgba(58,161,126,0.12) 100%)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(58,161,126,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <User className="w-7 h-7 text-darkgreen transition-transform duration-300 group-hover:scale-110" />
            <span className="text-base font-bold text-darkgreen">حسابي</span>
          </button>
        </div>
      </nav>
      )}

      {!selectedInvestmentFarm && (
        <nav
          className="fixed left-0 right-0 lg:hidden backdrop-blur-2xl"
        style={{
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(248, 250, 249, 0.98) 0%, rgba(242, 247, 244, 0.95) 100%)',
          borderTop: '3px solid rgba(58,161,126,0.4)',
          boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          paddingTop: '1.25rem',
          paddingBottom: '5.5rem',
          zIndex: 99999,
          position: 'fixed',
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)'
        }}
      >
        <div className="flex items-center justify-around px-3 relative" style={{ height: '4.5rem' }}>
          <button className="flex flex-col items-center justify-center gap-1 relative group active:scale-95 transition-transform">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-active:scale-90"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,252,250,0.9) 100%)',
                boxShadow: '0 6px 12px rgba(58,161,126,0.2), inset 0 2px 4px rgba(255,255,255,0.9)',
                border: '2.5px solid #3AA17E'
              }}
            >
              <Home className="w-6 h-6 text-darkgreen transition-all duration-300 group-active:scale-110" />
            </div>
            <span className="text-[10px] font-bold text-darkgreen/80">الرئيسية</span>
          </button>

          <button
            onClick={() => setShowAssistant(true)}
            className="flex flex-col items-center justify-center gap-1 relative group active:scale-95 transition-transform"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group-active:scale-90 overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,252,250,0.9) 100%)',
                boxShadow: '0 6px 12px rgba(58,161,126,0.2), inset 0 2px 4px rgba(255,255,255,0.9)',
                border: '2.5px solid #3AA17E'
              }}
            >
              <Sparkles className="w-6 h-6 text-darkgreen transition-all duration-300 group-active:scale-110" />
              <div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                  boxShadow: '0 0 8px rgba(212,175,55,0.6)'
                }}
              />
            </div>
            <span className="text-[10px] font-bold text-darkgreen/80">المساعد</span>
          </button>

          <button
            onClick={() => alert(`قريباً: ${appMode === 'agricultural' ? 'محصولي الزراعي' : 'محصولي الاستثماري'}`)}
            className="flex flex-col items-center justify-center gap-1 relative -mt-5 active:scale-95 transition-all duration-300"
          >
            <div
              className="w-18 h-18 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden group"
              style={{
                background: appMode === 'agricultural'
                  ? 'linear-gradient(145deg, #3AA17E 0%, #2F8266 50%, #3AA17E 100%)'
                  : 'linear-gradient(145deg, #F4E4B8 0%, #D4AF37 50%, #B8942F 100%)',
                boxShadow: appMode === 'agricultural'
                  ? '0 10px 30px rgba(58,161,126,0.6), 0 6px 15px rgba(47,130,102,0.4), inset 0 2px 6px rgba(255,255,255,0.5)'
                  : '0 10px 30px rgba(212,175,55,0.6), 0 6px 15px rgba(184,148,47,0.4), inset 0 2px 6px rgba(255,255,255,0.5)',
                border: '3px solid rgba(255,255,255,0.9)',
                width: '3.5rem',
                height: '3.5rem'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/20 pointer-events-none"></div>
              {appMode === 'agricultural' ? (
                <Sprout className="w-10 h-10 text-white drop-shadow-2xl relative z-10 animate-pulse" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))' }} />
              ) : (
                <TrendingUp className="w-10 h-10 text-white drop-shadow-2xl relative z-10 animate-pulse" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))' }} />
              )}
            </div>
            <span className="text-[9px] font-black text-darkgreen mt-1">
              {appMode === 'agricultural' ? 'زراعي' : 'استثماري'}
            </span>
          </button>

          <NotificationCenter
            unreadCount={unreadMessagesCount}
            onCountChange={handleUnreadCountChange}
          />

          <button
            onClick={handleMyAccountClick}
            className="flex flex-col items-center justify-center gap-1 relative group active:scale-95 transition-transform"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-active:scale-90"
              style={{
                background: 'linear-gradient(145deg, rgba(240,248,244,0.95) 0%, rgba(232,242,237,0.9) 100%)',
                boxShadow: '0 6px 12px rgba(58,161,126,0.25), inset 0 2px 4px rgba(255,255,255,0.9)',
                border: '2.5px solid #3AA17E'
              }}
            >
              <User className="w-6 h-6 text-darkgreen transition-all duration-300 group-active:scale-110" />
            </div>
            <span className="text-[10px] font-black text-darkgreen/90">حسابي</span>
          </button>
        </div>
      </nav>
      )}

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
