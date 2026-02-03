import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Gift } from 'lucide-react';

interface ContractCountdownProps {
  contractStartDate: string | null;
  durationYears: number;
  bonusYears: number;
  status: string;
}

type ContractPhase = 'active' | 'bonus' | 'ending-soon' | 'expired';

interface TimeRemaining {
  years: number;
  months: number;
  days: number;
  hours: number;
  phase: ContractPhase;
}

export default function ContractCountdown({
  contractStartDate,
  durationYears,
  bonusYears,
  status
}: ContractCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    if (!contractStartDate || (status !== 'active' && status !== 'confirmed' && status !== 'completed')) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const startDate = new Date(contractStartDate);
      const now = new Date();

      const contractEndDate = new Date(startDate);
      contractEndDate.setFullYear(contractEndDate.getFullYear() + durationYears);

      const totalEndDate = new Date(contractEndDate);
      totalEndDate.setFullYear(totalEndDate.getFullYear() + bonusYears);

      const sixMonthsBeforeEnd = new Date(totalEndDate);
      sixMonthsBeforeEnd.setMonth(sixMonthsBeforeEnd.getMonth() - 6);

      const diffMs = totalEndDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining({
          years: 0,
          months: 0,
          days: 0,
          hours: 0,
          phase: 'expired'
        });
        return;
      }

      const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const years = Math.floor(totalDays / 365);
      const remainingDaysAfterYears = totalDays % 365;
      const months = Math.floor(remainingDaysAfterYears / 30);
      const days = remainingDaysAfterYears % 30;
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      let phase: ContractPhase = 'active';

      if (now >= sixMonthsBeforeEnd) {
        phase = 'ending-soon';
      } else if (now >= contractEndDate) {
        phase = 'bonus';
      }

      setTimeRemaining({
        years,
        months,
        days,
        hours,
        phase
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [contractStartDate, durationYears, bonusYears, status]);

  if (!timeRemaining || (status !== 'active' && status !== 'confirmed' && status !== 'completed')) {
    return null;
  }

  const phaseConfig = {
    active: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle,
      label: 'العقد نشط',
      gradient: 'from-green-500 to-emerald-500'
    },
    bonus: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: Gift,
      label: 'السنوات المجانية',
      gradient: 'from-blue-500 to-cyan-500'
    },
    'ending-soon': {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: AlertCircle,
      label: 'قرب الانتهاء',
      gradient: 'from-red-500 to-orange-500'
    },
    expired: {
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: Clock,
      label: 'منتهي',
      gradient: 'from-gray-500 to-gray-600'
    }
  };

  const config = phaseConfig[timeRemaining.phase];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${config.bgColor} ${config.borderColor} border-2`}>
      {/* أيقونة الحالة */}
      <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      {/* العداد التنازلي */}
      <div className="flex-1">
        <div className={`text-xs font-medium ${config.color} mb-1`}>
          {config.label}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {timeRemaining.years > 0 && (
            <div className="flex items-center gap-1">
              <span className={`text-lg font-bold ${config.color}`}>
                {timeRemaining.years}
              </span>
              <span className={`text-xs ${config.color} opacity-70`}>
                سنة
              </span>
            </div>
          )}

          {(timeRemaining.months > 0 || timeRemaining.years > 0) && (
            <>
              {timeRemaining.years > 0 && (
                <span className={`text-xs ${config.color} opacity-40`}>•</span>
              )}
              <div className="flex items-center gap-1">
                <span className={`text-lg font-bold ${config.color}`}>
                  {timeRemaining.months}
                </span>
                <span className={`text-xs ${config.color} opacity-70`}>
                  شهر
                </span>
              </div>
            </>
          )}

          {(timeRemaining.days > 0 || (timeRemaining.years === 0 && timeRemaining.months === 0)) && (
            <>
              {(timeRemaining.months > 0 || timeRemaining.years > 0) && (
                <span className={`text-xs ${config.color} opacity-40`}>•</span>
              )}
              <div className="flex items-center gap-1">
                <span className={`text-lg font-bold ${config.color}`}>
                  {timeRemaining.days}
                </span>
                <span className={`text-xs ${config.color} opacity-70`}>
                  يوم
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* تأشير خاص للحالات الحرجة */}
      {timeRemaining.phase === 'ending-soon' && (
        <div className="animate-pulse">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
      )}
    </div>
  );
}
