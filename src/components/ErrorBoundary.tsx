import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">حدث خطأ</h2>
            <p className="text-gray-600 mb-6">عذراً، حدث خطأ غير متوقع. الرجاء تحديث الصفحة والمحاولة مرة أخرى.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
