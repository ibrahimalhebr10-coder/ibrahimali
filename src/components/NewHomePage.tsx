import React, { useState } from 'react';
import { Play, Shield, TrendingUp, Star, Handshake, User, Sprout, Sparkles, CheckCircle, ChevronLeft } from 'lucide-react';
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
    <div className="relative h-screen overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
        }}
      >
        {/* Multi-layer Gradient: Clear top, white fog bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-white/80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Hero Section - Optimized for Single Screen View */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 safe-top overflow-y-auto scrollbar-hide">
          <div className="w-full max-w-lg space-y-3 pb-24">
            {/* Main Heading - Compact */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center leading-tight drop-shadow-md">
              استثمر في الزراعة بثقة
            </h1>

            {/* Subtitle - Compact */}
            <p className="text-base md:text-lg text-gray-800 font-medium text-center drop-shadow-sm">
              أصول حقيقية • إدارة احترافية
            </p>

            {/* Trust Badge - Compact */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl px-4 py-2 shadow-xl border border-white/60">
              <div className="flex items-center justify-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-500 drop-shadow-md" />
                <span className="text-gray-900 font-bold text-xs">أكثر من 500 مستثمر</span>
                <CheckCircle className="w-3.5 h-3.5 text-green-600 drop-shadow-md" />
              </div>
              <p className="text-gray-800 text-center text-xs font-medium mt-0.5">بدأوا خلال 30 آخر يوم</p>
            </div>

            {/* Video Button - Compact */}
            <button
              onClick={() => setShowVideoPlayer(true)}
              className="bg-white/80 backdrop-blur-md rounded-full px-5 py-2.5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 border border-white/60 w-full justify-center"
            >
              <div className="bg-green-700 rounded-full p-1.5 shadow-lg">
                <Play className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="text-gray-900 font-bold text-sm">
                فيديو تعريفي (دقيقة واحدة)
              </span>
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>

            {/* What Are You Looking For Section - Compact */}
            <h2 className="text-lg md:text-xl font-bold text-gray-900 text-center pt-2 drop-shadow-sm">
              ما الذي تبحث عنه؟
            </h2>

            {/* Three Cards - Compact */}
            <div className="grid grid-cols-3 gap-2 w-full">
              {/* Card 1: Stable Income */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-xl border border-white/60 flex flex-col items-center justify-center min-h-[100px] hover:scale-105 transition-transform duration-300">
                <div className="relative mb-1.5">
                  <Shield className="w-8 h-8 text-amber-500 drop-shadow-lg" />
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 absolute -top-0.5 -right-0.5 bg-white rounded-full shadow-md" />
                </div>
                <p className="text-gray-900 font-bold text-center text-xs leading-tight">
                  دخل ثابت
                </p>
                <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-1.5 drop-shadow-md" />
              </div>

              {/* Card 2: Annual Returns */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-xl border border-white/60 flex flex-col items-center justify-center min-h-[100px] hover:scale-105 transition-transform duration-300">
                <div className="relative mb-1.5">
                  <TrendingUp className="w-8 h-8 text-green-700 drop-shadow-lg" />
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 absolute -top-0.5 -right-0.5 bg-white rounded-full shadow-md" />
                </div>
                <p className="text-gray-900 font-bold text-center text-xs leading-tight">
                  عوائد سنوية
                </p>
                <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-1.5 drop-shadow-md" />
              </div>

              {/* Card 3: Safe First Experience */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-xl border border-white/60 flex flex-col items-center justify-center min-h-[100px] hover:scale-105 transition-transform duration-300">
                <div className="relative mb-1.5">
                  <Star className="w-8 h-8 text-amber-500 fill-amber-500 drop-shadow-lg" />
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 absolute -top-0.5 -right-0.5 bg-white rounded-full shadow-md" />
                </div>
                <p className="text-gray-900 font-bold text-center text-xs leading-tight">
                  تجربة أولى آمنة
                </p>
                <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-1.5 drop-shadow-md" />
              </div>
            </div>

            {/* Success Partner Button - Compact */}
            <button
              onClick={onOpenPartnerProgram}
              className="bg-white/80 backdrop-blur-md rounded-full px-5 py-2.5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 border border-white/60 w-full justify-center"
            >
              <Handshake className="w-4 h-4 text-amber-600 drop-shadow-md" />
              <span className="text-gray-900 font-bold text-sm">
                كن شريك نجاح
              </span>
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Fixed Bottom Footer with Safe Area */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200/50 shadow-2xl z-50 safe-area-bottom">
          <div className="flex items-center justify-between px-4 py-2.5 max-w-2xl mx-auto">
            {/* Left: My Account */}
            <button
              onClick={onOpenAccount}
              className="flex flex-col items-center gap-0.5 hover:scale-105 active:scale-95 transition-transform min-w-[56px]"
            >
              <User className="w-5 h-5 text-gray-700" />
              <span className="text-[10px] text-gray-700 font-medium">حسابي</span>
            </button>

            {/* Center: Start Investment (Primary Button) */}
            <button
              onClick={onStartInvestment}
              className="bg-green-700 hover:bg-green-800 text-white rounded-full px-5 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Sprout className="w-4 h-4" />
              <span className="font-bold text-sm">ابدأ الاستثمار</span>
            </button>

            {/* Right: Assistant */}
            <button
              onClick={onOpenAssistant}
              className="flex flex-col items-center gap-0.5 hover:scale-105 active:scale-95 transition-transform min-w-[56px]"
            >
              <Sparkles className="w-5 h-5 text-gray-700" />
              <span className="text-[10px] text-gray-700 font-medium">المساعد</span>
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
