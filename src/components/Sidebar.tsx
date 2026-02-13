import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Shirt,
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
        "before:w-[3px] before:rounded-r-full before:transition-all before:duration-300 before:ease-out",
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
  const isClothingActive = [
    "/clothing",
    "/ai-hangoutfit",
    "/ai-display",
    "/fashion-outfit",
    "/fashion-model-outfit",
    "/fashion-detail-focus",
  ].includes(location.pathname);
  const isCreativeToolsActive = [
    "/creative-tools",
    "/more-features",
    "/ai-poster",
    "/ai-drawing",
    "/ai-ppt",
    "/generative-report",
  ].includes(location.pathname);

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
            {/* Logo 图标 - 直接铺满 */}
            <img 
              src="/logo.webp" 
              alt="灵犀 Logo" 
              loading="eager"
              decoding="async"
              className="w-9 h-9 object-cover flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground text-[15px] leading-tight">
                灵犀
              </span>
              <span className="text-[11px] text-muted-foreground/60 tracking-wide">
                CREATIVE STUDIO
              </span>
            </div>
          </div>
        ) : null}

        {/* 收起/展开按钮 */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-2 rounded-lg transition-all duration-200 min-w-[36px] min-h-[36px]",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-sidebar-accent",
              "active:scale-95"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        
        {/* 收起状态：展开按钮（居中显示） */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-2 rounded-lg transition-all duration-200 min-w-[36px] min-h-[36px] mx-auto",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-sidebar-accent",
              "active:scale-95"
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
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
        </NavSection>

        <NavSection title="智能工具" collapsed={collapsed}>
          <NavItem
            icon={<Shirt className="w-[18px] h-[18px]" />}
            label="服装工具"
            active={isClothingActive}
            collapsed={collapsed}
            to="/clothing"
          />
          <NavItem
            icon={<Palette className="w-[18px] h-[18px]" />}
            label="创意工具"
            active={isCreativeToolsActive}
            collapsed={collapsed}
            to="/creative-tools"
          />
          <NavItem
            icon={<FileText className="w-[18px] h-[18px]" />}
            label="文案工具"
            active={isActive("/ai-copywriting")}
            collapsed={collapsed}
            to="/ai-copywriting"
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
