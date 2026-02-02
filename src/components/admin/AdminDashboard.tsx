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
  LogOut
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

  const menuItems = [
    { id: 'overview' as AdminSection, label: 'الصفحة الرئيسية', icon: LayoutDashboard },
    { id: 'farms' as AdminSection, label: 'بطاقات المزارع', icon: Layers },
    { id: 'packages' as AdminSection, label: 'الباقات والعروض', icon: Package },
    { id: 'agricultural' as AdminSection, label: 'محصولي الزراعي', icon: Sprout },
    { id: 'investment' as AdminSection, label: 'محصولي الاستثماري', icon: TrendingUp },
    { id: 'contracts' as AdminSection, label: 'العقود', icon: FileText },
    { id: 'marketing' as AdminSection, label: 'إدارة التسويق', icon: Megaphone },
    { id: 'content' as AdminSection, label: 'المحتوى والرسائل', icon: MessageSquare },
    { id: 'settings' as AdminSection, label: 'الإعدادات العامة', icon: Settings },
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50" dir="rtl">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-72 bg-white border-l border-gray-200 shadow-lg flex flex-col">
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
                  <Icon className={`w-5 h-5 ${isActive ? 'text-darkgreen' : 'text-gray-500'}`} />
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
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
