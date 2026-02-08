import React from 'react';

interface SmartAssistantIconProps {
  size?: number;
  onClick?: () => void;
}

const SmartAssistantIcon: React.FC<SmartAssistantIconProps> = ({ size = 70, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '8px'
      }}
    >
      {/* الروبوت المتطور */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow Effect الخارجي */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
            filter: 'blur(10px)'
          }}
        />

        {/* الدائرة الخارجية - حلقة متوهجة */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <defs>
            {/* Gradient للحلقة الخارجية */}
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
            </linearGradient>

            {/* Gradient لجسم الروبوت */}
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#818cf8', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
            </linearGradient>

            {/* Gradient للعيون */}
            <radialGradient id="eyeGradient">
              <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
              <stop offset="70%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
            </radialGradient>

            {/* Filter للتوهج */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* الحلقة الخارجية المتوهجة */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="2"
            strokeDasharray="5,3"
            opacity="0.6"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 50 50"
              to="360 50 50"
              dur="20s"
              repeatCount="indefinite"
            />
          </circle>

          {/* خلفية الروبوت */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="url(#bodyGradient)"
            filter="url(#glow)"
          />

          {/* رأس الروبوت */}
          <g>
            {/* الهوائي */}
            <line x1="50" y1="18" x2="50" y2="12" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="50" cy="10" r="3" fill="#60a5fa">
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
            </circle>

            {/* الرأس */}
            <rect x="35" y="20" width="30" height="25" rx="12" fill="#818cf8" />

            {/* العيون */}
            <g>
              {/* العين اليسرى */}
              <ellipse cx="42" cy="30" rx="4" ry="5" fill="url(#eyeGradient)">
                <animate attributeName="ry" values="5;1;5" dur="3s" repeatCount="indefinite"/>
              </ellipse>

              {/* العين اليمنى */}
              <ellipse cx="58" cy="30" rx="4" ry="5" fill="url(#eyeGradient)">
                <animate attributeName="ry" values="5;1;5" dur="3s" repeatCount="indefinite"/>
              </ellipse>

              {/* نقاط الضوء في العيون */}
              <circle cx="43" cy="29" r="1.5" fill="#bfdbfe"/>
              <circle cx="59" cy="29" r="1.5" fill="#bfdbfe"/>
            </g>

            {/* الابتسامة */}
            <path
              d="M 42 38 Q 50 42 58 38"
              stroke="#c7d2fe"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* جسم الروبوت */}
          <g>
            {/* الجسم الرئيسي */}
            <rect x="32" y="48" width="36" height="28" rx="8" fill="#6366f1"/>

            {/* خط الوسط */}
            <line x1="50" y1="50" x2="50" y2="74" stroke="#818cf8" strokeWidth="1.5"/>

            {/* الأزرار */}
            <circle cx="45" cy="58" r="2" fill="#60a5fa">
              <animate attributeName="fill" values="#60a5fa;#3b82f6;#60a5fa" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="55" cy="58" r="2" fill="#60a5fa">
              <animate attributeName="fill" values="#60a5fa;#3b82f6;#60a5fa" dur="1.5s" begin="0.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="50" cy="66" r="2" fill="#60a5fa">
              <animate attributeName="fill" values="#60a5fa;#3b82f6;#60a5fa" dur="1.5s" begin="1s" repeatCount="indefinite"/>
            </circle>
          </g>

          {/* الأذرع */}
          <g>
            {/* الذراع اليسرى */}
            <rect x="24" y="52" width="8" height="18" rx="4" fill="#818cf8"/>
            <circle cx="28" cy="72" r="3" fill="#60a5fa"/>

            {/* الذراع اليمنى */}
            <rect x="68" y="52" width="8" height="18" rx="4" fill="#818cf8"/>
            <circle cx="72" cy="72" r="3" fill="#60a5fa"/>
          </g>

          {/* الأرجل */}
          <g>
            {/* الرجل اليسرى */}
            <rect x="38" y="76" width="8" height="12" rx="4" fill="#818cf8"/>
            <ellipse cx="42" cy="88" rx="5" ry="3" fill="#60a5fa"/>

            {/* الرجل اليمنى */}
            <rect x="54" y="76" width="8" height="12" rx="4" fill="#818cf8"/>
            <ellipse cx="58" cy="88" rx="5" ry="3" fill="#60a5fa"/>
          </g>

          {/* شرارات الذكاء حول الرأس */}
          <g opacity="0.8">
            <circle cx="70" cy="28" r="2" fill="#fbbf24">
              <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="30" cy="28" r="2" fill="#fbbf24">
              <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite"/>
              <animate attributeName="r" values="2;3;2" dur="2s" begin="1s" repeatCount="indefinite"/>
            </circle>
          </g>
        </svg>
      </div>

      {/* النص الفاخر */}
      <div
        style={{
          fontFamily: '"Tajawal", "Cairo", "Almarai", -apple-system, sans-serif',
          fontSize: '13px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 2px 4px rgba(99, 102, 241, 0.2)',
          letterSpacing: '0.5px',
          position: 'relative',
          padding: '2px 0'
        }}
      >
        المساعد الذكي

        {/* Shine Effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            animation: 'shine 3s infinite'
          }}
        />
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          20% { left: 100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SmartAssistantIcon;
