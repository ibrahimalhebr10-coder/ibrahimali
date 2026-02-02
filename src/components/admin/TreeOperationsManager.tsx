import { useState, useEffect } from 'react';
import { Droplets, Wrench, Scissors, Apple, Plus, X, Upload, Image, Video, Calendar, DollarSign, FileText, User, MapPin, Search, Filter, Eye, Sparkles } from 'lucide-react';
import { treeOperationsService, type TreeOperation, type CreateTreeOperationInput } from '../../services/treeOperationsService';
import { supabase } from '../../lib/supabase';

interface TreeOperationsManagerProps {
  farmId?: string;
}

export default function TreeOperationsManager({ farmId }: TreeOperationsManagerProps) {
  const [operations, setOperations] = useState<TreeOperation[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<TreeOperation | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateTreeOperationInput>({
    farm_id: farmId || '',
    investor_id: '',
    operation_type: 'irrigation',
    operation_date: new Date().toISOString().split('T')[0],
    trees_count: 0,
    total_cost: 0,
    notes: '',
    status_report: ''
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const operationTypes = [
    { value: 'irrigation', label: 'ري', icon: Droplets, color: 'blue' },
    { value: 'maintenance', label: 'صيانة', icon: Wrench, color: 'amber' },
    { value: 'pruning', label: 'تقليم', icon: Scissors, color: 'green' },
    { value: 'harvest', label: 'حصاد', icon: Apple, color: 'red' }
  ];

  useEffect(() => {
    loadData();
  }, [farmId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (farmId) {
        const ops = await treeOperationsService.getOperationsByFarm(farmId);
        setOperations(ops);
      } else {
        const { data: allOps } = await supabase
          .from('tree_operations')
          .select(`
            *,
            users:investor_id(full_name),
            farms:farm_id(name),
            media:tree_operation_media(*)
          `)
          .order('operation_date', { ascending: false });

        setOperations((allOps || []).map(op => ({
          ...op,
          investor_name: op.users?.full_name,
          farm_name: op.farms?.name
        })));
      }

      const { data: investorsData } = await supabase
        .from('reservations')
        .select('user_id, users:user_id(id, full_name)')
        .eq('status', 'confirmed');

      const uniqueInvestors = Array.from(
        new Map(
          (investorsData || [])
            .filter(r => r.users)
            .map(r => [r.users.id, { id: r.users.id, full_name: r.users.full_name }])
        ).values()
      );
      setInvestors(uniqueInvestors);

      const { data: farmsData } = await supabase
        .from('farms')
        .select('id, name')
        .order('name');
      setFarms(farmsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const operation = await treeOperationsService.createOperation(formData);

      if (mediaFiles.length > 0) {
        setUploading(true);
        for (const file of mediaFiles) {
          try {
            const mediaUrl = await treeOperationsService.uploadMediaFile(file, operation.id);
            await treeOperationsService.addMedia({
              operation_id: operation.id,
              media_type: file.type.startsWith('video/') ? 'video' : 'photo',
              media_url: mediaUrl
            });
          } catch (error) {
            console.error('Error uploading media:', error);
          }
        }
        setUploading(false);
      }

      await loadData();
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error('Error creating operation:', error);
      alert('حدث خطأ أثناء إضافة العملية');
    }
  };

  const resetForm = () => {
    setFormData({
      farm_id: farmId || '',
      investor_id: '',
      operation_type: 'irrigation',
      operation_date: new Date().toISOString().split('T')[0],
      trees_count: 0,
      total_cost: 0,
      notes: '',
      status_report: ''
    });
    setMediaFiles([]);
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const getTypeIcon = (type: string) => {
    const typeObj = operationTypes.find(t => t.value === type);
    const Icon = typeObj?.icon || Droplets;
    return <Icon className="w-5 h-5" />;
  };

  const getTypeColor = (type: string) => {
    const typeObj = operationTypes.find(t => t.value === type);
    return typeObj?.color || 'gray';
  };

  const filteredOperations = operations.filter(op => {
    const matchesType = filterType === 'all' || op.operation_type === filterType;
    const matchesSearch = !searchTerm ||
      op.investor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.farm_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">متابعة العمليات الزراعية</h2>
          <p className="text-sm text-gray-600 mt-1">تسجيل ومتابعة جميع العمليات على الأشجار</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8942F] transition-all"
        >
          <Plus className="w-5 h-5" />
          إضافة عملية جديدة
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن مزارع أو مزرعة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              filterType === 'all'
                ? 'bg-[#D4AF37] text-white border-[#D4AF37]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#D4AF37]'
            }`}
          >
            الكل
          </button>
          {operationTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                filterType === type.value
                  ? `bg-${type.color}-500 text-white border-${type.color}-500`
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredOperations.map((operation) => (
          <div
            key={operation.id}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full bg-${getTypeColor(operation.operation_type)}-100 flex items-center justify-center text-${getTypeColor(operation.operation_type)}-600`}>
                    {getTypeIcon(operation.operation_type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {operationTypes.find(t => t.value === operation.operation_type)?.label}
                    </h3>
                    <p className="text-sm text-gray-600">{new Date(operation.operation_date).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="flex flex-col">
                      <span className="text-gray-600">{operation.investor_name}</span>
                      {operation.farm_nickname && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {operation.farm_nickname}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{operation.farm_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Apple className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{operation.trees_count} شجرة</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{operation.total_cost} ر.س</span>
                  </div>
                </div>

                {operation.notes && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700"><strong>ملاحظات:</strong> {operation.notes}</p>
                  </div>
                )}

                {operation.status_report && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-blue-900"><strong>تقرير الحالة:</strong> {operation.status_report}</p>
                  </div>
                )}

                {operation.media && operation.media.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {operation.media.map((media) => (
                      <div key={media.id} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                        {media.media_type === 'photo' ? (
                          <img src={media.media_url} alt="Operation" className="w-full h-full object-cover" />
                        ) : (
                          <video src={media.media_url} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedOperation(operation)}
                className="text-[#D4AF37] hover:text-[#B8942F] p-2"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {filteredOperations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Apple className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>لا توجد عمليات مسجلة</p>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">إضافة عملية جديدة</h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المزرعة</label>
                  <select
                    value={formData.farm_id}
                    onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    required
                  >
                    <option value="">اختر المزرعة</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المزارع</label>
                  <select
                    value={formData.investor_id}
                    onChange={(e) => setFormData({ ...formData, investor_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    required
                  >
                    <option value="">اختر المزارع</option>
                    {investors.map((investor) => (
                      <option key={investor.id} value={investor.id}>{investor.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">نوع العملية</label>
                  <select
                    value={formData.operation_type}
                    onChange={(e) => setFormData({ ...formData, operation_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    required
                  >
                    {operationTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">تاريخ العملية</label>
                  <input
                    type="date"
                    value={formData.operation_date}
                    onChange={(e) => setFormData({ ...formData, operation_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">عدد الأشجار</label>
                  <input
                    type="number"
                    value={formData.trees_count}
                    onChange={(e) => setFormData({ ...formData, trees_count: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">التكلفة الإجمالية (ر.س)</label>
                  <input
                    type="number"
                    value={formData.total_cost}
                    onChange={(e) => setFormData({ ...formData, total_cost: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">تقرير الحالة</label>
                <textarea
                  value={formData.status_report}
                  onChange={(e) => setFormData({ ...formData, status_report: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">صور/فيديوهات</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#D4AF37] transition-all">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaSelect}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">انقر لرفع الصور أو الفيديوهات</p>
                    {mediaFiles.length > 0 && (
                      <p className="text-xs text-[#D4AF37] mt-2">{mediaFiles.length} ملف محدد</p>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-[#D4AF37] text-white py-3 rounded-lg font-semibold hover:bg-[#B8942F] transition-all disabled:opacity-50"
                >
                  {uploading ? 'جاري الرفع...' : 'حفظ العملية'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
