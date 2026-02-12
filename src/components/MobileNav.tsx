import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Palette,
  User,
  Shirt,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  matchPaths?: string[];
  active?: boolean;
}

const MobileNavItem = ({ icon, label, to, active }: NavItemProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className={cn(
        "flex flex-col items-center justify-center gap-1 flex-1 py-2 min-h-[56px]",
        "transition-all duration-200 ease-out",
        "active:scale-95",
        active
          ? "text-primary"
          : "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200",
          active && "bg-primary/10"
        )}
      >
        {icon}
        {/* 激活状态下的小圆点指示器 */}
        {active && (
          <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
        )}
      </span>
      <span
        className={cn(
          "text-[11px] font-medium transition-colors duration-200 whitespace-nowrap",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </button>
  );
};

export const MobileNav = () => {
  const location = useLocation();

  const isActive = (item: NavItemProps) => {
    if (item.to === "/") {
      return location.pathname === "/";
    }

    const paths = item.matchPaths ?? [item.to];
    return paths.some(
      (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  // 移动端核心导航项（保留 4 个入口）
  const navItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "首页", to: "/" },
    {
      icon: <Palette className="w-5 h-5" />,
      label: "创意工具",
      to: "/creative-tools",
      matchPaths: [
        "/creative-tools",
        "/ai-poster",
        "/ai-drawing",
        "/ai-ppt",
        "/generative-report",
        "/ai-copywriting",
        "/more-features",
      ],
    },
    {
      icon: <Shirt className="w-5 h-5" />,
      label: "服装",
      to: "/clothing",
      matchPaths: [
        "/clothing",
        "/ai-hangoutfit",
        "/ai-display",
        "/fashion-outfit",
        "/fashion-model-outfit",
      ],
    },
    {
      icon: <User className="w-5 h-5" />,
      label: "我的",
      to: "/my-works",
      matchPaths: ["/my-works", "/my-materials", "/settings"],
    },
  ];

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "md:hidden", // 仅移动端显示
        "bg-background/95 backdrop-blur-lg",
        "border-t border-border",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.08)]",
        // 安全区域适配（iPhone 底部横条）
        "pb-[env(safe-area-inset-bottom)]",
        "pl-safe pr-safe"
      )}
    >
      <div className="flex items-center justify-around px-1">
        {navItems.map((item) => (
          <MobileNavItem
            key={item.to}
            {...item}
            active={isActive(item)}
          />
        ))}
      </div>
    </nav>
  );
};
