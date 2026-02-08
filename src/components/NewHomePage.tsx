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
      <div className="relative z-10 flex flex-col h-screen">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-2 pb-20">
          {/* Main Heading */}
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center mb-1 leading-tight">
            استثمر في الزراعة بثقة
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-gray-700 text-center mb-2">
            أصول حقيقية • إدارة احترافية
          </p>

          {/* Trust Badge - Compact */}
          <div className="bg-white/80 backdrop-blur-md rounded-full px-4 py-1.5 shadow-lg mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-gray-800 font-semibold text-[11px]">500+ مستثمر نشط</span>
          </div>

          {/* Video Button - Compact */}
          <button
            onClick={() => setShowVideoPlayer(true)}
            className="bg-white/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 mb-2"
          >
            <div className="bg-green-700 rounded-full p-0.5">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="text-gray-800 font-semibold text-xs">
              شاهد الفيديو (دقيقة)
            </span>
          </button>

          {/* What Are You Looking For Section */}
          <h2 className="text-base md:text-lg font-bold text-gray-800 text-center mb-2">
            ما الذي تبحث عنه؟
          </h2>

          {/* Three Cards - Ultra Compact */}
          <div className="grid grid-cols-3 gap-1.5 w-full max-w-md mb-2 px-2">
            {/* Card 1: Stable Income */}
            <div className="bg-white/70 backdrop-blur-md rounded-lg p-2 shadow-md flex flex-col items-center justify-center min-h-[70px]">
              <Shield className="w-6 h-6 text-amber-600 mb-1" />
              <p className="text-gray-800 font-semibold text-center text-[10px] leading-tight">
                دخل ثابت
              </p>
            </div>

            {/* Card 2: Annual Returns */}
            <div className="bg-white/70 backdrop-blur-md rounded-lg p-2 shadow-md flex flex-col items-center justify-center min-h-[70px]">
              <TrendingUp className="w-6 h-6 text-green-700 mb-1" />
              <p className="text-gray-800 font-semibold text-center text-[10px] leading-tight">
                عوائد سنوية
              </p>
            </div>

            {/* Card 3: Safe First Experience */}
            <div className="bg-white/70 backdrop-blur-md rounded-lg p-2 shadow-md flex flex-col items-center justify-center min-h-[70px]">
              <Star className="w-6 h-6 text-amber-500 mb-1" />
              <p className="text-gray-800 font-semibold text-center text-[10px] leading-tight">
                تجربة آمنة
              </p>
            </div>
          </div>

          {/* Success Partner Button - Compact */}
          <button
            onClick={onOpenPartnerProgram}
            className="bg-white/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            <Handshake className="w-3.5 h-3.5 text-amber-700" />
            <span className="text-gray-800 font-semibold text-xs">
              كن شريك نجاح
            </span>
          </button>
        </div>

        {/* Fixed Bottom Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200/50 shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2 max-w-2xl mx-auto">
            {/* Left: My Account */}
            <button
              onClick={onOpenAccount}
              className="flex flex-col items-center gap-0.5 hover:scale-105 active:scale-95 transition-transform min-w-[45px]"
            >
              <User className="w-4 h-4 text-gray-700" />
              <span className="text-[9px] text-gray-700">حسابي</span>
            </button>

            {/* Center: Start Investment (Primary Button) */}
            <button
              onClick={onStartInvestment}
              className="bg-green-700 hover:bg-green-800 text-white rounded-full px-4 py-1.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span className="font-semibold text-xs">ابدأ الاستثمار</span>
            </button>

            {/* Right: Assistant */}
            <button
              onClick={onOpenAssistant}
              className="flex flex-col items-center gap-0.5 hover:scale-105 active:scale-95 transition-transform min-w-[45px]"
            >
              <Sparkles className="w-4 h-4 text-gray-700" />
              <span className="text-[9px] text-gray-700">المساعد</span>
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
