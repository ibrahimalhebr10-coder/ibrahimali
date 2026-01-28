import { Sprout, Loader2 } from 'lucide-react';

interface LoadingTransitionProps {
  message?: string;
}

export default function LoadingTransition({
  message = 'نجهز مزرعتك...'
}: LoadingTransitionProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 z-[200] flex items-center justify-center animate-fade-in">
      <div className="text-center px-4">
        {/* أيقونة النبتة المتحركة */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute w-24 h-24 bg-green-200/40 rounded-full animate-ping"></div>
          <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
            <Sprout className="w-10 h-10 text-white animate-bounce" />
          </div>
        </div>

        {/* الرسالة */}
        <div className="space-y-2">
          <p className="text-xl font-black text-green-700">{message}</p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
            <p className="text-sm text-green-600 font-medium">يرجى الانتظار لحظة</p>
          </div>
        </div>

        {/* شريط التحميل */}
        <div className="mt-8 w-48 mx-auto">
          <div className="h-1.5 bg-green-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-progress"></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes progress {
          0% {
            width: 0%;
            transform: translateX(0);
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
