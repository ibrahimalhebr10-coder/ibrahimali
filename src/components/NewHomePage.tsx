import React, { useState } from 'react';
import { Play, Shield, TrendingUp, Star, Handshake, User, Sprout, Sparkles, CheckCircle } from 'lucide-react';
import StreamingVideoPlayer from './StreamingVideoPlayer';

interface NewHomePageProps {
  onStartInvestment: () => void;
  onOpenPartnerProgram: () => void;
  onOpenAccount: () => void;
  onOpenAssistant: () => void;
}

const NewHomePage: React.FC<NewHomePageProps> = ({
  onStartInvestment,
  onOpenPartnerProgram,
  onOpenAccount,
  onOpenAssistant
}) => {
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 to-white/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-screen pb-20">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 overflow-y-auto">
          {/* Main Heading */}
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-2 leading-tight">
            استثمر في الزراعة بثقة
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-700 text-center mb-4">
            أصول حقيقية • إدارة احترافية
          </p>

          {/* Trust Badge */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl px-5 py-3 shadow-lg mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-amber-600" />
              <span className="text-gray-800 font-semibold text-sm">أكثر من 500 مستثمر</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-gray-700 text-center text-sm">بدأوا خلال 30 آخر يوم</p>
          </div>

          {/* Video Button */}
          <button
            onClick={() => setShowVideoPlayer(true)}
            className="bg-white/80 backdrop-blur-md rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 mb-5"
          >
            <div className="bg-green-700 rounded-full p-1.5">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-gray-800 font-semibold text-base">
              فيديو تعريفي (دقيقة واحدة)
            </span>
          </button>

          {/* What Are You Looking For Section */}
          <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
            ما الذي تبحث عنه؟
          </h2>

          {/* Three Cards */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-2xl mb-5 px-2">
            {/* Card 1: Stable Income */}
            <div className="bg-white/70 backdrop-blur-md rounded-xl p-3 shadow-lg flex flex-col items-center justify-center min-h-[110px]">
              <div className="relative mb-2">
                <Shield className="w-8 h-8 text-amber-600" />
                <CheckCircle className="w-4 h-4 text-green-600 absolute -top-0.5 -right-0.5" />
              </div>
              <p className="text-gray-800 font-semibold text-center text-xs leading-tight">
                دخل ثابت
              </p>
              <CheckCircle className="w-4 h-4 text-green-600 mt-1.5" />
            </div>

            {/* Card 2: Annual Returns */}
            <div className="bg-white/70 backdrop-blur-md rounded-xl p-3 shadow-lg flex flex-col items-center justify-center min-h-[110px]">
              <div className="relative mb-2">
                <TrendingUp className="w-8 h-8 text-green-700" />
                <CheckCircle className="w-4 h-4 text-green-600 absolute -top-0.5 -right-0.5" />
              </div>
              <p className="text-gray-800 font-semibold text-center text-xs leading-tight">
                عوائد سنجل
              </p>
              <CheckCircle className="w-4 h-4 text-green-600 mt-1.5" />
            </div>

            {/* Card 3: Safe First Experience */}
            <div className="bg-white/70 backdrop-blur-md rounded-xl p-3 shadow-lg flex flex-col items-center justify-center min-h-[110px]">
              <div className="relative mb-2">
                <Star className="w-8 h-8 text-amber-500" />
                <CheckCircle className="w-4 h-4 text-green-600 absolute -top-0.5 -right-0.5" />
              </div>
              <p className="text-gray-800 font-semibold text-center text-xs leading-tight">
                تجربة أولى آمنة
              </p>
              <CheckCircle className="w-4 h-4 text-green-600 mt-1.5" />
            </div>
          </div>

          {/* Success Partner Button */}
          <button
            onClick={onOpenPartnerProgram}
            className="bg-white/80 backdrop-blur-md rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Handshake className="w-5 h-5 text-amber-700" />
            <span className="text-gray-800 font-semibold text-base">
              كن شريك نجاح
            </span>
          </button>
        </div>

        {/* Fixed Bottom Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200/50 shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
            {/* Left: My Account */}
            <button
              onClick={onOpenAccount}
              className="flex flex-col items-center gap-0.5 hover:scale-105 active:scale-95 transition-transform"
            >
              <User className="w-5 h-5 text-gray-700" />
              <span className="text-xs text-gray-700">حسابي</span>
            </button>

            {/* Center: Start Investment (Primary Button) */}
            <button
              onClick={onStartInvestment}
              className="bg-green-700 hover:bg-green-800 text-white rounded-full px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Sprout className="w-4 h-4" />
              <span className="font-semibold text-base">ابدأ الاستثمار</span>
            </button>

            {/* Right: Assistant */}
            <button
              onClick={onOpenAssistant}
              className="flex flex-col items-center gap-0.5 hover:scale-105 active:scale-95 transition-transform"
            >
              <Sparkles className="w-5 h-5 text-gray-700" />
              <span className="text-xs text-gray-700">المساعد</span>
            </button>
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {showVideoPlayer && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <StreamingVideoPlayer
              videoUrl=""
              onClose={() => setShowVideoPlayer(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NewHomePage;
