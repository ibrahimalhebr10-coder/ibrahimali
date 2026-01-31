import { X, User, TreePine, TrendingUp, CheckCircle, FileText, DollarSign, MessageCircle, Bell, LogOut, Sparkles, ArrowLeft, Flame, Leaf, Droplets, Recycle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import WhatsAppButton from './WhatsAppButton';
import InvestmentContract from './InvestmentContract';
import InvestorVirtualFarm from './InvestorVirtualFarm';
import { investorAccountService, type InvestorStats, type InvestorInvestment } from '../services/investorAccountService';

interface AccountProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onOpenReservations: () => void;
}

export default function AccountProfile({ isOpen, onClose, onOpenAuth, onOpenReservations }: AccountProfileProps) {
  const { user, signOut, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InvestorStats | null>(null);
  const [investments, setInvestments] = useState<InvestorInvestment[]>([]);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadInvestorData();
    }
  }, [isOpen, user]);

  const loadInvestorData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [statsData, investmentsData] = await Promise.all([
        investorAccountService.getInvestorStats(user.id),
        investorAccountService.getInvestorInvestments(user.id)
      ]);

      setStats(statsData);
      setInvestments(investmentsData);
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

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />
      <div
        className="fixed inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 z-50 overflow-y-auto"
        style={{
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <div className="min-h-screen pb-20 px-4 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-green-800">حسابي الاستثماري</h1>
            <div className="w-10" />
          </div>

          {authLoading || loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : user ? (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Identity Card - Investor Profile */}
              <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-green-300/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 text-right">
                    <h2 className="text-2xl font-bold text-green-800">
                      مرحبًا يا {user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستثمر'}
                    </h2>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>

                {stats && stats.status !== 'none' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Total Trees */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TreePine className="w-5 h-5 text-green-600" />
                        <span className="text-xs text-gray-600">عدد الأشجار النشطة</span>
                      </div>
                      <p className="text-3xl font-bold text-green-700">{stats.totalTrees}</p>
                    </div>

                    {/* Total Investment Value */}
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border-2 border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                        <span className="text-xs text-gray-600">قيمة الاستثمار</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-700">{stats.totalInvestmentValue.toLocaleString()} ريال</p>
                    </div>

                    {/* Investment Status - Full Width */}
                    <div className="col-span-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-gray-600">حالة الاستثمار</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {stats.status === 'active' ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-lg font-bold text-green-700">نشط</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                              <span className="text-lg font-bold text-yellow-700">قيد المراجعة</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 text-center border-2 border-gray-200">
                    <TreePine className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">لا توجد استثمارات حتى الآن</p>
                    <p className="text-sm text-gray-500 mt-2">ابدأ رحلتك الاستثمارية الآن</p>
                  </div>
                )}
              </div>

              {/* Investor Virtual Farm */}
              {investments.length > 0 && (
                <InvestorVirtualFarm
                  investorName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستثمر'}
                  investments={investments}
                  onViewContract={handleViewCertificate}
                  onInvestMore={onClose}
                />
              )}

              {/* Additional Benefits Section */}
              {investments.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-green-200">
                  <h3 className="text-xl font-bold text-green-800 text-right mb-4">
                    القيمة الكاملة لاستثمار أشجارك
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Firewood from Pruning */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                      <Flame className="w-8 h-8 text-orange-600 mb-2" />
                      <p className="text-sm font-bold text-gray-800">حطب من التقليم</p>
                      <p className="text-xs text-gray-600 mt-1">للاستخدام أو البيع</p>
                    </div>

                    {/* Olive Leaves as Feed */}
                    <div className="bg-gradient-to-br from-green-50 to-lime-50 rounded-xl p-4 border border-green-200">
                      <Leaf className="w-8 h-8 text-green-600 mb-2" />
                      <p className="text-sm font-bold text-gray-800">أوراق كأعلاف</p>
                      <p className="text-xs text-gray-600 mt-1">قيمة غذائية عالية</p>
                    </div>

                    {/* Pressing Waste */}
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                      <Droplets className="w-8 h-8 text-amber-600 mb-2" />
                      <p className="text-sm font-bold text-gray-800">مخلفات العصر</p>
                      <p className="text-xs text-gray-600 mt-1">استخدامات متعددة</p>
                    </div>

                    {/* Full Tree Utilization */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                      <Recycle className="w-8 h-8 text-blue-600 mb-2" />
                      <p className="text-sm font-bold text-gray-800">صفر هدر</p>
                      <p className="text-xs text-gray-600 mt-1">كل جزء له قيمة</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 text-right mb-4">الإجراءات السريعة</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => alert('قريبًا: صفحة الدفع')}
                    className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <span className="text-xs font-bold text-gray-700">الدفع</span>
                  </button>

                  <button
                    onClick={() => alert('قريبًا: صفحة الدعم')}
                    className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                    <span className="text-xs font-bold text-gray-700">الدعم</span>
                  </button>

                  <button
                    onClick={() => alert('قريبًا: صفحة الإشعارات')}
                    className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <Bell className="w-6 h-6 text-amber-600" />
                    <span className="text-xs font-bold text-gray-700">الإشعارات</span>
                  </button>
                </div>
              </div>

              {/* WhatsApp Support */}
              <WhatsAppButton
                investorName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستثمر'}
                variant="secondary"
                size="large"
                className="w-full"
              />

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full py-4 rounded-xl font-bold text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 bg-white"
              >
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 relative bg-gradient-to-br from-green-600 to-emerald-600 shadow-2xl">
                  <User className="w-14 h-14 text-white" />
                  <div className="absolute -top-1 -right-1 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="w-6 h-6 text-yellow-900" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-green-800 mb-3">مرحبًا بك!</h2>
                <p className="text-base text-gray-700 leading-relaxed px-4">
                  ابدأ رحلتك الاستثمارية معنا
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 mb-6 shadow-2xl border-2 border-green-200">
                <div className="space-y-3 text-right">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 flex-1">
                      سجل دخولك بسهولة باستخدام البريد الإلكتروني
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 flex-1">
                      احجز أشجارك في أفضل المزارع
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 flex-1">
                      تابع محصولك وعوائدك بكل شفافية
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="w-full py-5 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden group bg-gradient-to-r from-green-600 to-emerald-600 shadow-2xl"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <span className="text-lg">ابدأ الآن</span>
                <ArrowLeft className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
              </button>

              <p className="text-xs text-center text-gray-500 mt-4 px-4">
                بالضغط على "ابدأ الآن" فإنك توافق على الشروط والأحكام
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
