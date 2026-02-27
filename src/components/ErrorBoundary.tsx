import React from "react";

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);

    // 结构化错误上报（生产环境）
    if (import.meta.env.PROD) {
      try {
        const payload = JSON.stringify({
          message: error.message,
          stack: error.stack?.slice(0, 1000),
          componentStack: info.componentStack?.slice(0, 500),
          url: window.location.href,
          timestamp: Date.now(),
        });
        navigator.sendBeacon?.('/api/error-report', payload);
      } catch {
        // 上报失败不影响用户体验
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF8] px-4 text-center">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            页面出了点问题
          </h1>
          <p className="text-gray-500 mb-6">
            别担心，刷新一下通常就好了
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
