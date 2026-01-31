import { Zap, Gift, Crown, Star, TrendingUp, Award, Sparkles } from 'lucide-react';

interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: any;
  available: boolean;
  color: string;
}

interface LoyaltyTier {
  name: string;
  minPoints: number;
  color: string;
  benefits: string[];
}

interface LoyaltyPointsRewardsProps {
  currentPoints: number;
  totalEarned: number;
}

export default function LoyaltyPointsRewards({
  currentPoints,
  totalEarned
}: LoyaltyPointsRewardsProps) {
  const tiers: LoyaltyTier[] = [
    {
      name: 'برونزي',
      minPoints: 0,
      color: 'from-orange-400 to-amber-600',
      benefits: ['خصم 5% على الاستثمارات الجديدة']
    },
    {
      name: 'فضي',
      minPoints: 500,
      color: 'from-gray-300 to-gray-500',
      benefits: ['خصم 10%', 'أولوية في الحصاد']
    },
    {
      name: 'ذهبي',
      minPoints: 1000,
      color: 'from-yellow-400 to-yellow-600',
      benefits: ['خصم 15%', 'استشارات مجانية']
    },
    {
      name: 'بلاتيني',
      minPoints: 2000,
      color: 'from-purple-400 to-indigo-600',
      benefits: ['خصم 20%', 'مدير حساب خاص']
    }
  ];

  const rewards: Reward[] = [
    {
      id: '1',
      title: 'خصم 10%',
      description: 'على استثمارك القادم',
      points: 200,
      icon: Gift,
      available: currentPoints >= 200,
      color: 'from-green-400 to-emerald-500'
    },
    {
      id: '2',
      title: 'شجرة مجانية',
      description: 'احصل على شجرة إضافية',
      points: 500,
      icon: Star,
      available: currentPoints >= 500,
      color: 'from-blue-400 to-cyan-500'
    },
    {
      id: '3',
      title: 'زيارة مجانية',
      description: 'زيارة مرشدة لمزرعتك',
      points: 300,
      icon: Award,
      available: currentPoints >= 300,
      color: 'from-amber-400 to-orange-500'
    },
    {
      id: '4',
      title: 'ترقية الخدمة',
      description: 'أولوية في المتابعة',
      points: 800,
      icon: Crown,
      available: currentPoints >= 800,
      color: 'from-purple-400 to-pink-500'
    }
  ];

  const currentTier = [...tiers].reverse().find(t => totalEarned >= t.minPoints) || tiers[0];
  const nextTier = tiers.find(t => totalEarned < t.minPoints);
  const progressToNext = nextTier
    ? ((totalEarned - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  return (
    <div className="space-y-4">
      {/* Points Overview */}
      <div className={`bg-gradient-to-br ${currentTier.color} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="text-right">
              <p className="text-sm opacity-90 mb-1">مستواك الحالي</p>
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6" />
                <p className="text-2xl font-bold">{currentTier.name}</p>
              </div>
            </div>
            <div className="text-center bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3">
              <p className="text-3xl font-bold">{currentPoints}</p>
              <p className="text-xs opacity-90">نقطة متاحة</p>
            </div>
          </div>

          {nextTier && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs opacity-90">
                  {totalEarned} / {nextTier.minPoints} نقطة
                </span>
                <span className="text-xs opacity-90">
                  المستوى التالي: {nextTier.name}
                </span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2 backdrop-blur-sm">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-500 shadow-lg"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 text-right mb-4">مميزات مستواك</h3>
        <div className="space-y-2">
          {currentTier.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3 text-right">
              <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <p className="text-sm text-gray-700 flex-1">{benefit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Available Rewards */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 text-right mb-4">المكافآت المتاحة</h3>
        <div className="grid grid-cols-2 gap-3">
          {rewards.map((reward) => {
            const Icon = reward.icon;

            return (
              <button
                key={reward.id}
                disabled={!reward.available}
                className={`relative rounded-xl p-4 text-right transition-all ${
                  reward.available
                    ? 'bg-gradient-to-br ' + reward.color + ' text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                    : 'bg-gray-100 text-gray-400 opacity-60'
                }`}
              >
                {reward.available && (
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                )}

                <Icon className="w-8 h-8 mb-2" />
                <p className="font-bold text-sm mb-1">{reward.title}</p>
                <p className="text-xs opacity-90 mb-2">{reward.description}</p>

                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                  reward.available ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-200'
                }`}>
                  <Zap className="w-3 h-3" />
                  <span>{reward.points}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* How to Earn Points */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200">
        <h3 className="text-lg font-bold text-gray-800 text-right mb-4 flex items-center gap-2 justify-end">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          كيف تكسب نقاط؟
        </h3>
        <div className="space-y-3 text-right">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">استثمار جديد</span>
            <span className="text-sm font-bold text-blue-600">+100 نقطة</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">إتمام عام كامل</span>
            <span className="text-sm font-bold text-blue-600">+500 نقطة</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">دعوة صديق</span>
            <span className="text-sm font-bold text-blue-600">+200 نقطة</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">مراجعة إيجابية</span>
            <span className="text-sm font-bold text-blue-600">+50 نقطة</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-lg text-center">
          <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">{totalEarned}</p>
          <p className="text-xs text-gray-600">إجمالي النقاط</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg text-center">
          <Gift className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">{currentPoints}</p>
          <p className="text-xs text-gray-600">نقاط متاحة</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg text-center">
          <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">{totalEarned - currentPoints}</p>
          <p className="text-xs text-gray-600">تم استبدالها</p>
        </div>
      </div>
    </div>
  );
}
