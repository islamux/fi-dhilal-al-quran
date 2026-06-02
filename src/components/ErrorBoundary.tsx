import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render(): ReactNode {
    if ((this as Component<Props, State>).state.hasError) {
      return (
        <div role="alert" className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-brand-dark-bg text-white font-sans">
          <h1 className="text-2xl font-bold text-gilded-gold mb-4 font-serif">حدث خطأ غير متوقع</h1>
          <p className="text-sm text-brand-dark-mute mb-6 max-w-md">
            تعذر تحميل التطبيق. يرجى إعادة تحميل الصفحة.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gilded-gold text-white rounded-none hover:bg-gilded-hover transition-colors text-sm font-bold font-mono"
          >
            إعادة تحميل
          </button>
          {(this as Component<Props, State>).state.error && (
            <details className="mt-6 max-w-md text-left">
              <summary className="text-xs text-brand-grey cursor-pointer font-mono">تفاصيل الخطأ</summary>
              <pre className="mt-2 text-xs text-red-400 bg-black/30 p-4 rounded-none overflow-auto font-mono">
                {(this as Component<Props, State>).state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return (this as Component<Props, State>).props.children;
  }
}
