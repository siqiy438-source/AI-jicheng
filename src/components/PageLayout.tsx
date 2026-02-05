import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  /** 是否显示 Header，默认 true */
  showHeader?: boolean;
  /** 主内容区域的额外 className */
  className?: string;
  /** 内容区域最大宽度，默认 max-w-4xl */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "4xl" | "6xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  full: "max-w-full",
};

export const PageLayout = ({
  children,
  showHeader = true,
  className,
  maxWidth = "4xl",
}: PageLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gradient-main">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {showHeader && <Header />}
        <main
          className={cn(
            "flex-1 overflow-y-auto scrollbar-thin",
            // 移动端底部留出导航栏空间
            "pb-20 md:pb-0"
          )}
        >
          <div
            className={cn(
              maxWidthClasses[maxWidth],
              "mx-auto",
              // 响应式内边距：移动端更紧凑
              "px-4 md:px-6",
              // 响应式上下间距
              "py-6 md:py-16",
              className
            )}
          >
            {children}
          </div>
        </main>
      </div>
      {/* 移动端底部导航 */}
      <MobileNav />
    </div>
  );
};
