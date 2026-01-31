import { Check, Circle, Sprout, Droplets, Sun, Scissors, Package, Sparkles } from 'lucide-react';

interface JourneyStage {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
  progress?: number;
}

interface JourneyTimelineProps {
  currentStage: number;
}

export default function InvestmentJourneyTimeline({ currentStage }: JourneyTimelineProps) {
  const stages: JourneyStage[] = [
    {
      id: '1',
      title: 'التسجيل والحجز',
      description: 'تم تسجيلك وحجز أشجارك بنجاح',
      icon: Sparkles,
      status: currentStage >= 1 ? 'completed' : currentStage === 0 ? 'current' : 'upcoming',
      date: 'يناير 2024'
    },
    {
      id: '2',
      title: 'الزراعة والغرس',
      description: 'بدأت مرحلة زراعة أشجارك',
      icon: Sprout,
      status: currentStage >= 2 ? 'completed' : currentStage === 1 ? 'current' : 'upcoming',
      date: 'فبراير 2024',
      progress: currentStage === 1 ? 65 : undefined
    },
    {
      id: '3',
      title: 'الري والتسميد',
      description: 'رعاية مستمرة وتغذية الأشجار',
      icon: Droplets,
      status: currentStage >= 3 ? 'completed' : currentStage === 2 ? 'current' : 'upcoming',
      date: 'مارس - مايو 2024',
      progress: currentStage === 2 ? 40 : undefined
    },
    {
      id: '4',
      title: 'النمو والإزهار',
      description: 'أشجارك تنمو وتزدهر',
      icon: Sun,
      status: currentStage >= 4 ? 'completed' : currentStage === 3 ? 'current' : 'upcoming',
      date: 'يونيو - أغسطس 2024',
      progress: currentStage === 3 ? 75 : undefined
    },
    {
      id: '5',
      title: 'التقليم والصيانة',
      description: 'العناية بصحة أشجارك',
      icon: Scissors,
      status: currentStage >= 5 ? 'completed' : currentStage === 4 ? 'current' : 'upcoming',
      date: 'سبتمبر 2024'
    },
    {
      id: '6',
      title: 'الحصاد والجني',
      description: 'حان وقت جني ثمار استثمارك',
      icon: Package,
      status: currentStage >= 6 ? 'completed' : currentStage === 5 ? 'current' : 'upcoming',
      date: 'أكتوبر - نوفمبر 2024'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 text-right mb-6">رحلة استثمارك</h3>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isCompleted = stage.status === 'completed';
          const isCurrent = stage.status === 'current';
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.id} className="relative">
              <div className="flex items-start gap-4">
                {/* Timeline Line & Icon */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg'
                        : isCurrent
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg animate-pulse'
                        : 'bg-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : isCurrent ? (
                      <Icon className="w-6 h-6 text-white" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  {!isLast && (
                    <div
                      className={`w-1 h-16 my-1 transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 text-right">
                      <h4
                        className={`font-bold mb-1 transition-colors ${
                          isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-400'
                        }`}
                      >
                        {stage.title}
                      </h4>
                      <p
                        className={`text-sm mb-2 transition-colors ${
                          isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {stage.description}
                      </p>
                      {stage.date && (
                        <p className="text-xs text-gray-500">{stage.date}</p>
                      )}

                      {/* Progress Bar for Current Stage */}
                      {isCurrent && stage.progress && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-blue-600">
                              {stage.progress}%
                            </span>
                            <span className="text-xs text-gray-500">التقدم</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${stage.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badge for Current Stage */}
                  {isCurrent && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                        <Circle className="w-2 h-2 fill-current animate-pulse" />
                        جاري التنفيذ
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Progress */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">التقدم الإجمالي</span>
          <span className="text-sm font-bold text-green-600">
            {Math.round((currentStage / stages.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(currentStage / stages.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
