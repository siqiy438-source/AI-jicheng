import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// ==================== PWA Service Worker 注册 ====================
// 延迟注册，避免抢占首屏渲染的主线程资源
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const registerSW = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                const banner = document.createElement('div');
                banner.setAttribute('role', 'alert');
                banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;display:flex;align-items:center;justify-content:center;gap:12px;padding:12px 16px;background:#D97706;color:#fff;font-size:14px;font-family:system-ui,sans-serif';
                banner.textContent = '发现新版本';
                const btn = document.createElement('button');
                btn.textContent = '立即更新';
                btn.style.cssText = 'padding:4px 16px;border-radius:6px;border:1px solid rgba(255,255,255,0.4);background:transparent;color:#fff;cursor:pointer;font-size:14px';
                btn.onclick = () => window.location.reload();
                const dismiss = document.createElement('button');
                dismiss.textContent = '稍后';
                dismiss.style.cssText = 'padding:4px 12px;border:none;background:transparent;color:rgba(255,255,255,0.8);cursor:pointer;font-size:14px';
                dismiss.onclick = () => banner.remove();
                banner.appendChild(btn);
                banner.appendChild(dismiss);
                document.body.prepend(banner);
              }
            });
          }
        });
      })
      .catch((error) => console.error('SW registration failed:', error));
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(registerSW);
  } else {
    setTimeout(registerSW, 3000);
  }
}
