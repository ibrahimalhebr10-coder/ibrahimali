import { useState, useEffect } from 'react';
import { Users, Sprout, TreeDeciduous, Package, AlertCircle, DollarSign, X, LogOut, Home, Target, CreditCard } from 'lucide-react';
import KPICard from './KPICard';
import AdminFarmCard from './AdminFarmCard';
import Breadcrumb from './Breadcrumb';
import AdminNavigation, { AdminPage } from './AdminNavigation';
import FarmManagement from './FarmManagement';
import VideoIntroManagement from './VideoIntroManagement';
import ReservationsManagement from './ReservationsManagement';
import FinanceManagement from './FinanceManagement';
import PermissionsManagement from './PermissionsManagement';
import PaymentMethodsSettings from './PaymentMethodsSettings';
import AdminRouteGuard from './AdminRouteGuard';
import MyHarvest from '../MyHarvest';
import InvestorMessaging from './InvestorMessaging';
import MessagesCenter from './MessagesCenter';
import { adminService, DashboardStats, FarmStats } from '../../services/adminService';
import { useAdmin } from '../../contexts/AdminContext';

interface AdminDashboardProps {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const { admin, adminRole, defaultPage, signOutAdmin } = useAdmin();
  const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeInvestors: 0,
    totalTreesBooked: 0,
    activeHarvestOperations: 0,
    pendingActions: 0,
    todayPayments: 0,
    pendingPayments: 0
  });
  const [farms, setFarms] = useState<FarmStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [showPermissionsManagement, setShowPermissionsManagement] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  useEffect(() => {
    if (defaultPage) {
      console.log('🎯 Setting initial page to:', defaultPage);
      setCurrentPage(defaultPage);
    }
  }, [defaultPage]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [statsData, farmsData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAllFarms()
      ]);

      setStats(statsData);
      setFarms(farmsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleBooking(farmId: string, isOpen: boolean) {
    const success = await adminService.updateFarmStatus(farmId, isOpen);
    if (success) {
      setFarms(farms.map(f => f.id === farmId ? { ...f, isOpenForBooking: isOpen } : f));
    }
  }

  function handleViewFarmDetails(farm: FarmStats) {
    console.log('View farm details for farm:', farm.id, farm.name);
    setSelectedFarmId(farm.id);
    setCurrentPage('farms');
  }

  async function handleLogout() {
    await signOutAdmin();
    onClose();
  }

  function getPageLabel(page: AdminPage): string {
    const labels: Record<AdminPage, string> = {
      dashboard: 'لوحة التحكم',
      farms: 'إدارة المزارع',
      reservations: 'إدارة الحجوزات',
      finance: 'الإدارة المالية',
      harvest: 'إدارة محصولي',
      messages: 'إدارة الرسائل',
      messaging: 'مراسلة المستثمرين',
      video: 'الفيديو التعريفي',
      settings: 'إعدادات النظام'
    };
    return labels[page];
  }

  function getPendingTasksMessage(stats: DashboardStats, role: string): string {
    if (role === 'financial_manager') {
      return `${stats.pendingPayments} عملية دفع معلقة`;
    }
    if (role === 'farm_manager') {
      return `${stats.pendingActions} مزرعة تحتاج متابعة`;
    }
    return `${stats.pendingActions} إجراء يحتاج تدخل`;
  }

  if (!admin) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">غير مصرح</h2>
          <p className="text-gray-400 mb-6">ليس لديك صلاحية الوصول إلى لوحة التحكم</p>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-white transition-all duration-300"
            style={{
              background: 'linear-gradient(145deg, #3AA17E, #2D8B6A)'
            }}
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (currentPage !== 'farms') {
      setSelectedFarmId(null);
    }
  }, [currentPage]);

  function renderPageContent() {
    if (currentPage === 'farms') {
      console.log('Rendering FarmManagement with selectedFarmId:', selectedFarmId);
      return <FarmManagement key={selectedFarmId || 'all'} initialFarmId={selectedFarmId} />;
    }

    if (currentPage === 'video') {
      return <VideoIntroManagement />;
    }

    if (currentPage === 'reservations') {
      return <ReservationsManagement onBack={() => setCurrentPage('dashboard')} />;
    }

    if (currentPage === 'finance') {
      return <FinanceManagement onBack={() => setCurrentPage('dashboard')} />;
    }

    if (currentPage === 'harvest') {
      return <MyHarvest isOpen={true} onClose={() => {}} inDashboard={true} />;
    }

    if (currentPage === 'messages') {
      return <MessagesCenter />;
    }

    if (currentPage === 'messaging') {
      return (
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <InvestorMessaging />
          </div>
        </div>
      );
    }

    if (currentPage === 'settings') {
      return (
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-6">
              <button
                onClick={() => setShowPermissionsManagement(true)}
                className="p-8 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl text-right hover:scale-105 transition-transform"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">إدارة الصلاحيات</h3>
                    <p className="text-white/80">إدارة الأدوار، الصلاحيات، ومستخدمي الإدارة</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowPaymentMethods(true)}
                className="p-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl text-right hover:scale-105 transition-transform"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">وسائل السداد</h3>
                    <p className="text-white/80">إدارة وسائل السداد المتاحة للمستثمرين (مدى، تابي، تمارا، تحويل بنكي)</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <>
              <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">المؤشرات الرئيسية</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    icon={Users}
                    title="إجمالي المستخدمين"
                    value={stats.totalUsers}
                    color="#3AA17E"
                  />
                  <KPICard
                    icon={Sprout}
                    title="المستثمرون النشطون"
                    value={stats.activeInvestors}
                    color="#4CAF50"
                  />
                  <KPICard
                    icon={TreeDeciduous}
                    title="الأشجار المحجوزة"
                    value={stats.totalTreesBooked}
                    color="#FF9800"
                  />
                  <KPICard
                    icon={AlertCircle}
                    title="تحتاج تدخل"
                    value={stats.pendingActions}
                    color="#F44336"
                  />
                </div>
              </section>

              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">المزارع</h2>
                  <span className="text-sm text-white/70">{farms.length} مزرعة</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {farms.map(farm => (
                    <AdminFarmCard
                      key={farm.id}
                      farm={farm}
                      onViewDetails={handleViewFarmDetails}
                      onToggleBooking={handleToggleBooking}
                    />
                  ))}
                </div>
              </section>

              {farms.length === 0 && (
                <div className="text-center py-12">
                  <TreeDeciduous className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">لا توجد مزارع حالياً</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <AdminRouteGuard onUnauthorized={onClose}>
      <div className="fixed inset-0 bg-gray-900 z-50 overflow-hidden flex">
        <AdminNavigation
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          adminRole={admin?.role || 'support'}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="min-h-screen">
            <header
              className="sticky top-0 z-10"
              style={{
                background: 'linear-gradient(135deg, #2F5233 0%, #3AA17E 100%)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className="max-w-7xl mx-auto">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                        border: '2px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      <Sprout className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white">لوحة تحكم الإدارة</h1>
                      <p className="text-xs text-white/80">{admin?.full_name} - {getRoleLabel(admin?.role || 'support')}</p>
                    </div>
                  </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 hover:bg-white/20"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <LogOut className="w-4 h-4 text-white" />
                    <span className="text-sm font-semibold text-white">خروج</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/20"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div
                className="px-6 py-3 border-t"
                style={{
                  background: 'rgba(0, 0, 0, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="flex items-center justify-between">
                  <Breadcrumb
                    items={[
                      { label: 'لوحة الإدارة', icon: <Home className="w-4 h-4 text-white/60" /> },
                      { label: getPageLabel(currentPage), icon: <Sprout className="w-4 h-4 text-yellow-400" /> }
                    ]}
                  />
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-white/60" />
                    <span className="text-xs font-semibold text-white/80">
                      {getPendingTasksMessage(stats, admin?.role || 'support')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main>
              {renderPageContent()}
            </main>
          </div>
        </div>
      </div>
      {showPermissionsManagement && (
        <PermissionsManagement onClose={() => setShowPermissionsManagement(false)} />
      )}
      {showPaymentMethods && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-50 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">وسائل السداد</h2>
                  <p className="text-sm text-gray-600">إدارة وتكوين وسائل السداد المتاحة</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentMethods(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <PaymentMethodsSettings />
            </div>
          </div>
        </div>
      )}
    </AdminRouteGuard>
  );
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'مدير عام',
    farm_manager: 'مدير مزارع',
    financial_manager: 'مدير مالي',
    support: 'دعم فني'
  };
  return labels[role] || role;
}
