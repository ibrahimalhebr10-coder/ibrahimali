import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Package,
  Megaphone,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardList,
  Wrench,
  DollarSign,
  Users,
  Flame,
  Sparkles,
  Video,
  ClipboardCheck,
  Trees
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import DashboardOverview from './DashboardOverview';
import FarmCardsManagement from './FarmCardsManagement';
import PackagesManagement from './PackagesManagement';
import MarketingManagement from './MarketingManagement';
import ContentManagement from './ContentManagement';
import GeneralSettings from './GeneralSettings';
import FarmOffersManager from './FarmOffersManager';
import OperationsSection from './OperationsSection';
import FinanceSection from './FinanceSection';
import CustomersSection from './CustomersSection';
import HotLeadsDashboard from './HotLeadsDashboard';
import AdvancedAssistantManager from './AdvancedAssistantManager';
import IntroVideoManager from './IntroVideoManager';
import FollowUpRoom from './FollowUpRoom';
import FarmFollowUpRoom from './FarmFollowUpRoom';

type AdminSection =
  | 'overview'
  | 'farms'
  | 'farm-offers'
  | 'follow-up'
  | 'farm-follow-up'
  | 'hot-leads'
  | 'customers'
  | 'operations'
  | 'finance'
  | 'packages'
  | 'marketing'
  | 'content'
  | 'videos'
  | 'assistant'
  | 'settings';

interface AdminDashboardProps {
  initialSection?: AdminSection;
  initialMarketingTab?: 'overview' | 'influencers' | 'featured' | 'settings' | 'share-message';
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialSection = 'overview',
  initialMarketingTab
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>(initialSection);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAdminAuth();

  const menuItems = [
    { id: 'overview' as AdminSection, label: 'الرئيسية', icon: LayoutDashboard, color: 'blue' },
    { id: 'follow-up' as AdminSection, label: 'غرفة المتابعة', icon: ClipboardCheck, color: 'emerald' },
    { id: 'farm-follow-up' as AdminSection, label: 'متابعة المزارع', icon: Trees, color: 'green' },
    { id: 'hot-leads' as AdminSection, label: 'العملاء الساخنون', icon: Flame, color: 'red' },
    { id: 'farms' as AdminSection, label: 'المزارع', icon: Layers, color: 'green' },
    { id: 'farm-offers' as AdminSection, label: 'عروض المزارع', icon: ClipboardList, color: 'emerald' },
    { id: 'customers' as AdminSection, label: 'العملاء', icon: Users, color: 'cyan' },
    { id: 'operations' as AdminSection, label: 'التشغيل', icon: Wrench, color: 'orange' },
    { id: 'finance' as AdminSection, label: 'المالية', icon: DollarSign, color: 'teal' },
    { id: 'packages' as AdminSection, label: 'الباقات', icon: Package, color: 'purple' },
    { id: 'marketing' as AdminSection, label: 'التسويق', icon: Megaphone, color: 'pink' },
    { id: 'content' as AdminSection, label: 'المحتوى', icon: MessageSquare, color: 'indigo' },
    { id: 'videos' as AdminSection, label: 'الفيديو التعريفي', icon: Video, color: 'blue' },
    { id: 'assistant' as AdminSection, label: 'المساعد الذكي', icon: Sparkles, color: 'emerald' },
    { id: 'settings' as AdminSection, label: 'الإعدادات', icon: Settings, color: 'gray' },
  ];

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <DashboardOverview />;
      case 'follow-up':
        return <FollowUpRoom />;
      case 'farm-follow-up':
        return <FarmFollowUpRoom />;
      case 'hot-leads':
        return <HotLeadsDashboard />;
      case 'farms':
        return <FarmCardsManagement />;
      case 'farm-offers':
        return <FarmOffersManager />;
      case 'customers':
        return <CustomersSection />;
      case 'operations':
        return <OperationsSection />;
      case 'finance':
        return <FinanceSection />;
      case 'packages':
        return <PackagesManagement />;
      case 'marketing':
        return <MarketingManagement initialTab={initialMarketingTab} />;
      case 'content':
        return <ContentManagement />;
      case 'videos':
        return <IntroVideoManager />;
      case 'assistant':
        return <AdvancedAssistantManager />;
      case 'settings':
        return <GeneralSettings />;
      default:
        return <DashboardOverview />;
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      red: 'text-red-600',
      green: 'text-green-600',
      cyan: 'text-cyan-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      pink: 'text-pink-600',
      indigo: 'text-indigo-600',
      emerald: 'text-emerald-600',
      teal: 'text-teal-600',
      gray: 'text-gray-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-x-hidden" dir="rtl">
      {/* Mobile Header */}
      <div className="xl:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-darkgreen">لوحة التحكم</h1>
            <p className="text-xs text-gray-600">
              {menuItems.find(item => item.id === activeSection)?.label}
            </p>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="xl:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`
          xl:hidden fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-darkgreen to-green-700">
            <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
            <p className="text-sm text-green-100 mt-1">إدارة المنصة الهجينة</p>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-6 py-4 text-right transition-all
                    ${isActive
                      ? 'bg-green-50 text-darkgreen border-r-4 border-darkgreen font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-darkgreen' : getColorClasses(item.color)}`} />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden xl:flex xl:fixed xl:top-0 xl:right-0 xl:bottom-0 xl:w-80 bg-white border-l border-gray-200 shadow-xl flex-col z-30">
        {/* Header */}
        <div className="p-8 border-b border-gray-200 bg-gradient-to-br from-darkgreen to-green-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
              <p className="text-xs text-green-100 mt-0.5">المنصة الهجينة</p>
            </div>
          </div>
        </div>

        {/* Admin Info Card */}
        <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-darkgreen rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">المدير العام</p>
              <p className="text-xs text-gray-600">admin@dev.com</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 text-right transition-all mb-1 rounded-xl
                  ${isActive
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-darkgreen border-r-4 border-darkgreen font-semibold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-white shadow-sm' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-darkgreen' : getColorClasses(item.color)}`} />
                </div>
                <span className="text-[15px]">{item.label}</span>
                {isActive && (
                  <div className="mr-auto w-2 h-2 bg-darkgreen rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:shadow-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="xl:mr-80 pt-20 xl:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10 pb-32 xl:pb-10 w-full">
          {renderContent()}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="flex items-center justify-around px-2 py-3">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all
                  ${isActive ? 'text-darkgreen' : 'text-gray-500'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdminDashboard;
