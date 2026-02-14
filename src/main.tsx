import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

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
                if (confirm('发现新版本，是否立即更新？')) {
                  window.location.reload();
                }
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
