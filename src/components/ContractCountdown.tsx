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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!contractStartDate || (status !== 'active' && status !== 'confirmed' && status !== 'completed')) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const startDate = new Date(contractStartDate);
      const now = currentTime;

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

      const totalSeconds = Math.floor(diffMs / 1000);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      const totalDays = Math.floor(totalHours / 24);

      const years = Math.floor(totalDays / 365);
      const remainingDaysAfterYears = totalDays % 365;
      const months = Math.floor(remainingDaysAfterYears / 30);
      const days = remainingDaysAfterYears % 30;
      const hours = totalHours % 24;

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
  }, [contractStartDate, durationYears, bonusYears, status, currentTime]);

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

  const minutes = Math.floor((currentTime.getTime() - Math.floor(currentTime.getTime() / (1000 * 60 * 60)) * (1000 * 60 * 60)) / (1000 * 60)) % 60;
  const seconds = Math.floor((currentTime.getTime() / 1000) % 60);

  return (
    <div className="space-y-3">
      {/* بطاقة العداد الرئيسية */}
      <div className={`rounded-2xl ${config.bgColor} border-2 ${config.borderColor} overflow-hidden shadow-lg`}>
        {/* القسم العلوي - حالة العقد */}
        <div className="px-4 py-3 bg-gradient-to-br from-white/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${config.color}`}>
                  {config.label}
                </span>
                {timeRemaining.phase === 'ending-soon' && (
                  <Hourglass className="w-4 h-4 text-rose-500 animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <StageIcon className={`w-3.5 h-3.5 ${config.color} opacity-60`} />
                <span className={`text-xs ${config.color} opacity-70`}>
                  {stageInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* العداد الرئيسي - سنوات وشهور وأيام */}
        <div className="px-4 py-4 bg-white/30">
          <div className="flex items-center justify-center gap-3">
            {timeRemaining.years > 0 && (
              <div className="text-center">
                <div className={`text-3xl font-bold ${config.color} tabular-nums leading-none`}>
                  {String(timeRemaining.years).padStart(2, '0')}
                </div>
                <div className={`text-xs ${config.color} opacity-60 mt-1`}>
                  سنة
                </div>
              </div>
            )}

            {(timeRemaining.years > 0 || timeRemaining.months > 0) && (
              <>
                {timeRemaining.years > 0 && (
                  <div className={`text-2xl ${config.color} opacity-30 font-light`}>:</div>
                )}
                <div className="text-center">
                  <div className={`text-3xl font-bold ${config.color} tabular-nums leading-none`}>
                    {String(timeRemaining.months).padStart(2, '0')}
                  </div>
                  <div className={`text-xs ${config.color} opacity-60 mt-1`}>
                    شهر
                  </div>
                </div>
              </>
            )}

            {(timeRemaining.months > 0 || timeRemaining.years > 0) && (
              <div className={`text-2xl ${config.color} opacity-30 font-light`}>:</div>
            )}
            <div className="text-center">
              <div className={`text-3xl font-bold ${config.color} tabular-nums leading-none`}>
                {String(timeRemaining.days).padStart(2, '0')}
              </div>
              <div className={`text-xs ${config.color} opacity-60 mt-1`}>
                يوم
              </div>
            </div>
          </div>
        </div>

        {/* العداد الرقمي الديناميكي - ساعات ودقائق وثواني */}
        <div className="px-4 py-4 bg-white/50 backdrop-blur-sm border-t-2 border-white/60">
          <div className="flex items-center justify-center gap-3">
            {/* أيقونة الساعة النابضة */}
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} shadow-lg flex items-center justify-center animate-pulse`}>
              <Clock className="w-5 h-5 text-white" />
            </div>

            {/* العداد الرقمي */}
            <div className="flex items-center gap-1.5">
              {/* الساعات */}
              <div className="flex flex-col items-center">
                <div className={`text-2xl font-black tabular-nums bg-gradient-to-br ${config.gradient} bg-clip-text text-transparent`}>
                  {String(timeRemaining.hours).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">ساعة</div>
              </div>

              <div className="text-2xl font-bold text-gray-400 animate-pulse">:</div>

              {/* الدقائق */}
              <div className="flex flex-col items-center">
                <div className={`text-2xl font-black tabular-nums bg-gradient-to-br ${config.gradient} bg-clip-text text-transparent`}>
                  {String(minutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">دقيقة</div>
              </div>

              <div className="text-2xl font-bold text-gray-400 animate-pulse">:</div>

              {/* الثواني */}
              <div className="flex flex-col items-center">
                <div className={`text-2xl font-black tabular-nums bg-gradient-to-br ${config.gradient} bg-clip-text text-transparent`}>
                  {String(seconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">ثانية</div>
              </div>
            </div>

            {/* شارة "متبقي" */}
            <div className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} text-white text-xs font-bold shadow-md`}>
              متبقي
            </div>
          </div>
        </div>

        {/* شريط المرحلة مع خلفية قوية */}
        <div className={`px-4 py-3 bg-gradient-to-r ${config.gradient} border-t-2 ${config.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <StageIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white drop-shadow-lg">
                {stageInfo.label}
              </span>
            </div>
            <span className="text-sm text-white/90 font-medium drop-shadow">
              {stageInfo.description}
            </span>
          </div>
        </div>
      </div>

      {/* بطاقة إحصائيات إضافية */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-xl ${config.bgColor} border ${config.borderColor} p-3 text-center`}>
          <div className={`text-2xl font-bold ${config.daysColor} tabular-nums`}>
            {timeRemaining.totalDays}
          </div>
          <div className={`text-xs ${config.color} opacity-60 mt-1`}>
            إجمالي الأيام
          </div>
        </div>
        <div className={`rounded-xl ${config.bgColor} border ${config.borderColor} p-3 text-center`}>
          <div className={`text-2xl font-bold ${config.daysColor} tabular-nums`}>
            {Math.round(timeRemaining.progressPercentage)}%
          </div>
          <div className={`text-xs ${config.color} opacity-60 mt-1`}>
            نسبة التقدم
          </div>
        </div>
      </div>
    </div>
  );
}
