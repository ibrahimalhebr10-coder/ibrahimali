import { useState } from 'react';
import { Megaphone, TrendingUp, Users, Target, Package, Settings, MessageSquare } from 'lucide-react';
import InfluencerPartnersManager from './InfluencerPartnersManager';
import FeaturedPackageManager from './FeaturedPackageManager';
import InfluencerSettingsManager from './InfluencerSettingsManager';
import PartnerShareMessageManager from './PartnerShareMessageManager';

const MarketingManagement = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'influencers' | 'featured' | 'settings' | 'share-message'>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">التسويق</h1>
          <p className="text-gray-600">إدارة الحملات التسويقية والترويجية</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'overview'
              ? 'text-emerald-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          نظرة عامة
          {activeTab === 'overview' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('influencers')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'influencers'
              ? 'text-emerald-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          شركاء المسيرة
          {activeTab === 'influencers' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('featured')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'featured'
              ? 'text-amber-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          الباقة المميزة
          {activeTab === 'featured' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'settings'
              ? 'text-emerald-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          إعدادات النظام
          {activeTab === 'settings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('share-message')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'share-message'
              ? 'text-amber-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          رسالة المشاركة
          {activeTab === 'share-message' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />
          )}
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => setActiveTab('influencers')}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all text-right group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                شركاء المسيرة
              </h3>
              <p className="text-sm text-gray-600">
                إدارة المؤثرين ونظام المكافآت التراكمية
              </p>
            </button>

            <button
              onClick={() => setActiveTab('featured')}
              className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 hover:shadow-md transition-all text-right group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
                الباقة المميزة
              </h3>
              <p className="text-sm text-gray-600">
                تخصيص الباقة المؤقتة التي تظهر عند إدخال كود المؤثر
              </p>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all text-right group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                إعدادات النظام
              </h3>
              <p className="text-sm text-gray-600">
                إدارة قواعد المكافآت والإعدادات العامة
              </p>
            </button>

            <button
              onClick={() => setActiveTab('share-message')}
              className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 hover:shadow-md transition-all text-right group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
                رسالة المشاركة
              </h3>
              <p className="text-sm text-gray-600">
                تخصيص رسالة المشاركة والرابط للشركاء
              </p>
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 opacity-50">
              <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center mb-4">
                <Megaphone className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">الحملات الإعلانية</h3>
              <p className="text-sm text-gray-600">إدارة الحملات التسويقية على منصات التواصل الاجتماعي</p>
              <span className="inline-block mt-2 text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded">قريباً</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 opacity-50">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">تحليل الأداء</h3>
              <p className="text-sm text-gray-600">متابعة نتائج الحملات ومعدلات التحويل</p>
              <span className="inline-block mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">قريباً</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-12 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Users className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">نظام التسويق بالمؤثرين مفعّل</h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              يمكنك الآن إدارة شركاء المسيرة وتتبع أدائهم من خلال قسم "شركاء المسيرة"
            </p>
            <button
              onClick={() => setActiveTab('influencers')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              الانتقال إلى إدارة الشركاء
            </button>
          </div>
        </div>
      )}

      {activeTab === 'influencers' && <InfluencerPartnersManager />}

      {activeTab === 'featured' && <FeaturedPackageManager />}

      {activeTab === 'settings' && <InfluencerSettingsManager />}

      {activeTab === 'share-message' && <PartnerShareMessageManager />}
    </div>
  );
};

export default MarketingManagement;
