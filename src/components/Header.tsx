import { Bell, BookOpen, User, LogOut, Sparkles, Coins, Shield, QrCode, Gift, X, Rocket, Wrench, Zap, Check } from "lucide-react";
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
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-[calc(100vw-1rem)] max-w-[340px] p-0 rounded-2xl border-border/60 shadow-elevated overflow-hidden">
            {/* 头部 */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-sm">更新动态</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-primary-foreground bg-primary px-2 py-0.5 rounded-full font-medium">{unreadCount} 条新</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">v1.0.0</span>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            {/* 列表 */}
            <div className="max-h-[380px] overflow-y-auto py-1.5">
              {changelogEntries.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-secondary flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-muted-foreground/40" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-muted-foreground">暂无更新动态</p>
                </div>
              ) : (
                changelogEntries.map((entry, i) => (
                  <ChangelogItem
                    key={entry.id}
                    entry={entry}
                    isUnread={entry.id > lastReadId}
                    isLast={i === changelogEntries.length - 1}
                    onSelect={() => setDetailEntry(entry)}
                  />
                ))
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
          <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden gap-0 border-0 rounded-2xl [&>button:last-child]:hidden">
            <ChangelogDetail entry={detailEntry} onClose={() => setDetailEntry(null)} />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

/* ── 更新日志子组件 ── */

const typeConfig = {
  feature: { icon: Rocket, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-500", label: "新功能" },
  fix: { icon: Wrench, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-500", label: "修复" },
  improve: { icon: Zap, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", dot: "bg-blue-500", label: "优化" },
} as const;

function ChangelogItem({ entry, isUnread, isLast, onSelect }: {
  entry: ChangelogEntry; isUnread: boolean; isLast: boolean; onSelect: () => void;
}) {
  const config = typeConfig[entry.type];
  const Icon = config.icon;
  return (
    <button
      onClick={onSelect}
      className="w-full text-left group px-5 py-2.5 transition-colors hover:bg-accent/40 active:bg-accent/60 cursor-pointer"
    >
      <div className="flex gap-3.5">
        {/* 时间线 */}
        <div className="flex flex-col items-center pt-1">
          <div className={cn(
            "w-2 h-2 rounded-full flex-shrink-0 ring-2 ring-background transition-all",
            isUnread ? cn(config.dot, "ring-primary/20") : "bg-muted-foreground/25"
          )} />
          {!isLast && <div className="w-px flex-1 bg-border mt-1.5" />}
        </div>
        {/* 内容 */}
        <div className="flex-1 min-w-0 pb-3">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn("text-xs font-medium px-1.5 py-px rounded-md", config.bg, config.color)}>{config.label}</span>
            <span className="text-xs text-muted-foreground/50">{entry.date}</span>
            {isUnread && (
              <span className="ml-auto text-xs text-primary font-medium">NEW</span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground mb-0.5 group-hover:text-primary transition-colors">{entry.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{entry.description}</p>
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
      {/* 头部 - 统一使用品牌主色 */}
      <div className="relative px-6 pt-7 pb-5 bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          aria-label="关闭"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>
        {/* 装饰光斑 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/8 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium bg-white/20 text-white px-2 py-0.5 rounded-md">{config.label}</span>
            <span className="text-xs text-white/60">{entry.date}</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight leading-snug">{entry.title}</h2>
          <p className="text-sm text-white/70 mt-1.5 leading-relaxed">{entry.description}</p>
        </div>
      </div>
      {/* 详情列表 */}
      <div className="px-6 py-5 bg-card">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">更新内容</p>
        <div className="space-y-2">
          {entry.details.map((item, i) => (
            <div key={i} className="flex gap-3 items-start group/item">
              <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-px">
                <Check className="w-3 h-3 text-primary" aria-hidden="true" />
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
        <Button onClick={onClose} className="w-full rounded-xl h-10 mt-5 text-sm">
          知道了
        </Button>
      </div>
    </>
  );
}
