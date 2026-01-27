import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  onClick?: () => void;
}

export default function KPICard({ icon: Icon, title, value, subtitle, color, onClick }: KPICardProps) {
  return (
    <button
      onClick={onClick}
      className="p-6 rounded-2xl bg-white transition-all duration-300 hover:shadow-xl active:scale-98 text-right w-full"
      style={{
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        border: `2px solid ${color}`
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: `linear-gradient(145deg, ${color}20, ${color}10)`,
            border: `2px solid ${color}`
          }}
        >
          <Icon className="w-7 h-7" style={{ color }} />
        </div>
      </div>

      <h3 className="text-sm text-gray-600 mb-2 font-semibold">{title}</h3>
      <p className="text-3xl font-bold mb-1" style={{ color }}>{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500">{subtitle}</p>
      )}
    </button>
  );
}
