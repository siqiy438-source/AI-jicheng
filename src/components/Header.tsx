import { Bell, HelpCircle, User, LogOut, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Header = () => {
  const { user, loading, signOut } = useAuth();
  const isMobile = useIsMobile();

  return (
    <header className={cn(
      "h-14 md:h-16 flex items-center justify-between",
      "px-4 md:px-6",
      "glass border-b border-border",
      // 安全区域适配（顶部刘海）
      "pt-safe"
    )}>
      {/* 左侧：Logo（移动端显示）或导航 */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* 移动端显示 Logo */}
        {isMobile ? (
          <Link to="/" className="flex items-center gap-2">
            <div className={cn(
              "relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              "shadow-[0_2px_6px_hsl(28_80%_52%/0.25)]",
            )}>
              <img 
                src="/logo.png" 
                alt="灵犀 Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-semibold text-foreground text-sm">灵犀</span>
          </Link>
        ) : (
          <nav className="flex items-center gap-1">
            <button className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
              灵犀
            </button>
          </nav>
        )}
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* 帮助按钮 - 移动端隐藏 */}
        <button className="hidden md:flex p-2.5 rounded-xl hover:bg-accent transition-colors touch-target">
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* 通知按钮 */}
        <button className="p-2.5 rounded-xl hover:bg-accent transition-colors relative touch-target">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* 用户区域 */}
        {loading ? (
          <div className="ml-1 md:ml-2 w-16 md:w-20 h-8 md:h-9 bg-muted animate-pulse rounded-xl" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "ml-1 md:ml-2 flex items-center gap-2",
                "px-2 md:px-3 py-1.5 md:py-2",
                "bg-accent hover:bg-accent/80 rounded-xl",
                "text-sm font-medium transition-colors",
                "touch-target"
              )}>
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-foreground" />
                </div>
                <span className="max-w-[80px] md:max-w-[120px] truncate hidden xs:inline">
                  {user.email?.split('@')[0]}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  设置
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            to="/auth"
            className={cn(
              "ml-1 md:ml-2 px-3 md:px-4 py-1.5 md:py-2",
              "bg-primary text-primary-foreground rounded-xl",
              "text-sm font-medium hover:bg-primary/90 transition-colors",
              "shadow-soft touch-target"
            )}
          >
            登录
          </Link>
        )}
      </div>
    </header>
  );
};
