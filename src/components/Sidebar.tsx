import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ImageIcon,
  FileText,
  Sparkles,
  Star,
  Settings,
  FolderOpen,
  Upload,
  ChevronLeft,
  ChevronRight,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  to?: string;
  onClick?: () => void;
}

const NavItem = ({ icon, label, active, collapsed, to, onClick }: NavItemProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    }
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        // 基础样式
        "relative w-full flex items-center gap-3 px-3 py-3 rounded-xl min-h-[44px]",
        "transition-all duration-200 ease-out",
        "group",
        // 左侧指示条
        "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
        "before:w-[3px] before:rounded-r-full before:transition-all before:duration-200",
        // 默认状态
        "text-muted-foreground",
        "hover:bg-sidebar-accent/60 hover:text-foreground",
        // 激活状态
        active ? [
          "bg-sidebar-accent text-foreground font-medium",
          "before:h-[55%] before:bg-primary",
        ].join(" ") : "before:h-0 before:bg-transparent"
      )}
    >
      {/* 图标 */}
      <span
        className={cn(
          "flex-shrink-0 transition-all duration-200",
          active
            ? "text-primary scale-110"
            : "text-muted-foreground group-hover:text-primary group-hover:scale-105"
        )}
      >
        {icon}
      </span>

      {/* 标签 */}
      {!collapsed && (
        <span className={cn(
          "flex-1 text-left text-sm transition-colors duration-200",
          active ? "text-foreground" : "group-hover:text-foreground"
        )}>
          {label}
        </span>
      )}

      {/* 悬停光效 */}
      {active && (
        <span className="absolute inset-0 rounded-xl bg-primary/5 pointer-events-none" />
      )}
    </button>
  );
};

interface NavSectionProps {
  title: string;
  children: React.ReactNode;
  collapsed?: boolean;
}

const NavSection = ({ title, children, collapsed }: NavSectionProps) => (
  <div className="mb-6">
    {!collapsed && (
      <div className="flex items-center gap-2 px-3 mb-3">
        <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">
          {title}
        </span>
        <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
      </div>
    )}
    <div className="space-y-1">{children}</div>
  </div>
);

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  const isActive = (path: string) => location.pathname === path;

  // 移动端不渲染 Sidebar
  if (isMobile) {
    return null;
  }

  return (
    <aside
      className={cn(
        "h-screen flex flex-col",
        "bg-sidebar-background border-r border-sidebar-border",
        "transition-all duration-300 ease-out",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Logo 区域 */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            {/* Logo 图标 - 工艺感设计 */}
            <div className={cn(
              "relative w-9 h-9 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-primary to-[hsl(32_85%_48%)]",
              "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2),0_2px_8px_hsl(28_80%_52%/0.3)]",
            )}>
              <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
              {/* 光泽效果 */}
              <span className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-[15px] leading-tight">
                AI 创作
              </span>
              <span className="text-[11px] text-muted-foreground/60 tracking-wide">
                CREATIVE STUDIO
              </span>
            </div>
          </div>
        ) : (
          <div className={cn(
            "relative w-9 h-9 rounded-xl flex items-center justify-center mx-auto",
            "bg-gradient-to-br from-primary to-[hsl(32_85%_48%)]",
            "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2),0_2px_8px_hsl(28_80%_52%/0.3)]",
          )}>
            <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
            <span className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          </div>
        )}

        {/* 收起/展开按钮 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-2 rounded-lg transition-all duration-200 min-w-[36px] min-h-[36px]",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-sidebar-accent",
            "active:scale-95",
            collapsed && "mx-auto mt-3"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 导航区域 */}
      <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <NavSection title="工作台" collapsed={collapsed}>
          <NavItem
            icon={<LayoutDashboard className="w-[18px] h-[18px]" />}
            label="工作台"
            active={isActive("/")}
            collapsed={collapsed}
            to="/"
          />
          <NavItem
            icon={<Sparkles className="w-[18px] h-[18px]" />}
            label="创作中心"
            active={isActive("/creative-center")}
            collapsed={collapsed}
            to="/creative-center"
          />
        </NavSection>

        <NavSection title="智能工具" collapsed={collapsed}>
          <NavItem
            icon={<Palette className="w-[18px] h-[18px]" />}
            label="AI 海报"
            active={isActive("/ai-poster")}
            collapsed={collapsed}
            to="/ai-poster"
          />
          <NavItem
            icon={<ImageIcon className="w-[18px] h-[18px]" />}
            label="AI 绘图"
            active={isActive("/ai-drawing")}
            collapsed={collapsed}
            to="/ai-drawing"
          />
          <NavItem
            icon={<FileText className="w-[18px] h-[18px]" />}
            label="AI 文案"
            active={isActive("/ai-copywriting")}
            collapsed={collapsed}
            to="/ai-copywriting"
          />
          <NavItem
            icon={<Star className="w-[18px] h-[18px]" />}
            label="更多功能"
            active={isActive("/more-features")}
            collapsed={collapsed}
            to="/more-features"
          />
        </NavSection>

        <NavSection title="素材" collapsed={collapsed}>
          <NavItem
            icon={<FolderOpen className="w-[18px] h-[18px]" />}
            label="我的作品"
            active={isActive("/my-works")}
            collapsed={collapsed}
            to="/my-works"
          />
          <NavItem
            icon={<Upload className="w-[18px] h-[18px]" />}
            label="我的素材"
            active={isActive("/my-materials")}
            collapsed={collapsed}
            to="/my-materials"
          />
        </NavSection>
      </nav>

      {/* 底部设置 */}
      <div className="p-3 border-t border-sidebar-border">
        <NavItem
          icon={<Settings className="w-[18px] h-[18px]" />}
          label="设置"
          active={isActive("/settings")}
          collapsed={collapsed}
          to="/settings"
        />
      </div>
    </aside>
  );
};
