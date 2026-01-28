import { User, Calculator, Sprout, Wheat, Apple, Grape, Leaf, Video, HelpCircle, Home, Sparkles, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import FarmPage from './components/FarmPage';
import FarmCalculator from './components/FarmCalculator';
import FarmCalculatorConfirmation from './components/FarmCalculatorConfirmation';
import VideoIntro from './components/VideoIntro';
import HowToStart from './components/HowToStart';
import SmartAssistant from './components/SmartAssistant';
import NotificationCenter from './components/NotificationCenter';
import AccountProfile from './components/AccountProfile';
import MyHarvestComingSoon from './components/MyHarvestComingSoon';
import InvestorAccount from './components/InvestorAccount';
import AdminDashboard from './components/admin/AdminDashboard';
import SmartAdminLoginGate from './components/admin/SmartAdminLoginGate';
import Header from './components/Header';
import AuthForm from './components/AuthForm';
import ErrorBoundary from './components/ErrorBoundary';
import { farmService, type FarmCategory, type FarmProject } from './services/farmService';
import { getUnreadCount } from './services/messagesService';
import { useAdmin } from './contexts/AdminContext';
import { initializeSupabase } from './lib/supabase';

function App() {
  const { isAdminAuthenticated, isLoading: isAdminLoading, checkAdminSession } = useAdmin();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'farm' | 'calculator' | 'confirmation'>('home');
  const [categories, setCategories] = useState<FarmCategory[]>([]);
  const [farmProjects, setFarmProjects] = useState<Record<string, FarmProject[]>>({});
  const [loading, setLoading] = useState(true);
  const [calculatorData, setCalculatorData] = useState<any>(null);
  const [showVideoIntro, setShowVideoIntro] = useState(false);
  const [showHowToStart, setShowHowToStart] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showAccountProfile, setShowAccountProfile] = useState(false);
  const [showMyHarvest, setShowMyHarvest] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showMyReservations, setShowMyReservations] = useState(false);

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
      if (isAdminAuthenticated || !mounted) {
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
  }, [isAdminAuthenticated]);

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

  // Glass morphism 3D color scheme for each category
  const colorScheme: Record<string, {
    iconGradient: string;
    cardGradient: string;
    border: string;
    shadow: string;
  }> = {
    leaf: {
      iconGradient: 'linear-gradient(145deg, rgba(200, 255, 200, 0.95) 0%, rgba(220, 255, 220, 0.90) 50%, rgba(200, 255, 200, 0.95) 100%)',
      cardGradient: 'linear-gradient(135deg, rgba(220, 255, 220, 0.85) 0%, rgba(230, 255, 230, 0.80) 50%, rgba(220, 255, 220, 0.85) 100%)',
      border: 'rgba(144, 238, 144, 0.70)',
      shadow: 'rgba(144, 238, 144, 0.45)'
    },
    wheat: {
      iconGradient: 'linear-gradient(145deg, rgba(255, 253, 245, 0.95) 0%, rgba(255, 248, 230, 0.88) 50%, rgba(255, 251, 240, 0.92) 100%)',
      cardGradient: 'linear-gradient(135deg, rgba(255, 251, 240, 0.72) 0%, rgba(255, 246, 225, 0.65) 50%, rgba(255, 249, 235, 0.70) 100%)',
      border: 'rgba(255, 240, 200, 0.45)',
      shadow: 'rgba(245, 215, 150, 0.28)'
    },
    apple: {
      iconGradient: 'linear-gradient(145deg, rgba(220, 255, 235, 0.92) 0%, rgba(230, 255, 240, 0.88) 50%, rgba(225, 255, 238, 0.90) 100%)',
      cardGradient: 'linear-gradient(135deg, rgba(225, 255, 238, 0.75) 0%, rgba(230, 255, 242, 0.68) 50%, rgba(228, 255, 240, 0.72) 100%)',
      border: 'rgba(144, 238, 144, 0.50)',
      shadow: 'rgba(144, 238, 144, 0.35)'
    },
    grape: {
      iconGradient: 'linear-gradient(145deg, rgba(255, 248, 240, 0.95) 0%, rgba(255, 238, 220, 0.88) 50%, rgba(255, 245, 233, 0.92) 100%)',
      cardGradient: 'linear-gradient(135deg, rgba(255, 245, 233, 0.72) 0%, rgba(255, 235, 215, 0.65) 50%, rgba(255, 241, 226, 0.70) 100%)',
      border: 'rgba(255, 225, 185, 0.45)',
      shadow: 'rgba(255, 200, 150, 0.28)'
    },
    palm: {
      iconGradient: 'linear-gradient(145deg, rgba(255, 250, 243, 0.95) 0%, rgba(255, 242, 225, 0.88) 50%, rgba(255, 247, 236, 0.92) 100%)',
      cardGradient: 'linear-gradient(135deg, rgba(255, 247, 236, 0.72) 0%, rgba(255, 240, 220, 0.65) 50%, rgba(255, 244, 230, 0.70) 100%)',
      border: 'rgba(255, 230, 190, 0.45)',
      shadow: 'rgba(255, 210, 160, 0.28)'
    }
  };

  // Get color scheme for icon
  const getColorForIcon = (iconName: string) => {
    const normalizedName = iconName.toLowerCase();
    return colorScheme[normalizedName] || colorScheme.leaf;
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setCurrentSlideIndex(0);
  };

  const currentFarms = farmProjects[activeCategory] || [];

  // Get active category icon for card colors
  const activeIconName = categories.find(cat => cat.slug === activeCategory)?.icon || 'leaf';
  const activeColors = getColorForIcon(activeIconName);

  console.log('[App Render] Active category:', activeCategory);
  console.log('[App Render] Available categories:', Object.keys(farmProjects));
  console.log('[App Render] Current farms count:', currentFarms.length);
  console.log('[App Render] Categories state:', categories.length, 'categories');

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

  const handleFarmClick = (farmId: string) => {
    setSelectedFarmId(farmId);
    setCurrentView('farm');
  };

  const handleCloseFarm = () => {
    setCurrentView('home');
    setSelectedFarmId(null);
  };

  const handleOpenCalculator = () => {
    setCurrentView('calculator');
  };

  const handleCalculatorComplete = (data: any) => {
    setCalculatorData(data);
    setCurrentView('confirmation');
  };

  const handleCloseCalculator = () => {
    setCurrentView('home');
  };

  const handleConfirmationComplete = () => {
    setCurrentView('home');
    setCalculatorData(null);
  };

  const handleUnreadCountChange = async () => {
    if (isAdminAuthenticated) {
      return;
    }

    try {
      const count = await getUnreadCount();
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  const handleAdminAccess = () => {
    setShowAdminLogin(true);
  };

  const handleAdminLoginSuccess = async () => {
    setShowAdminLogin(false);
    await checkAdminSession();
    setShowAdminDashboard(true);
  };

  useEffect(() => {
    if (isAdminAuthenticated && !isAdminLoading) {
      setShowAdminDashboard(true);
    } else {
      setShowAdminDashboard(false);
    }
  }, [isAdminAuthenticated, isAdminLoading]);

  if (currentView === 'farm' && selectedFarmId) {
    return (
      <FarmPage
        farmId={selectedFarmId}
        onClose={handleCloseFarm}
        onOpenAuth={() => setShowAuthForm(true)}
        onNavigateToReservations={() => {
          handleCloseFarm();
          setShowMyReservations(true);
        }}
      />
    );
  }

  if (currentView === 'calculator') {
    return <FarmCalculator onClose={handleCloseCalculator} onComplete={handleCalculatorComplete} />;
  }

  if (currentView === 'confirmation' && calculatorData) {
    return (
      <FarmCalculatorConfirmation
        calculatorData={calculatorData}
        onComplete={handleConfirmationComplete}
        onBack={() => setCurrentView('calculator')}
        onGoHome={() => {
          setCurrentView('home');
          setCalculatorData(null);
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen bg-pearl flex flex-col overflow-hidden">
        <Header
          onAdminAccess={handleAdminAccess}
          onOpenAdminDashboard={() => setShowAdminDashboard(true)}
        />

        {/* MAIN CONTENT - Scrollable */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-4 pt-14 lg:pt-16">
          <div className="max-w-7xl mx-auto">
        {/* HERO SECTION - Enhanced Visual Design */}
        <section className="px-3 lg:px-6 pt-1.5 lg:pt-4 pb-0.5 lg:pb-2 flex-shrink-0">
          <div className="relative w-full h-20 lg:h-72 xl:h-80 overflow-hidden rounded-2xl lg:rounded-3xl" style={{ border: '3px solid #3AA17E' }}>
            {/* Background Image with Zoom Effect */}
            <div className="absolute inset-0">
              <img
                src="https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="مزرعة"
                className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-105"
              />
            </div>

            {/* Decorative Border Overlay */}
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

            {/* Subtle Pattern Overlay */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.8) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 50%, rgba(255,255,255,0.6) 0%, transparent 50%)`
              }}
            />

            {/* Content */}
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
                  className="text-sm lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-2xl"
                  style={{
                    textShadow: '0 2px 10px rgba(0,0,0,0.5), 0 0 20px rgba(58,161,126,0.3)'
                  }}
                >
                  استثمر في مزارع حقيقية
                </h1>
                <div
                  className="h-0.5 lg:h-1.5 mt-1 lg:mt-3 mx-auto rounded-full"
                  style={{
                    width: '60%',
                    background: 'linear-gradient(90deg, transparent 0%, #3AA17E 50%, transparent 100%)'
                  }}
                />
              </div>
            </div>

            {/* Corner Accents */}
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

        {/* QUICK ACTIONS - Green Glass Border System */}
        <section className="px-3 lg:px-6 py-1 lg:py-3 flex-shrink-0">
          <div className="flex gap-2 lg:gap-4 justify-between lg:max-w-4xl lg:mx-auto">
            {[
              { icon: Calculator, label: 'حاسبة مزرعتك', color: '#2F5233', onClick: handleOpenCalculator },
              { icon: Video, label: 'فيديو تعريفي', color: '#3D6B42', onClick: () => setShowVideoIntro(true) },
              { icon: HelpCircle, label: 'كيف تبدأ؟', color: '#2F5233', onClick: () => setShowHowToStart(true) }
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className="rounded-xl flex-1 h-12 lg:h-24 xl:h-28 flex flex-col items-center justify-center bg-white relative group hover:scale-105 active:scale-95"
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
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(4px)';
                  e.currentTarget.style.boxShadow = `
                    0 2px 0 0 rgba(58,161,126,0.3),
                    0 4px 8px rgba(58,161,126,0.2),
                    inset 0 1px 0 rgba(255,255,255,0.8),
                    inset 0 -1px 0 rgba(58,161,126,0.1)
                  `;
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `
                    0 6px 0 0 rgba(58,161,126,0.3),
                    0 8px 16px rgba(58,161,126,0.25),
                    inset 0 1px 0 rgba(255,255,255,0.8),
                    inset 0 -1px 0 rgba(58,161,126,0.1)
                  `;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `
                    0 6px 0 0 rgba(58,161,126,0.3),
                    0 8px 16px rgba(58,161,126,0.25),
                    inset 0 1px 0 rgba(255,255,255,0.8),
                    inset 0 -1px 0 rgba(58,161,126,0.1)
                  `;
                }}
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 via-transparent to-black/5 pointer-events-none"></div>
                <action.icon
                  className="w-5 h-5 lg:w-8 lg:h-8 xl:w-9 xl:h-9 text-darkgreen mb-0.5 lg:mb-2 relative z-10 drop-shadow-md"
                  style={{ filter: 'drop-shadow(0 2px 3px rgba(47,82,51,0.3))' }}
                />
                <span className="text-[9px] lg:text-sm xl:text-base font-bold text-darkgreen relative z-10 text-center leading-tight px-1">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* CATEGORY SLIDER - Green Glass Border System */}
        <section className="px-3 lg:px-6 py-1 lg:py-3 flex-shrink-0">
          <h3 className="text-xs lg:text-2xl xl:text-3xl font-bold mb-1 lg:mb-4 text-darkgreen text-center lg:text-right">المزارع المتاحة</h3>
          {categories.length === 0 ? (
            <div className="text-center py-4 text-darkgreen/70">
              <p className="text-sm">جاري تحميل الفئات...</p>
            </div>
          ) : (
          <div className="flex gap-1.5 lg:gap-4 justify-between lg:max-w-3xl lg:mx-auto">
            {categories.map((category) => {
              const Icon = iconMap[category.icon] || Leaf;
              const isActive = activeCategory === category.slug;
              const colors = getColorForIcon(category.icon);
              console.log('[Category Render]', category.name, '- slug:', category.slug, '- icon:', category.icon, '- isActive:', isActive);
              return (
                <div key={category.slug} className="flex-1 flex flex-col items-center gap-1 lg:gap-2">
                  <button
                    onClick={() => handleCategoryChange(category.slug)}
                    className="rounded-xl lg:rounded-2xl w-full aspect-square flex items-center justify-center bg-white transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-lg relative overflow-hidden"
                    style={{
                      boxShadow: isActive
                        ? `0 4px 16px ${colors.shadow}, 0 8px 32px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.05)`
                        : '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                      background: isActive
                        ? colors.iconGradient
                        : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(249,249,249,0.8) 100%)',
                      border: `2px solid ${isActive ? colors.border : 'rgba(255,255,255,0.7)'}`,
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)'
                    }}
                  >
                    <Icon className={`w-6 h-6 lg:w-12 lg:h-12 xl:w-14 xl:h-14 ${isActive ? 'text-darkgreen drop-shadow-sm' : 'text-darkgreen/60'}`} />
                  </button>
                  <span className={`text-[8px] lg:text-sm xl:text-base font-bold text-center leading-tight ${isActive ? 'text-darkgreen' : 'text-darkgreen/60'}`}>
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>
          )}
        </section>

        {/* FARM CARDS SLIDER - Ultra Compact */}
        <section className="px-3 lg:px-6 py-1 lg:py-4 flex-shrink-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-darkgreen"></div>
              <p className="text-sm text-darkgreen/70">جاري تحميل المزارع...</p>
            </div>
          ) : currentFarms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Sprout className="w-16 h-16 text-darkgreen/30" />
              <p className="text-sm text-darkgreen/70 font-bold">لا توجد مزارع متاحة حالياً في "{activeCategory}"</p>
              <p className="text-xs text-darkgreen/50">المتاح: {JSON.stringify(Object.keys(farmProjects))}</p>
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
                          <button
                            onClick={() => handleFarmClick(farm.id)}
                            className="w-full rounded-xl overflow-hidden transition-all duration-300 active:scale-[0.97] hover:shadow-xl text-right group backdrop-blur-xl relative"
                            style={{
                              background: activeColors.cardGradient,
                              boxShadow: `0 8px 24px ${activeColors.shadow}, 0 4px 12px ${activeColors.shadow}, inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.03)`,
                              border: `2px solid ${activeColors.border}`,
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)'
                            }}
                          >
                            <div className="relative w-full h-[76px] overflow-hidden">
                              <img
                                src={farm.image}
                                alt={farm.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                        <div className="p-2.5 space-y-1.5">
                          <div className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200 shadow-sm">
                            <Sparkles className="w-2.5 h-2.5 text-amber-500" strokeWidth={2.5} fill="currentColor" />
                            <span className="text-[9px] font-black text-amber-800">احجز شجرتك الآن</span>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 text-[8px]">
                            <div className="flex items-center gap-1 bg-green-50 rounded-lg px-2 py-1 border border-green-200 shadow-sm flex-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-green-600" strokeWidth={2.5} />
                              <span className="font-black text-green-700 text-[9px]">{farm.availableTrees}</span>
                              <span className="font-bold text-green-600">متاح</span>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-50 rounded-lg px-2 py-1 border border-amber-200 shadow-sm flex-1">
                              <Clock className="w-2.5 h-2.5 text-amber-600" strokeWidth={2.5} />
                              <span className="font-black text-amber-700 text-[9px]">{farm.reservedTrees}</span>
                              <span className="font-bold text-amber-600">محجوز</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 transition-all duration-700"
                                style={{
                                  width: `${reservationPercentage}%`,
                                  backgroundSize: '200% 100%',
                                  animation: 'shimmer 3s linear infinite'
                                }}
                              />
                            </div>
                            <p className="text-[8px] font-black text-amber-700 text-center">
                              نسبة الحجز: {reservationPercentage.toFixed(0)}%
                            </p>
                          </div>

                          <p className="text-[8px] leading-relaxed line-clamp-2 font-bold text-darkgreen/80 pt-0.5">
                            {farm.description}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {currentFarms.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-7 h-7 bg-white/95 rounded-full flex items-center justify-center z-10 transition-all duration-300"
                  style={{
                    boxShadow: '0 2px 8px rgba(58,161,126,0.25)',
                    border: '2px solid #3AA17E'
                  }}
                >
                  <span className="text-darkgreen font-bold text-sm">→</span>
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-7 h-7 bg-white/95 rounded-full flex items-center justify-center z-10 transition-all duration-300"
                  style={{
                    boxShadow: '0 2px 8px rgba(58,161,126,0.25)',
                    border: '2px solid #3AA17E'
                  }}
                >
                  <span className="text-darkgreen font-bold text-sm">←</span>
                </button>
              </>
            )}
          </div>

          {/* Pagination Dots - Compact */}
          {currentFarms.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {currentFarms.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`rounded-full ${
                    index === currentSlideIndex
                      ? 'bg-darkgreen w-6 h-1.5'
                      : 'bg-darkgreen/30 w-1.5 h-1.5'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {currentFarms.map((farm) => {
              const totalTrees = farm.availableTrees + farm.reservedTrees;
              const reservationPercentage = (farm.reservedTrees / totalTrees) * 100;

              return (
                <button
                  key={farm.id}
                  onClick={() => handleFarmClick(farm.id)}
                  className="w-full rounded-xl overflow-hidden transition-all duration-300 active:scale-[0.97] hover:shadow-xl text-right group backdrop-blur-xl relative"
                  style={{
                    background: activeColors.cardGradient,
                    boxShadow: `0 8px 24px ${activeColors.shadow}, 0 4px 12px ${activeColors.shadow}, inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.03)`,
                    border: `2px solid ${activeColors.border}`,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                  }}
                >
                  <div className="relative w-full h-[76px] overflow-hidden">
                    <img
                      src={farm.image}
                      alt={farm.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                  <div className="p-2.5 space-y-1.5">
                    <div className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200 shadow-sm">
                      <Sparkles className="w-2.5 h-2.5 text-amber-500" strokeWidth={2.5} fill="currentColor" />
                      <span className="text-[9px] font-black text-amber-800">احجز شجرتك الآن</span>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 text-[8px]">
                      <div className="flex items-center gap-1 bg-green-50 rounded-lg px-2 py-1 border border-green-200 shadow-sm flex-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-green-600" strokeWidth={2.5} />
                        <span className="font-black text-green-700 text-[9px]">{farm.availableTrees}</span>
                        <span className="font-bold text-green-600">متاح</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 rounded-lg px-2 py-1 border border-amber-200 shadow-sm flex-1">
                        <Clock className="w-2.5 h-2.5 text-amber-600" strokeWidth={2.5} />
                        <span className="font-black text-amber-700 text-[9px]">{farm.reservedTrees}</span>
                        <span className="font-bold text-amber-600">محجوز</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 transition-all duration-700"
                          style={{
                            width: `${reservationPercentage}%`,
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 3s linear infinite'
                          }}
                        />
                      </div>
                      <p className="text-[8px] font-black text-amber-700 text-center">
                        نسبة الحجز: {reservationPercentage.toFixed(0)}%
                      </p>
                    </div>

                    <p className="text-[8px] leading-relaxed line-clamp-2 font-bold text-darkgreen/80 pt-0.5">
                      {farm.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
            </>
          )}
        </section>
        </div>
      </div>

      {/* DESKTOP NAVIGATION - Top Navigation for Large Screens */}
      <nav className="hidden lg:flex fixed bottom-0 left-0 right-0 bg-white z-50 border-t-2 border-darkgreen/20">
        <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-around">
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
            onClick={() => setShowMyHarvest(true)}
            className="flex items-center gap-3 px-8 py-3 rounded-2xl transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(145deg, #F4E4B8 0%, #D4AF37 50%, #B8942F 100%)',
              boxShadow: '0 4px 16px rgba(212,175,55,0.4)',
              border: '2px solid #3AA17E'
            }}
          >
            <Sprout className="w-7 h-7 text-white" />
            <span className="text-base font-bold text-white">محصولي</span>
          </button>

          <NotificationCenter
            unreadCount={unreadMessagesCount}
            onCountChange={handleUnreadCountChange}
          />

          <button
            onClick={() => setShowAccountProfile(true)}
            className="flex flex-col items-center gap-2 px-6 py-2 rounded-xl transition-all hover:bg-darkgreen/5"
          >
            <User className="w-6 h-6 text-darkgreen" />
            <span className="text-sm font-bold text-darkgreen">حسابي</span>
          </button>
        </div>
      </nav>

      {/* BOTTOM NAVIGATION - Mobile Only */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white lg:hidden z-50"
        style={{
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: 'calc(4.5rem + env(safe-area-inset-bottom))'
        }}
      >
        <div className="h-[4.5rem] flex items-center justify-around px-3 relative">
          {/* زر الرئيسية */}
          <button
            className="flex flex-col items-center justify-center gap-1 relative group"
            onMouseEnter={(e) => {
              const div = e.currentTarget.querySelector('div') as HTMLElement;
              div.style.background = 'linear-gradient(145deg, #F0FFF4 0%, #E8F5E9 100%)';
            }}
            onMouseLeave={(e) => {
              const div = e.currentTarget.querySelector('div') as HTMLElement;
              div.style.background = 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)';
            }}
          >
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

          {/* زر المساعد الذكي */}
          <button
            onClick={() => setShowAssistant(true)}
            className="flex flex-col items-center justify-center gap-1 relative group"
            onMouseEnter={(e) => {
              const div = e.currentTarget.querySelector('div') as HTMLElement;
              div.style.background = 'linear-gradient(145deg, #F0FFF4 0%, #E8F5E9 100%)';
            }}
            onMouseLeave={(e) => {
              const div = e.currentTarget.querySelector('div') as HTMLElement;
              div.style.background = 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)';
            }}
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

          {/* زر محصولي - الزر الرئيسي المميز */}
          <button
            onClick={() => setShowMyHarvest(true)}
            className="flex flex-col items-center justify-center gap-1 relative -mt-4"
          >
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-300 active:scale-95"
              style={{
                background: 'linear-gradient(145deg, #F4E4B8 0%, #D4AF37 50%, #B8942F 100%)',
                boxShadow: '0 8px 24px rgba(212,175,55,0.5), 0 4px 12px rgba(184,148,47,0.3), inset 0 2px 4px rgba(255,255,255,0.4)',
                border: '2.5px solid #3AA17E'
              }}
            >
              <Sprout className="w-8 h-8 text-white drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
            </div>
            <span className="text-[11px] font-bold text-darkgreen">محصولي</span>
          </button>

          <NotificationCenter
            unreadCount={unreadMessagesCount}
            onCountChange={handleUnreadCountChange}
          />

          {/* زر حسابي - مميز ثانوي */}
          <button
            onClick={() => setShowAccountProfile(true)}
            className="flex flex-col items-center justify-center gap-1 relative group"
            onMouseEnter={(e) => {
              const div = e.currentTarget.querySelector('div') as HTMLElement;
              div.style.background = 'linear-gradient(145deg, #E8F5E9 0%, #C8E6C9 100%)';
            }}
            onMouseLeave={(e) => {
              const div = e.currentTarget.querySelector('div') as HTMLElement;
              div.style.background = 'linear-gradient(145deg, #f0f4f0 0%, #e8ede8 100%)';
            }}
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
        onStartFarm={handleOpenCalculator}
      />

      <HowToStart
        isOpen={showHowToStart}
        onClose={() => setShowHowToStart(false)}
        onStart={handleOpenCalculator}
      />

      <SmartAssistant
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
      />

      <AccountProfile
        isOpen={showAccountProfile}
        onClose={() => setShowAccountProfile(false)}
        onOpenAuth={() => setShowAuthForm(true)}
        onOpenReservations={() => setShowMyReservations(true)}
      />

      <MyHarvestComingSoon
        isOpen={showMyHarvest}
        onClose={() => setShowMyHarvest(false)}
      />

      <AuthForm
        isOpen={showAuthForm}
        onClose={() => setShowAuthForm(false)}
        onSuccess={() => {
          setShowAuthForm(false);
          setShowAccountProfile(true);
        }}
      />

      {showMyReservations && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <InvestorAccount />
          <button
            onClick={() => setShowMyReservations(false)}
            className="fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-700 text-xl">✕</span>
          </button>
        </div>
      )}

      {showAdminLogin && (
        <SmartAdminLoginGate
          onSuccess={handleAdminLoginSuccess}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {showAdminDashboard && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
