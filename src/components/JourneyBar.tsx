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
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 mb-6">
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
                      w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-4
                      ${isCompleted ? 'bg-green-500 border-green-600 scale-100' : ''}
                      ${isCurrent ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-blue-600 scale-110 shadow-lg' : ''}
                      ${isFuture ? 'bg-gray-200 border-gray-300 scale-90' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-7 h-7 text-white stroke-[3]" />
                    ) : (
                      <StepIcon
                        className={`
                          w-6 h-6 transition-all
                          ${isCurrent ? 'text-white' : ''}
                          ${isFuture ? 'text-gray-400' : ''}
                        `}
                      />
                    )}
                  </div>

                  <p
                    className={`
                      mt-3 text-sm font-bold text-center whitespace-nowrap transition-all
                      ${isCompleted ? 'text-green-600' : ''}
                      ${isCurrent ? 'text-blue-600 scale-105' : ''}
                      ${isFuture ? 'text-gray-400' : ''}
                    `}
                  >
                    {step.label}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div className="absolute top-7 right-0 w-full h-1 -z-0" style={{ left: '50%', width: 'calc(100% - 28px)' }}>
                    <div
                      className={`
                        h-full transition-all duration-500
                        ${index < currentIndex ? 'bg-green-500' : 'bg-gray-200'}
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
