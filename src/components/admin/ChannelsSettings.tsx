import React, { useState, useEffect } from 'react';
import { Globe, MessageCircle, Smartphone, Mail, CheckCircle, Clock, Settings, Info, Wrench } from 'lucide-react';
import { messagingChannelsService } from '../../services/messagingChannelsService';
import SMSProviderConfigModal from './SMSProviderConfig';
import WhatsAppBusinessConfigModal from './WhatsAppBusinessConfig';

interface Channel {
  id: string;
  name: string;
  nameEn: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  status: 'active' | 'coming_soon' | 'planned';
  description: string;
  features: string[];
}

export default function ChannelsSettings() {
  const [showSMSConfig, setShowSMSConfig] = useState(false);
  const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false);
  const [smsConfigured, setSmsConfigured] = useState(false);
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkChannelsConfiguration();
  }, []);

  const checkChannelsConfiguration = async () => {
    try {
      setLoading(true);
      const [smsConfig, whatsappConfig] = await Promise.all([
        messagingChannelsService.isChannelConfigured('sms'),
        messagingChannelsService.isChannelConfigured('whatsapp_business')
      ]);

      setSmsConfigured(smsConfig);
      setWhatsappConfigured(whatsappConfig);
    } catch (error) {
      console.error('Error checking configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSaved = () => {
    checkChannelsConfiguration();
  };

  const channels: Channel[] = [
    {
      id: 'website',
      name: 'رسائل داخل الموقع',
      nameEn: 'Website Messages',
      icon: <Globe className="w-8 h-8" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      status: 'active',
      description: 'نظام الرسائل الداخلية للموقع. يمكن للمستثمرين استلام الرسائل مباشرة في حساباتهم.',
      features: [
        'إرسال فوري للرسائل',
        'إشعارات داخل النظام',
        'سجل كامل للمحادثات',
        'دعم المرفقات والصور'
      ]
    },
    {
      id: 'sms',
      name: 'رسائل نصية SMS',
      nameEn: 'SMS Messages',
      icon: <Smartphone className="w-8 h-8" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      status: 'coming_soon',
      description: 'إرسال رسائل نصية مباشرة إلى هواتف المستثمرين. مثالي للتنبيهات العاجلة والتأكيدات.',
      features: [
        'إرسال رسائل نصية قصيرة',
        'تأكيدات فورية',
        'دعم الأرقام الدولية',
        'تقارير حالة التسليم'
      ]
    },
    {
      id: 'whatsapp',
      name: 'واتساب WhatsApp API',
      nameEn: 'WhatsApp Business API',
      icon: <MessageCircle className="w-8 h-8" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      status: 'coming_soon',
      description: 'التكامل مع واتساب للأعمال. إرسال رسائل تفاعلية مع دعم الوسائط المتعددة.',
      features: [
        'رسائل تفاعلية',
        'دعم الصور والفيديو',
        'أزرار وردود سريعة',
        'محادثات ثنائية الاتجاه'
      ]
    },
    {
      id: 'email',
      name: 'البريد الإلكتروني',
      nameEn: 'Email',
      icon: <Mail className="w-8 h-8" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      status: 'planned',
      description: 'إرسال رسائل بريد إلكتروني احترافية. مثالي للتقارير والمستندات الرسمية.',
      features: [
        'تصميم احترافي للرسائل',
        'دعم المرفقات',
        'قوالب قابلة للتخصيص',
        'تتبع الفتح والنقرات'
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            مفعّلة
          </span>
        );
      case 'coming_soon':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4" />
            قريباً
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <Settings className="w-4 h-4" />
            مخطط لها
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">إعدادات القنوات</h2>
        <p className="text-gray-600 mt-1">إدارة قنوات التواصل مع المستثمرين</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">معلومات مهمة</h3>
            <p className="text-sm text-blue-800">
              هذه الصفحة تعرض القنوات المتاحة والمخطط لها مستقبلاً. القنوات غير المفعّلة ستتوفر في التحديثات القادمة.
              حالياً، فقط الرسائل الداخلية داخل الموقع مفعّلة ومتاحة للاستخدام.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className={`bg-white rounded-xl border-2 transition-all ${
              channel.status === 'active'
                ? 'border-green-200 shadow-lg'
                : 'border-gray-200 opacity-75'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`${channel.bgColor} p-3 rounded-xl ${channel.color}`}>
                    {channel.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {channel.name}
                    </h3>
                    <p className="text-sm text-gray-500">{channel.nameEn}</p>
                  </div>
                </div>
                {getStatusBadge(channel.status)}
              </div>

              <p className="text-gray-700 mb-4 leading-relaxed">
                {channel.description}
              </p>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 text-sm">المميزات:</h4>
                <ul className="space-y-2">
                  {channel.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        channel.status === 'active' ? 'bg-green-600' : 'bg-gray-400'
                      }`}></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {channel.status === 'active' && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">الحالة</span>
                    <span className="text-sm font-semibold text-green-600">جاهزة للاستخدام</span>
                  </div>
                </div>
              )}

              {channel.status === 'coming_soon' && (
                <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                  {channel.id === 'sms' && (
                    <>
                      {smsConfigured ? (
                        <div className="bg-green-50 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-sm text-green-800 font-medium">تم تكوين المزود</p>
                          </div>
                          <button
                            onClick={() => setShowSMSConfig(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm"
                          >
                            <Wrench className="w-4 h-4" />
                            تعديل الإعدادات
                          </button>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <p className="text-sm text-yellow-800 mb-3">
                            ستتوفر هذه القناة في التحديثات القادمة. يتم العمل على تكاملها مع مزودي خدمة الرسائل النصية حالياً.
                          </p>
                          <button
                            onClick={() => setShowSMSConfig(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            <Settings className="w-4 h-4" />
                            تكوين مزود SMS
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {channel.id === 'whatsapp' && (
                    <>
                      {whatsappConfigured ? (
                        <div className="bg-green-50 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-sm text-green-800 font-medium">تم تكوين المزود</p>
                          </div>
                          <button
                            onClick={() => setShowWhatsAppConfig(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm"
                          >
                            <Wrench className="w-4 h-4" />
                            تعديل الإعدادات
                          </button>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <p className="text-sm text-yellow-800 mb-3">
                            ستتوفر هذه القناة في التحديثات القادمة. يتم العمل على التكامل حالياً.
                          </p>
                          <button
                            onClick={() => setShowWhatsAppConfig(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            <Settings className="w-4 h-4" />
                            تكوين WhatsApp Business API
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {channel.id !== 'sms' && channel.id !== 'whatsapp' && (
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        ستتوفر هذه القناة في التحديثات القادمة. يتم العمل على التكامل حالياً.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {channel.status === 'planned' && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      مخطط إضافة هذه القناة في المستقبل بناءً على احتياجات المنصة.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">الإحصائيات الحالية</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">القنوات المفعّلة</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {channels.filter(c => c.status === 'active').length}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">قريباً</span>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {channels.filter(c => c.status === 'coming_soon').length}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">مخطط لها</span>
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {channels.filter(c => c.status === 'planned').length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">ملاحظات التطوير</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
            <p>
              <strong>الرسائل الداخلية:</strong> متاحة حالياً وجاهزة للاستخدام الكامل مع دعم القوالب والسجل الشامل.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 flex-shrink-0"></div>
            <p>
              <strong>SMS:</strong> يتطلب التكامل مع مزود خدمة SMS محلي. سيتم إضافة الدعم عند توفر البنية التحتية.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5 flex-shrink-0"></div>
            <p>
              <strong>WhatsApp API:</strong> يتطلب حساب WhatsApp Business API معتمد. سيتم التكامل في المرحلة القادمة.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5 flex-shrink-0"></div>
            <p>
              <strong>البريد الإلكتروني:</strong> مخطط للمستقبل لإرسال التقارير والمستندات الرسمية.
            </p>
          </div>
        </div>
      </div>

      {showSMSConfig && (
        <SMSProviderConfigModal
          onClose={() => setShowSMSConfig(false)}
          onSaved={handleConfigSaved}
        />
      )}

      {showWhatsAppConfig && (
        <WhatsAppBusinessConfigModal
          onClose={() => setShowWhatsAppConfig(false)}
          onSaved={handleConfigSaved}
        />
      )}
    </div>
  );
}
