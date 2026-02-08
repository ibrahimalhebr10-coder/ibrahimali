import { User, Handshake, Sprout, Wheat, Apple, Grape, Leaf, HelpCircle, Sparkles, TrendingUp, CheckCircle2, Clock, Layers, ChevronLeft, ChevronRight, Settings, TreePine, Plus, X, Video, Star } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import NewHomePage from './components/NewHomePage';
import HowToStart from './components/HowToStart';
import StreamingVideoPlayer from './components/StreamingVideoPlayer';
import AdvancedAIAssistant from './components/AdvancedAIAssistant';
import SuccessPartnerIntro from './components/SuccessPartnerIntro';
import SuccessPartnerOnboarding from './components/SuccessPartnerOnboarding';
import SuccessPartnerRegistrationForm from './components/SuccessPartnerRegistrationForm';
import SuccessPartnerWelcome from './components/SuccessPartnerWelcome';
import HowItWorksPartner from './components/HowItWorksPartner';
import SuccessPartnerWelcomeBanner from './components/SuccessPartnerWelcomeBanner';
import NotificationCenter from './components/NotificationCenter';
import AccountProfile from './components/AccountProfile';
import SuccessPartnerAccount from './components/SuccessPartnerAccount';
import AccountTypeSelector from './components/AccountTypeSelector';
import StandaloneAccountRegistration from './components/StandaloneAccountRegistration';
import WelcomeToAccountScreen from './components/WelcomeToAccountScreen';
import MyReservations from './components/MyReservations';
import MyTrees from './components/MyTrees';
import QuickAccountAccess from './components/QuickAccountAccess';
import AccountTypeIndicator from './components/AccountTypeIndicator';
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
import { farmLoadingService, type LoadingProgress } from './services/farmLoadingService';
import { diagnostics } from './utils/diagnostics';
import { getUnreadCount } from './services/messagesService';
import { useAuth } from './contexts/AuthContext';
import { useAdminAuth } from './contexts/AdminAuthContext';
import { OfferModeProvider, useOfferMode } from './contexts/OfferModeContext';
import { useDemoMode } from './contexts/DemoModeContext';
import DemoWelcomeScreen from './components/DemoWelcomeScreen';
import { initializeSupabase } from './lib/supabase';
import { useLeadTracking } from './hooks/useLeadTracking';
import { impersonationService } from './services/impersonationService';

function AppContent() {
  const { user, identity, updateIdentity } = useAuth();
  useLeadTracking();
  const { admin } = useAdminAuth();
  const { isOfferMode, enterOfferMode } = useOfferMode();
  const { isDemoMode, demoType, enterDemoMode, exitDemoMode, showDemoWelcome, setShowDemoWelcome } = useDemoMode();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const farmsSliderRef = useRef<HTMLDivElement>(null);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [allowHideFooter, setAllowHideFooter] = useState(false);
  const lastScrollYRef = useRef(0);
  const [currentFarmIndex, setCurrentFarmIndex] = useState(0);
  const [hasSwipedOnce, setHasSwipedOnce] = useState(false);
  const appMode = identity as AppMode;
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<FarmCategory[]>([]);
  const [farmProjects, setFarmProjects] = useState<Record<string, FarmProject[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [showStreamingVideo, setShowStreamingVideo] = useState(false);
  const [showHowToStart, setShowHowToStart] = useState(false);
  const [showAdvancedAssistant, setShowAdvancedAssistant] = useState(false);
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
  const [showAccountIndicator, setShowAccountIndicator] = useState(false);
  const [accountIndicatorType, setAccountIndicatorType] = useState<'regular' | 'partner'>('regular');
  const [showSuccessPartnerAccount, setShowSuccessPartnerAccount] = useState(false);
  const [showAccountTypeSelector, setShowAccountTypeSelector] = useState(false);
  const [showNewHomePage, setShowNewHomePage] = useState(true);

  useEffect(() => {
    if (!showNewHomePage) {
      setIsScrollingDown(false);
      setAllowHideFooter(false);
      lastScrollYRef.current = 0;

      const timer = setTimeout(() => {
        setAllowHideFooter(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [showNewHomePage]);

  const handleAppModeChange = async (mode: AppMode) => {
    await updateIdentity(mode);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

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
    let mounted = true;
    let refreshInterval: NodeJS.Timeout;

    async function loadFarmsWithProgressiveLoading() {
      console.log('[App] 🚀 Loading farms');
      setLoading(true);

      try {
        const result = await farmLoadingService.loadWithCache((progress) => {
          if (mounted) {
            setLoadingProgress(progress);
          }
        });

        if (!mounted) return;

        setFromCache(result.fromCache);
        setCategories(result.categories);
        setFarmProjects(result.farms);
        setActiveCategory('all');

        const totalFarms = Object.values(result.farms).flat().length;
        console.log(`[App] ✅ Loaded ${totalFarms} farms ${result.fromCache ? '(cached)' : '(fresh)'}`);

      } catch (error) {
        console.error('[App] ❌ Error loading farms:', error);
        if (mounted) {
          setCategories([]);
          setFarmProjects({});
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingProgress(null);
        }
      }
    }

    loadFarmsWithProgressiveLoading();

    refreshInterval = setInterval(() => {
      console.log('[App] 🔄 Background refresh');
      farmLoadingService.loadAllFarms().then(result => {
        if (mounted) {
          farmLoadingService.saveToCache(result.categories, result.farms);
          console.log('[App] ✅ Cache updated in background');
        }
      }).catch(error => {
        console.error('[App] ⚠️ Background refresh failed:', error);
      });
    }, 180000);

    return () => {
      mounted = false;
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
      // Check for partner impersonation
      const impersonationData = impersonationService.getImpersonationData();

      if (impersonationData) {
        console.log('');
        console.log('🎭'.repeat(50));
        console.log('🎭 [App] Partner impersonation detected!');
        console.log('🎭 Partner ID:', impersonationData.partnerId);
        console.log('🎭 Partner Name:', impersonationData.partnerName);
        console.log('🎭 Admin User ID:', impersonationData.adminUserId);
        console.log('🎭 Opening Success Partner Account...');
        console.log('🎭'.repeat(50));
        console.log('');

        setTimeout(() => {
          setShowSuccessPartnerAccount(true);
        }, 500);
        return;
      }

      // Check for new partner registration
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
    console.log('');
    console.log('🔔'.repeat(50));
    console.log('🔔 [STATE CHANGE] showSuccessPartnerAccount:', showSuccessPartnerAccount);
    console.log('🔔'.repeat(50));
    console.log('');
  }, [showSuccessPartnerAccount]);

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
    console.log('');
    console.log('👤'.repeat(50));
    console.log('👤 [HEADER] زر "حسابي" تم الضغط عليه!');
    console.log('👤'.repeat(50));
    console.log('🔐 User:', user?.id || '❌ NO USER');
    console.log('🎭 Identity:', identity);
    console.log('');
    // Always use QuickAccountAccess - it will check account type and route correctly
    console.log('🔄 [Header] Opening QuickAccountAccess to check account type');
    setShowQuickAccountAccess(true);
    console.log('✅ [Header] QuickAccountAccess state set to TRUE');
    console.log('👤'.repeat(50));
    console.log('');
  };

  const handleQuickAccessLogin = () => {
    setShowQuickAccountAccess(false);
    setStandaloneRegistrationMode('login');
    setShowStandaloneRegistration(true);
  };

  const handleQuickAccessRegister = () => {
    setShowQuickAccountAccess(false);
    setShowWelcomeToAccount(true);
  };

  const handleOpenRegularAccount = () => {
    console.log('📱 [QuickAccess] Opening regular account');
    setShowAccountProfile(true);
    setAccountContractFilter(null);
    setAccountIndicatorType('regular');
    setShowAccountIndicator(true);
  };

  const handleOpenPartnerAccount = () => {
    console.log('');
    console.log('🌟'.repeat(50));
    console.log('🌟 [App] handleOpenPartnerAccount called!');
    console.log('🌟'.repeat(50));
    console.log('👤 User:', user?.id || '❌ NO USER');
    console.log('🎭 Identity:', identity);
    console.log('📊 Current showSuccessPartnerAccount state:', showSuccessPartnerAccount);
    console.log('');
    console.log('✅ Setting showSuccessPartnerAccount to TRUE...');
    setShowSuccessPartnerAccount(true);
    console.log('✅ State updated - SuccessPartnerAccount should now be visible');
    console.log('🌟'.repeat(50));
    console.log('');
  };

  const handleMyFarmClick = async () => {
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

    console.log('🔍 [Footer Button] Checking if user is an influencer...');
    const { influencerMarketingService } = await import('./services/influencerMarketingService');
    const isInfluencer = await influencerMarketingService.checkIfUserIsInfluencer();
    console.log('📊 [Footer Button] isInfluencer result:', isInfluencer);

    if (isInfluencer) {
      console.log('');
      console.log('⭐'.repeat(50));
      console.log('⭐ [Footer Button] User IS a Success Partner!');
      console.log('⭐ Setting showSuccessPartnerAccount to TRUE...');
      setShowSuccessPartnerAccount(true);
      console.log('⭐ State updated - SuccessPartnerAccount should now be visible');
      console.log('⭐'.repeat(50));
      console.log('');
    } else {
      console.log(`✅ [Footer Button] User is NOT a partner - Opening My Trees for user ${user.id} with identity ${identity}`);
      setShowMyTrees(true);
    }

    console.log('🏠'.repeat(50));
    console.log('');
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
    // بعد نجاح تسجيل الدخول، ننتظر تحديث AuthContext ثم نفتح QuickAccountAccess
    console.log('✅ [Registration Success] Waiting for AuthContext to update user state...');
    setTimeout(() => {
      console.log('✅ [Registration Success] Re-opening QuickAccountAccess to check account type');
      setShowQuickAccountAccess(true);
    }, 1500);
  };

  if (isOfferMode) {
    return (
      <ErrorBoundary>
        <FarmOfferMode />
      </ErrorBoundary>
    );
  }

  // Debug log
  console.log('🏠 [App] showNewHomePage:', showNewHomePage);
  console.log('🏠 [App] showAdminDashboard:', showAdminDashboard);
  console.log('🏠 [App] showAdminLogin:', showAdminLogin);

  if (showNewHomePage && !showAdminDashboard && !showAdminLogin) {
    console.log('✅ [App] Showing New Home Page!');
    return (
      <ErrorBoundary>
        <NewHomePage
          onStartInvestment={() => setShowNewHomePage(false)}
          onOpenPartnerProgram={() => setShowSuccessPartnerIntro(true)}
          onOpenAccount={() => setShowQuickAccountAccess(true)}
          onOpenAssistant={() => setShowAdvancedAssistant(true)}
        />
      </ErrorBoundary>
    );
  }

  console.log('📄 [App] Showing Current Interface (Second Page)');

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
            <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #f0eeea 0%, #e8e6e2 100%)' }}>
              <div className="sticky top-16 lg:top-20 z-20 relative" style={{
                background: 'linear-gradient(180deg, #e8e6e2 0%, #e5e3df 100%)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                transform: !isScrollingDown ? 'translateY(0)' : 'translateY(-100%)',
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1)',
                willChange: 'transform',
                WebkitTransform: !isScrollingDown ? 'translateY(0)' : 'translateY(-100%)',
                WebkitTransition: 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1)',
                paddingBottom: !isScrollingDown ? '0.75rem' : '0rem'
              }}>

                {/* Mode Selector - Exact Design from Image */}
                <div className="px-4 pt-5 pb-3">
                  <div className="flex gap-3 justify-center">
                    {/* أشجاري Button - Green Pill */}
                    <button
                      onClick={() => handleAppModeChange('agricultural')}
                      className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-base transition-all duration-300"
                      style={{
                        background: appMode === 'agricultural'
                          ? 'linear-gradient(145deg, #4a9d7c 0%, #2d6a4f 100%)'
                          : 'rgba(245, 243, 240, 0.9)',
                        color: appMode === 'agricultural' ? '#ffffff' : '#7a7a7a',
                        boxShadow: appMode === 'agricultural'
                          ? '0 6px 20px rgba(45, 106, 79, 0.45), inset 0 2px 0 rgba(255,255,255,0.15)'
                          : '0 4px 15px rgba(0,0,0,0.08)',
                        border: 'none'
                      }}
                    >
                      <Sprout className="w-5 h-5" />
                      <span>أشجاري</span>
                    </button>

                    {/* أشجاري الذهبية Button - Gold Pill */}
                    <button
                      onClick={() => handleAppModeChange('investment')}
                      className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-base transition-all duration-300"
                      style={{
                        background: appMode === 'investment'
                          ? 'linear-gradient(145deg, #d4b85a 0%, #a67c00 100%)'
                          : 'linear-gradient(145deg, #f8f3e3 0%, #ede5d0 100%)',
                        color: appMode === 'investment' ? '#ffffff' : '#a08050',
                        boxShadow: appMode === 'investment'
                          ? '0 6px 20px rgba(169, 124, 0, 0.45), inset 0 2px 0 rgba(255,255,255,0.15)'
                          : '0 4px 15px rgba(0,0,0,0.06)',
                        border: 'none'
                      }}
                    >
                      <Sprout className="w-5 h-5" />
                      <span>أشجاري الذهبية</span>
                    </button>
                  </div>

                  {/* Title under buttons */}
                  <h2 className="text-center font-bold text-base mt-4" style={{ color: '#5a5a5a' }}>
                    مزارع مالئد أعلى
                  </h2>
                </div>

                {/* Tree Type Filters - Exact Design from Image */}
                <section className="px-5 pb-4">
          <div className="flex gap-4 justify-center">
            {[
              { slug: 'all', name: 'الكل', image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=200' },
              { slug: 'palm', name: 'النخيل', image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=200' },
              { slug: 'olive', name: 'الزيتون', image: 'https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=200' },
              { slug: 'mango', name: 'المانجا', image: 'https://images.pexels.com/photos/2294471/pexels-photo-2294471.jpeg?auto=compress&cs=tinysrgb&w=200' }
            ].map((category) => {
              const isActive = activeCategory === category.slug;

              return (
                <div key={category.slug} className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => handleCategoryChange(category.slug)}
                    className="w-[72px] h-[72px] rounded-2xl overflow-hidden transition-all duration-300 relative"
                    style={{
                      boxShadow: isActive
                        ? '0 8px 25px rgba(45, 106, 79, 0.4)'
                        : '0 6px 18px rgba(0,0,0,0.1)',
                      border: isActive ? '4px solid #3d8b6e' : '3px solid #e8e8e8',
                      background: '#f5f5f5'
                    }}
                  >
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                    {isActive && (
                      <div className="absolute inset-0 bg-green-600/10" />
                    )}
                  </button>
                  <span
                    className="text-sm font-bold"
                    style={{ color: isActive ? '#2d6a4f' : '#777777' }}
                  >
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>
                </section>
              </div>

              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden"
                style={{
                  paddingBottom: '120px',
                  background: 'linear-gradient(180deg, #e5e3df 0%, #dddbd7 100%)',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  scrollBehavior: 'auto',
                  touchAction: 'pan-y'
                }}
              >
                <div className="max-w-7xl mx-auto">
                  <section className="px-4 lg:px-4 pb-6 lg:pb-4 pt-4 lg:pt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 animate-fadeIn">
              <div className="relative">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-200"></div>
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-darkgreen border-t-transparent absolute inset-0"></div>
                <Sprout className="w-7 h-7 text-darkgreen absolute inset-0 m-auto animate-pulse" />
              </div>

              {fromCache ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-darkgreen font-bold flex items-center gap-2 justify-center">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    تحميل فوري من الذاكرة
                  </p>
                  <p className="text-xs text-darkgreen/60">تحديث البيانات في الخلفية...</p>
                </div>
              ) : loadingProgress ? (
                <div className="text-center space-y-3 w-full max-w-xs">
                  <p className="text-sm text-darkgreen font-bold">{loadingProgress.message}</p>

                  {loadingProgress.stage !== 'complete' && (
                    <div className="w-full space-y-2">
                      <div className="relative h-2 bg-emerald-100 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-darkgreen to-emerald-400 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%`
                          }}
                        >
                          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                        </div>
                      </div>
                      <p className="text-xs text-darkgreen/70 font-medium">
                        {loadingProgress.loaded} من {loadingProgress.total}
                        {loadingProgress.stage === 'instant' && ' • تحميل سريع'}
                        {loadingProgress.stage === 'progressive' && ' • تحميل تدريجي'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-sm text-darkgreen font-bold animate-pulse">جاري التحميل...</p>
                  <div className="flex gap-1.5 justify-center">
                    <div className="w-1.5 h-1.5 bg-darkgreen rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-darkgreen rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-darkgreen rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
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
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1"
                style={{
                  scrollPaddingLeft: '1rem',
                  scrollPaddingRight: '1rem'
                }}
              >
                {currentFarms.map((farm, idx) => {
                  const totalTrees = farm.availableTrees + farm.reservedTrees;
                  const reservationPercentage = (farm.reservedTrees / totalTrees) * 100;
                  const availablePercentage = 100 - reservationPercentage;

                  return (
                    <div
                      key={farm.id}
                      onClick={() => {
                        setSelectedInvestmentFarm(farm);
                        setSelectedFarmMode(appMode);
                      }}
                      className="flex-shrink-0 w-[90%] lg:w-[calc(50%-1rem)] xl:w-[calc(33.333%-1rem)] rounded-[28px] overflow-hidden text-right relative cursor-pointer transition-all duration-500 group animate-fadeIn snap-center"
                      style={{
                        background: 'linear-gradient(180deg, #fefefe 0%, #f8f6f3 100%)',
                        boxShadow: '0 15px 50px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0,0,0,0.06)',
                        border: '1px solid rgba(230,225,215,0.6)',
                        animationDelay: `${idx * 100}ms`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 15px 50px rgba(0, 0, 0, 0.1)';
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.transform = 'scale(0.98)';
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {/* Farm Image Section - Much Larger to Match Design */}
                      <div className="relative w-full h-52 overflow-hidden rounded-t-[28px]">
                        <img
                          src={farm.image}
                          alt={farm.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

                        {/* Farm Name Badge - Top Center - Exact Design */}
                        <div
                          className="absolute top-4 left-1/2 -translate-x-1/2 px-7 py-2.5 rounded-full"
                          style={{
                            background: 'linear-gradient(145deg, #4a9d7c 0%, #2d6a4f 100%)',
                            boxShadow: '0 8px 25px rgba(45, 106, 79, 0.5)'
                          }}
                        >
                          <span className="text-[15px] font-bold text-white whitespace-nowrap tracking-wide">
                            {farm.name}
                          </span>
                        </div>

                        {/* Return Rate Badge - Gold Circle - Exact Design */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 left-4 w-[88px] h-[88px] rounded-full flex flex-col items-center justify-center"
                          style={{
                            background: 'linear-gradient(145deg, #f5e9c8 0%, #d4b04a 25%, #c9a227 50%, #b8922a 75%, #d4b85a 100%)',
                            border: '5px solid rgba(255,255,255,0.98)',
                            boxShadow: '0 10px 35px rgba(169, 124, 0, 0.5), inset 0 3px 8px rgba(255,255,255,0.6), inset 0 -2px 6px rgba(0,0,0,0.1)'
                          }}
                        >
                          <span className="text-[11px] font-bold" style={{ color: '#5c4a1f' }}>عائد سنوي</span>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <span className="text-[26px] font-black" style={{ color: '#4a3a15' }}>{farm.returnRate}</span>
                            <TrendingUp className="w-5 h-5 text-green-700" strokeWidth={3} />
                          </div>
                        </div>
                      </div>

                      {/* Card Content - White Background */}
                      <div className="p-5 space-y-3" style={{ background: '#fefefe' }}>
                        {/* Available Trees */}
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-[17px] font-bold" style={{ color: '#3a3a3a' }}>
                            {totalTrees} شجرة متاحة للاستثمار
                          </span>
                          <CheckCircle2 className="w-6 h-6 text-green-600" strokeWidth={2.5} />
                        </div>

                        {/* Progress Bar - Exact Design Match */}
                        <div className="space-y-3">
                          <div
                            className="relative h-5 rounded-full overflow-hidden"
                            style={{
                              background: 'linear-gradient(180deg, #e8e5de 0%, #dedad2 100%)',
                              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)'
                            }}
                          >
                            {/* Available Section - Green gradient from right */}
                            <div
                              className="absolute right-0 top-0 h-full rounded-r-full transition-all duration-700"
                              style={{
                                width: `${availablePercentage}%`,
                                background: 'linear-gradient(90deg, #7ee8b8 0%, #4ade80 25%, #22c55e 50%, #16a34a 75%, #15803d 100%)',
                              }}
                            />
                            {/* Reserved Section - Yellow gradient */}
                            {reservationPercentage > 0 && (
                              <div
                                className="absolute top-0 h-full transition-all duration-700"
                                style={{
                                  right: `${availablePercentage}%`,
                                  width: `${reservationPercentage}%`,
                                  background: 'linear-gradient(90deg, #fef08a 0%, #facc15 50%, #eab308 100%)',
                                }}
                              />
                            )}
                          </div>

                          {/* Status Labels Row - Exact Design */}
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full" style={{ background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)' }} />
                              <span className="font-bold text-[13px]" style={{ color: '#555555' }}>متاح</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full" style={{ background: 'linear-gradient(135deg, #fef08a 0%, #eab308 100%)' }} />
                              <span className="font-bold text-[13px]" style={{ color: '#555555' }}>محجوز</span>
                            </div>
                            <span className="font-black text-[15px]" style={{ color: '#333333' }}>
                              {reservationPercentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {/* Management Info - Exact Design */}
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-[13px]" style={{ color: '#666666' }}>
                            الإدارة والمتابعة من فريق متخصص
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Swipe Hint Text - Mobile Only */}
              {!hasSwipedOnce && currentFarms.length > 1 && (
                <div className="lg:hidden flex items-center justify-center gap-2 mt-1 animate-bounce">
                  <ChevronLeft className="w-3 h-3 text-darkgreen/60" />
                  <span className="text-[10px] text-darkgreen/70 font-semibold">اسحب لرؤية المزيد</span>
                  <ChevronRight className="w-3 h-3 text-darkgreen/60" />
                </div>
              )}

              {/* Progress Dots */}
              {currentFarms.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-2">
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

      {!selectedInvestmentFarm && !showAdminDashboard && !showAdminLogin && !showSuccessPartnerIntro && !showSuccessPartnerOnboarding && !showSuccessPartnerRegistration && !showSuccessPartnerWelcome && !showHowItWorksPartner && !showAdvancedAssistant && (
        <nav
          className="hidden lg:flex fixed left-0 right-0 backdrop-blur-2xl"
          style={{
            background: 'linear-gradient(180deg, rgba(248, 250, 249, 0.98) 0%, rgba(242, 247, 244, 0.98) 100%)',
            borderTop: '3px solid rgba(58,161,126,0.4)',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            bottom: 0,
            zIndex: 99999
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
            onClick={() => setShowAdvancedAssistant(true)}
            className="flex flex-col items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 relative group"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(145deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.18) 100%)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="relative">
              <Sparkles className="w-6 h-6 text-emerald-600 transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                boxShadow: '0 0 10px rgba(212,175,55,0.6)'
              }}></div>
            </div>
            <span className="text-sm font-bold text-emerald-600">المساعد الذكي</span>
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

      {!selectedInvestmentFarm && !showAdminDashboard && !showAdminLogin && !showSuccessPartnerIntro && !showSuccessPartnerOnboarding && !showSuccessPartnerRegistration && !showSuccessPartnerWelcome && !showHowItWorksPartner && !showAdvancedAssistant && ReactDOM.createPortal(
        <div
          id="mobile-footer"
          className="lg:hidden"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.1)',
            zIndex: 2147483647,
            WebkitTransform: 'translate3d(0, 0, 0)',
            transform: 'translate3d(0, 0, 0)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 28px',
              paddingBottom: 'max(18px, env(safe-area-inset-bottom))'
            }}
          >
            {/* Account Button - Left */}
            <button
              onClick={handleMyAccountClick}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                minWidth: '60px'
              }}
            >
              <User style={{ width: '26px', height: '26px', color: '#9ca3af' }} strokeWidth={1.5} />
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>حسابي</span>
            </button>

            {/* My Trees Button - Center - Exact Design Match */}
            <button
              onClick={handleMyFarmClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 32px',
                borderRadius: '9999px',
                background: 'linear-gradient(145deg, #4a9d7c 0%, #2d6a4f 100%)',
                boxShadow: '0 6px 24px rgba(45, 106, 79, 0.45), inset 0 2px 0 rgba(255,255,255,0.15)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Sprout style={{ width: '22px', height: '22px', color: '#ffffff' }} />
              <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '15px' }}>أشجاري</span>
            </button>

            {/* Notifications Button - Right */}
            <button
              onClick={() => setShowNotifications(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                minWidth: '60px'
              }}
            >
              <div style={{ position: 'relative' }}>
                <svg style={{ width: '26px', height: '26px', color: '#9ca3af' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#ffffff',
                    background: '#dc2626',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)'
                  }}
                >
                  {unreadMessagesCount > 0 ? (unreadMessagesCount > 9 ? '9+' : unreadMessagesCount) : '3'}
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>الإشعارات</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      <StreamingVideoPlayer
        isOpen={showStreamingVideo}
        onClose={() => setShowStreamingVideo(false)}
        onComplete={() => {
          setShowStreamingVideo(false);
          setShowAdvancedAssistant(true);
        }}
      />

      <HowToStart
        isOpen={showHowToStart}
        onClose={() => setShowHowToStart(false)}
        onStart={() => alert('قريباً')}
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
          onLogin={handleQuickAccessLogin}
          onRegister={handleQuickAccessRegister}
          onOpenRegularAccount={handleOpenRegularAccount}
          onOpenPartnerAccount={handleOpenPartnerAccount}
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

      {/* SuccessPartnerAccount Component - Always Rendered */}
      {console.log('🎨 [RENDER] About to render SuccessPartnerAccount with isOpen:', showSuccessPartnerAccount)}
      <SuccessPartnerAccount
        isOpen={showSuccessPartnerAccount}
        onClose={() => {
          console.log('🔴 [SuccessPartnerAccount] onClose called - setting state to FALSE');
          setShowSuccessPartnerAccount(false);
        }}
      />

      <AccountTypeSelector
        isOpen={showAccountTypeSelector}
        identity={identity}
        onClose={() => setShowAccountTypeSelector(false)}
        onSelectCustomerAccount={() => {
          setShowAccountTypeSelector(false);
          setShowMyTrees(true);
        }}
        onSelectPartnerAccount={() => {
          setShowAccountTypeSelector(false);
          setShowSuccessPartnerAccount(true);
        }}
      />

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

      {showAccountIndicator && (
        <AccountTypeIndicator
          accountType={accountIndicatorType}
          onClose={() => setShowAccountIndicator(false)}
        />
      )}

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
            console.log('Payment navigation requested for:', maintenanceId);
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

      <AdvancedAIAssistant
        isOpen={showAdvancedAssistant}
        onClose={() => setShowAdvancedAssistant(false)}
      />

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
