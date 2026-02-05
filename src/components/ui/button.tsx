import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // 基础样式 - 增加质感层次
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg text-sm font-medium",
    "ring-offset-background transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "[&_svg]:transition-transform [&_svg]:duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        // 主要按钮 - 渐变 + 内阴影 + 悬停上浮
        default: [
          "bg-gradient-to-br from-primary to-[hsl(32_85%_48%)]",
          "text-primary-foreground",
          "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-1px_0_hsl(0_0%_0%/0.1),0_2px_4px_hsl(30_20%_20%/0.1)]",
          "hover:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-1px_0_hsl(0_0%_0%/0.1),0_6px_20px_hsl(28_80%_52%/0.25)]",
          "hover:-translate-y-0.5",
          "active:translate-y-0 active:shadow-[inset_0_2px_4px_hsl(0_0%_0%/0.15)]",
        ].join(" "),

        // 危险按钮
        destructive: [
          "bg-gradient-to-br from-destructive to-[hsl(0_65%_45%)]",
          "text-destructive-foreground",
          "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.15),0_2px_4px_hsl(0_0%_0%/0.1)]",
          "hover:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.15),0_6px_16px_hsl(0_72%_51%/0.25)]",
          "hover:-translate-y-0.5",
          "active:translate-y-0",
        ].join(" "),

        // 轮廓按钮 - 精致边框
        outline: [
          "border border-border bg-background",
          "text-foreground",
          "shadow-[0_1px_2px_hsl(30_20%_20%/0.04)]",
          "hover:bg-secondary/50 hover:border-primary/30",
          "hover:shadow-[0_4px_12px_hsl(30_20%_20%/0.08)]",
          "hover:-translate-y-0.5",
          "active:translate-y-0 active:bg-secondary/70",
        ].join(" "),

        // 次要按钮
        secondary: [
          "bg-secondary text-secondary-foreground",
          "shadow-[0_1px_2px_hsl(30_20%_20%/0.04)]",
          "hover:bg-secondary/80",
          "hover:shadow-[0_2px_8px_hsl(30_20%_20%/0.08)]",
          "active:bg-secondary",
        ].join(" "),

        // 幽灵按钮
        ghost: [
          "text-muted-foreground",
          "hover:bg-secondary hover:text-foreground",
          "active:bg-secondary/70",
          "[&_svg]:hover:scale-110",
        ].join(" "),

        // 链接按钮
        link: [
          "text-primary underline-offset-4",
          "hover:underline hover:text-primary/80",
        ].join(" "),

        // 新增：发送按钮 - 特殊样式
        send: [
          "bg-gradient-to-br from-primary to-accent",
          "text-primary-foreground",
          "shadow-[0_4px_12px_hsl(28_80%_52%/0.3),0_0_20px_hsl(28_80%_52%/0.2)]",
          "hover:shadow-[0_6px_20px_hsl(28_80%_52%/0.4),0_0_30px_hsl(28_80%_52%/0.3)]",
          "hover:scale-105",
          "active:scale-[0.98]",
          "[&_svg]:hover:rotate-[15deg]",
        ].join(" "),

        // 新增：工艺按钮 - 最高质感
        craft: [
          "relative overflow-hidden",
          "bg-gradient-to-br from-primary to-[hsl(32_85%_48%)]",
          "text-primary-foreground",
          "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-1px_0_hsl(0_0%_0%/0.1),0_4px_12px_hsl(28_80%_52%/0.2)]",
          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/15 before:to-transparent before:pointer-events-none",
          "hover:-translate-y-0.5",
          "hover:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-1px_0_hsl(0_0%_0%/0.1),0_8px_24px_hsl(28_80%_52%/0.3)]",
          "active:translate-y-0",
          "active:shadow-[inset_0_2px_4px_hsl(0_0%_0%/0.2)]",
        ].join(" "),

        // 新增：标签按钮
        tag: [
          "relative pl-3",
          "bg-secondary border border-border",
          "text-muted-foreground",
          "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
          "before:w-[3px] before:h-0 before:bg-primary before:rounded-r-sm",
          "before:transition-all before:duration-200",
          "hover:border-primary/30 hover:text-foreground",
          "data-[active=true]:bg-primary/10 data-[active=true]:border-primary/30 data-[active=true]:text-primary",
          "data-[active=true]:before:h-[60%]",
        ].join(" "),
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 md:h-9 min-h-[44px] md:min-h-0 rounded-md px-3 text-sm md:text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        xl: "h-12 rounded-xl px-10 text-base font-semibold",
        icon: "h-10 w-10",
        "icon-sm": "h-9 w-9 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:h-8 md:w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** 用于 tag variant 的激活状态 */
  active?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, active, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        data-active={active}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
