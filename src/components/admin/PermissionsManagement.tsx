import { useState } from 'react';
import { Shield, Users, Key, X } from 'lucide-react';
import RolesTab from './RolesTab';
import PermissionsTab from './PermissionsTab';
import AdminUsersTab from './AdminUsersTab';

interface PermissionsManagementProps {
  onClose: () => void;
}

type TabType = 'roles' | 'permissions' | 'users';

export default function PermissionsManagement({ onClose }: PermissionsManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>('roles');

  const tabs = [
    { id: 'roles' as TabType, label: 'الأدوار', icon: Shield },
    { id: 'permissions' as TabType, label: 'الصلاحيات', icon: Key },
    { id: 'users' as TabType, label: 'مستخدمو الإدارة', icon: Users }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl">
          <div className="sticky top-0 bg-white border-b-2 border-gray-200 rounded-t-2xl z-10">
            <div className="flex items-center justify-between p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">إدارة الصلاحيات</h2>
                <p className="text-sm text-gray-600 mt-1">إدارة الأدوار والصلاحيات والمستخدمين</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="flex gap-2 px-6 pb-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
                    style={{
                      background: isActive
                        ? 'linear-gradient(145deg, #10b981, #059669)'
                        : '#f9fafb',
                      color: isActive ? '#ffffff' : '#6b7280',
                      boxShadow: isActive
                        ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                        : 'none'
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'roles' && <RolesTab />}
            {activeTab === 'permissions' && <PermissionsTab />}
            {activeTab === 'users' && <AdminUsersTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
