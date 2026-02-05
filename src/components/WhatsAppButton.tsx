import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { systemSettingsService } from '../services/systemSettingsService';
import { leadScoringService } from '../services/leadScoringService';

interface WhatsAppButtonProps {
  investorName?: string;
  reservationNumber?: string;
  farmName?: string;
  customMessage?: string;
  variant?: 'primary' | 'secondary' | 'floating';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function WhatsAppButton({
  investorName,
  reservationNumber,
  farmName,
  customMessage,
  variant = 'primary',
  size = 'medium',
  className = ''
}: WhatsAppButtonProps) {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWhatsAppSettings();
  }, []);

  const loadWhatsAppSettings = async () => {
    try {
      const [number, enabled] = await Promise.all([
        systemSettingsService.getWhatsAppNumber(),
        systemSettingsService.isWhatsAppEnabled()
      ]);
      setWhatsappNumber(number);
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Error loading WhatsApp settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildMessage = (): string => {
    if (customMessage) return customMessage;

    let message = 'السلام عليكم';

    if (investorName) {
      message += `\n\nالاسم: ${investorName}`;
    }

    if (reservationNumber) {
      message += `\nرقم الحجز: ${reservationNumber}`;
    }

    if (farmName) {
      message += `\nالمزرعة: ${farmName}`;
    }

    message += '\n\nأرغب في التواصل معكم.';

    return message;
  };

  const openWhatsApp = () => {
    if (!whatsappNumber) {
      alert('رقم واتساب غير متوفر حالياً');
      return;
    }

    console.log('💬 [WhatsApp] Button clicked!');
    leadScoringService.trackWhatsAppClick();

    const message = buildMessage();
    const encodedMessage = encodeURIComponent(message);
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  if (isLoading || !isEnabled || !whatsappNumber) {
    return null;
  }

  const getButtonStyles = () => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95';

    const sizeStyles = {
      small: 'px-3 py-2 text-sm',
      medium: 'px-4 py-3 text-base',
      large: 'px-6 py-4 text-lg'
    };

    const variantStyles = {
      primary: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl',
      secondary: 'bg-white hover:bg-green-50 text-green-600 border-2 border-green-600 shadow-md hover:shadow-lg',
      floating: 'fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white shadow-2xl hover:shadow-3xl rounded-full p-4'
    };

    if (variant === 'floating') {
      return `${variantStyles.floating} ${className}`;
    }

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;
  };

  const getIconSize = () => {
    const sizes = {
      small: 'w-4 h-4',
      medium: 'w-5 h-5',
      large: 'w-6 h-6'
    };
    return sizes[size];
  };

  if (variant === 'floating') {
    return (
      <button
        onClick={openWhatsApp}
        className={getButtonStyles()}
        title="تواصل معنا عبر واتساب"
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    );
  }

  return (
    <button
      onClick={openWhatsApp}
      className={getButtonStyles()}
    >
      <MessageCircle className={getIconSize()} />
      تواصل عبر واتساب
    </button>
  );
}
