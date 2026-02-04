import React from 'react';
import { Lock, LogIn, UserPlus } from 'lucide-react';
import { useDemoMode } from '../contexts/DemoModeContext';

interface DemoActionModalProps {
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export default function DemoActionModal({ onClose, onLogin, onRegister }: DemoActionModalProps) {
  const { demoType } = useDemoMode();

  const isGreen = demoType === 'green';
  const color = isGreen ? '#3aa17e' : '#d4af37';
  const gradient = isGreen
    ? 'linear-gradient(135deg, #3aa17e 0%, #2f8266 100%)'
    : 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)';

  const title = isGreen ? 'هذه خطوة حقيقية' : 'هذه خطوة استثمارية حقيقية';
  const description1 = isGreen
    ? 'لتصبح رحلتك فعلية، سجّل دخولك'
    : 'دخولك يفتح لك التفاصيل والتنفيذ';
  const description2 = isGreen
    ? 'وستنتقل من التجربة إلى الواقع'
    : 'وتصبح جزءاً من هذا الأصل';

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
        style={{
          animation: 'fadeInScale 0.3s ease-out'
        }}
      >
        {/* Icon */}
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: gradient }}
        >
          <Lock className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h2
          className="text-2xl font-bold mb-3"
          style={{ color }}
        >
          {title}
        </h2>

        {/* Description */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-right">
          <p className="text-gray-700 leading-relaxed">
            {description1}
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            {description2}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-4">
          <button
            onClick={onLogin}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            style={{ background: gradient }}
          >
            <LogIn className="w-5 h-5" />
            <span>تسجيل الدخول</span>
          </button>

          <button
            onClick={onRegister}
            className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 border-2"
            style={{
              color: color,
              borderColor: color,
              background: 'white'
            }}
          >
            <UserPlus className="w-5 h-5" />
            <span>إنشاء حساب</span>
          </button>
        </div>

        {/* Continue Demo */}
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
        >
          متابعة التجربة (بدون تنفيذ)
        </button>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
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
