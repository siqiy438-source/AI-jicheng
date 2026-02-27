import { Bell, BookOpen, User, LogOut, Sparkles, Coins, Shield, QrCode, Gift, X, Rocket, Wrench, Zap, ChevronRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/contexts/CreditsContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdmin } from "@/hooks/use-admin";
import { useChangelog } from "@/hooks/use-changelog";
import type { ChangelogEntry } from "@/data/changelog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatCredits } from "@/lib/credits";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const { user, loading, signOut } = useAuth();
  const { balance, loading: creditsLoading } = useCredits();
  const isMobile = useIsMobile();
  const { isAdmin } = useAdmin();
  const [wechatOpen, setWechatOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<ChangelogEntry | null>(null);
  const { entries: changelogEntries, unreadCount, lastReadId, markAllRead } = useChangelog();
  const [, forceUpdate] = useState(0);

  return (
    <>
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
              alt="灵犀 AI创作平台 Logo"
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
        {/* 使用教程按钮 */}
        <Link
          to="/tutorials"
          className="flex md:hidden p-2.5 rounded-xl bg-secondary/40 active:bg-secondary/70 transition-colors touch-target"
        >
          <BookOpen className="w-5 h-5 text-muted-foreground" />
        </Link>
        <Link
          to="/tutorials"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-accent transition-colors touch-target text-sm text-muted-foreground hover:text-foreground"
        >
          <BookOpen className="w-4 h-4" />
          使用教程
        </Link>

        {/* 积分余额 */}
        {user && !creditsLoading && (
          <Link
            to="/recharge"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl",
              "bg-secondary/40 active:bg-secondary/70 transition-colors text-sm font-medium touch-target"
            )}
          >
            <Coins className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-foreground">{formatCredits(balance)}</span>
          </Link>
        )}

        {/* 通知按钮 - 更新日志 */}
        <DropdownMenu onOpenChange={(open) => {
          if (open && unreadCount > 0) {
            markAllRead();
            forceUpdate((n) => n + 1);
          }
        }}>
          <DropdownMenuTrigger asChild>
            <button className="p-2.5 rounded-xl bg-secondary/40 active:bg-secondary/70 transition-colors relative touch-target focus:outline-none" aria-label="更新通知">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[calc(100vw-1rem)] max-w-80 p-0">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">更新日志</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-primary font-medium">{unreadCount} 条新更新</span>
                )}
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {changelogEntries.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <Bell className="w-7 h-7 text-primary/40" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-muted-foreground">暂无更新</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {changelogEntries.map((entry) => (
                    <ChangelogItem key={entry.id} entry={entry} isUnread={entry.id > lastReadId} onSelect={() => setDetailEntry(entry)} />
                  ))}
                </div>
              )}
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
                "rounded-xl bg-secondary/40 active:bg-secondary/70",
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
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer">
                    <Shield className="w-4 h-4 mr-2" />
                    管理后台
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  设置
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="md:hidden">
                <Link to="/tutorials" className="cursor-pointer">
                  <BookOpen className="w-4 h-4 mr-2" />
                  使用教程
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setWechatOpen(true)}
                className="cursor-pointer text-primary focus:text-primary"
              >
                <QrCode className="w-4 h-4 mr-2" />
                添加创始人微信
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

      {/* 创始人微信弹窗 */}
      <Dialog open={wechatOpen} onOpenChange={setWechatOpen}>
        <DialogContent className="sm:max-w-[360px] p-0 overflow-hidden gap-0 border-0 [&>button:last-child]:hidden">
          <div className="relative bg-gradient-to-br from-amber-600/90 to-yellow-700/80 px-6 pt-8 pb-6 text-white">
            <button
              onClick={() => setWechatOpen(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="关闭"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-yellow-300/15 blur-2xl pointer-events-none" />
            <div className="relative flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-1">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">添加创始人微信</h2>
              <p className="text-sm text-white/80 leading-relaxed">
                备注「灵犀」，新用户可获赠
                <span className="inline-flex items-center gap-0.5 mx-1 px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-sm">
                  300 积分
                </span>
              </p>
            </div>
          </div>
          <div className="bg-card px-6 py-5 flex flex-col items-center gap-3">
            <img
              src="/wechat-qr.jpg"
              alt="创始人微信二维码"
              className="w-48 rounded-2xl border-2 border-amber-500/20 bg-white p-1"
            />
            <p className="text-xs text-muted-foreground text-center">
              扫码或长按识别二维码
            </p>
            <Button onClick={() => setWechatOpen(false)} className="w-full rounded-xl h-11 bg-amber-600 hover:bg-amber-700 text-white">
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 更新详情弹窗 */}
      <Dialog open={!!detailEntry} onOpenChange={(open) => !open && setDetailEntry(null)}>
        {detailEntry && (
          <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden gap-0 border-0 [&>button:last-child]:hidden">
            <ChangelogDetail entry={detailEntry} onClose={() => setDetailEntry(null)} />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

const typeConfig = {
  feature: { icon: Rocket, color: "text-green-600", bg: "bg-green-500/10", label: "新功能", gradient: "from-green-600/90 to-emerald-700/80" },
  fix: { icon: Wrench, color: "text-orange-600", bg: "bg-orange-500/10", label: "修复", gradient: "from-orange-600/90 to-amber-700/80" },
  improve: { icon: Zap, color: "text-blue-600", bg: "bg-blue-500/10", label: "优化", gradient: "from-blue-600/90 to-indigo-700/80" },
} as const;

function ChangelogItem({ entry, isUnread, onSelect }: { entry: ChangelogEntry; isUnread: boolean; onSelect: () => void }) {
  const config = typeConfig[entry.type];
  const Icon = config.icon;
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left px-4 py-3 transition-colors hover:bg-accent/50 active:bg-accent/70 cursor-pointer",
        isUnread && "bg-primary/5"
      )}
    >
      <div className="flex gap-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", config.bg)}>
          <Icon className={cn("w-4 h-4", config.color)} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-foreground truncate">{entry.title}</p>
            {isUnread && <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{entry.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", config.bg, config.color)}>{config.label}</span>
              <span className="text-xs text-muted-foreground/60">{entry.date}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" aria-hidden="true" />
          </div>
        </div>
      </div>
    </button>
  );
}

function ChangelogDetail({ entry, onClose }: { entry: ChangelogEntry; onClose: () => void }) {
  const config = typeConfig[entry.type];
  const Icon = config.icon;
  return (
    <>
      <div className={cn("relative px-6 pt-8 pb-6 text-white bg-gradient-to-br", config.gradient)}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="关闭"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-1">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">{entry.title}</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70 bg-white/15 px-2.5 py-0.5 rounded-full">{config.label}</span>
            <span className="text-sm text-white/70">{entry.date}</span>
          </div>
        </div>
      </div>
      <div className="bg-card px-6 py-5">
        <p className="text-sm text-muted-foreground mb-4">{entry.description}</p>
        <div className="space-y-2.5">
          {entry.details.map((item, i) => (
            <div key={i} className="flex gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-foreground leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
        <Button onClick={onClose} className="w-full rounded-xl h-11 mt-5">
          知道了
        </Button>
      </div>
    </>
  );
}
