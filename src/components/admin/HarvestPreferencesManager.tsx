import { useState, useEffect } from 'react';
import { Gift, Heart, Home, CheckCircle, Clock, XCircle, Play, Eye, X, Search, Filter } from 'lucide-react';
import { harvestPreferencesService, type HarvestPreference } from '../../services/harvestPreferencesService';

export default function HarvestPreferencesManager() {
  const [preferences, setPreferences] = useState<HarvestPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPreference, setSelectedPreference] = useState<HarvestPreference | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingNotes, setProcessingNotes] = useState('');

  const preferenceTypes = [
    { value: 'personal_use', label: 'استفادة شخصية', icon: Home, color: 'blue' },
    { value: 'gift', label: 'إهداء', icon: Gift, color: 'pink' },
    { value: 'charity', label: 'صدقة', icon: Heart, color: 'green' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'قيد الانتظار', icon: Clock, color: 'yellow' },
    { value: 'in_progress', label: 'قيد المعالجة', icon: Play, color: 'blue' },
    { value: 'completed', label: 'مكتمل', icon: CheckCircle, color: 'green' },
    { value: 'cancelled', label: 'ملغي', icon: XCircle, color: 'red' }
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const data = await harvestPreferencesService.getAllPreferences();
      setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (preferenceId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      await harvestPreferencesService.updatePreferenceStatus(preferenceId, newStatus, processingNotes);
      await loadPreferences();
      setSelectedPreference(null);
      setProcessingNotes('');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const getTypeIcon = (type: string) => {
    const typeObj = preferenceTypes.find(t => t.value === type);
    const Icon = typeObj?.icon || Home;
    return <Icon className="w-5 h-5" />;
  };

  const getTypeColor = (type: string) => {
    const typeObj = preferenceTypes.find(t => t.value === type);
    return typeObj?.color || 'gray';
  };

  const getTypeLabel = (type: string) => {
    return preferenceTypes.find(t => t.value === type)?.label || type;
  };

  const getStatusIcon = (status: string) => {
    const statusObj = statusOptions.find(s => s.value === status);
    const Icon = statusObj?.icon || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj?.color || 'gray';
  };

  const getStatusLabel = (status: string) => {
    return statusOptions.find(s => s.value === status)?.label || status;
  };

  const filteredPreferences = preferences.filter(pref => {
    const matchesStatus = filterStatus === 'all' || pref.status === filterStatus;
    const matchesType = filterType === 'all' || pref.preference_type === filterType;
    const matchesSearch = !searchTerm ||
      pref.investor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pref.farm_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pref.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">إدارة اختيارات المحصول</h2>
        <p className="text-sm text-gray-600 mt-1">متابعة ومعالجة طلبات المزارعين للمحصول</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن مزارع، مزرعة، أو مستلم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-2">
          <span className="text-sm font-semibold text-gray-700 py-2">النوع:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
              filterType === 'all'
                ? 'bg-[#D4AF37] text-white border-[#D4AF37]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#D4AF37]'
            }`}
          >
            الكل
          </button>
          {preferenceTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
                filterType === type.value
                  ? `bg-${type.color}-500 text-white border-${type.color}-500`
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="w-px bg-gray-300"></div>

        <div className="flex gap-2">
          <span className="text-sm font-semibold text-gray-700 py-2">الحالة:</span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
              filterStatus === 'all'
                ? 'bg-[#D4AF37] text-white border-[#D4AF37]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#D4AF37]'
            }`}
          >
            الكل
          </button>
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => setFilterStatus(status.value)}
              className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
                filterStatus === status.value
                  ? `bg-${status.color}-500 text-white border-${status.color}-500`
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPreferences.map((preference) => (
          <div
            key={preference.id}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full bg-${getTypeColor(preference.preference_type)}-100 flex items-center justify-center text-${getTypeColor(preference.preference_type)}-600`}>
                    {getTypeIcon(preference.preference_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-800">
                        {getTypeLabel(preference.preference_type)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${getStatusColor(preference.status)}-100 text-${getStatusColor(preference.status)}-700 flex items-center gap-1`}>
                        {getStatusIcon(preference.status)}
                        {getStatusLabel(preference.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{new Date(preference.created_at).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">المزارع</p>
                    <p className="text-sm font-semibold text-gray-800">{preference.investor_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">المزرعة</p>
                    <p className="text-sm font-semibold text-gray-800">{preference.farm_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">عدد الأشجار</p>
                    <p className="text-sm font-semibold text-gray-800">{preference.trees_count} شجرة</p>
                  </div>
                </div>

                {preference.preference_type === 'gift' && (
                  <div className="bg-pink-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-pink-900">
                      <strong>المستلم:</strong> {preference.recipient_name}
                      {preference.recipient_phone && <> - {preference.recipient_phone}</>}
                    </p>
                    {preference.recipient_address && (
                      <p className="text-sm text-pink-900 mt-1">
                        <strong>العنوان:</strong> {preference.recipient_address}
                      </p>
                    )}
                  </div>
                )}

                {preference.preference_type === 'charity' && preference.charity_name && (
                  <div className="bg-green-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-green-900">
                      <strong>الجمعية:</strong> {preference.charity_name}
                    </p>
                  </div>
                )}

                {preference.special_instructions && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700">
                      <strong>تعليمات خاصة:</strong> {preference.special_instructions}
                    </p>
                  </div>
                )}

                {preference.processing_notes && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-900">
                      <strong>ملاحظات المعالجة:</strong> {preference.processing_notes}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedPreference(preference)}
                className="text-[#D4AF37] hover:text-[#B8942F] p-2"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {filteredPreferences.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Gift className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>لا توجد اختيارات مسجلة</p>
          </div>
        )}
      </div>

      {selectedPreference && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8942F] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold">تحديث حالة الطلب</h3>
              <button onClick={() => setSelectedPreference(null)} className="text-white hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الحالة الجديدة</label>
                <div className="grid grid-cols-2 gap-3">
                  {statusOptions.map((status) => {
                    const Icon = status.icon;
                    return (
                      <button
                        key={status.value}
                        onClick={() => handleStatusUpdate(selectedPreference.id, status.value as any)}
                        className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                          selectedPreference.status === status.value
                            ? `bg-${status.color}-100 border-${status.color}-500`
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 text-${status.color}-600`} />
                        <p className="text-sm font-semibold text-gray-700">{status.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ملاحظات المعالجة</label>
                <textarea
                  value={processingNotes}
                  onChange={(e) => setProcessingNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  rows={4}
                  placeholder="أضف ملاحظات حول معالجة الطلب..."
                />
              </div>

              <button
                onClick={() => setSelectedPreference(null)}
                className="w-full py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
