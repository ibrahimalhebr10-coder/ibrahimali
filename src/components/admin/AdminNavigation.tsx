import { useEffect, useState } from 'react';
import { Home, Sprout, DollarSign, Package, Settings, BarChart3, Video, Mail, MessageSquare } from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionsContext';

export type AdminPage = 'dashboard' | 'farms' | 'finance' | 'messaging' | 'messages' | 'settings' | 'video';

interface AdminNavigationProps {
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  adminRole: string;
}

interface NavItem {
  id: AdminPage;
  label: string;
  icon: any;
  allowedRoles: string[];
  requiredPermissions?: string[];
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    icon: Home,
    allowedRoles: ['super_admin', 'farm_manager', 'financial_manager', 'support'],
    requiredPermissions: ['dashboard:view']
  },
  {
    id: 'farms',
    label: 'إدارة المزارع',
    icon: Sprout,
    allowedRoles: ['super_admin', 'farm_manager'],
    requiredPermissions: ['farms:view']
  },
  {
    id: 'finance',
    label: 'الإدارة المالية',
    icon: DollarSign,
    allowedRoles: ['super_admin', 'financial_manager'],
    requiredPermissions: ['finance:view']
  },
  {
    id: 'messages',
    label: 'إدارة الرسائل',
    icon: MessageSquare,
    allowedRoles: ['super_admin'],
    requiredPermissions: ['dashboard:view']
  },
  {
    id: 'messaging',
    label: 'مراسلة المستثمرين',
    icon: Mail,
    allowedRoles: ['super_admin', 'farm_manager'],
    requiredPermissions: ['dashboard:view']
  },
  {
    id: 'video',
    label: 'الفيديو التعريفي',
    icon: Video,
    allowedRoles: ['super_admin'],
    requiredPermissions: ['settings:edit']
  },
  {
    id: 'settings',
    label: 'إعدادات النظام',
    icon: Settings,
    allowedRoles: ['super_admin'],
    requiredPermissions: ['settings:view']
  }
];

export default function AdminNavigation({ currentPage, onNavigate, adminRole }: AdminNavigationProps) {
  const { isAuthorized } = usePermissions();
  const [visibleItems, setVisibleItems] = useState<NavItem[]>([]);

  useEffect(() => {
    const filterItems = async () => {
      if (adminRole === 'super_admin') {
        setVisibleItems(navItems);
        return;
      }

      const filtered: NavItem[] = [];
      for (const item of navItems) {
        if (item.allowedRoles.includes(adminRole)) {
          if (item.requiredPermissions) {
            const hasPermission = isAuthorized(item.requiredPermissions, false);
            if (hasPermission) {
              filtered.push(item);
            }
          } else {
            filtered.push(item);
          }
        }
      }
      setVisibleItems(filtered);
    };

    filterItems();
  }, [adminRole, isAuthorized]);

  return (
    <nav
      className="w-64 flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, #2F5233 0%, #1a2e1d 100%)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="p-6 space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-right"
              style={{
                background: isActive
                  ? 'linear-gradient(145deg, rgba(58, 161, 126, 0.3), rgba(45, 139, 106, 0.2))'
                  : 'transparent',
                border: isActive
                  ? '2px solid rgba(58, 161, 126, 0.5)'
                  : '2px solid transparent',
                boxShadow: isActive
                  ? '0 4px 12px rgba(58, 161, 126, 0.2)'
                  : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon
                className="w-5 h-5"
                style={{ color: isActive ? '#3AA17E' : '#9CA3AF' }}
              />
              <span
                className="font-semibold"
                style={{ color: isActive ? '#FFFFFF' : '#D1D5DB' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 p-6"
        style={{
          background: 'linear-gradient(0deg, rgba(0,0,0,0.3) 0%, transparent 100%)'
        }}
      >
        <div className="flex items-center gap-3 text-white/60 text-xs">
          <BarChart3 className="w-4 h-4" />
          <span>نظام إدارة المزارع v1.0</span>
        </div>
      </div>
    </nav>
  );
}
