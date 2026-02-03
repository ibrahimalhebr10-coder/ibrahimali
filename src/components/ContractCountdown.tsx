import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Gift, Sprout, Leaf, Wheat, Award, Hourglass } from 'lucide-react';

interface ContractCountdownProps {
  contractStartDate: string | null;
  durationYears: number;
  bonusYears: number;
  status: string;
  userType?: 'investor' | 'farmer';
}

type ContractPhase = 'active' | 'bonus' | 'ending-soon' | 'expired';

type ContractStage = 'growth' | 'stability' | 'harvest' | 'privilege' | 'completion';

interface TimeRemaining {
  years: number;
  months: number;
  days: number;
  hours: number;
  totalDays: number;
  phase: ContractPhase;
  stage: ContractStage;
  progressPercentage: number;
}

export default function ContractCountdown({
  contractStartDate,
  durationYears,
  bonusYears,
  status,
  userType = 'investor'
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
      const totalContractDuration = totalEndDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const progressPercentage = Math.min(100, Math.max(0, (elapsed / totalContractDuration) * 100));

      if (diffMs <= 0) {
        setTimeRemaining({
          years: 0,
          months: 0,
          days: 0,
          hours: 0,
          totalDays: 0,
          phase: 'expired',
          stage: 'completion',
          progressPercentage: 100
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
      let stage: ContractStage = 'growth';

      if (now >= sixMonthsBeforeEnd) {
        phase = 'ending-soon';
        stage = 'completion';
      } else if (now >= contractEndDate) {
        phase = 'bonus';
        stage = 'privilege';
      } else {
        if (progressPercentage < 33) {
          stage = 'growth';
        } else if (progressPercentage < 66) {
          stage = 'stability';
        } else {
          stage = 'harvest';
        }
      }

      setTimeRemaining({
        years,
        months,
        days,
        hours,
        totalDays,
        phase,
        stage,
        progressPercentage
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000 * 60 * 60 * 24);

    return () => clearInterval(interval);
  }, [contractStartDate, durationYears, bonusYears, status]);

  if (!timeRemaining || (status !== 'active' && status !== 'confirmed' && status !== 'completed')) {
    return null;
  }

  const stageConfig = {
    growth: {
      icon: Sprout,
      label: 'مرحلة النمو',
      emoji: '🌱',
      description: userType === 'farmer' ? 'نعتني بأشجارك' : 'بداية رحلتك'
    },
    stability: {
      icon: Leaf,
      label: 'مرحلة الاستقرار',
      emoji: '🌿',
      description: userType === 'farmer' ? 'أشجارك تنمو بقوة' : 'استثمارك يزدهر'
    },
    harvest: {
      icon: Wheat,
      label: 'مرحلة الحصاد',
      emoji: '🌾',
      description: userType === 'farmer' ? 'قرب موسم الحصاد' : 'اقتراب النتائج'
    },
    privilege: {
      icon: Award,
      label: 'مرحلة الامتياز',
      emoji: '🔵',
      description: userType === 'farmer' ? 'سنوات الرعاية المجانية' : 'السنوات المجانية'
    },
    completion: {
      icon: Hourglass,
      label: 'مرحلة اكتمال الدورة',
      emoji: '⏳',
      description: userType === 'farmer' ? 'اكتمال دورة الرعاية' : 'اقتراب نهاية العقد'
    }
  };

  const phaseConfig = {
    active: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle,
      label: 'العقد نشط',
      gradient: 'from-green-500 to-emerald-500',
      daysColor: 'text-green-600'
    },
    bonus: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: Gift,
      label: 'السنوات المجانية',
      gradient: 'from-blue-500 to-cyan-500',
      daysColor: 'text-blue-600'
    },
    'ending-soon': {
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      icon: AlertCircle,
      label: 'قرب الانتهاء',
      gradient: 'from-rose-400 to-pink-400',
      daysColor: 'text-rose-500'
    },
    expired: {
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: Clock,
      label: 'منتهي',
      gradient: 'from-gray-500 to-gray-600',
      daysColor: 'text-gray-600'
    }
  };

  const config = phaseConfig[timeRemaining.phase];
  const stageInfo = stageConfig[timeRemaining.stage];
  const Icon = config.icon;
  const StageIcon = stageInfo.icon;

  return (
    <div className={`rounded-xl ${config.bgColor} ${config.borderColor} border-2 overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* أيقونة الحالة */}
        <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* العداد التنازلي */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`text-xs font-medium ${config.color}`}>
              {config.label}
            </div>
            {timeRemaining.phase === 'ending-soon' && (
              <Hourglass className="w-3 h-3 text-rose-400" />
            )}
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

        {/* عدد الأيام المتبقية الإجمالي */}
        {timeRemaining.totalDays > 0 && (
          <div className="text-left">
            <div className={`text-lg font-bold ${config.daysColor}`}>
              {timeRemaining.totalDays}
            </div>
            <div className={`text-xs ${config.color} opacity-60`}>
              يوم
            </div>
          </div>
        )}
      </div>

      {/* شريط مرحلة العقد */}
      <div className={`px-4 py-2 bg-gradient-to-l ${config.gradient} bg-opacity-5 border-t ${config.borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StageIcon className={`w-3.5 h-3.5 ${config.color} opacity-70`} />
            <span className={`text-xs font-medium ${config.color} opacity-80`}>
              {stageInfo.label}
            </span>
          </div>
          <span className={`text-xs ${config.color} opacity-60`}>
            {stageInfo.description}
          </span>
        </div>
      </div>
    </div>
  );
}
