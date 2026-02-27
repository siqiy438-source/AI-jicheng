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
          <DropdownMenuContent align="end" sideOffset={8} className="w-[calc(100vw-1rem)] max-w-[360px] p-0 rounded-2xl shadow-floating overflow-hidden border-border/50">
            {/* 头部渐变条 */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent pointer-events-none" />
              <div className="relative px-4 sm:px-5 pt-3 sm:pt-4 pb-2.5 sm:pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-[13px] sm:text-sm leading-none mb-0.5">更新动态</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-none">了解灵犀的最新变化</p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <span className="text-[10px] sm:text-xs text-primary-foreground bg-primary px-1.5 sm:px-2 py-0.5 rounded-full font-medium shadow-sm">{unreadCount} 条新</span>
                )}
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-primary/20 via-border to-transparent" />
            {/* 列表 */}
            <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto p-1.5 sm:p-2">
              {changelogEntries.length === 0 ? (
                <div className="px-4 py-8 sm:py-10 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/30" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-muted-foreground">暂无更新动态</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">有新版本时会在这里通知你</p>
                </div>
              ) : (
                <div className="space-y-1 sm:space-y-1.5">
                  {changelogEntries.map((entry) => (
                    <ChangelogItem
                      key={entry.id}
                      entry={entry}
                      isUnread={entry.id > lastReadId}
                      onSelect={() => setDetailEntry(entry)}
                    />
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

      {/* 更新详情弹窗 - 手机端底部抽屉 */}
      <Dialog open={!!detailEntry} onOpenChange={(open) => !open && setDetailEntry(null)}>
        {detailEntry && (
          <DialogContent className={cn(
            "p-0 overflow-hidden gap-0 border-0 [&>button:last-child]:hidden",
            // 手机端：悬浮居中卡片
            "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100vw-2.5rem)] max-w-[420px] rounded-2xl max-h-[80vh]",
            // 桌面端微调
            "sm:max-w-[420px] sm:max-h-none"
          )}>
            <div className="overflow-y-auto max-h-[80vh] sm:max-h-none">
              <ChangelogDetail entry={detailEntry} onClose={() => setDetailEntry(null)} />
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

/* ── 更新日志子组件 ── */

const typeConfig = {
  feature: {
    icon: Rocket,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "shadow-[inset_0_0_0_1px_rgba(16,185,129,0.1)]",
    label: "新功能",
  },
  fix: {
    icon: Wrench,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    glow: "shadow-[inset_0_0_0_1px_rgba(245,158,11,0.1)]",
    label: "修复",
  },
  improve: {
    icon: Zap,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    glow: "shadow-[inset_0_0_0_1px_rgba(59,130,246,0.1)]",
    label: "优化",
  },
} as const;

function ChangelogItem({ entry, isUnread, onSelect }: {
  entry: ChangelogEntry; isUnread: boolean; onSelect: () => void;
}) {
  const config = typeConfig[entry.type];
  const Icon = config.icon;
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left group rounded-xl p-2.5 sm:p-3 transition-all duration-200",
        "hover:bg-accent/50 active:scale-[0.98]",
        isUnread
          ? cn("bg-primary/[0.03] border border-primary/10", config.glow)
          : "border border-transparent"
      )}
    >
      <div className="flex gap-2.5 sm:gap-3 items-start">
        {/* 图标 */}
        <div className={cn(
          "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
          config.bg
        )}>
          <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", config.color)} aria-hidden="true" />
        </div>
        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
            <p className="text-xs sm:text-[13px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">{entry.title}</p>
            {isUnread && (
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 mb-1.5 sm:mb-2">{entry.description}</p>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md",
              config.bg, config.color
            )}>{config.label}</span>
            <span className="text-[10px] text-muted-foreground/40">{entry.date}</span>
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
      {/* 沉浸式头部 */}
      <div className="relative px-4 sm:px-6 pt-5 sm:pt-8 pb-4 sm:pb-6 overflow-hidden">
        {/* 背景层 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
        {/* 装饰 */}
        <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 rounded-full bg-white/[0.07] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-28 sm:w-36 h-28 sm:h-36 rounded-full bg-white/[0.04] blur-2xl pointer-events-none" />
        <div className="absolute top-4 left-6 w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-white/[0.03] blur-xl pointer-events-none" />
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 hover:scale-105 backdrop-blur-sm"
          aria-label="关闭"
        >
          <X className="w-4 h-4 sm:w-4 sm:h-4 text-white" strokeWidth={2.5} />
        </button>
        {/* 内容 */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold bg-white/15 backdrop-blur-sm text-white/90 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg">{config.label}</span>
            <span className="text-[11px] sm:text-xs text-white/50 ml-auto">{entry.date}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug mb-1.5 sm:mb-2">{entry.title}</h2>
          <p className="text-[13px] sm:text-sm text-white/65 leading-relaxed">{entry.description}</p>
        </div>
      </div>
      {/* 详情列表 */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-card">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">更新内容</span>
          <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          {entry.details.map((item, i) => (
            <div
              key={i}
              className="flex gap-2.5 sm:gap-3 items-start p-1.5 sm:p-2 rounded-lg hover:bg-secondary/50 transition-colors group/item"
            >
              <div className="w-[18px] h-[18px] sm:w-5 sm:h-5 rounded-md bg-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:bg-primary/15 transition-colors">
                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary/70 group-hover/item:text-primary transition-colors" aria-hidden="true" />
              </div>
              <p className="text-[13px] sm:text-sm text-foreground/75 leading-relaxed group-hover/item:text-foreground transition-colors">{item}</p>
            </div>
          ))}
        </div>
        <Button onClick={onClose} className="w-full rounded-xl h-10 mt-4 sm:mt-5 text-sm shadow-sm">
          知道了
        </Button>
      </div>
    </>
  );
}
