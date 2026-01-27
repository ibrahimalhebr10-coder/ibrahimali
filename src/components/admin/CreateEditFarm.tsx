import { useState, useEffect, useRef } from 'react';
import { X, Save, Upload, Plus, Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { supabase } from '../../lib/supabase';

interface CreateEditFarmProps {
  farmId: string | null;
  onClose: () => void;
}

interface TreeTypeData {
  id: string;
  name: string;
  subtitle: string;
  count: number;
  base_price: number;
  maintenance_fee: number;
}

interface ContractData {
  id: string;
  contract_name: string;
  duration_years: number;
  investor_price: number;
  bonus_years: number;
  has_bonus_years: boolean;
  is_active: boolean;
  display_order: number;
}

export default function CreateEditFarm({ farmId, onClose }: CreateEditFarmProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category_slug: 'olive',
    location: '',
    area_size: '',
    status: 'active' as 'active' | 'upcoming' | 'closed',
    image: '',
    hero_image: '',
    marketing_text: '',
    total_trees: 0,
    video_url: '',
    video_title: 'شاهد جولة المزرعة',
    map_url: '',
    order_index: 0,
    description: '',
    first_year_maintenance_free: true
  });
  const [treeTypes, setTreeTypes] = useState<TreeTypeData[]>([]);
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const heroImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (farmId) {
      loadFarm();
    }
  }, [farmId]);

  async function loadFarm() {
    setLoading(true);
    const farm = await adminService.getFarmById(farmId!);
    if (farm) {
      setFormData({
        name: farm.name || '',
        category_slug: farm.category_slug || 'olive',
        location: farm.location || '',
        area_size: farm.area_size || '',
        status: farm.status || 'active',
        image: farm.image || '',
        hero_image: farm.hero_image || '',
        marketing_text: farm.marketing_text || '',
        total_trees: farm.total_trees || 0,
        video_url: farm.video_url || '',
        video_title: farm.video_title || 'شاهد جولة المزرعة',
        map_url: farm.map_url || '',
        order_index: farm.order_index || 0,
        description: farm.description || '',
        first_year_maintenance_free: farm.first_year_maintenance_free ?? true
      });

      if (farm.tree_types && Array.isArray(farm.tree_types)) {
        const cleanedTreeTypes = farm.tree_types.map((tree: any) => ({
          id: tree.id || `tree-${Date.now()}-${Math.random()}`,
          name: tree.name || '',
          subtitle: tree.subtitle || '',
          count: tree.count || tree.available || 0,
          base_price: tree.base_price || tree.price || 0,
          maintenance_fee: tree.maintenance_fee || tree.operatingFee || 0
        }));
        setTreeTypes(cleanedTreeTypes);
      }

      if (farm.contracts && Array.isArray(farm.contracts)) {
        const cleanedContracts = farm.contracts.map((contract: any) => ({
          ...contract,
          has_bonus_years: contract.has_bonus_years ?? (contract.bonus_years > 0)
        }));
        setContracts(cleanedContracts);
      }
    }
    setLoading(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `farm-${Date.now()}.${fileExt}`;
      const filePath = `farms/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('farm-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('not found')) {
          alert('التخزين غير متاح. سيتم استخدام رابط URL مؤقتاً.');
          console.error('Storage bucket not found:', uploadError);
        } else {
          throw uploadError;
        }
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('farm-images')
          .getPublicUrl(filePath);

        setFormData({ ...formData, image: publicUrl });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('يرجى اختيار ملف فيديو');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert('حجم الفيديو يجب أن يكون أقل من 100 ميجابايت');
      return;
    }

    setUploadingVideo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `farm-video-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('farm-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('not found')) {
          alert('التخزين غير متاح. سيتم استخدام رابط URL مؤقتاً.');
          console.error('Storage bucket not found:', uploadError);
        } else {
          throw uploadError;
        }
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('farm-videos')
          .getPublicUrl(filePath);

        setFormData({ ...formData, video_url: publicUrl });
        alert('تم رفع الفيديو بنجاح! الفيديو سيتم تشغيله مباشرة داخل التطبيق.');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('حدث خطأ أثناء رفع الفيديو');
    } finally {
      setUploadingVideo(false);
    }
  }

  async function handleHeroImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploadingHeroImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `farm-hero-${Date.now()}.${fileExt}`;
      const filePath = `farms/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('farm-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('farm-images')
        .getPublicUrl(filePath);

      if (publicUrl) {
        setFormData({ ...formData, hero_image: publicUrl });
      }
    } catch (error) {
      console.error('Error uploading hero image:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingHeroImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const totalTreeCount = treeTypes.reduce((sum, tree) => sum + (tree.count || 0), 0);

      if (totalTreeCount > formData.total_trees) {
        alert(`مجموع أعداد أنواع الأشجار (${totalTreeCount}) يتجاوز إجمالي عدد أشجار المزرعة (${formData.total_trees}). يرجى تعديل الأعداد.`);
        setSaving(false);
        return;
      }

      const farmDataToSave = {
        ...formData,
        tree_types: treeTypes,
        contracts: contracts
      };

      let result;
      if (farmId) {
        result = await adminService.updateFarm(farmId, farmDataToSave);
      } else {
        result = await adminService.createFarm(farmDataToSave);
      }

      if (result.success) {
        onClose();
      } else {
        alert('حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving farm:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  }

  function addTreeType() {
    setTreeTypes([...treeTypes, {
      id: `tree-${Date.now()}-${Math.random()}`,
      name: '',
      subtitle: '',
      count: 0,
      base_price: 0,
      maintenance_fee: 0
    }]);
  }

  function removeTreeType(index: number) {
    setTreeTypes(treeTypes.filter((_, i) => i !== index));
  }

  function updateTreeType(index: number, field: keyof TreeTypeData, value: any) {
    const updated = [...treeTypes];
    updated[index] = { ...updated[index], [field]: value };
    setTreeTypes(updated);
  }

  function addContract() {
    setContracts([...contracts, {
      id: `contract-${Date.now()}-${Math.random()}`,
      contract_name: '',
      duration_years: 1,
      investor_price: 0,
      bonus_years: 0,
      has_bonus_years: false,
      is_active: true,
      display_order: contracts.length
    }]);
  }

  function removeContract(index: number) {
    setContracts(contracts.filter((_, i) => i !== index));
  }

  function updateContract(index: number, field: keyof ContractData, value: any) {
    const updated = [...contracts];
    updated[index] = { ...updated[index], [field]: value };
    setContracts(updated);
  }

  const treeTypeSummary = treeTypes.map(t => t.name).filter(n => n).join(' • ') || 'لا توجد أنواع بعد';

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto">
      <div className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">
              {farmId ? 'تحرير المزرعة' : 'إنشاء مزرعة جديدة'}
            </h1>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              className="rounded-2xl p-6 space-y-5"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-white/10">
                1️⃣ البيانات العامة للمزرعة
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    اسم المزرعة *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl text-right"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }}
                    placeholder="مثال: مزرعة الزيتون الأخضر"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    المنطقة *
                  </label>
                  <select
                    value={formData.category_slug}
                    onChange={(e) => setFormData({ ...formData, category_slug: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl text-right"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }}
                  >
                    <option value="olive">زيتون</option>
                    <option value="palm">نخيل</option>
                    <option value="mixed">مزارع متنوعة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    الموقع النصي *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl text-right"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }}
                    placeholder="مثال: الجوف، السعودية"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    مساحة المزرعة
                  </label>
                  <input
                    type="text"
                    value={formData.area_size}
                    onChange={(e) => setFormData({ ...formData, area_size: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-right"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }}
                    placeholder="مثال: 50 هكتار"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  الحالة *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  required
                  className="w-full px-4 py-3 rounded-xl text-right"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                >
                  <option value="active">مفتوحة للحجز</option>
                  <option value="upcoming">مغلقة</option>
                  <option value="closed">موقوفة</option>
                </select>
              </div>
            </div>

            <div
              className="rounded-2xl p-6 space-y-5"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-white/10">
                2️⃣ بيانات بطاقة المزرعة
              </h2>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  صورة رئيسية *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full px-4 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2"
                      style={{
                        background: uploading ? 'rgba(158, 158, 158, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                        border: '2px solid rgba(33, 150, 243, 0.5)',
                        color: '#2196F3'
                      }}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          <span>جاري الرفع...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>رفع من الجهاز</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl text-right"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        color: 'white'
                      }}
                      placeholder="أو أدخل رابط الصورة"
                    />
                  </div>
                </div>
                {formData.image && (
                  <div className="mt-3">
                    <img
                      src={formData.image}
                      alt="معاينة"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  نص دعائي قصير
                </label>
                <textarea
                  value={formData.marketing_text}
                  onChange={(e) => setFormData({ ...formData, marketing_text: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl text-right"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                  placeholder="نص تسويقي مختصر يظهر في البطاقة..."
                />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl" style={{
                background: 'rgba(58, 161, 126, 0.1)',
                border: '2px solid rgba(58, 161, 126, 0.3)'
              }}>
                <input
                  type="checkbox"
                  id="first_year_maintenance_free"
                  checked={formData.first_year_maintenance_free}
                  onChange={(e) => setFormData({ ...formData, first_year_maintenance_free: e.target.checked })}
                  className="w-5 h-5 rounded cursor-pointer"
                  style={{
                    accentColor: '#3AA17E'
                  }}
                />
                <label
                  htmlFor="first_year_maintenance_free"
                  className="text-sm font-semibold text-white cursor-pointer flex-1"
                >
                  ✨ التشغيل والصيانة للسنة الأولى مجاناً
                  <span className="block text-xs text-white/60 mt-1">
                    عند التفعيل، سيتم عرض "التشغيل والصيانة للسنة الأولى مجاناً" مع إظهار قيمة رسوم التشغيل والصيانة للمستثمر
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  عرض مختصر لأنواع الأشجار (قراءة فقط)
                </label>
                <div
                  className="w-full px-4 py-3 rounded-xl text-right text-sm text-white/60 italic"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '2px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  {treeTypeSummary}
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl p-6 space-y-5"
              style={{
                background: 'linear-gradient(145deg, rgba(139, 195, 74, 0.08), rgba(76, 175, 80, 0.05))',
                border: '2px solid rgba(139, 195, 74, 0.2)'
              }}
            >
              <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-green-400/20 flex items-center gap-2">
                <span className="text-2xl">🖼️</span>
                صفحة المزرعة
              </h2>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  صورة أعلى صفحة المزرعة
                  <span className="text-xs text-white/60 block mt-1">هذه الصورة ستظهر مصغرة في أعلى صفحة المزرعة</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      ref={heroImageInputRef}
                      type="file"
                      onChange={handleHeroImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => heroImageInputRef.current?.click()}
                      disabled={uploadingHeroImage}
                      className="w-full px-4 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2"
                      style={{
                        background: uploadingHeroImage ? 'rgba(158, 158, 158, 0.2)' : 'rgba(139, 195, 74, 0.2)',
                        border: '2px solid rgba(139, 195, 74, 0.5)',
                        color: '#8BC34A'
                      }}
                    >
                      {uploadingHeroImage ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                          <span>جاري الرفع...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>رفع صورة Hero</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <input
                      type="url"
                      value={formData.hero_image}
                      onChange={(e) => setFormData({ ...formData, hero_image: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-right"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        color: 'white'
                      }}
                      placeholder="أو أدخل رابط URL للصورة"
                    />
                  </div>
                </div>

                {formData.hero_image && (
                  <div className="mt-3">
                    <img
                      src={formData.hero_image}
                      alt="Hero Preview"
                      className="w-full h-32 object-cover rounded-lg border-2 border-green-400/30"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  عنوان زر الفيديو
                  <span className="text-xs text-white/60 block mt-1">النص الذي سيظهر على زر الفيديو تحت الصورة</span>
                </label>
                <input
                  type="text"
                  value={formData.video_title}
                  onChange={(e) => setFormData({ ...formData, video_title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-right"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                  placeholder="مثال: شاهد جولة المزرعة"
                />
              </div>
            </div>

            <div
              className="rounded-2xl p-6 space-y-4"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">
                  3️⃣ أنواع الأشجار
                </h2>
                <button
                  type="button"
                  onClick={addTreeType}
                  className="px-4 py-2 rounded-xl font-bold text-white transition-all duration-300 flex items-center gap-2"
                  style={{
                    background: 'linear-gradient(145deg, #3AA17E, #2D8B6A)'
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة نوع</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  إجمالي عدد أشجار المزرعة *
                </label>
                <input
                  type="number"
                  value={formData.total_trees}
                  onChange={(e) => setFormData({ ...formData, total_trees: parseInt(e.target.value) || 0 })}
                  required
                  min="0"
                  className="w-full px-4 py-3 rounded-xl text-right"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                />
              </div>

              {treeTypes.map((tree, index) => (
                <div
                  key={tree.id}
                  className="p-4 rounded-xl space-y-3"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-white/60 mb-1">
                        اسم الشجرة *
                      </label>
                      <input
                        type="text"
                        value={tree.name}
                        onChange={(e) => updateTreeType(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-right text-sm"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                        placeholder="مثال: زيتون زيتي"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-white/60 mb-1">
                        العنوان الفرعي
                      </label>
                      <input
                        type="text"
                        value={tree.subtitle}
                        onChange={(e) => updateTreeType(index, 'subtitle', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-right text-sm"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                        placeholder="وصف مختصر"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/60 mb-1">
                        العدد *
                      </label>
                      <input
                        type="number"
                        value={tree.count}
                        onChange={(e) => updateTreeType(index, 'count', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 rounded-lg text-right text-sm"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-white/60 mb-1">
                        السعر الأساسي (ريال) *
                      </label>
                      <input
                        type="number"
                        value={tree.base_price}
                        onChange={(e) => updateTreeType(index, 'base_price', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg text-right text-sm"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/60 mb-1">
                        رسوم التشغيل والصيانة السنوية (ريال) *
                      </label>
                      <input
                        type="number"
                        value={tree.maintenance_fee}
                        onChange={(e) => updateTreeType(index, 'maintenance_fee', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg text-right text-sm"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                        placeholder="مثال: 19"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-white/60 mb-1">
                        حذف
                      </label>
                      <button
                        type="button"
                        onClick={() => removeTreeType(index)}
                        className="w-full px-3 py-2 rounded-lg font-bold text-white transition-all duration-300"
                        style={{
                          background: 'linear-gradient(145deg, #F44336, #D32F2F)'
                        }}
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {treeTypes.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  لم يتم إضافة أنواع أشجار بعد
                </div>
              )}

              {treeTypes.length > 0 && (
                <div
                  className="p-4 rounded-xl mt-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `2px solid ${(() => {
                      const total = treeTypes.reduce((sum, tree) => sum + (tree.count || 0), 0);
                      if (total > formData.total_trees) return '#F44336';
                      if (total === formData.total_trees) return '#3AA17E';
                      return 'rgba(255, 255, 255, 0.1)';
                    })()}`
                  }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-white">
                      مجموع أعداد الأشجار: {treeTypes.reduce((sum, tree) => sum + (tree.count || 0), 0)}
                    </span>
                    <span className="font-bold text-white/60">
                      من إجمالي: {formData.total_trees}
                    </span>
                  </div>
                  {(() => {
                    const total = treeTypes.reduce((sum, tree) => sum + (tree.count || 0), 0);
                    if (total > formData.total_trees) {
                      return (
                        <div className="mt-2 text-xs text-red-400 font-semibold">
                          تحذير: المجموع يتجاوز الإجمالي بمقدار {total - formData.total_trees} شجرة
                        </div>
                      );
                    }
                    if (total === formData.total_trees) {
                      return (
                        <div className="mt-2 text-xs text-green-400 font-semibold">
                          ممتاز: تم توزيع جميع الأشجار
                        </div>
                      );
                    }
                    return (
                      <div className="mt-2 text-xs text-white/40 font-semibold">
                        متبقي: {formData.total_trees - total} شجرة
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div
              className="rounded-2xl p-6 space-y-4"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">
                  4️⃣ العقود / مدد الإيجار
                </h2>
                <button
                  type="button"
                  onClick={addContract}
                  className="px-4 py-2 rounded-xl font-bold text-white transition-all duration-300 flex items-center gap-2"
                  style={{
                    background: 'linear-gradient(145deg, #3AA17E, #2D8B6A)'
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة عقد</span>
                </button>
              </div>

              {contracts.map((contract, index) => (
                <div
                  key={contract.id}
                  className="p-4 rounded-xl space-y-3"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-white/60 mb-1">
                        اسم العقد / العرض *
                      </label>
                      <input
                        type="text"
                        value={contract.contract_name}
                        onChange={(e) => updateContract(index, 'contract_name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-right text-sm"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                        placeholder="مثال: عقد 3 سنوات + 7 مجاناً"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/60 mb-1">
                        مدة العقد المدفوعة (سنوات) *
                      </label>
                      <input
                        type="number"
                        value={contract.duration_years}
                        onChange={(e) => updateContract(index, 'duration_years', parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-full px-3 py-2 rounded-lg text-right text-sm"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-white/60 mb-1">
                        سعر الشجرة (قيمة ثابتة) *
                      </label>
                      <input
                        type="number"
                        value={contract.investor_price}
                        onChange={(e) => updateContract(index, 'investor_price', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg text-right text-sm"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                        placeholder="مثال: 300 أو 490"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl" style={{
                    background: contract.has_bonus_years ? 'rgba(58, 161, 126, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: contract.has_bonus_years ? '2px solid rgba(58, 161, 126, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        id={`bonus-toggle-${index}`}
                        checked={contract.has_bonus_years}
                        onChange={(e) => {
                          const isEnabled = e.target.checked;
                          updateContract(index, 'has_bonus_years', isEnabled);
                          if (!isEnabled) {
                            updateContract(index, 'bonus_years', 0);
                          }
                        }}
                        className="w-5 h-5 rounded cursor-pointer"
                        style={{
                          accentColor: '#3AA17E'
                        }}
                      />
                      <label
                        htmlFor={`bonus-toggle-${index}`}
                        className="text-sm font-bold text-white cursor-pointer flex-1"
                      >
                        🎁 تفعيل سنوات مجانية كميزة عرض
                        <span className="block text-xs text-white/60 mt-0.5">
                          السنوات المجانية لا تدخل في أي حساب وهي ميزة تسويقية فقط
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/60 mb-1">
                        عدد السنوات المجانية
                      </label>
                      <input
                        type="number"
                        value={contract.bonus_years}
                        onChange={(e) => updateContract(index, 'bonus_years', parseInt(e.target.value) || 0)}
                        disabled={!contract.has_bonus_years}
                        min="0"
                        className="w-full px-3 py-2 rounded-lg text-right text-sm"
                        style={{
                          background: contract.has_bonus_years ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: contract.has_bonus_years ? 'white' : 'rgba(255, 255, 255, 0.3)',
                          cursor: contract.has_bonus_years ? 'text' : 'not-allowed'
                        }}
                        placeholder={contract.has_bonus_years ? "مثال: 3 أو 7" : "معطل"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contract.is_active}
                          onChange={(e) => updateContract(index, 'is_active', e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-white font-semibold">مفعل</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/60 mb-1">
                        ترتيب العرض
                      </label>
                      <input
                        type="number"
                        value={contract.display_order}
                        onChange={(e) => updateContract(index, 'display_order', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 rounded-lg text-right text-sm"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/60 mb-1">
                        حذف
                      </label>
                      <button
                        type="button"
                        onClick={() => removeContract(index)}
                        className="w-full px-3 py-2 rounded-lg font-bold text-white transition-all duration-300"
                        style={{
                          background: 'linear-gradient(145deg, #F44336, #D32F2F)'
                        }}
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {contracts.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  لم يتم إضافة عقود بعد
                </div>
              )}
            </div>

            <div
              className="rounded-2xl p-6 space-y-5"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-white/10">
                5️⃣ صفحة المزرعة
              </h2>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  الوصف التفصيلي *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-right"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                  placeholder="وصف تفصيلي للمزرعة..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    فيديو المزرعة
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="file"
                        ref={videoFileInputRef}
                        onChange={handleVideoUpload}
                        accept="video/mp4,video/quicktime,video/webm"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => videoFileInputRef.current?.click()}
                        disabled={uploadingVideo}
                        className="w-full px-4 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2"
                        style={{
                          background: uploadingVideo ? 'rgba(158, 158, 158, 0.2)' : 'rgba(139, 116, 71, 0.2)',
                          border: '2px solid rgba(139, 116, 71, 0.5)',
                          color: '#8B7447'
                        }}
                      >
                        {uploadingVideo ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
                            <span className="text-xs">جاري الرفع...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            <span className="text-xs">رفع فيديو</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div>
                      <input
                        type="url"
                        value={formData.video_url}
                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-right"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '2px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                        placeholder="أو رابط YouTube"
                      />
                    </div>
                  </div>
                  {formData.video_url && (
                    <div className="mt-2 p-3 rounded-xl" style={{
                      background: 'rgba(139, 116, 71, 0.1)',
                      border: '1px solid rgba(139, 116, 71, 0.3)'
                    }}>
                      {formData.video_url.includes('supabase') ? (
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <span>✓</span>
                          <span>فيديو محمّل - سيتم التشغيل مباشرة داخل التطبيق</span>
                        </div>
                      ) : (
                        <div className="text-xs text-white/60">
                          رابط: {formData.video_url.substring(0, 50)}...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    رابط موقع المزرعة (Google Earth / Maps)
                  </label>
                  <input
                    type="url"
                    value={formData.map_url}
                    onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-right"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }}
                    placeholder="https://earth.google.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  ترتيب العرض
                </label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-3 rounded-xl text-right"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(145deg, #3AA17E, #2D8B6A)',
                  boxShadow: '0 4px 12px rgba(58, 161, 126, 0.4)'
                }}
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{farmId ? 'حفظ التغييرات' : 'إنشاء المزرعة'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-4 rounded-xl font-bold transition-all duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
