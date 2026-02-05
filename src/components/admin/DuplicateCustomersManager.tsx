import { useState, useEffect } from 'react';
import { AlertTriangle, Users, Phone, Mail, ArrowLeft } from 'lucide-react';
import { customerManagementService } from '../../services/customerManagementService';

interface DuplicateCustomersManagerProps {
  onBack: () => void;
}

interface DuplicateGroup {
  identifier: string;
  identifier_type: string;
  user_count: number;
  user_ids: string[];
}

export default function DuplicateCustomersManager({ onBack }: DuplicateCustomersManagerProps) {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDuplicates();
  }, []);

  const loadDuplicates = async () => {
    try {
      setLoading(true);
      const data = await customerManagementService.findDuplicateCustomers();
      setDuplicates(data);
    } catch (error) {
      console.error('Error loading duplicates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">العملاء المكررين</h2>
          <p className="text-sm text-gray-600 mt-1">
            {duplicates.length === 0
              ? 'لا توجد تسجيلات مكررة - النظام نظيف ✓'
              : `عدد الهويات المكررة: ${duplicates.length}`
            }
          </p>
        </div>
      </div>

      {duplicates.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-green-900 mb-2">النظام نظيف!</h3>
          <p className="text-green-700">
            لا توجد حسابات مكررة في النظام
            <br />
            كل هوية (جوال أو بريد) مرتبطة بعميل واحد فقط
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <div className="font-bold mb-1">تم العثور على تسجيلات مكررة</div>
              <div>
                هذا يعني أن نفس الجوال أو البريد مرتبط بأكثر من حساب.
                النظام الحالي يعرض تلقائياً الحساب الأحدث أو الأكثر تفعيلاً.
              </div>
            </div>
          </div>

          {duplicates.map((dup, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                {dup.identifier_type === 'phone' ? (
                  <Phone className="w-5 h-5 text-blue-600" />
                ) : (
                  <Mail className="w-5 h-5 text-purple-600" />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{dup.identifier}</div>
                  <div className="text-sm text-gray-600">
                    {dup.identifier_type === 'phone' ? 'رقم الجوال' : 'البريد الإلكتروني'}
                  </div>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  {dup.user_count} حسابات
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">معرفات الحسابات (User IDs):</div>
                <div className="space-y-1">
                  {dup.user_ids.map((userId, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono text-gray-600">
                      <span className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center text-white text-[10px]">
                        {i + 1}
                      </span>
                      <code className="flex-1 bg-white px-2 py-1 rounded border border-gray-200">
                        {userId}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">ملاحظة:</span> النظام الموحد يعرض تلقائياً الحساب الأكثر صلاحية
                  (المفعل أولاً، ثم الأحدث). يمكنك الاحتفاظ بالحسابات المتعددة أو دمجها يدوياً حسب الحاجة.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">كيف يعمل النظام الموحد؟</h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>يبحث النظام عن جميع المسجلين باستخدام الجوال أو البريد كهوية موحدة</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>إذا وُجد نفس الجوال/البريد في أكثر من حساب، يُعرض الحساب الأكثر صلاحية تلقائياً</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>الأولوية: حساب مفعل {">"} حساب أحدث {">"} حساب قديم</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>هذا يمنع ظهور نفس العميل مرتين في القائمة</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
