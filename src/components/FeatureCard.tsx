import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  color: "amber" | "indigo" | "emerald" | "rose" | "violet";
  delay?: number;
  to?: string;
}

// 新色彩系统 - 工坊风格
const colorVariants = {
  amber: {
    iconBg: "from-amber-100 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    accentLine: "from-amber-400 to-orange-400",
    hoverBorder: "hover:border-amber-300/50 dark:hover:border-amber-600/30",
    glowColor: "group-hover:shadow-[0_8px_30px_-8px_hsl(28_80%_52%/0.25)]",
  },
  indigo: {
    iconBg: "from-indigo-100 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/20",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    accentLine: "from-indigo-400 to-blue-400",
    hoverBorder: "hover:border-indigo-300/50 dark:hover:border-indigo-600/30",
    glowColor: "group-hover:shadow-[0_8px_30px_-8px_hsl(215_60%_50%/0.25)]",
  },
  emerald: {
    iconBg: "from-emerald-100 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    accentLine: "from-emerald-400 to-teal-400",
    hoverBorder: "hover:border-emerald-300/50 dark:hover:border-emerald-600/30",
    glowColor: "group-hover:shadow-[0_8px_30px_-8px_hsl(160_60%_45%/0.25)]",
  },
  rose: {
    iconBg: "from-rose-100 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/20",
    iconColor: "text-rose-600 dark:text-rose-400",
    accentLine: "from-rose-400 to-pink-400",
    hoverBorder: "hover:border-rose-300/50 dark:hover:border-rose-600/30",
    glowColor: "group-hover:shadow-[0_8px_30px_-8px_hsl(350_60%_50%/0.25)]",
  },
  violet: {
    iconBg: "from-violet-100 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/20",
    iconColor: "text-violet-600 dark:text-violet-400",
    accentLine: "from-violet-400 to-purple-400",
    hoverBorder: "hover:border-violet-300/50 dark:hover:border-violet-600/30",
    glowColor: "group-hover:shadow-[0_8px_30px_-8px_hsl(270_60%_50%/0.25)]",
  },
};

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  badge,
  color,
  delay = 0,
  to,
}: FeatureCardProps) => {
  const navigate = useNavigate();
  const colorStyle = colorVariants[color];

  const handleClick = () => {
    if (to) {
      navigate(to);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        // 基础布局 - Mobile-First 内边距
        "group relative p-3 md:p-5 rounded-xl md:rounded-2xl cursor-pointer",
        // 背景与边框
        "bg-card border border-border",
        // 阴影系统
        "shadow-[0_2px_8px_-2px_hsl(30_20%_20%/0.06)]",
        colorStyle.glowColor,
        // 悬停边框变色
        colorStyle.hoverBorder,
        // 交互动效 - 上浮 + 阴影扩散
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1",
        "active:translate-y-0 active:scale-[0.98]",
        // 入场动画
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* 顶部装饰线 */}
      <span
        className={cn(
          "absolute top-0 left-4 right-4 h-[2px] rounded-full",
          "bg-gradient-to-r opacity-0 group-hover:opacity-100",
          "transition-opacity duration-300",
          colorStyle.accentLine
        )}
      />

      {/* 徽章 */}
      {badge && (
        <span className={cn(
          "absolute -top-2 -right-2 px-2.5 py-0.5",
          "text-[10px] font-semibold",
          "bg-gradient-to-r from-primary to-[hsl(32_85%_48%)]",
          "text-primary-foreground rounded-full",
          "shadow-[0_2px_8px_hsl(28_80%_52%/0.3)]"
        )}>
          {badge}
        </span>
      )}

      {/* 图标容器 - 增加深度感 */}
      <div
        className={cn(
          "relative w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4",
          "bg-gradient-to-br",
          colorStyle.iconBg,
          // 内阴影增加深度
          "shadow-[inset_0_-2px_4px_hsl(0_0%_0%/0.05),0_2px_4px_hsl(0_0%_0%/0.04)]",
          // 悬停效果
          "transition-transform duration-300",
          "group-hover:scale-105 group-hover:rotate-3"
        )}
      >
        <Icon
          className={cn(
            "w-5 h-5 md:w-7 md:h-7 transition-all duration-300",
            colorStyle.iconColor,
            "group-hover:scale-110"
          )}
        />
        {/* 高光层 */}
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/40 to-transparent dark:from-white/10 pointer-events-none" />
      </div>

      {/* 标题 */}
      <h3 className={cn(
        "font-semibold text-foreground mb-1 md:mb-1.5 text-sm md:text-base",
        "transition-colors duration-200"
      )}>
        {title}
      </h3>

      {/* 描述 */}
      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {/* 底部渐变装饰 - 悬停显示 */}
      <span
        className={cn(
          "absolute bottom-0 left-0 right-0 h-12 rounded-b-2xl",
          "bg-gradient-to-t from-black/[0.02] to-transparent dark:from-white/[0.02]",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity duration-300 pointer-events-none"
        )}
      />
    </div>
  );
};
