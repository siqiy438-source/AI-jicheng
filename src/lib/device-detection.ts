/**
 * 移动端设备检测和性能优化工具
 */

/**
 * 检测是否为低端设备
 * 基于内存和 CPU 核心数判断
 */
export const isLowEndDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;

  // @ts-ignore - deviceMemory 是实验性 API
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;

  // 内存 <= 2GB 或 CPU <= 2 核心视为低端设备
  return memory <= 2 || cores <= 2;
};

/**
 * 检测是否为移动设备
 */
export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

/**
 * 检测是否支持 WebP 格式
 */
export const supportsWebP = (): boolean => {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
};

/**
 * 检测网络连接类型
 */
export const getConnectionType = (): string => {
  if (typeof navigator === 'undefined') return 'unknown';
  // @ts-ignore - connection 是实验性 API
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return connection?.effectiveType || 'unknown';
};

/**
 * 检测是否为慢速网络
 */
export const isSlowNetwork = (): boolean => {
  const connectionType = getConnectionType();
  return connectionType === 'slow-2g' || connectionType === '2g';
};

/**
 * 获取设备性能等级
 * @returns 'high' | 'medium' | 'low'
 */
export const getDevicePerformance = (): 'high' | 'medium' | 'low' => {
  if (typeof navigator === 'undefined') return 'medium';

  // @ts-ignore
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;

  // 高端设备：内存 >= 8GB 且 CPU >= 8 核心
  if (memory >= 8 && cores >= 8) return 'high';

  // 低端设备：内存 <= 2GB 或 CPU <= 2 核心
  if (memory <= 2 || cores <= 2) return 'low';

  // 中端设备
  return 'medium';
};

/**
 * 检测是否应该使用性能降级模式
 */
export const shouldReducePerformance = (): boolean => {
  // 检查用户偏好设置
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return true;
  }

  // 检查设备性能
  const performance = getDevicePerformance();
  if (performance === 'low') return true;

  // 检查网络状况
  if (isSlowNetwork()) return true;

  return false;
};

/**
 * 获取推荐的图片质量
 * @returns 0.5 - 1.0 之间的质量值
 */
export const getRecommendedImageQuality = (): number => {
  const performance = getDevicePerformance();
  const connectionType = getConnectionType();

  // 低端设备或慢速网络使用低质量
  if (performance === 'low' || isSlowNetwork()) return 0.6;

  // 3G 网络使用中等质量
  if (connectionType === '3g') return 0.75;

  // 其他情况使用高质量
  return 0.85;
};

/**
 * 获取推荐的图片最大尺寸
 */
export const getRecommendedImageSize = (): number => {
  const performance = getDevicePerformance();

  if (performance === 'low') return 800;
  if (performance === 'medium') return 1200;
  return 1920;
};

