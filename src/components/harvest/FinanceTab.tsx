import { DollarSign, Info } from 'lucide-react';

interface Farm {
  id: string;
  name_ar: string;
}

interface FinanceTabProps {
  farm: Farm;
}

export default function FinanceTab({ farm }: FinanceTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">المالية التشغيلية</h3>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
        <Info className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h4 className="text-lg font-bold text-gray-900 mb-2">قيد التطوير</h4>
        <p className="text-sm text-gray-600">
          سيتم إضافة نظام إدارة المصروفات والإيرادات التشغيلية قريباً
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500 mb-1">المصروفات (شهري)</p>
          <p className="text-lg font-bold text-red-600">- ريال</p>
        </div>
        <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500 mb-1">الإيرادات (شهري)</p>
          <p className="text-lg font-bold text-green-600">- ريال</p>
        </div>
      </div>
    </div>
  );
}
