import { Check, Sprout, FileText, CreditCard, Play } from 'lucide-react';

type JourneyStep = 'selection' | 'reservation' | 'payment' | 'operation';

interface JourneyBarProps {
  currentStep: JourneyStep;
}

const steps = [
  { id: 'selection', icon: Sprout, label: 'اختيار المزرعة' },
  { id: 'reservation', icon: FileText, label: 'الحجز' },
  { id: 'payment', icon: CreditCard, label: 'السداد' },
  { id: 'operation', icon: Play, label: 'التشغيل' }
] as const;

export default function JourneyBar({ currentStep }: JourneyBarProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 mb-6">
      <div className="relative">
        <div className="flex items-center justify-between relative">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <div key={step.id} className="flex-1 relative">
                <div className="flex flex-col items-center relative z-10">
                  <div
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 sm:border-3
                      ${isCompleted ? 'bg-emerald-500 border-emerald-600 scale-100' : ''}
                      ${isCurrent ? 'bg-gradient-to-br from-sky-500 to-cyan-500 border-sky-600 scale-105 sm:scale-110 shadow-md' : ''}
                      ${isFuture ? 'bg-gray-100 border-gray-200 scale-90 sm:scale-95' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.5]" />
                    ) : (
                      <StepIcon
                        className={`
                          w-4 h-4 sm:w-5 sm:h-5 transition-all
                          ${isCurrent ? 'text-white' : ''}
                          ${isFuture ? 'text-gray-400' : ''}
                        `}
                      />
                    )}
                  </div>

                  <p
                    className={`
                      mt-2 sm:mt-3 text-xs sm:text-sm font-semibold text-center whitespace-nowrap transition-all
                      ${isCompleted ? 'text-emerald-700' : ''}
                      ${isCurrent ? 'text-sky-700' : ''}
                      ${isFuture ? 'text-gray-400' : ''}
                    `}
                  >
                    {step.label}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div className="absolute top-5 sm:top-6 right-0 w-full h-0.5 sm:h-1 -z-0" style={{ left: '50%', width: 'calc(100% - 20px)' }}>
                    <div
                      className={`
                        h-full transition-all duration-500 rounded-full
                        ${index < currentIndex ? 'bg-emerald-500' : 'bg-gray-200'}
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function getJourneyStep(status: string): JourneyStep {
  switch (status) {
    case 'no_reservation':
      return 'selection';

    case 'pending':
    case 'cancelled':
      return 'reservation';

    case 'waiting_for_payment':
    case 'payment_submitted':
      return 'payment';

    case 'paid':
    case 'transferred_to_harvest':
      return 'operation';

    default:
      return 'selection';
  }
}
