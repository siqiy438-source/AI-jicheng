import { useState, useEffect } from 'react';
import {
  isLowEndDevice,
  isMobileDevice,
  getDevicePerformance,
  shouldReducePerformance,
  getConnectionType,
  isSlowNetwork,
} from '@/lib/device-detection';

/**
 * 设备信息 Hook
 * 提供设备性能、网络状况等信息
 */
export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isLowEnd: false,
    isMobile: false,
    performance: 'medium' as 'high' | 'medium' | 'low',
    shouldReduce: false,
    connectionType: 'unknown',
    isSlowConnection: false,
  });

  useEffect(() => {
    setDeviceInfo({
      isLowEnd: isLowEndDevice(),
      isMobile: isMobileDevice(),
      performance: getDevicePerformance(),
      shouldReduce: shouldReducePerformance(),
      connectionType: getConnectionType(),
      isSlowConnection: isSlowNetwork(),
    });
  }, []);

  return deviceInfo;
};

/**
 * 性能优化 Hook
 * 根据设备性能自动调整功能
 */
export const usePerformanceOptimization = () => {
  const deviceInfo = useDeviceInfo();

  return {
    // 是否启用动画
    enableAnimations: !deviceInfo.shouldReduce,
    // 是否启用玻璃态效果
    enableGlassEffect: !deviceInfo.isLowEnd,
    // 是否启用阴影效果
    enableShadows: deviceInfo.performance !== 'low',
    // 是否启用复杂渐变
    enableGradients: deviceInfo.performance !== 'low',
    // 图片加载策略
    imageLoadingStrategy: deviceInfo.isSlowConnection ? 'lazy' : 'eager',
    // 设备信息
    ...deviceInfo,
  };
};
