import { X, Home, BarChart3, Trophy, Camera, User, LogOut, Sparkles, ChevronLeft, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import InvestmentContract from './InvestmentContract';
import InvestorVirtualFarm from './InvestorVirtualFarm';
import InvestmentAnalyticsDashboard from './InvestmentAnalyticsDashboard';
import InvestmentJourneyTimeline from './InvestmentJourneyTimeline';
import AchievementsRewards from './AchievementsRewards';
import SmartPhotoGallery from './SmartPhotoGallery';
import LoyaltyPointsRewards from './LoyaltyPointsRewards';
import InteractiveFarmCalendar from './InteractiveFarmCalendar';
import FarmNicknameModal from './FarmNicknameModal';
import { investorAccountService, type InvestorStats, type InvestorInvestment } from '../services/investorAccountService';

interface AccountProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onOpenReservations: () => void;
  onStartInvestment?: () => void;
}

type ActiveTab = 'home' | 'analytics' | 'achievements' | 'gallery';

export default function AccountProfile({ isOpen, onClose, onOpenAuth, onStartInvestment }: AccountProfileProps) {
  const { user, signOut, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InvestorStats | null>(null);
  const [investments, setInvestments] = useState<InvestorInvestment[]>([]);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [farmNickname, setFarmNickname] = useState<string | null>(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [hasCheckedNickname, setHasCheckedNickname] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadInvestorData();
    } else if (!isOpen) {
      setStats(null);
      setInvestments([]);
      setActiveTab('home');
    }
  }, [isOpen, user]);

  const loadInvestorData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [statsData, investmentsData, nickname] = await Promise.all([
        investorAccountService.getInvestorStats(user.id),
        investorAccountService.getInvestorInvestments(user.id),
        investorAccountService.getFarmNickname(user.id)
      ]);

      setStats(statsData);
      setInvestments(investmentsData);
      setFarmNickname(nickname);

      if (!hasCheckedNickname && statsData.status !== 'none' && !nickname) {
        setShowNicknameModal(true);
        setHasCheckedNickname(true);
      }
    } catch (error) {
      console.error('Error loading investor data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleViewCertificate = (investmentId: string) => {
    setSelectedInvestmentId(investmentId);
    setShowCertificate(true);
  };

  if (showCertificate && selectedInvestmentId) {
    return (
      <InvestmentContract
        reservationId={selectedInvestmentId}
        investorName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
        onClose={() => {
          setShowCertificate(false);
          setSelectedInvestmentId(null);
        }}
      />
    );
  }

  if (!user) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
          onClick={onClose}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl transform transition-all scale-100">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xl relative">
                <User className="w-12 h-12 text-white" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-5 h-5 text-yellow-900" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">مرحباً بك</h2>
              <p className="text-gray-600">انضم لآلاف المستثمرين الناجحين</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">1</span>
                </div>
                <p className="text-sm text-gray-700 text-right flex-1">سجل الدخول بسهولة</p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">2</span>
                </div>
                <p className="text-sm text-gray-700 text-right flex-1">احجز أشجارك المثمرة</p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">3</span>
                </div>
                <p className="text-sm text-gray-700 text-right flex-1">راقب استثمارك ينمو</p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>ابدأ الآن</span>
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-slate-50 via-white to-green-50">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <h1 className="text-xl font-bold text-gray-900">حسابي</h1>

              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg"
              >
                <User className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Menu Dropdown */}
        {showProfileMenu && (
          <div className="absolute top-16 left-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-30 min-w-[200px]">
            <div className="p-3 border-b border-gray-100">
              <p className="font-bold text-gray-900 text-sm text-right">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500 text-right">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full p-3 flex items-center gap-2 hover:bg-red-50 rounded-xl transition-colors text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-bold flex-1 text-right">تسجيل الخروج</span>
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-2xl mx-auto px-4 py-6">
            {authLoading || loading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-600 mt-4">جاري التحميل...</p>
              </div>
            ) : stats && stats.status !== 'none' ? (
              <>
                {/* Stats Hero Card */}
                {activeTab === 'home' && (
                  <div className="mb-6">
                    <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>

                      <div className="relative z-10">
                        <p className="text-sm opacity-90 mb-1">مرحباً</p>
                        <h2 className="text-2xl font-bold mb-2">
                          {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </h2>

                        {farmNickname ? (
                          <div className="flex items-center gap-2 mb-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 flex-1">
                              <Sparkles className="w-4 h-4" />
                              <span className="text-sm font-semibold">{farmNickname}</span>
                            </div>
                            <button
                              onClick={() => setShowNicknameModal(true)}
                              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowNicknameModal(true)}
                            className="mb-4 flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 hover:bg-white/30 transition-all"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-semibold">اختر اسماً لمزرعتك</span>
                          </button>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                            <p className="text-xs opacity-90 mb-1">أشجاري</p>
                            <p className="text-3xl font-bold">{stats.totalTrees}</p>
                          </div>

                          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                            <p className="text-xs opacity-90 mb-1">الاستثمار</p>
                            <p className="text-2xl font-bold">{(stats.totalInvestmentValue / 1000).toFixed(0)}K</p>
                            <p className="text-xs opacity-75">ريال</p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${stats.status === 'active' ? 'bg-green-300' : 'bg-yellow-300'} animate-pulse`}></div>
                          <span className="text-sm font-bold">
                            {stats.status === 'active' ? 'نشط' : 'قيد المراجعة'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content */}
                <div className="space-y-6">
                  {activeTab === 'home' && (
                    <>
                      {investments.length > 0 && (
                        <InvestorVirtualFarm
                          investorName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستثمر'}
                          investments={investments}
                          onViewContract={handleViewCertificate}
                          onInvestMore={onClose}
                        />
                      )}
                      <InvestmentJourneyTimeline currentStage={3} />
                    </>
                  )}

                  {activeTab === 'analytics' && (
                    <InvestmentAnalyticsDashboard userId={user.id} />
                  )}

                  {activeTab === 'achievements' && (
                    <>
                      <AchievementsRewards
                        totalTrees={stats.totalTrees}
                        totalInvestment={stats.totalInvestmentValue}
                        yearsActive={1}
                      />
                      <LoyaltyPointsRewards
                        currentPoints={850}
                        totalEarned={1200}
                      />
                    </>
                  )}

                  {activeTab === 'gallery' && (
                    <>
                      <SmartPhotoGallery farmName="مزرعة الخير" />
                      <InteractiveFarmCalendar farmId="farm-1" />
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <Sparkles className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">ابدأ استثمارك الآن</h3>
                <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                  انضم لآلاف المستثمرين واستثمر في أشجار مثمرة
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onStartInvestment?.();
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  ابدأ الآن
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        {stats && stats.status !== 'none' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-20">
            <div className="max-w-2xl mx-auto px-4 py-3">
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
                    activeTab === 'home'
                      ? 'bg-green-500 text-white scale-105 shadow-lg'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Home className="w-6 h-6" />
                  <span className="text-xs font-bold">الرئيسية</span>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-blue-500 text-white scale-105 shadow-lg'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="w-6 h-6" />
                  <span className="text-xs font-bold">التحليلات</span>
                </button>

                <button
                  onClick={() => setActiveTab('achievements')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
                    activeTab === 'achievements'
                      ? 'bg-amber-500 text-white scale-105 shadow-lg'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Trophy className="w-6 h-6" />
                  <span className="text-xs font-bold">الإنجازات</span>
                </button>

                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
                    activeTab === 'gallery'
                      ? 'bg-purple-500 text-white scale-105 shadow-lg'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs font-bold">المعرض</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Farm Nickname Modal */}
        {showNicknameModal && user && (
          <FarmNicknameModal
            userId={user.id}
            currentNickname={farmNickname}
            isFirstTime={!farmNickname}
            onClose={() => setShowNicknameModal(false)}
            onSave={(newNickname) => {
              setFarmNickname(newNickname);
            }}
          />
        )}
      </div>
    </>
  );
}
