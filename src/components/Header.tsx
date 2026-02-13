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
  
  // 通知状态（未来从后端获取）
  const hasUnreadNotifications = false; // 当前无未读通知

  return (
    <header className={cn(
      "min-h-14 md:min-h-16 flex items-center justify-between",
      "px-safe",
      "glass border-b border-border",
      // 安全区域适配（顶部刘海）
      "pt-safe md:pt-0"
    )}>
      {/* 左侧：Logo（移动端显示）或导航 */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* 移动端显示 Logo */}
        {isMobile ? (
          <Link to="/" className="flex items-center gap-2">
            {/* Logo 图标 - 直接铺满 */}
            <img 
              src="/logo.webp" 
              alt="灵犀 Logo" 
              loading="eager"
              decoding="async"
              className="w-8 h-8 object-cover flex-shrink-0"
            />
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2.5 rounded-xl hover:bg-accent transition-colors relative touch-target">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {/* 只在有未读通知时显示红点 */}
              {hasUnreadNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[calc(100vw-1rem)] max-w-80">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">通知</h3>
                <span className="text-xs text-muted-foreground">全部标为已读</span>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {/* 暂无通知 - 品牌化空状态 */}
              <div className="px-4 py-8 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Bell className="w-7 h-7 text-primary/40" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">暂无新通知</p>
                <p className="text-xs text-muted-foreground/60">
                  有新的更新时会在这里显示
                </p>
              </div>
              
              {/* 通知列表示例（未来使用） */}
              {/* <div className="divide-y divide-border">
                <div className="px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">
                        新功能上线
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        AI PPT 现已支持自定义模板，快来体验吧！
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        2小时前
                      </p>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 用户区域 */}
        {loading ? (
          <div className="ml-1 md:ml-2 w-16 md:w-20 h-8 md:h-9 animate-shimmer rounded-xl" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "ml-1 md:ml-2 flex items-center gap-2",
                "px-2 md:px-3 py-1.5 md:py-2",
                "rounded-xl hover:bg-accent active:bg-accent",
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
