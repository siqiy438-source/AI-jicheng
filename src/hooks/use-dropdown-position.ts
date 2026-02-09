import { useRef, useEffect, useCallback, useState } from "react";

/**
 * 下拉菜单视口边界检测 Hook
 * 确保下拉面板永远显示在可视区域内，不超出屏幕
 */
interface DropdownPosition {
  /** 是否应该向右对齐（当左对齐会溢出右侧时） */
  alignRight: boolean;
  /** 是否应该向上展开（当向下展开会溢出底部时） */
  alignTop: boolean;
}

export function useDropdownPosition(isOpen: boolean) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<DropdownPosition>({
    alignRight: false,
    alignTop: false,
  });

  const calculatePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current || !panelRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const panel = panelRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 16; // 16px 安全边距

    // 判断是否向右对齐
    const wouldOverflowRight = trigger.left + panel.width > viewportWidth - margin;
    const wouldOverflowLeftIfRight = trigger.right - panel.width < margin;

    // 判断是否向上展开
    const wouldOverflowBottom = trigger.bottom + panel.height > viewportHeight - margin;
    const wouldOverflowTopIfUp = trigger.top - panel.height < margin;

    setPosition({
      alignRight: wouldOverflowRight && !wouldOverflowLeftIfRight,
      alignTop: wouldOverflowBottom && !wouldOverflowTopIfUp,
    });
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // 使用 requestAnimationFrame 确保 DOM 已渲染
      requestAnimationFrame(calculatePosition);
    }
  }, [isOpen, calculatePosition]);

  return {
    triggerRef,
    panelRef,
    position,
  };
}
