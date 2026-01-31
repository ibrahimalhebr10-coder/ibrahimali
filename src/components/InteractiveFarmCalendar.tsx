import { Calendar, Droplets, Scissors, Package, Camera, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface FarmEvent {
  id: string;
  title: string;
  date: string;
  type: 'irrigation' | 'pruning' | 'harvest' | 'inspection' | 'maintenance';
  description: string;
  completed: boolean;
  icon: any;
  color: string;
}

interface InteractiveFarmCalendarProps {
  farmId: string;
}

export default function InteractiveFarmCalendar({ farmId }: InteractiveFarmCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const events: FarmEvent[] = [
    {
      id: '1',
      title: 'جلسة ري',
      date: '2024-06-15',
      type: 'irrigation',
      description: 'ري منتظم للمحافظة على رطوبة التربة',
      completed: true,
      icon: Droplets,
      color: 'from-blue-400 to-cyan-500'
    },
    {
      id: '2',
      title: 'التقليم الصيفي',
      date: '2024-06-20',
      type: 'pruning',
      description: 'إزالة الأفرع الضعيفة لتحسين الإنتاج',
      completed: false,
      icon: Scissors,
      color: 'from-amber-400 to-orange-500'
    },
    {
      id: '3',
      title: 'معاينة المحصول',
      date: '2024-06-25',
      type: 'inspection',
      description: 'فحص حالة الأشجار والثمار',
      completed: false,
      icon: Camera,
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: '4',
      title: 'بداية الحصاد',
      date: '2024-07-10',
      type: 'harvest',
      description: 'موعد بداية جني المحصول',
      completed: false,
      icon: Package,
      color: 'from-green-400 to-emerald-500'
    }
  ];

  const upcomingEvents = events.filter(e => !e.completed).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      irrigation: 'ري',
      pruning: 'تقليم',
      harvest: 'حصاد',
      inspection: 'معاينة',
      maintenance: 'صيانة'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const getDaysUntil = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'مضى';
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'غداً';
    return `بعد ${diffDays} يوم`;
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-right">
            <h3 className="text-xl font-bold mb-1">تقويم المزرعة</h3>
            <p className="text-sm opacity-90">جدول الأعمال والأحداث</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm">
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-lg font-bold">يونيو 2024</p>
          <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 text-right mb-4">الأحداث القادمة</h3>

        <div className="space-y-3">
          {upcomingEvents.map((event) => {
            const Icon = event.icon;
            const daysUntil = getDaysUntil(event.date);
            const isToday = daysUntil === 'اليوم';
            const isTomorrow = daysUntil === 'غداً';

            return (
              <div
                key={event.id}
                className={`relative rounded-xl p-4 border-2 transition-all hover:shadow-md ${
                  isToday || isTomorrow
                    ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {(isToday || isTomorrow) && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Bell className="w-3 h-3 text-white" />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${event.color} flex-shrink-0 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 text-right">
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        isToday || isTomorrow
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {daysUntil}
                      </span>
                      <div>
                        <h4 className="font-bold text-gray-800">{event.title}</h4>
                        <p className="text-xs text-gray-500">{formatDate(event.date)}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>

                    <span className="inline-block text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                      {getEventTypeLabel(event.type)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Types Legend */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 text-right mb-4">أنواع الأحداث</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-right">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Droplets className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-700">ري</span>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-700">تقليم</span>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-700">حصاد</span>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-700">معاينة</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200 text-center">
          <p className="text-2xl font-bold text-blue-700">{upcomingEvents.length}</p>
          <p className="text-xs text-gray-600 mt-1">حدث قادم</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 text-center">
          <p className="text-2xl font-bold text-green-700">{events.filter(e => e.completed).length}</p>
          <p className="text-xs text-gray-600 mt-1">تم إنجازه</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200 text-center">
          <p className="text-2xl font-bold text-amber-700">{events.length}</p>
          <p className="text-xs text-gray-600 mt-1">إجمالي</p>
        </div>
      </div>
    </div>
  );
}
