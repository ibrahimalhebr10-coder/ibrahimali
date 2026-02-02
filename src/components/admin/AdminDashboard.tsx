import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Package,
  Sprout,
  TrendingUp,
  FileText,
  Megaphone,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import DashboardOverview from './DashboardOverview';
import FarmCardsManagement from './FarmCardsManagement';
import PackagesManagement from './PackagesManagement';
import AgriculturalSection from './AgriculturalSection';
import InvestmentSection from './InvestmentSection';
import ContractsPage from './ContractsPage';
import MarketingManagement from './MarketingManagement';
import ContentManagement from './ContentManagement';
import GeneralSettings from './GeneralSettings';

type AdminSection =
  | 'overview'
  | 'farms'
  | 'packages'
  | 'agricultural'
  | 'investment'
  | 'contracts'
  | 'marketing'
  | 'content'
  | 'settings';

const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'overview' as AdminSection, label: 'الرئيسية', icon: LayoutDashboard, color: 'blue' },
    { id: 'farms' as AdminSection, label: 'المزارع', icon: Layers, color: 'green' },
    { id: 'packages' as AdminSection, label: 'الباقات', icon: Package, color: 'purple' },
    { id: 'agricultural' as AdminSection, label: 'زراعي', icon: Sprout, color: 'green' },
    { id: 'investment' as AdminSection, label: 'استثماري', icon: TrendingUp, color: 'orange' },
    { id: 'contracts' as AdminSection, label: 'العقود', icon: FileText, color: 'blue' },
    { id: 'marketing' as AdminSection, label: 'التسويق', icon: Megaphone, color: 'pink' },
    { id: 'content' as AdminSection, label: 'المحتوى', icon: MessageSquare, color: 'indigo' },
    { id: 'settings' as AdminSection, label: 'الإعدادات', icon: Settings, color: 'gray' },
  ];

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <DashboardOverview />;
      case 'farms':
        return <FarmCardsManagement />;
      case 'packages':
        return <PackagesManagement />;
      case 'agricultural':
        return <AgriculturalSection />;
      case 'investment':
        return <InvestmentSection />;
      case 'contracts':
        return <ContractsPage />;
      case 'marketing':
        return <MarketingManagement />;
      case 'content':
        return <ContentManagement />;
      case 'settings':
        return <GeneralSettings />;
      default:
        return <DashboardOverview />;
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      pink: 'text-pink-600',
      indigo: 'text-indigo-600',
      gray: 'text-gray-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
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
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`
          lg:hidden fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-darkgreen">لوحة التحكم</h1>
            <p className="text-sm text-gray-600 mt-1">إدارة المنصة الهجينة</p>
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
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:fixed lg:top-0 lg:right-0 lg:bottom-0 lg:w-72 bg-white border-l border-gray-200 shadow-lg flex-col z-30">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-darkgreen">لوحة التحكم</h1>
          <p className="text-sm text-gray-600 mt-1">إدارة المنصة الهجينة</p>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`
                  w-full flex items-center gap-3 px-6 py-3 text-right transition-all
                  ${isActive
                    ? 'bg-green-50 text-darkgreen border-r-4 border-darkgreen font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-darkgreen' : getColorClasses(item.color)}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:mr-72 pt-20 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
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
