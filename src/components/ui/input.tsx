import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  /** 是否显示底部高亮线效果 */
  underline?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, underline, ...props }, ref) => {
    return (
      <div className={cn("relative", underline && "input-underline")}>
        <input
          type={type}
          className={cn(
            // 基础布局
            "flex h-11 w-full rounded-xl px-4 py-2",
            // 背景与边框
            "bg-background border border-border",
            // 文字样式
            "text-base text-foreground",
            "placeholder:text-muted-foreground/60",
            // 文件输入样式
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            // 阴影 - 轻微内阴影增加深度
            "shadow-[inset_0_1px_2px_hsl(0_0%_0%/0.04),0_1px_2px_hsl(0_0%_0%/0.02)]",
            // 聚焦状态
            "focus-visible:outline-none",
            "focus-visible:border-primary/50",
            "focus-visible:shadow-[inset_0_1px_2px_hsl(0_0%_0%/0.04),0_0_0_3px_hsl(var(--primary)/0.1)]",
            "focus-visible:bg-background",
            // 过渡效果
            "transition-all duration-200 ease-out",
            // 禁用状态
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
            // 响应式
            "md:text-sm",
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = "Input";

// 搜索输入框变体
const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        className={cn(
          "h-12 rounded-2xl pl-12 pr-4",
          "bg-card border-border/50",
          "shadow-[0_2px_8px_-2px_hsl(30_20%_20%/0.06)]",
          "focus-visible:shadow-[0_4px_16px_-4px_hsl(30_20%_20%/0.1),0_0_0_3px_hsl(var(--primary)/0.1)]",
          "focus-visible:border-primary/30",
          className,
        )}
        {...props}
      />
    );
  },
);
SearchInput.displayName = "SearchInput";

// 文本域组件
export interface TextareaProps extends React.ComponentProps<"textarea"> {
  /** 是否显示底部高亮线效果 */
  underline?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, underline, ...props }, ref) => {
    return (
      <div className={cn("relative", underline && "input-underline")}>
        <textarea
          className={cn(
            // 基础布局
            "flex min-h-[120px] w-full rounded-xl px-4 py-3",
            // 背景与边框
            "bg-background border border-border",
            // 文字样式
            "text-base text-foreground leading-relaxed",
            "placeholder:text-muted-foreground/60",
            // 阴影
            "shadow-[inset_0_1px_2px_hsl(0_0%_0%/0.04)]",
            // 聚焦状态
            "focus-visible:outline-none",
            "focus-visible:border-primary/50",
            "focus-visible:shadow-[inset_0_1px_2px_hsl(0_0%_0%/0.04),0_0_0_3px_hsl(var(--primary)/0.1)]",
            // 过渡效果
            "transition-all duration-200 ease-out",
            // 禁用状态
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
            // 调整大小
            "resize-none",
            // 响应式
            "md:text-sm",
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Input, SearchInput, Textarea };
