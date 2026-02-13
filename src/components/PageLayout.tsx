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
    <div className="flex app-shell bg-gradient-main relative overflow-hidden">
      {/* 背景氛围光斑 - 移动端缩小 */}
      <div className="ambient-orb ambient-orb-primary w-[280px] h-[280px] md:w-[500px] md:h-[500px] -top-24 -right-24 md:-top-40 md:-right-40" />
      <div className="ambient-orb ambient-orb-accent w-[220px] h-[220px] md:w-[400px] md:h-[400px] bottom-10 -left-20 md:bottom-20 md:-left-32" />
      {/* 纸张纹理覆盖层 */}
      <div className="fixed inset-0 texture-paper pointer-events-none z-0" />

      <Sidebar />
      <div className="flex-1 flex flex-col app-shell overflow-hidden relative z-10">
        {showHeader && <Header />}
        <main
          className={cn(
            "flex-1 overflow-y-auto overscroll-y-contain scrollbar-thin",
            // 移动端底部留出导航栏空间
            "pb-mobile-nav"
          )}
        >
          <div
            className={cn(
              maxWidthClasses[maxWidth],
              "mx-auto",
              // 响应式内边距：移动端更紧凑
              "px-safe",
              // 响应式上下间距
              "py-4 md:py-10",
              className
            )}
          >
            {children}
          </div>
          
          {/* 备案号 Footer */}
          <footer className="py-2 md:py-6 md:border-t md:border-border/30 px-safe">
            <div className="text-center">
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] md:text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors inline-block"
              >
                黔ICP备2026001006号
              </a>
            </div>
          </footer>
        </main>
      </div>
      {/* 移动端底部导航 */}
      <MobileNav />
    </div>
  );
};
