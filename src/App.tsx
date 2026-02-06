import { User, Handshake, Sprout, Wheat, Apple, Grape, Leaf, Video, HelpCircle, Sparkles, TrendingUp, CheckCircle2, Clock, Layers, ChevronLeft, ChevronRight, Settings, TreePine, Plus, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import VideoIntro from './components/VideoIntro';
import HowToStart from './components/HowToStart';
import SmartAssistant from './components/SmartAssistant';
import SuccessPartnerIntro from './components/SuccessPartnerIntro';
import SuccessPartnerOnboarding from './components/SuccessPartnerOnboarding';
import SuccessPartnerRegistrationForm from './components/SuccessPartnerRegistrationForm';
import SuccessPartnerWelcome from './components/SuccessPartnerWelcome';
import HowItWorksPartner from './components/HowItWorksPartner';
import SuccessPartnerWelcomeBanner from './components/SuccessPartnerWelcomeBanner';
import NotificationCenter from './components/NotificationCenter';
import AccountProfile from './components/AccountProfile';
import StandaloneAccountRegistration from './components/StandaloneAccountRegistration';
import WelcomeToAccountScreen from './components/WelcomeToAccountScreen';
import MyReservations from './components/MyReservations';
import MyTrees from './components/MyTrees';
import MaintenancePaymentPage from './components/MaintenancePaymentPage';
import MaintenancePaymentResult from './components/MaintenancePaymentResult';
import QuickAccountAccess from './components/QuickAccountAccess';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import AppModeSelector, { type AppMode } from './components/AppModeSelector';
import InvestmentFarmPage from './components/InvestmentFarmPage';
import AgriculturalFarmPage from './components/AgriculturalFarmPage';
import IdentitySwitcher from './components/IdentitySwitcher';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLogin from './components/admin/AdminLogin';
import FarmOfferMode from './components/FarmOfferMode';
import { farmService, type FarmCategory, type FarmProject } from './services/farmService';
import { getUnreadCount } from './services/messagesService';
import { useAuth } from './contexts/AuthContext';
import { useAdminAuth } from './contexts/AdminAuthContext';
import { OfferModeProvider, useOfferMode } from './contexts/OfferModeContext';
import { useDemoMode } from './contexts/DemoModeContext';
import DemoWelcomeScreen from './components/DemoWelcomeScreen';
import { initializeSupabase } from './lib/supabase';
import { useLeadTracking } from './hooks/useLeadTracking';

function AppContent() {
  const { user, identity, updateIdentity } = useAuth();
  useLeadTracking();
  const { admin } = useAdminAuth();
  const { isOfferMode, enterOfferMode } = useOfferMode();
  const { isDemoMode, demoType, enterDemoMode, exitDemoMode, showDemoWelcome, setShowDemoWelcome } = useDemoMode();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const farmsSliderRef = useRef<HTMLDivElement>(null);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollYRef = useRef(0);
  const [currentFarmIndex, setCurrentFarmIndex] = useState(0);
  const [hasSwipedOnce, setHasSwipedOnce] = useState(false);
  const appMode = identity as AppMode;
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<FarmCategory[]>([]);
  const [farmProjects, setFarmProjects] = useState<Record<string, FarmProject[]>>({});
  const [loading, setLoading] = useState(true);
  const [showVideoIntro, setShowVideoIntro] = useState(false);
  const [showHowToStart, setShowHowToStart] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showSuccessPartnerIntro, setShowSuccessPartnerIntro] = useState(false);
  const [showSuccessPartnerOnboarding, setShowSuccessPartnerOnboarding] = useState(false);
  const [showSuccessPartnerRegistration, setShowSuccessPartnerRegistration] = useState(false);
  const [showSuccessPartnerWelcome, setShowSuccessPartnerWelcome] = useState(false);
  const [showHowItWorksPartner, setShowHowItWorksPartner] = useState(false);
  const [showSuccessPartnerWelcomeBanner, setShowSuccessPartnerWelcomeBanner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountProfile, setShowAccountProfile] = useState(false);
  const [showMyReservations, setShowMyReservations] = useState(false);
  const [showMyTrees, setShowMyTrees] = useState(false);
  const [showMaintenancePayment, setShowMaintenancePayment] = useState(false);
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<string | null>(null);
  const [showPaymentResult, setShowPaymentResult] = useState(false);
  const [showStandaloneRegistration, setShowStandaloneRegistration] = useState(false);
  const [standaloneRegistrationMode, setStandaloneRegistrationMode] = useState<'register' | 'login'>('register');
  const [showWelcomeToAccount, setShowWelcomeToAccount] = useState(false);
  const [showQuickAccountAccess, setShowQuickAccountAccess] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [selectedInvestmentFarm, setSelectedInvestmentFarm] = useState<FarmProject | null>(null);
  const [selectedFarmMode, setSelectedFarmMode] = useState<AppMode | null>(null);
  const [accountContractFilter, setAccountContractFilter] = useState<'agricultural' | 'investment' | null>(null);

  const handleAppModeChange = async (mode: AppMode) => {
    await updateIdentity(mode);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('payment_id')) {
      setShowPaymentResult(true);
    }

    // Check for referral link parameter
    const refCode = urlParams.get('ref');
    if (refCode) {
      console.log('🔗 [App] Referral link detected, partner code:', refCode);
      sessionStorage.setItem('influencer_code', refCode);
      sessionStorage.setItem('influencer_activated_at', new Date().toISOString());
      console.log('✅ [App] Partner code saved to sessionStorage');

      // Clean URL without reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let refreshInterval: NodeJS.Timeout;
    let isFirstLoad = true;

    async function loadData(isRetry: boolean = false) {
      const wasFirstLoad = isFirstLoad;

      if (!isRetry && wasFirstLoad) {
        setLoading(true);
      }

      try {
        const [cats, allProjects] = await Promise.all([
          farmService.getDisplayCategories(),
          farmService.getAllDisplayProjects()
        ]);

        if (!cats || cats.length === 0) {
          console.warn('[App] No categories found');
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
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
          isFirstLoad = false;
        }

        setFarmProjects(allProjects);
      } catch (error) {
        console.error('[App] Error loading farm data:', error);

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
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
        }
      }
    }

    loadData();

    refreshInterval = setInterval(() => {
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

  useEffect(() => {
    if (user && !showAccountProfile) {
      const justRegistered = localStorage.getItem('successPartnerJustRegistered');
      if (justRegistered === 'true') {
        console.log('🌿 [Banner] Success Partner just registered and logged in - showing welcome banner');
        localStorage.removeItem('successPartnerJustRegistered');
        setTimeout(() => {
          setShowSuccessPartnerWelcomeBanner(true);
        }, 500);
      }
    }
  }, [user, showAccountProfile]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      console.log('❌ Scroll container not found');
      return;
    }

    console.log('✅ Scroll container found, adding listener');
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = scrollContainer.scrollTop;

          console.log('📜 Scroll:', {
            current: currentScrollY,
            last: lastScrollYRef.current,
            isScrollingDown: currentScrollY > lastScrollYRef.current && currentScrollY > 80
          });

          if (currentScrollY > lastScrollYRef.current && currentScrollY > 80) {
            console.log('⬇️ Hiding header/footer');
            setIsScrollingDown(true);
          } else if (currentScrollY < lastScrollYRef.current) {
            console.log('⬆️ Showing header/footer');
            setIsScrollingDown(false);
          }

          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
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

  const currentFarms = activeCategory === 'all'
    ? Object.values(farmProjects).flat()
    : farmProjects[activeCategory] || [];
  const activeIconName = activeCategory === 'all' ? 'all' : categories.find(cat => cat.slug === activeCategory)?.icon || 'leaf';
  const activeColors = getColorForIcon(activeIconName, appMode);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setCurrentFarmIndex(0);
    if (farmsSliderRef.current) {
      farmsSliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scrollToFarm = useCallback((index: number) => {
    if (farmsSliderRef.current) {
      const container = farmsSliderRef.current;
      const scrollWidth = container.scrollWidth;
      const containerWidth = container.clientWidth;
      const cardWidth = scrollWidth / currentFarms.length;
      const scrollPosition = cardWidth * index;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [currentFarms.length]);

  const handleFarmScroll = useCallback(() => {
    if (farmsSliderRef.current && currentFarms.length > 0) {
      const container = farmsSliderRef.current;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const index = Math.round(scrollLeft / containerWidth);
      setCurrentFarmIndex(Math.min(index, currentFarms.length - 1));
      if (!hasSwipedOnce && scrollLeft > 0) {
        setHasSwipedOnce(true);
      }
    }
  }, [currentFarms.length, hasSwipedOnce]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedInvestmentFarm) return;

      if (e.key === 'ArrowLeft' && currentFarmIndex < currentFarms.length - 1) {
        scrollToFarm(currentFarmIndex + 1);
      } else if (e.key === 'ArrowRight' && currentFarmIndex > 0) {
        scrollToFarm(currentFarmIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFarmIndex, currentFarms.length, selectedInvestmentFarm, scrollToFarm]);

  useEffect(() => {
    const slider = farmsSliderRef.current;
    if (!slider) return;

    const handleWheel = (e: WheelEvent) => {
      if (selectedInvestmentFarm) return;

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      if (window.innerWidth >= 1024) {
        e.preventDefault();

        if (e.deltaY > 0 && currentFarmIndex < currentFarms.length - 1) {
          scrollToFarm(currentFarmIndex + 1);
        } else if (e.deltaY < 0 && currentFarmIndex > 0) {
          scrollToFarm(currentFarmIndex - 1);
        }
      }
    };

    slider.addEventListener('wheel', handleWheel, { passive: false });
    return () => slider.removeEventListener('wheel', handleWheel);
  }, [currentFarmIndex, currentFarms.length, selectedInvestmentFarm, scrollToFarm]);

  const handleUnreadCountChange = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  const handleMyAccountClick = () => {
    console.log(`👤 [Header] My Account clicked`);
    if (user) {
      console.log(`✅ [Header] Opening Account Profile without filter (show all contracts)`);
      setAccountContractFilter(null);
      setShowAccountProfile(true);
    } else {
      console.log(`⚠️ [Header] No user - showing quick access`);
      setShowQuickAccountAccess(true);
    }
  };

  const handleQuickAccessExistingUser = () => {
    setShowQuickAccountAccess(false);
    setStandaloneRegistrationMode('login');
    setShowStandaloneRegistration(true);
  };

  const handleQuickAccessNewUser = () => {
    setShowQuickAccountAccess(false);
    setShowWelcomeToAccount(true);
  };

  const handleMyFarmClick = () => {
    console.log('');
    console.log('🏠'.repeat(50));
    console.log('🏠 [FOOTER BUTTON] زر "أشجاري" تم الضغط عليه!');
    console.log('🏠'.repeat(50));
    console.log('👤 User:', user?.id || '❌ NO USER');
    console.log('🔐 Identity:', identity);
    console.log('🎭 Is Demo Mode?', isDemoMode);
    console.log('');

    if (!user) {
      console.log(`⚠️ [Footer Button] NO USER - Entering demo mode`);
      const demoType = identity === 'agricultural' ? 'green' : 'golden';
      console.log('🎨 Demo Type:', demoType);
      enterDemoMode(demoType);
      setShowMyTrees(true);
      console.log('✅ [Footer Button] Demo mode activated and MyTrees opened');
      console.log('🏠'.repeat(50));
      console.log('');
      return;
    }

    if (isDemoMode) {
      console.log(`🔄 [Footer Button] Was in Demo Mode - Exiting now`);
      exitDemoMode();
    }

    console.log(`✅ [Footer Button] Opening My Trees for user ${user.id} with identity ${identity}`);
    console.log('🏠'.repeat(50));
    console.log('');
    setShowMyTrees(true);
  };

  const handleOfferFarmClick = () => {
    enterOfferMode();
  };

  const handleWelcomeStartNow = () => {
    setShowWelcomeToAccount(false);
    setShowStandaloneRegistration(true);
  };

  const handleRegistrationSuccess = () => {
    setShowStandaloneRegistration(false);
    // لا نفتح أي صفحة - نترك المستخدم على الواجهة الرئيسية
  };

  if (isOfferMode) {
    return (
      <ErrorBoundary>
        <FarmOfferMode />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div
        className="min-h-screen flex flex-col overflow-hidden relative"
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

        {!selectedInvestmentFarm && !showAdminDashboard && !showAdminLogin && (
          <Header
            isVisible={!isScrollingDown}
            onAdminAccess={() => setShowAdminLogin(true)}
          />
        )}

        {!selectedInvestmentFarm && !showAdminDashboard && !showAdminLogin && (
          <>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="sticky top-16 lg:top-20 z-20 backdrop-blur-2xl relative" style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 250, 0.95) 50%, rgba(252, 254, 253, 0.95) 100%)',
                boxShadow: '0 8px 32px rgba(58, 161, 126, 0.12), 0 2px 8px rgba(0, 0, 0, 0.05)',
                transform: !isScrollingDown ? 'translateY(0)' : 'translateY(-100%)',
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1)',
                willChange: 'transform',
                WebkitTransform: !isScrollingDown ? 'translateY(0)' : 'translateY(-100%)',
                WebkitTransition: 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1)',
                paddingBottom: !isScrollingDown ? '0.75rem' : '0rem'
              }}>
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'radial-gradient(ellipse at top, rgba(58, 161, 126, 0.05) 0%, transparent 70%)'
                }}></div>
                <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none" style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(58, 161, 126, 0.3) 50%, transparent 100%)'
                }}></div>
                <section className="px-2 lg:px-6 py-1 lg:py-1.5">
                  <div className="flex gap-1.5 lg:gap-3 justify-between lg:max-w-5xl lg:mx-auto">
                    {[
                      {
                        icon: Handshake,
                        label: 'شريك النجاح',
                        onClick: () => setShowSuccessPartnerIntro(true),
                        delay: '0ms',
                        gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.15) 50%, rgba(16, 185, 129, 0.12) 100%)',
                        hoverGradient: 'linear-gradient(135deg, rgba(52, 211, 153, 0.18) 0%, rgba(16, 185, 129, 0.22) 50%, rgba(52, 211, 153, 0.18) 100%)',
                        iconColor: '#059669',
                        textColor: '#047857',
                        border: 'rgba(16, 185, 129, 0.25)',
                        shadow: 'rgba(16, 185, 129, 0.15)',
                        glow: 'rgba(16, 185, 129, 0.08)'
                      },
                      {
                        icon: Video,
                        label: 'فيديو تعريفي',
                        onClick: () => setShowVideoIntro(true),
                        delay: '100ms',
                        gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(219, 39, 119, 0.15) 50%, rgba(236, 72, 153, 0.12) 100%)',
                        hoverGradient: 'linear-gradient(135deg, rgba(244, 114, 182, 0.18) 0%, rgba(236, 72, 153, 0.22) 50%, rgba(244, 114, 182, 0.18) 100%)',
                        iconColor: '#db2777',
                        textColor: '#be185d',
                        border: 'rgba(236, 72, 153, 0.25)',
                        shadow: 'rgba(236, 72, 153, 0.15)',
                        glow: 'rgba(236, 72, 153, 0.08)'
                      },
                      {
                        icon: HelpCircle,
                        label: 'كيف تبدأ؟',
                        onClick: () => setShowHowToStart(true),
                        delay: '200ms',
                        gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.15) 50%, rgba(245, 158, 11, 0.12) 100%)',
                        hoverGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.18) 0%, rgba(245, 158, 11, 0.22) 50%, rgba(251, 191, 36, 0.18) 100%)',
                        iconColor: '#d97706',
                        textColor: '#b45309',
                        border: 'rgba(245, 158, 11, 0.25)',
                        shadow: 'rgba(245, 158, 11, 0.15)',
                        glow: 'rgba(245, 158, 11, 0.08)'
                      }
                    ].map((action, idx) => (
                      <button
                        key={idx}
                        onClick={action.onClick}
                        className="rounded-xl lg:rounded-2xl flex-1 h-11 lg:h-16 xl:h-18 flex flex-col items-center justify-center relative group overflow-hidden transition-all duration-300 hover:scale-[1.04] active:scale-[0.96]"
                        style={{
                          boxShadow: `0 4px 12px ${action.shadow}, 0 2px 8px ${action.glow}, inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.05)`,
                          border: `1.5px solid ${action.border}`,
                          background: `rgba(255, 255, 255, 0.65)`,
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          animationDelay: action.delay
                        }}
                      >
                        <div
                          className="absolute inset-0 rounded-xl lg:rounded-2xl pointer-events-none"
                          style={{
                            background: action.gradient
                          }}
                        />
                        <div
                          className="absolute inset-0 rounded-xl lg:rounded-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                          style={{
                            background: action.hoverGradient
                          }}
                        />
                        <div
                          className="absolute inset-0 rounded-xl lg:rounded-2xl pointer-events-none"
                          style={{
                            background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)'
                          }}
                        />
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1/2 rounded-b-xl lg:rounded-b-2xl pointer-events-none"
                          style={{
                            background: 'linear-gradient(to top, rgba(0,0,0,0.03) 0%, transparent 100%)'
                          }}
                        />
                        <action.icon
                          className="w-5 h-5 lg:w-7 lg:h-7 xl:w-8 xl:h-8 mb-0.5 relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                          style={{
                            color: action.iconColor,
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                            strokeWidth: '2.5px'
                          }}
                        />
                        <span
                          className="text-[10px] lg:text-xs xl:text-sm font-black text-center leading-tight px-1.5 relative z-10 tracking-wide transition-all duration-300 group-hover:scale-105"
                          style={{
                            color: action.textColor,
                            textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                            letterSpacing: '0.2px'
                          }}
                        >
                          {action.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="relative px-2 lg:px-6">
                  <div className="absolute left-0 right-0 top-0 h-px" style={{
                    background: 'linear-gradient(90deg, transparent 5%, rgba(58, 161, 126, 0.15) 50%, transparent 95%)'
                  }}></div>
                </div>

                <div className="px-2 lg:px-6 py-1 lg:py-1.5">
                  <AppModeSelector
                    activeMode={appMode}
                    onModeChange={handleAppModeChange}
                  />
                </div>

                <div className="relative px-2 lg:px-6">
                  <div className="absolute left-0 right-0 top-0 h-px" style={{
                    background: 'linear-gradient(90deg, transparent 5%, rgba(58, 161, 126, 0.15) 50%, transparent 95%)'
                  }}></div>
                </div>

                <section className="px-2 lg:px-6 pb-1.5 lg:pb-2 pt-1 lg:pt-1.5">
          {categories.length === 0 ? (
            <div className="text-center py-4 text-darkgreen/70 animate-pulse">
              <p className="text-sm">جاري تحميل الفئات...</p>
            </div>
          ) : (
          <div className="flex gap-2 lg:gap-3 justify-between lg:max-w-5xl lg:mx-auto">
            {[{ slug: 'all', name: 'الكل', icon: 'all' }, ...categories].map((category, idx) => {
              const Icon = iconMap[category.icon] || Leaf;
              const isActive = activeCategory === category.slug;
              const colors = getColorForIcon(category.icon, appMode);
              const iconColor = appMode === 'agricultural' ? '#3AA17E' : '#D4AF37';
              const textColor = appMode === 'agricultural' ? 'text-darkgreen' : 'text-[#B8942F]';

              return (
                <div key={category.slug} className="flex-1 flex flex-col items-center gap-1.5 lg:gap-2 animate-fadeIn" style={{ animationDelay: `${idx * 70}ms` }}>
                  <button
                    onClick={() => handleCategoryChange(category.slug)}
                    className="rounded-lg lg:rounded-xl w-11 h-11 lg:w-14 lg:h-14 flex items-center justify-center bg-white transition-all duration-300 backdrop-blur-lg relative overflow-hidden group"
                    style={{
                      boxShadow: isActive
                        ? `0 2px 8px ${colors.shadow}, 0 4px 16px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.8)`
                        : '0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
                      background: isActive
                        ? colors.iconGradient
                        : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(252,254,253,0.95) 100%)',
                      border: `1px solid ${isActive ? colors.border : 'rgba(58,161,126,0.2)'}`,
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      transform: isActive ? 'scale(1.03)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)';
                        e.currentTarget.style.boxShadow = `0 3px 10px ${colors.shadow}, 0 5px 20px ${colors.shadow}`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)';
                      }
                    }}
                  >
                    <div className={`absolute inset-0 rounded-lg lg:rounded-xl bg-gradient-to-br from-white/40 via-transparent to-emerald-50/30 pointer-events-none transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`}></div>
                    <Icon
                      className={`w-5 h-5 lg:w-6 lg:h-6 transition-all duration-300 ${isActive ? 'drop-shadow-md' : 'opacity-80 group-hover:opacity-100 group-hover:drop-shadow-sm'}`}
                      style={{
                        color: isActive ? iconColor : `${iconColor}70`,
                        filter: isActive ? 'drop-shadow(0 1px 2px rgba(58,161,126,0.3))' : 'none'
                      }}
                    />
                    {isActive && (
                      <div className="absolute inset-0 rounded-lg lg:rounded-xl animate-pulse" style={{
                        background: `radial-gradient(circle at center, ${colors.shadow} 0%, transparent 75%)`,
                        opacity: 0.15
                      }}></div>
                    )}
                  </button>
                  <span className={`text-[11px] lg:text-sm font-bold text-center leading-tight transition-all duration-300 ${isActive ? `${textColor} scale-100` : `${textColor}/70 scale-95`}`}>
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>
          )}
                </section>
              </div>

              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden"
                style={{
                  paddingBottom: '6.5rem',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  scrollBehavior: 'auto',
                  touchAction: 'pan-y'
                }}
              >
                <div className="max-w-7xl mx-auto">
                  <section className="px-3 lg:px-4 pb-4 lg:pb-6 pt-14 lg:pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 animate-fadeIn">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-emerald-200"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-darkgreen border-t-transparent absolute inset-0"></div>
                <Sprout className="w-6 h-6 text-darkgreen absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-sm text-darkgreen font-bold animate-pulse">جاري تحميل المزارع...</p>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-darkgreen rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-darkgreen rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-darkgreen rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : currentFarms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 animate-scaleIn">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <Sprout className="w-16 h-16 text-darkgreen/40 relative animate-float" />
              </div>
              <p className="text-base text-darkgreen/80 font-bold">لا توجد مزارع متاحة حالياً</p>
              <p className="text-xs text-darkgreen/60">تحقق مرة أخرى قريباً</p>
            </div>
          ) : (
            <div className="relative">
              {/* Desktop Navigation Arrows */}
              <div className="hidden lg:block">
                {currentFarmIndex > 0 && (
                  <button
                    onClick={() => scrollToFarm(currentFarmIndex - 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/95 backdrop-blur-md border-2 border-darkgreen/30 shadow-xl hover:shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
                    style={{ background: activeColors.cardGradient }}
                  >
                    <ChevronRight className="w-6 h-6 text-darkgreen group-hover:scale-125 transition-transform" strokeWidth={3} />
                  </button>
                )}
                {currentFarmIndex < currentFarms.length - 1 && (
                  <button
                    onClick={() => scrollToFarm(currentFarmIndex + 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/95 backdrop-blur-md border-2 border-darkgreen/30 shadow-xl hover:shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
                    style={{ background: activeColors.cardGradient }}
                  >
                    <ChevronLeft className="w-6 h-6 text-darkgreen group-hover:scale-125 transition-transform" strokeWidth={3} />
                  </button>
                )}
              </div>

              {/* Farms Slider */}
              <div
                ref={farmsSliderRef}
                onScroll={handleFarmScroll}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
                style={{
                  scrollPaddingLeft: '1rem',
                  scrollPaddingRight: '1rem'
                }}
              >
                {currentFarms.map((farm, idx) => {
                  const totalTrees = farm.availableTrees + farm.reservedTrees;
                  const reservationPercentage = (farm.reservedTrees / totalTrees) * 100;

                  return (
                    <div
                      key={farm.id}
                      onClick={() => {
                        setSelectedInvestmentFarm(farm);
                        setSelectedFarmMode(appMode);
                      }}
                      className="flex-shrink-0 w-[90%] lg:w-[calc(50%-1rem)] xl:w-[calc(33.333%-1rem)] rounded-xl lg:rounded-2xl overflow-hidden text-right backdrop-blur-xl relative cursor-pointer transition-all duration-500 group animate-fadeIn snap-center"
                      style={{
                        background: activeColors.cardGradient,
                        boxShadow: `0 8px 24px ${activeColors.shadow}, 0 4px 12px ${activeColors.shadow}, inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.05)`,
                        border: `2px solid ${activeColors.border}`,
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        animationDelay: `${idx * 100}ms`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                        e.currentTarget.style.boxShadow = `0 12px 32px ${activeColors.shadow}, 0 6px 16px ${activeColors.shadow}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = `0 8px 24px ${activeColors.shadow}, 0 4px 12px ${activeColors.shadow}`;
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.transform = 'scale(0.97)';
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <div className="relative w-full h-32 md:h-36 lg:h-44 overflow-hidden">
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
                        <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-gradient-to-r from-emerald-600 to-green-600 backdrop-blur-md rounded-lg px-2.5 md:px-3 py-1.5 md:py-2 shadow-lg border-2 border-white/30">
                          <span className="text-xs md:text-base font-black text-white drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{farm.name}</span>
                        </div>
                        <div className="absolute top-2 md:top-3 left-2 md:left-3 bg-gradient-to-r from-green-100 to-emerald-100 backdrop-blur-md rounded-full px-2 md:px-3 py-1 md:py-1.5 flex items-center gap-1 md:gap-2 shadow-lg border border-green-300 animate-pulse">
                          <TrendingUp className="w-3 md:w-4 h-3 md:h-4 text-green-700" strokeWidth={2.5} />
                          <span className="text-[10px] md:text-base font-black text-green-800">{farm.returnRate}</span>
                        </div>
                      </div>
                      <div className="p-2 md:p-4 space-y-1.5 md:space-y-2.5">
                        {farm.comingSoonLabel && (
                          <div className="flex items-center justify-center gap-1 md:gap-2 py-1.5 md:py-2 px-2.5 md:px-4 rounded-lg bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 border-2 border-amber-300 shadow-md">
                            <Sparkles className="w-3 md:w-4 h-3 md:h-4 text-amber-600 animate-pulse" strokeWidth={3} fill="currentColor" />
                            <span className="text-[10px] md:text-sm font-black text-amber-900">{farm.comingSoonLabel}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-1.5 md:gap-2">
                          <div className="flex items-center gap-1 md:gap-2 bg-green-100 rounded-lg px-2 md:px-3 py-1 md:py-2 border border-green-300 shadow-sm flex-1">
                            <CheckCircle2 className="w-3 md:w-4 h-3 md:h-4 text-green-700" strokeWidth={2.5} />
                            <span className="font-black text-green-800 text-[10px] md:text-base">{farm.availableTrees}</span>
                            <span className="font-bold text-green-700 text-[9px] md:text-sm">متاح</span>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2 bg-amber-100 rounded-lg px-2 md:px-3 py-1 md:py-2 border border-amber-300 shadow-sm flex-1">
                            <Clock className="w-3 md:w-4 h-3 md:h-4 text-amber-700" strokeWidth={2.5} />
                            <span className="font-black text-amber-800 text-[10px] md:text-base">{farm.reservedTrees}</span>
                            <span className="font-bold text-amber-700 text-[9px] md:text-sm">محجوز</span>
                          </div>
                        </div>

                        <div className="space-y-1 md:space-y-1.5">
                          <div className="h-1.5 md:h-2.5 w-full bg-gray-300 rounded-full overflow-hidden shadow-inner border border-gray-400">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 transition-all duration-700 shadow-lg"
                              style={{
                                width: `${reservationPercentage}%`,
                                backgroundSize: '200% 100%',
                                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)'
                              }}
                            />
                          </div>
                          <p className="text-[9px] md:text-sm font-black text-amber-800 text-center">
                            نسبة الحجز: {reservationPercentage.toFixed(0)}%
                          </p>
                        </div>

                        <p className="text-[9px] md:text-sm leading-relaxed line-clamp-2 font-bold text-darkgreen/90">
                          {farm.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Swipe Hint Text - Mobile Only */}
              {!hasSwipedOnce && currentFarms.length > 1 && (
                <div className="lg:hidden flex items-center justify-center gap-2 mt-3 animate-bounce">
                  <ChevronLeft className="w-4 h-4 text-darkgreen/60" />
                  <span className="text-xs text-darkgreen/70 font-semibold">اسحب لرؤية المزيد</span>
                  <ChevronRight className="w-4 h-4 text-darkgreen/60" />
                </div>
              )}

              {/* Progress Dots */}
              {currentFarms.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {currentFarms.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToFarm(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentFarmIndex
                          ? 'w-8 bg-darkgreen'
                          : 'w-2 bg-darkgreen/30 hover:bg-darkgreen/50'
                      }`}
                      aria-label={`الانتقال للمزرعة ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
                  </section>
                </div>
              </div>
            </div>
          </>
        )}

      {!selectedInvestmentFarm && !showAssistant && !showAdminDashboard && !showAdminLogin && !showSuccessPartnerIntro && !showSuccessPartnerOnboarding && !showSuccessPartnerRegistration && !showSuccessPartnerWelcome && !showHowItWorksPartner && (
        <nav
          className="hidden lg:flex fixed left-0 right-0 z-50 backdrop-blur-2xl"
          style={{
            background: 'linear-gradient(180deg, rgba(248, 250, 249, 0.95) 0%, rgba(242, 247, 244, 0.92) 100%)',
            borderTop: '3px solid rgba(58,161,126,0.4)',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            bottom: 0,
            transform: !isScrollingDown ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1)',
            willChange: 'transform',
            WebkitTransform: !isScrollingDown ? 'translateY(0)' : 'translateY(100%)',
            WebkitTransition: 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1)'
          }}
          ref={(el) => {
            if (el) {
              console.log('🟢 Desktop Footer - isScrollingDown:', isScrollingDown, 'Transform:', el.style.transform);
            }
          }}
        >
        <div className="max-w-7xl mx-auto w-full px-8 py-5 pb-8 flex items-center justify-around">
          <button
            onClick={handleOfferFarmClick}
            className="flex flex-col items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 group relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #d4af37 100%)',
              boxShadow: '0 4px 12px rgba(212,175,55,0.4), inset 0 2px 4px rgba(255,255,255,0.9)',
              border: '2px solid #b8942f'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(212,175,55,0.6), inset 0 2px 4px rgba(255,255,255,0.9)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(212,175,55,0.4), inset 0 2px 4px rgba(255,255,255,0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative">
              <Plus className="w-4 h-4 absolute -top-1 -right-1 text-white group-hover:rotate-90 transition-transform duration-300" />
              <Sprout className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className="text-sm font-bold text-white relative">اعرض مزرعتك</span>
          </button>

          <button
            onClick={() => setShowAssistant(true)}
            className="flex flex-col items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 relative group"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(145deg, rgba(58,161,126,0.08) 0%, rgba(58,161,126,0.12) 100%)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(58,161,126,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Sparkles className="w-6 h-6 text-darkgreen transition-transform duration-300 group-hover:scale-110" />
            <span className="text-sm font-bold text-darkgreen">المساعد</span>
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full animate-pulse" style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              boxShadow: '0 0 10px rgba(212,175,55,0.6)'
            }}></div>
          </button>

          <button
            onClick={handleMyFarmClick}
            className="flex flex-col items-center gap-2 px-8 py-4 rounded-3xl transition-all duration-300 hover:scale-105 group relative"
            style={{
              background: appMode === 'agricultural'
                ? 'linear-gradient(145deg, rgba(58,161,126,0.25) 0%, rgba(58,161,126,0.15) 50%, rgba(58,161,126,0.25) 100%)'
                : 'linear-gradient(145deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.15) 50%, rgba(212,175,55,0.25) 100%)',
              boxShadow: appMode === 'agricultural'
                ? '0 8px 24px rgba(58,161,126,0.35), 0 4px 12px rgba(58,161,126,0.25), inset 0 2px 4px rgba(255,255,255,0.8)'
                : '0 8px 24px rgba(212,175,55,0.35), 0 4px 12px rgba(212,175,55,0.25), inset 0 2px 4px rgba(255,255,255,0.8)',
              border: appMode === 'agricultural' ? '3px solid rgba(58,161,126,0.5)' : '3px solid rgba(212,175,55,0.5)',
              transform: 'scale(1.1)'
            }}
            onMouseEnter={(e) => {
              if (appMode === 'agricultural') {
                e.currentTarget.style.background = 'linear-gradient(145deg, rgba(58,161,126,0.35) 0%, rgba(58,161,126,0.25) 50%, rgba(58,161,126,0.35) 100%)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(58,161,126,0.45), 0 6px 16px rgba(58,161,126,0.35)';
              } else {
                e.currentTarget.style.background = 'linear-gradient(145deg, rgba(212,175,55,0.35) 0%, rgba(212,175,55,0.25) 50%, rgba(212,175,55,0.35) 100%)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(212,175,55,0.45), 0 6px 16px rgba(212,175,55,0.35)';
              }
            }}
            onMouseLeave={(e) => {
              if (appMode === 'agricultural') {
                e.currentTarget.style.background = 'linear-gradient(145deg, rgba(58,161,126,0.25) 0%, rgba(58,161,126,0.15) 50%, rgba(58,161,126,0.25) 100%)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(58,161,126,0.35), 0 4px 12px rgba(58,161,126,0.25)';
              } else {
                e.currentTarget.style.background = 'linear-gradient(145deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.15) 50%, rgba(212,175,55,0.25) 100%)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(212,175,55,0.35), 0 4px 12px rgba(212,175,55,0.25)';
              }
            }}
          >
            <TreePine className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" style={{ color: appMode === 'agricultural' ? '#3aa17e' : '#d4af37' }} />
            <span className="text-sm font-bold" style={{ color: appMode === 'agricultural' ? '#3aa17e' : '#d4af37' }}>
              {appMode === 'agricultural' ? 'أشجاري الخضراء' : 'أشجاري الذهبية'}
            </span>
          </button>

          <NotificationCenter
            unreadCount={unreadMessagesCount}
            onCountChange={handleUnreadCountChange}
            onOpenChange={setShowNotifications}
          />

          <button
            onClick={handleMyAccountClick}
            className="flex flex-col items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 group"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(145deg, rgba(58,161,126,0.08) 0%, rgba(58,161,126,0.12) 100%)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(58,161,126,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <User className="w-6 h-6 text-darkgreen transition-transform duration-300 group-hover:scale-110" />
            <span className="text-sm font-bold text-darkgreen">حسابي</span>
          </button>
        </div>
      </nav>
      )}

      {!selectedInvestmentFarm && !showAssistant && !showAdminDashboard && !showAdminLogin && !showSuccessPartnerIntro && !showSuccessPartnerOnboarding && !showSuccessPartnerRegistration && !showSuccessPartnerWelcome && !showHowItWorksPartner && (
        <nav
          className="fixed left-0 right-0 lg:hidden backdrop-blur-2xl"
        style={{
          transform: !isScrollingDown ? 'translateY(0)' : 'translateY(100%)',
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(248, 250, 249, 0.98) 0%, rgba(242, 247, 244, 0.95) 100%)',
          borderTop: '3px solid rgba(58,161,126,0.4)',
          boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          paddingTop: '1.25rem',
          paddingBottom: '5.5rem',
          zIndex: 50000,
          position: 'fixed',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1)',
          willChange: 'transform',
          WebkitTransform: !isScrollingDown ? 'translateY(0)' : 'translateY(100%)',
          WebkitTransition: 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1)'
        }}
        ref={(el) => {
          if (el) {
            console.log('🔵 Mobile Footer - isScrollingDown:', isScrollingDown, 'Transform:', el.style.transform);
          }
        }}
      >
        <div className="flex items-center justify-around px-2 relative" style={{ height: '5rem' }}>
          <button
            onClick={handleOfferFarmClick}
            className="flex flex-col items-center justify-center gap-1 relative group active:scale-95 transition-transform"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-active:scale-90 overflow-hidden relative"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #d4af37 100%)',
                boxShadow: '0 4px 12px rgba(212,175,55,0.4), inset 0 2px 4px rgba(255,255,255,0.9)',
                border: '2px solid #b8942f'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative">
                <Plus className="w-3 h-3 absolute -top-0.5 -right-0.5 text-white group-hover:rotate-90 transition-transform duration-300" />
                <Sprout className="w-5 h-5 text-white transition-all duration-300 group-active:scale-110" />
              </div>
            </div>
            <span className="text-[9px] font-bold" style={{ color: '#b8942f' }}>اعرض مزرعتك</span>
          </button>

          <button
            onClick={() => setShowAssistant(true)}
            className="flex flex-col items-center justify-center gap-1 relative group active:scale-95 transition-transform"
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 relative group-active:scale-90 overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,252,250,0.9) 100%)',
                boxShadow: '0 4px 8px rgba(58,161,126,0.15), inset 0 2px 4px rgba(255,255,255,0.9)',
                border: '2px solid rgba(58,161,126,0.3)'
              }}
            >
              <Sparkles className="w-5 h-5 text-darkgreen transition-all duration-300 group-active:scale-110" />
              <div
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                  boxShadow: '0 0 8px rgba(212,175,55,0.6)'
                }}
              />
            </div>
            <span className="text-[9px] font-bold text-darkgreen/70">المساعد</span>
          </button>

          <button
            onClick={handleMyFarmClick}
            className="flex flex-col items-center justify-center gap-1.5 relative group active:scale-95 transition-transform -mt-6"
          >
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-300 relative group-active:scale-90 overflow-hidden"
              style={{
                background: appMode === 'agricultural'
                  ? 'linear-gradient(145deg, rgba(58,161,126,0.28) 0%, rgba(58,161,126,0.18) 50%, rgba(58,161,126,0.28) 100%)'
                  : 'linear-gradient(145deg, rgba(212,175,55,0.28) 0%, rgba(212,175,55,0.18) 50%, rgba(212,175,55,0.28) 100%)',
                boxShadow: appMode === 'agricultural'
                  ? '0 8px 20px rgba(58,161,126,0.4), 0 4px 12px rgba(58,161,126,0.3), inset 0 2px 4px rgba(255,255,255,0.8)'
                  : '0 8px 20px rgba(212,175,55,0.4), 0 4px 12px rgba(212,175,55,0.3), inset 0 2px 4px rgba(255,255,255,0.8)',
                border: appMode === 'agricultural' ? '3px solid rgba(58,161,126,0.5)' : '3px solid rgba(212,175,55,0.5)'
              }}
            >
              <TreePine className="w-7 h-7 transition-all duration-300 group-active:scale-110" style={{ color: appMode === 'agricultural' ? '#3aa17e' : '#d4af37' }} />
            </div>
            <span className="text-[10px] font-black" style={{ color: appMode === 'agricultural' ? '#3aa17e' : '#b8942f' }}>
              {appMode === 'agricultural' ? 'أشجاري الخضراء' : 'أشجاري الذهبية'}
            </span>
          </button>

          <NotificationCenter
            unreadCount={unreadMessagesCount}
            onCountChange={handleUnreadCountChange}
            onOpenChange={setShowNotifications}
          />

          <button
            onClick={handleMyAccountClick}
            className="flex flex-col items-center justify-center gap-1 relative group active:scale-95 transition-transform"
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 group-active:scale-90"
              style={{
                background: 'linear-gradient(145deg, rgba(240,248,244,0.95) 0%, rgba(232,242,237,0.9) 100%)',
                boxShadow: '0 4px 8px rgba(58,161,126,0.2), inset 0 2px 4px rgba(255,255,255,0.9)',
                border: '2px solid rgba(58,161,126,0.35)'
              }}
            >
              <User className="w-5 h-5 text-darkgreen transition-all duration-300 group-active:scale-110" />
            </div>
            <span className="text-[9px] font-black text-darkgreen/80">حسابي</span>
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

      <SuccessPartnerIntro
        isOpen={showSuccessPartnerIntro}
        onClose={() => setShowSuccessPartnerIntro(false)}
        onDiscover={() => {
          setShowSuccessPartnerIntro(false);
          setShowSuccessPartnerOnboarding(true);
        }}
      />

      <SuccessPartnerOnboarding
        isOpen={showSuccessPartnerOnboarding}
        onClose={() => setShowSuccessPartnerOnboarding(false)}
        onComplete={() => {
          setShowSuccessPartnerOnboarding(false);
          setShowSuccessPartnerRegistration(true);
        }}
      />

      <SuccessPartnerRegistrationForm
        isOpen={showSuccessPartnerRegistration}
        onClose={() => setShowSuccessPartnerRegistration(false)}
        onSuccess={() => {
          setShowSuccessPartnerRegistration(false);
          setShowSuccessPartnerWelcome(true);
        }}
      />

      <SuccessPartnerWelcome
        isOpen={showSuccessPartnerWelcome}
        onExplore={() => {
          setShowSuccessPartnerWelcome(false);
          setShowHowItWorksPartner(true);
        }}
      />

      <HowItWorksPartner
        isOpen={showHowItWorksPartner}
        onClose={() => setShowHowItWorksPartner(false)}
      />

      <SuccessPartnerWelcomeBanner
        isOpen={showSuccessPartnerWelcomeBanner}
        onClose={() => setShowSuccessPartnerWelcomeBanner(false)}
      />

      <IdentitySwitcher />

      {showQuickAccountAccess && (
        <QuickAccountAccess
          onExistingUser={handleQuickAccessExistingUser}
          onNewUser={handleQuickAccessNewUser}
          onClose={() => setShowQuickAccountAccess(false)}
        />
      )}

      {showWelcomeToAccount && (
        <WelcomeToAccountScreen
          onStartNow={handleWelcomeStartNow}
          onClose={() => setShowWelcomeToAccount(false)}
        />
      )}

      {showStandaloneRegistration && (
        <StandaloneAccountRegistration
          onSuccess={handleRegistrationSuccess}
          onBack={() => {
            setShowStandaloneRegistration(false);
            setStandaloneRegistrationMode('register');
          }}
          initialMode={standaloneRegistrationMode}
        />
      )}

      <AccountProfile
        isOpen={showAccountProfile}
        currentContext={identity}
        contractFilter={accountContractFilter}
        onClose={() => {
          setShowAccountProfile(false);
          setAccountContractFilter(null);
        }}
        onOpenAuth={() => alert('قريباً: تسجيل الدخول')}
        onOpenReservations={() => {
          setShowAccountProfile(false);
          setShowMyReservations(true);
        }}
        onStartInvestment={() => {
          setShowAccountProfile(false);
          setShowMyReservations(true);
        }}
        onOpenGreenTrees={() => {
          setShowAccountProfile(false);
          setShowMyTrees(true);
        }}
      />


      {selectedInvestmentFarm && (
        <>
          {selectedFarmMode === 'investment' ? (
            <InvestmentFarmPage
              farm={selectedInvestmentFarm}
              onClose={() => {
                setSelectedInvestmentFarm(null);
                setSelectedFarmMode(null);
              }}
              onGoToAccount={() => setShowAccountProfile(true)}
            />
          ) : (
            <AgriculturalFarmPage
              farm={selectedInvestmentFarm}
              onClose={() => {
                setSelectedInvestmentFarm(null);
                setSelectedFarmMode(null);
              }}
              onGoToAccount={() => setShowAccountProfile(true)}
            />
          )}
        </>
      )}

      {(showAdminDashboard || showAdminLogin) && (
        <>
          {admin ? (
            <AdminDashboard />
          ) : (
            <AdminLogin
              onLoginSuccess={() => {
                setShowAdminLogin(false);
                setShowAdminDashboard(true);
              }}
            />
          )}
        </>
      )}

      <MyReservations
        isOpen={showMyReservations}
        onClose={() => setShowMyReservations(false)}
      />

      {showMyTrees && (
        <MyTrees
          onClose={() => {
            setShowMyTrees(false);
            if (isDemoMode) {
              exitDemoMode();
            }
          }}
          onNavigateToPayment={(maintenanceId) => {
            setSelectedMaintenanceId(maintenanceId);
            setShowMyTrees(false);
            setShowMaintenancePayment(true);
          }}
          onShowAuth={(mode) => {
            setShowMyTrees(false);
            exitDemoMode();
            if (mode === 'login') {
              setShowAccountProfile(true);
            } else {
              setShowStandaloneRegistration(true);
            }
          }}
        />
      )}

      {showDemoWelcome && (
        <DemoWelcomeScreen
          onStart={() => {
            setShowDemoWelcome(false);
          }}
        />
      )}

      {showMaintenancePayment && selectedMaintenanceId && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <MaintenancePaymentPage
            maintenanceId={selectedMaintenanceId}
            onClose={() => {
              setShowMaintenancePayment(false);
              setSelectedMaintenanceId(null);
              setShowMyTrees(true);
            }}
            onSuccess={() => {
              setShowMaintenancePayment(false);
              setSelectedMaintenanceId(null);
              setShowPaymentResult(true);
            }}
          />
        </div>
      )}

      {showPaymentResult && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <MaintenancePaymentResult
            onReturnHome={() => {
              setShowPaymentResult(false);
              setShowMyTrees(true);
              window.history.replaceState({}, '', window.location.pathname);
            }}
          />
        </div>
      )}

      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <OfferModeProvider>
      <AppContent />
    </OfferModeProvider>
  );
}

export default App;
