/**
 * 移动端交互优化工具
 */

/**
 * 触觉反馈（如果设备支持）
 * @param style 反馈类型: 'light' | 'medium' | 'heavy'
 */
export const hapticFeedback = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator === 'undefined') return;

  // 检查是否支持触觉反馈
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(patterns[style]);
  }
};

/**
 * 防止双击缩放
 * 在元素上添加此事件处理器
 */
export const preventDoubleTapZoom = (event: TouchEvent) => {
  const now = Date.now();
  const lastTap = (event.target as any)._lastTap || 0;
  const delta = now - lastTap;

  if (delta < 300) {
    event.preventDefault();
  }

  (event.target as any)._lastTap = now;
};

/**
 * 优化的滚动到元素
 * @param element 目标元素
 * @param options 滚动选项
 */
export const smoothScrollTo = (
  element: HTMLElement | null,
  options: ScrollIntoViewOptions = {}
) => {
  if (!element) return;

  const defaultOptions: ScrollIntoViewOptions = {
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest',
  };

  element.scrollIntoView({ ...defaultOptions, ...options });
};

/**
 * 处理软键盘弹出时的视口调整
 * 返回清理函数
 */
export const handleKeyboardResize = (callback: (height: number) => void) => {
  if (typeof window === 'undefined' || !('visualViewport' in window)) {
    return () => {};
  }

  const viewport = window.visualViewport!;

  const handler = () => {
    callback(viewport.height);
  };

  viewport.addEventListener('resize', handler);

  return () => {
    viewport.removeEventListener('resize', handler);
  };
};

/**
 * 检测是否为触摸设备
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * 优化的长按检测
 * @param element 目标元素
 * @param callback 长按回调
 * @param duration 长按时长（毫秒）
 */
export const addLongPressListener = (
  element: HTMLElement,
  callback: () => void,
  duration: number = 500
) => {
  let timer: NodeJS.Timeout | null = null;
  let isLongPress = false;

  const start = (e: TouchEvent | MouseEvent) => {
    isLongPress = false;
    timer = setTimeout(() => {
      isLongPress = true;
      hapticFeedback('medium');
      callback();
    }, duration);
  };

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const end = (e: TouchEvent | MouseEvent) => {
    cancel();
    if (isLongPress) {
      e.preventDefault();
    }
  };

  element.addEventListener('touchstart', start as EventListener);
  element.addEventListener('mousedown', start as EventListener);
  element.addEventListener('touchend', end as EventListener);
  element.addEventListener('touchcancel', cancel);
  element.addEventListener('mouseup', end as EventListener);
  element.addEventListener('mouseleave', cancel);

  // 返回清理函数
  return () => {
    element.removeEventListener('touchstart', start as EventListener);
    element.removeEventListener('mousedown', start as EventListener);
    element.removeEventListener('touchend', end as EventListener);
    element.removeEventListener('touchcancel', cancel);
    element.removeEventListener('mouseup', end as EventListener);
    element.removeEventListener('mouseleave', cancel);
  };
};

/**
 * 防止页面滚动（用于模态框等）
 */
export const preventScroll = () => {
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';

  return () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
  };
};

/**
 * 优化的点击事件（消除 300ms 延迟）
 * 现代浏览器已通过 touch-action: manipulation 解决
 * 此函数用于需要特殊处理的场景
 */
export const fastClick = (element: HTMLElement, callback: (e: Event) => void) => {
  let startX = 0;
  let startY = 0;
  const threshold = 10; // 移动阈值

  const touchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  };

  const touchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - startX);
    const deltaY = Math.abs(touch.clientY - startY);

    // 如果移动距离小于阈值，视为点击
    if (deltaX < threshold && deltaY < threshold) {
      e.preventDefault();
      callback(e);
    }
  };

  element.addEventListener('touchstart', touchStart);
  element.addEventListener('touchend', touchEnd);

  return () => {
    element.removeEventListener('touchstart', touchStart);
    element.removeEventListener('touchend', touchEnd);
  };
};
