import { useState, useMemo } from 'react';
import { X, ArrowRight, Play, Wrench, ClipboardList, Truck, DollarSign } from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionsContext';
import OperationsTab from './OperationsTab';
import MaintenanceTab from './MaintenanceTab';
import TasksTab from './TasksTab';
import EquipmentTab from './EquipmentTab';
import FinanceTab from './FinanceTab';

interface Farm {
  id: string;
  name_ar: string;
  name_en: string;
  location: string;
  total_area: number;
  status: string;
}

interface FarmDetailsProps {
  farm: Farm;
  onBack: () => void;
  onClose: () => void;
  inDashboard?: boolean;
}

type TabType = 'operations' | 'maintenance' | 'tasks' | 'equipment' | 'finance';

export default function FarmDetails({ farm, onBack, onClose, inDashboard = false }: FarmDetailsProps) {
  const { hasAnyAction } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabType>('operations');

  const allTabs = [
    {
      id: 'operations' as TabType,
      name: 'التشغيل',
      icon: Play,
      actions: ['operations.view', 'operations.update', 'operations.start_season']
    },
    {
      id: 'maintenance' as TabType,
      name: 'الصيانة',
      icon: Wrench,
      actions: ['maintenance.view', 'maintenance.schedule', 'maintenance.update']
    },
    {
      id: 'tasks' as TabType,
      name: 'مهام العمل',
      icon: ClipboardList,
      actions: ['tasks.view', 'tasks.view_own', 'tasks.create']
    },
    {
      id: 'equipment' as TabType,
      name: 'المعدات',
      icon: Truck,
      actions: ['equipment.view', 'equipment.add', 'equipment.update']
    },
    {
      id: 'finance' as TabType,
      name: 'المالية التشغيلية',
      icon: DollarSign,
      actions: ['finance.view', 'finance.record_expense', 'finance.record_revenue']
    },
  ];

  const tabs = useMemo(() => {
    return allTabs.filter(tab => hasAnyAction(tab.actions));
  }, [hasAnyAction]);

  useMemo(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  if (inDashboard) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">{farm.name_ar}</h2>
            <p className="text-sm text-white/70">{farm.name_en}</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20">
          <div className="bg-white/5 border-b border-white/10 overflow-x-auto">
            <div className="flex gap-1 px-4 py-3 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'operations' && <OperationsTab farm={farm} />}
            {activeTab === 'maintenance' && <MaintenanceTab farm={farm} />}
            {activeTab === 'tasks' && <TasksTab farm={farm} />}
            {activeTab === 'equipment' && <EquipmentTab farm={farm} />}
            {activeTab === 'finance' && <FinanceTab farm={farm} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 bg-white z-50 max-h-[95vh] overflow-hidden rounded-t-3xl">
        <div
          className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #3AA17E 0%, #2D8B6A 100%)',
            boxShadow: '0 4px 12px rgba(58, 161, 126, 0.2)'
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">{farm.name_ar}</h2>
              <p className="text-xs text-green-100">{farm.name_en}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="bg-gray-50 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-1 px-4 py-3 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-140px)] px-6 py-6">
          {activeTab === 'operations' && <OperationsTab farm={farm} />}
          {activeTab === 'maintenance' && <MaintenanceTab farm={farm} />}
          {activeTab === 'tasks' && <TasksTab farm={farm} />}
          {activeTab === 'equipment' && <EquipmentTab farm={farm} />}
          {activeTab === 'finance' && <FinanceTab farm={farm} />}
        </div>
      </div>
    </>
  );
}
