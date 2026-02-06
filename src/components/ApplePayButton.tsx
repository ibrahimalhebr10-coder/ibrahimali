import React, { useState } from 'react';

interface ApplePayButtonProps {
  amount: number;
  onSuccess: (token: string, reference: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

const ApplePayButton: React.FC<ApplePayButtonProps> = ({
  amount,
  onSuccess,
  onError,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApplePay = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockToken = `apple_tok_${Math.random().toString(36).substr(2, 9)}`;
      const mockReference = `apple_ref_${Math.random().toString(36).substr(2, 9)}`;

      onSuccess(mockToken, mockReference);
    } catch (error) {
      onError('فشل في معالجة Apple Pay. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleApplePay}
      disabled={disabled || isProcessing}
      className={`
        w-full py-4 rounded-xl font-bold text-base
        transition-all duration-300 transform
        ${disabled || isProcessing
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-black text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
        }
      `}
    >
      {isProcessing ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>جاري المعالجة...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          <span>الدفع بواسطة Apple Pay</span>
        </div>
      )}
    </button>
  );
};

export default ApplePayButton;
