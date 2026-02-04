import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { useDemoMode } from '../contexts/DemoModeContext';

interface DemoWelcomeScreenProps {
  onStart: () => void;
}

export default function DemoWelcomeScreen({ onStart }: DemoWelcomeScreenProps) {
  const { demoType } = useDemoMode();

  const isGreen = demoType === 'green';
  const color = isGreen ? '#3aa17e' : '#d4af37';
  const gradient = isGreen
    ? 'linear-gradient(135deg, #3aa17e 0%, #2f8266 100%)'
    : 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)';
  const title = isGreen ? 'أشجاري الخضراء' : 'أشجاري الذهبية';
  const subtitle = isGreen
    ? 'رحلة رعاية أشجارك والاهتمام بها'
    : 'رحلة الاستثمار والعوائد المجزية';
  const icon = isGreen ? '🌿' : '✨';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
        style={{
          animation: 'fadeInScale 0.4s ease-out'
        }}
      >
        {/* Icon */}
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl shadow-lg"
          style={{ background: gradient }}
        >
          <span>{icon}</span>
        </div>

        {/* Title */}
        <h2
          className="text-3xl font-bold mb-3"
          style={{ color }}
        >
          أهلاً بك
        </h2>

        {/* Subtitle */}
        <p className="text-lg font-semibold text-gray-700 mb-4">
          {title}
        </p>

        {/* Description */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-right">
          <p className="text-gray-600 leading-relaxed">
            أنت الآن داخل <span className="font-bold" style={{ color }}>تجربة توضيحية</span>
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            شاهد كيف تعمل {subtitle}
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            خطوة بخطوة
          </p>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
          style={{ background: gradient }}
        >
          <Sparkles className="w-5 h-5" />
          <span>ابدأ التجربة</span>
        </button>

        {/* Note */}
        <p className="text-xs text-gray-400 mt-4">
          يمكنك تسجيل الدخول في أي وقت لتحويل التجربة إلى حساب فعلي
        </p>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
