import { Award, Trophy, Star, Crown, Medal, Target, Zap, Gift } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  progress: number;
  total: number;
  unlocked: boolean;
  reward: string;
  color: string;
}

interface AchievementsRewardsProps {
  totalTrees: number;
  totalInvestment: number;
  yearsActive: number;
}

export default function AchievementsRewards({
  totalTrees,
  totalInvestment,
  yearsActive
}: AchievementsRewardsProps) {
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'أول شجرة',
      description: 'استثمر في أول شجرة لك',
      icon: Star,
      progress: Math.min(totalTrees, 1),
      total: 1,
      unlocked: totalTrees >= 1,
      reward: '50 نقطة',
      color: 'from-yellow-400 to-amber-500'
    },
    {
      id: '2',
      title: 'بستان صغير',
      description: 'امتلك 10 أشجار',
      icon: Award,
      progress: Math.min(totalTrees, 10),
      total: 10,
      unlocked: totalTrees >= 10,
      reward: '200 نقطة',
      color: 'from-green-400 to-emerald-500'
    },
    {
      id: '3',
      title: 'مستثمر محترف',
      description: 'استثمر 50,000 ريال',
      icon: Trophy,
      progress: Math.min(totalInvestment, 50000),
      total: 50000,
      unlocked: totalInvestment >= 50000,
      reward: '500 نقطة',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      id: '4',
      title: 'مزرعة متوسطة',
      description: 'امتلك 50 شجرة',
      icon: Crown,
      progress: Math.min(totalTrees, 50),
      total: 50,
      unlocked: totalTrees >= 50,
      reward: '1000 نقطة',
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: '5',
      title: 'مستثمر مخضرم',
      description: 'عام كامل من الاستثمار',
      icon: Medal,
      progress: Math.min(yearsActive, 1),
      total: 1,
      unlocked: yearsActive >= 1,
      reward: '800 نقطة',
      color: 'from-orange-400 to-red-500'
    },
    {
      id: '6',
      title: 'مزرعة كبيرة',
      description: 'امتلك 100 شجرة',
      icon: Target,
      progress: Math.min(totalTrees, 100),
      total: 100,
      unlocked: totalTrees >= 100,
      reward: '2000 نقطة',
      color: 'from-teal-400 to-green-500'
    }
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + parseInt(a.reward), 0);

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="text-right">
            <p className="text-sm opacity-90 mb-1">الإنجازات المفتوحة</p>
            <p className="text-3xl font-bold">{unlockedCount}/{achievements.length}</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Trophy className="w-8 h-8" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-white/30 rounded-full h-2 backdrop-blur-sm">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-bold">{totalPoints}</span>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement) => {
          const Icon = achievement.icon;
          const progressPercentage = (achievement.progress / achievement.total) * 100;

          return (
            <div
              key={achievement.id}
              className={`relative rounded-2xl p-4 shadow-lg transition-all ${
                achievement.unlocked
                  ? 'bg-white border-2 border-green-300'
                  : 'bg-gray-50 border-2 border-gray-200 opacity-75'
              }`}
            >
              {/* Unlocked Badge */}
              {achievement.unlocked && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
                  <Star className="w-4 h-4 text-white fill-current" />
                </div>
              )}

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                  achievement.unlocked
                    ? `bg-gradient-to-br ${achievement.color} shadow-md`
                    : 'bg-gray-200'
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    achievement.unlocked ? 'text-white' : 'text-gray-400'
                  }`}
                />
              </div>

              {/* Title & Description */}
              <h4
                className={`font-bold text-sm mb-1 ${
                  achievement.unlocked ? 'text-gray-800' : 'text-gray-500'
                }`}
              >
                {achievement.title}
              </h4>
              <p
                className={`text-xs mb-3 ${
                  achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {achievement.description}
              </p>

              {/* Progress Bar */}
              {!achievement.unlocked && (
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">
                      {achievement.progress}/{achievement.total}
                    </span>
                    <span className="text-xs font-bold text-gray-600">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`bg-gradient-to-r ${achievement.color} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Reward */}
              <div
                className={`flex items-center gap-1 text-xs ${
                  achievement.unlocked ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                <Gift className="w-3 h-3" />
                <span>{achievement.reward}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Milestone */}
      {unlockedCount < achievements.length && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-bold text-gray-800">الإنجاز التالي</p>
              <p className="text-xs text-gray-600">
                {achievements.find(a => !a.unlocked)?.title}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
