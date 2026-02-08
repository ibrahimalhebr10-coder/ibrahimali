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
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
        }}
      >
        {/* Gradient: Clear top, white bottom (fog effect) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 pt-20 pb-24">
          {/* Main Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-2 leading-tight">
            استثمر في الزراعة بثقة
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-700 text-center mb-6">
            أصول حقيقية • إدارة احترافية
          </p>

          {/* Trust Badge */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl px-6 py-3 shadow-lg mb-6">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <span className="text-gray-800 font-semibold text-sm">أكثر من 500 مستثمر</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-gray-700 text-center text-sm mt-1">بدأوا خلال 30 آخر يوم</p>
          </div>

          {/* Video Button */}
          <button
            onClick={() => setShowVideoPlayer(true)}
            className="bg-white/70 backdrop-blur-md rounded-full px-6 py-3.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3 mb-8 border border-white/50 w-full max-w-sm justify-center"
          >
            <div className="bg-green-700 rounded-full p-2">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-gray-800 font-semibold text-base">
              فيديو تعريفي (دقيقة واحدة)
            </span>
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* What Are You Looking For Section */}
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center mb-5">
            ما الذي تبحث عنه؟
          </h2>

          {/* Three Cards */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-2xl mb-6 px-2">
            {/* Card 1: Stable Income */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center min-h-[120px]">
              <div className="relative mb-2">
                <Shield className="w-10 h-10 text-amber-500" />
                <CheckCircle className="w-4 h-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
              </div>
              <p className="text-gray-800 font-semibold text-center text-sm leading-tight">
                دخل ثابت
              </p>
              <CheckCircle className="w-4 h-4 text-green-600 mt-2" />
            </div>

            {/* Card 2: Annual Returns */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center min-h-[120px]">
              <div className="relative mb-2">
                <TrendingUp className="w-10 h-10 text-green-700" />
                <CheckCircle className="w-4 h-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
              </div>
              <p className="text-gray-800 font-semibold text-center text-sm leading-tight">
                عوائد سنوية
              </p>
              <CheckCircle className="w-4 h-4 text-green-600 mt-2" />
            </div>

            {/* Card 3: Safe First Experience */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center min-h-[120px]">
              <div className="relative mb-2">
                <Star className="w-10 h-10 text-amber-500 fill-amber-500" />
                <CheckCircle className="w-4 h-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
              </div>
              <p className="text-gray-800 font-semibold text-center text-sm leading-tight">
                تجربة أولى آمنة
              </p>
              <CheckCircle className="w-4 h-4 text-green-600 mt-2" />
            </div>
          </div>

          {/* Success Partner Button */}
          <button
            onClick={onOpenPartnerProgram}
            className="bg-white/70 backdrop-blur-md rounded-full px-6 py-3.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3 border border-white/50 w-full max-w-sm justify-center"
          >
            <Handshake className="w-5 h-5 text-amber-600" />
            <span className="text-gray-800 font-semibold text-base">
              كن شريك نجاح
            </span>
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Fixed Bottom Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200/50 shadow-lg z-50">
          <div className="flex items-center justify-between px-6 py-3.5 max-w-2xl mx-auto">
            {/* Left: My Account */}
            <button
              onClick={onOpenAccount}
              className="flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition-transform min-w-[60px]"
            >
              <User className="w-6 h-6 text-gray-700" />
              <span className="text-xs text-gray-700 font-medium">حسابي</span>
            </button>

            {/* Center: Start Investment (Primary Button) */}
            <button
              onClick={onStartInvestment}
              className="bg-green-700 hover:bg-green-800 text-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Sprout className="w-5 h-5" />
              <span className="font-semibold text-base">ابدأ الاستثمار</span>
            </button>

            {/* Right: Assistant */}
            <button
              onClick={onOpenAssistant}
              className="flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition-transform min-w-[60px]"
            >
              <Sparkles className="w-6 h-6 text-gray-700" />
              <span className="text-xs text-gray-700 font-medium">المساعد</span>
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
