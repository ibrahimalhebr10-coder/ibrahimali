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
      <div className="relative z-10 flex flex-col min-h-screen pb-24">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-start pt-16 px-6">
          {/* Main Heading */}
          <h1 className="text-4xl font-bold text-gray-800 text-center mb-3 leading-tight">
            استثمر في الزراعة بثقة
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-700 text-center mb-6">
            أصول حقيقية • إدارة احترافية
          </p>

          {/* Trust Badge */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-amber-600" />
              <span className="text-gray-800 font-semibold">أكثر من 500 مستثمر</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-gray-700 text-center">بدأوا خلال 30 آخر يوم</p>
          </div>

          {/* Video Button */}
          <button
            onClick={() => setShowVideoPlayer(true)}
            className="bg-white/80 backdrop-blur-md rounded-full px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3 mb-8"
          >
            <div className="bg-green-700 rounded-full p-2">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-gray-800 font-semibold text-lg">
              فيديو تعريفي (دقيقة واحدة)
            </span>
          </button>

          {/* What Are You Looking For Section */}
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
            ما الذي تبحث عنه؟
          </h2>

          {/* Three Cards */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-2xl mb-8 px-2">
            {/* Card 1: Stable Income */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center min-h-[140px]">
              <div className="relative mb-3">
                <Shield className="w-10 h-10 text-amber-600" />
                <CheckCircle className="w-5 h-5 text-green-600 absolute -top-1 -right-1" />
              </div>
              <p className="text-gray-800 font-semibold text-center text-sm leading-tight">
                دخل ثابت
              </p>
              <CheckCircle className="w-5 h-5 text-green-600 mt-2" />
            </div>

            {/* Card 2: Annual Returns */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center min-h-[140px]">
              <div className="relative mb-3">
                <TrendingUp className="w-10 h-10 text-green-700" />
                <CheckCircle className="w-5 h-5 text-green-600 absolute -top-1 -right-1" />
              </div>
              <p className="text-gray-800 font-semibold text-center text-sm leading-tight">
                عوائد سنجل
              </p>
              <CheckCircle className="w-5 h-5 text-green-600 mt-2" />
            </div>

            {/* Card 3: Safe First Experience */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center min-h-[140px]">
              <div className="relative mb-3">
                <Star className="w-10 h-10 text-amber-500" />
                <CheckCircle className="w-5 h-5 text-green-600 absolute -top-1 -right-1" />
              </div>
              <p className="text-gray-800 font-semibold text-center text-sm leading-tight">
                تجربة أولى آمنة
              </p>
              <CheckCircle className="w-5 h-5 text-green-600 mt-2" />
            </div>
          </div>

          {/* Success Partner Button */}
          <button
            onClick={onOpenPartnerProgram}
            className="bg-white/80 backdrop-blur-md rounded-full px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3"
          >
            <Handshake className="w-6 h-6 text-amber-700" />
            <span className="text-gray-800 font-semibold text-lg">
              كن شريك نجاح
            </span>
          </button>
        </div>

        {/* Fixed Bottom Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200/50 shadow-lg z-50">
          <div className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto">
            {/* Left: My Account */}
            <button
              onClick={onOpenAccount}
              className="flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition-transform"
            >
              <User className="w-6 h-6 text-gray-700" />
              <span className="text-sm text-gray-700">حسابي</span>
            </button>

            {/* Center: Start Investment (Primary Button) */}
            <button
              onClick={onStartInvestment}
              className="bg-green-700 hover:bg-green-800 text-white rounded-full px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Sprout className="w-5 h-5" />
              <span className="font-semibold text-lg">ابدأ الاستثمار</span>
            </button>

            {/* Right: Assistant */}
            <button
              onClick={onOpenAssistant}
              className="flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition-transform"
            >
              <Sparkles className="w-6 h-6 text-gray-700" />
              <span className="text-sm text-gray-700">المساعد</span>
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
