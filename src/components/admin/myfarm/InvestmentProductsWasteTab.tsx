import React, { useState, useEffect } from 'react';
import { Plus, Apple, Droplet, Scissors, Trash, Edit2, Trash2 as TrashIcon, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Product {
  id: string;
  user_id: string;
  asset_id: string | null;
  product_type: 'ثمار' | 'زيوت' | 'مخلفات تقليم' | 'مخلفات عصر';
  harvest_date: string;
  value: number;
  value_unit: string;
  description: string | null;
  created_at: string;
}

interface Waste {
  id: string;
  user_id: string;
  asset_id: string | null;
  waste_type: 'مخلفات تقليم' | 'مخلفات عصر' | 'أخرى';
  collection_date: string;
  value: number;
  value_unit: string;
  description: string | null;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface Asset {
  id: string;
  tree_type: string;
}

type TabType = 'products' | 'waste';

const InvestmentProductsWasteTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [wastes, setWastes] = useState<Waste[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [productFormData, setProductFormData] = useState({
    asset_id: '',
    product_type: 'ثمار' as Product['product_type'],
    harvest_date: new Date().toISOString().split('T')[0],
    value: 0,
    value_unit: 'كجم',
    description: '',
  });

  const [wasteFormData, setWasteFormData] = useState({
    asset_id: '',
    waste_type: 'مخلفات تقليم' as Waste['waste_type'],
    collection_date: new Date().toISOString().split('T')[0],
    value: 0,
    value_unit: 'كجم',
    description: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadAssets();
      loadProducts();
      loadWastes();
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .order('full_name');
    if (data) setUsers(data);
  };

  const loadAssets = async () => {
    if (!selectedUserId) return;
    const { data } = await supabase
      .from('investment_agricultural_assets')
      .select('id, tree_type')
      .eq('user_id', selectedUserId);
    if (data) setAssets(data);
  };

  const loadProducts = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    const { data } = await supabase
      .from('investment_products_yields')
      .select('*')
      .eq('user_id', selectedUserId)
      .order('harvest_date', { ascending: false });

    if (data) setProducts(data);
    setLoading(false);
  };

  const loadWastes = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    const { data } = await supabase
      .from('investment_waste_yields')
      .select('*')
      .eq('user_id', selectedUserId)
      .order('collection_date', { ascending: false });

    if (data) setWastes(data);
    setLoading(false);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const payload = {
      ...productFormData,
      user_id: selectedUserId,
      asset_id: productFormData.asset_id || null,
    };

    if (editingId) {
      await supabase
        .from('investment_products_yields')
        .update(payload)
        .eq('id', editingId);
    } else {
      await supabase
        .from('investment_products_yields')
        .insert([payload]);
    }

    resetForm();
    loadProducts();
  };

  const handleWasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const payload = {
      ...wasteFormData,
      user_id: selectedUserId,
      asset_id: wasteFormData.asset_id || null,
    };

    if (editingId) {
      await supabase
        .from('investment_waste_yields')
        .update(payload)
        .eq('id', editingId);
    } else {
      await supabase
        .from('investment_waste_yields')
        .insert([payload]);
    }

    resetForm();
    loadWastes();
  };

  const handleEditProduct = (product: Product) => {
    setEditingId(product.id);
    setProductFormData({
      asset_id: product.asset_id || '',
      product_type: product.product_type,
      harvest_date: product.harvest_date,
      value: product.value,
      value_unit: product.value_unit,
      description: product.description || '',
    });
    setActiveTab('products');
    setShowAddForm(true);
  };

  const handleEditWaste = (waste: Waste) => {
    setEditingId(waste.id);
    setWasteFormData({
      asset_id: waste.asset_id || '',
      waste_type: waste.waste_type,
      collection_date: waste.collection_date,
      value: waste.value,
      value_unit: waste.value_unit,
      description: waste.description || '',
    });
    setActiveTab('waste');
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      await supabase
        .from('investment_products_yields')
        .delete()
        .eq('id', id);
      loadProducts();
    }
  };

  const handleDeleteWaste = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المخلفات؟')) {
      await supabase
        .from('investment_waste_yields')
        .delete()
        .eq('id', id);
      loadWastes();
    }
  };

  const resetForm = () => {
    setProductFormData({
      asset_id: '',
      product_type: 'ثمار',
      harvest_date: new Date().toISOString().split('T')[0],
      value: 0,
      value_unit: 'كجم',
      description: '',
    });
    setWasteFormData({
      asset_id: '',
      waste_type: 'مخلفات تقليم',
      collection_date: new Date().toISOString().split('T')[0],
      value: 0,
      value_unit: 'كجم',
      description: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const getProductIcon = (type: Product['product_type']) => {
    const icons = {
      'ثمار': Apple,
      'زيوت': Droplet,
      'مخلفات تقليم': Scissors,
      'مخلفات عصر': Trash,
    };
    return icons[type];
  };

  const getProductColor = (type: Product['product_type']) => {
    const colors = {
      'ثمار': 'bg-red-100 text-red-700',
      'زيوت': 'bg-amber-100 text-amber-700',
      'مخلفات تقليم': 'bg-green-100 text-green-700',
      'مخلفات عصر': 'bg-gray-100 text-gray-700',
    };
    return colors[type];
  };

  const getAssetName = (assetId: string | null) => {
    if (!assetId) return 'غير محدد';
    return assets.find(a => a.id === assetId)?.tree_type || 'غير محدد';
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  const filteredProducts = products.filter(p =>
    p.product_type.includes(searchQuery) || p.description?.includes(searchQuery)
  );

  const filteredWastes = wastes.filter(w =>
    w.waste_type.includes(searchQuery) || w.description?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-darkgreen">المنتجات والمخلفات</h2>
          <p className="text-gray-600 text-sm mt-1">تسجيل قيم المنتجات والمخلفات الزراعية</p>
        </div>
        {selectedUserId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة {activeTab === 'products' ? 'منتج' : 'مخلفات'}</span>
          </button>
        )}
      </div>

      {/* User Selector */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">اختر المستثمر</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          <option value="">-- اختر مستثمر --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {selectedUserId && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'products'
                  ? 'text-amber-700 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              المنتجات ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('waste')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'waste'
                  ? 'text-amber-700 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              المخلفات ({wastes.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : activeTab === 'products' ? (
            filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <Apple className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد منتجات مسجلة</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  إضافة أول منتج
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((product) => {
                  const ProductIcon = getProductIcon(product.product_type);
                  return (
                    <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getProductColor(product.product_type)}`}>
                            <ProductIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{product.product_type}</h3>
                            <p className="text-sm text-gray-600">{getAssetName(product.asset_id)}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-darkgreen">
                          {product.value} {product.value_unit}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(product.harvest_date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      {product.description && (
                        <p className="text-sm text-gray-600 mt-2">{product.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            filteredWastes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <Trash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد مخلفات مسجلة</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  إضافة أول مخلفات
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWastes.map((waste) => (
                  <div key={waste.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center">
                          <Trash className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{waste.waste_type}</h3>
                          <p className="text-sm text-gray-600">{getAssetName(waste.asset_id)}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditWaste(waste)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWaste(waste.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-darkgreen">
                        {waste.value} {waste.value_unit}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(waste.collection_date).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    {waste.description && (
                      <p className="text-sm text-gray-600 mt-2">{waste.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-darkgreen">
                {editingId ? 'تعديل' : 'إضافة'} {activeTab === 'products' ? 'منتج' : 'مخلفات'}
              </h3>
              {selectedUser && (
                <p className="text-sm text-gray-600 mt-1">
                  للمستثمر: {selectedUser.full_name}
                </p>
              )}
            </div>
            <form onSubmit={activeTab === 'products' ? handleProductSubmit : handleWasteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الأصل المرتبط</label>
                <select
                  value={activeTab === 'products' ? productFormData.asset_id : wasteFormData.asset_id}
                  onChange={(e) => {
                    if (activeTab === 'products') {
                      setProductFormData({ ...productFormData, asset_id: e.target.value });
                    } else {
                      setWasteFormData({ ...wasteFormData, asset_id: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">-- غير محدد --</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.tree_type}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === 'products' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع المنتج *</label>
                    <select
                      required
                      value={productFormData.product_type}
                      onChange={(e) => setProductFormData({ ...productFormData, product_type: e.target.value as Product['product_type'] })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="ثمار">ثمار</option>
                      <option value="زيوت">زيوت</option>
                      <option value="مخلفات تقليم">مخلفات تقليم</option>
                      <option value="مخلفات عصر">مخلفات عصر</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الحصاد *</label>
                    <input
                      type="date"
                      required
                      value={productFormData.harvest_date}
                      onChange={(e) => setProductFormData({ ...productFormData, harvest_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع المخلفات *</label>
                    <select
                      required
                      value={wasteFormData.waste_type}
                      onChange={(e) => setWasteFormData({ ...wasteFormData, waste_type: e.target.value as Waste['waste_type'] })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="مخلفات تقليم">مخلفات تقليم</option>
                      <option value="مخلفات عصر">مخلفات عصر</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الجمع *</label>
                    <input
                      type="date"
                      required
                      value={wasteFormData.collection_date}
                      onChange={(e) => setWasteFormData({ ...wasteFormData, collection_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">القيمة *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={activeTab === 'products' ? productFormData.value : wasteFormData.value}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      if (activeTab === 'products') {
                        setProductFormData({ ...productFormData, value });
                      } else {
                        setWasteFormData({ ...wasteFormData, value });
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوحدة *</label>
                  <select
                    required
                    value={activeTab === 'products' ? productFormData.value_unit : wasteFormData.value_unit}
                    onChange={(e) => {
                      if (activeTab === 'products') {
                        setProductFormData({ ...productFormData, value_unit: e.target.value });
                      } else {
                        setWasteFormData({ ...wasteFormData, value_unit: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="كجم">كجم</option>
                    <option value="لتر">لتر</option>
                    <option value="SAR">ريال سعودي</option>
                    <option value="طن">طن</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">وصف</label>
                <textarea
                  value={activeTab === 'products' ? productFormData.description : wasteFormData.description}
                  onChange={(e) => {
                    if (activeTab === 'products') {
                      setProductFormData({ ...productFormData, description: e.target.value });
                    } else {
                      setWasteFormData({ ...wasteFormData, description: e.target.value });
                    }
                  }}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="وصف إضافي..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                >
                  {editingId ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
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
};

export default InvestmentProductsWasteTab;
