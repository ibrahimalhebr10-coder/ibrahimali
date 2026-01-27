import { ChevronLeft } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronLeft className="w-4 h-4 text-white/40" />}
          <div className="flex items-center gap-1.5">
            {item.icon}
            <span
              className={`font-semibold ${
                index === items.length - 1
                  ? 'text-yellow-400'
                  : 'text-white/60'
              }`}
            >
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
