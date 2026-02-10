/**
 * Agent Team 分析进行中动画组件
 * 4 位 AI 专家依次激活，模拟协作分析效果
 */

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { VM_AGENTS } from "@/lib/vm-analysis";
import { cn } from "@/lib/utils";

interface AnalyzingAnimationProps {
  /** 分析是否已完成 */
  isComplete?: boolean;
}

const AnalyzingAnimation = ({ isComplete = false }: AnalyzingAnimationProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isComplete) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % VM_AGENTS.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [isComplete]);

  return (
    <div className="flex flex-col items-center py-8 md:py-12">
      {/* Agent 头像行 */}
      <div className="flex items-center gap-4 md:gap-6 mb-6">
        {VM_AGENTS.map((agent, index) => {
          const isActive = !isComplete && index === activeIndex;
          const isDone = isComplete || (!isComplete && index < activeIndex);

          return (
            <div key={agent.id} className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl md:text-2xl transition-all duration-500",
                  isActive && "ring-2 ring-offset-2 ring-primary/50 scale-110",
                  isDone && "opacity-100",
                  !isActive && !isDone && "opacity-40 scale-90"
                )}
                style={{
                  background: isActive
                    ? "hsl(var(--primary) / 0.12)"
                    : isDone
                    ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                    : "#f5f5f5",
                }}
              >
                <span>{agent.icon}</span>
                {/* 激活脉冲 */}
                {isActive && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-primary/25" />
                )}
                {/* 完成对勾 */}
                {isDone && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] md:text-xs font-medium transition-colors duration-300",
                  isActive ? "text-primary" : isDone ? "text-green-600" : "text-muted-foreground/50"
                )}
              >
                {agent.nameCn}
              </span>
            </div>
          );
        })}
      </div>

      {/* 当前状态文字 */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm">
          {isComplete
            ? "分析完成！"
            : `${VM_AGENTS[activeIndex].nameCn} 正在分析中...`}
        </span>
      </div>
      <p className="text-muted-foreground/60 text-[10px] md:text-xs mt-2">
        AI 专家团队正在为您的服装制定最佳陈列方案
      </p>
    </div>
  );
};

export default AnalyzingAnimation;
