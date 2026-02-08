import { useEffect, useRef, RefObject, useState } from 'react';
import {
  hapticFeedback,
  addLongPressListener,
  handleKeyboardResize,
  isTouchDevice,
} from '@/lib/mobile-interaction';

/**
 * 触觉反馈 Hook
 */
export const useHapticFeedback = () => {
  return {
    light: () => hapticFeedback('light'),
    medium: () => hapticFeedback('medium'),
    heavy: () => hapticFeedback('heavy'),
  };
};

/**
 * 长按 Hook
 * @param callback 长按回调
 * @param duration 长按时长（毫秒）
 */
export const useLongPress = (
  callback: () => void,
  duration: number = 500
): RefObject<HTMLElement> => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const cleanup = addLongPressListener(element, callback, duration);
    return cleanup;
  }, [callback, duration]);

  return ref;
};

/**
 * 软键盘适配 Hook
 * 监听软键盘弹出/收起，调整页面布局
 */
export const useKeyboardAdjust = (callback?: (height: number) => void) => {
  useEffect(() => {
    if (!callback) return;

    const cleanup = handleKeyboardResize(callback);
    return cleanup;
  }, [callback]);
};

/**
 * 触摸设备检测 Hook
 */
export const useTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  return isTouch;
};

/**
 * 滚动锁定 Hook
 * 用于模态框等需要禁止背景滚动的场景
 */
export const useScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
};

/**
 * 安全区域 Hook
 * 获取设备安全区域信息（刘海屏等）
 */
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-top') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-left') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-right') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
    };
  }, []);

  return safeArea;
};
