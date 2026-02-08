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
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 to-white/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-start px-4 pt-2 pb-16">
          {/* Main Heading */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-1 leading-tight">
            استثمر في الزراعة بثقة
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-gray-700 text-center mb-2">
            أصول حقيقية • إدارة احترافية
          </p>

          {/* Trust Badge */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl px-4 py-1.5 shadow-lg mb-2">
            <div className="flex items-center justify-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="text-gray-800 font-semibold text-xs">أكثر من 500 مستثمر</span>
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            </div>
            <p className="text-gray-700 text-center text-xs mt-0.5">بدأوا خلال 30 آخر يوم</p>
          </div>

          {/* Video Button */}
          <button
            onClick={() => setShowVideoPlayer(true)}
            className="bg-white/80 backdrop-blur-md rounded-full px-5 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 mb-2"
          >
            <div className="bg-green-700 rounded-full p-1">
              <Play className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="text-gray-800 font-semibold text-sm">
              فيديو تعريفي (دقيقة واحدة)
            </span>
          </button>

          {/* What Are You Looking For Section */}
          <h2 className="text-lg md:text-xl font-bold text-gray-800 text-center mb-2">
            ما الذي تبحث عنه؟
          </h2>

          {/* Three Cards */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-xl mb-2 px-2">
            {/* Card 1: Stable Income */}
            <div className="bg-white/70 backdrop-blur-md rounded-lg p-2.5 shadow-lg flex flex-col items-center justify-center min-h-[95px]">
              <div className="relative mb-1.5">
                <Shield className="w-7 h-7 text-amber-600" />
                <CheckCircle className="w-3.5 h-3.5 text-green-600 absolute -top-0.5 -right-0.5" />
              </div>
              <p className="text-gray-800 font-semibold text-center text-xs leading-tight">
                دخل ثابت
              </p>
              <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-1" />
            </div>

            {/* Card 2: Annual Returns */}
            <div className="bg-white/70 backdrop-blur-md rounded-lg p-2.5 shadow-lg flex flex-col items-center justify-center min-h-[95px]">
              <div className="relative mb-1.5">
                <TrendingUp className="w-7 h-7 text-green-700" />
                <CheckCircle className="w-3.5 h-3.5 text-green-600 absolute -top-0.5 -right-0.5" />
              </div>
              <p className="text-gray-800 font-semibold text-center text-xs leading-tight">
                عوائد سنوية
              </p>
              <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-1" />
            </div>

            {/* Card 3: Safe First Experience */}
            <div className="bg-white/70 backdrop-blur-md rounded-lg p-2.5 shadow-lg flex flex-col items-center justify-center min-h-[95px]">
              <div className="relative mb-1.5">
                <Star className="w-7 h-7 text-amber-500" />
                <CheckCircle className="w-3.5 h-3.5 text-green-600 absolute -top-0.5 -right-0.5" />
              </div>
              <p className="text-gray-800 font-semibold text-center text-xs leading-tight">
                تجربة أولى آمنة
              </p>
              <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-1" />
            </div>
          </div>

          {/* Success Partner Button */}
          <button
            onClick={onOpenPartnerProgram}
            className="bg-white/80 backdrop-blur-md rounded-full px-5 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Handshake className="w-4 h-4 text-amber-700" />
            <span className="text-gray-800 font-semibold text-sm">
              كن شريك نجاح
            </span>
          </button>
        </div>

        {/* Fixed Bottom Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200/50 shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2.5 max-w-2xl mx-auto">
            {/* Left: My Account */}
            <button
              onClick={onOpenAccount}
              className="flex flex-col items-center gap-0.5 hover:scale-105 active:scale-95 transition-transform min-w-[50px]"
            >
              <User className="w-4.5 h-4.5 text-gray-700" />
              <span className="text-[10px] text-gray-700">حسابي</span>
            </button>

            {/* Center: Start Investment (Primary Button) */}
            <button
              onClick={onStartInvestment}
              className="bg-green-700 hover:bg-green-800 text-white rounded-full px-5 py-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Sprout className="w-4 h-4" />
              <span className="font-semibold text-sm">ابدأ الاستثمار</span>
            </button>

            {/* Right: Assistant */}
            <button
              onClick={onOpenAssistant}
              className="flex flex-col items-center gap-0.5 hover:scale-105 active:scale-95 transition-transform min-w-[50px]"
            >
              <Sparkles className="w-4.5 h-4.5 text-gray-700" />
              <span className="text-[10px] text-gray-700">المساعد</span>
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
