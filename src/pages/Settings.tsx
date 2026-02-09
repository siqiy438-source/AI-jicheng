import { useState, useEffect } from "react";
import { PageLayout } from "@/components/PageLayout";
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Bell,
  Shield,
  Globe,
  User,
  Palette,
  Volume2,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

const SettingItem = ({ icon, title, description, children, onClick }: SettingItemProps) => (
  <div
    className={cn(
      "flex items-center justify-between p-3 md:p-4 rounded-xl transition-colors gap-3",
      onClick && "hover:bg-secondary/50 active:bg-secondary/50 cursor-pointer"
    )}
    onClick={onClick}
  >
    <div className="flex items-center gap-3 md:gap-4 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="font-medium text-foreground text-sm md:text-base">{title}</h3>
        <p className="text-xs md:text-sm text-muted-foreground truncate">{description}</p>
      </div>
    </div>
    <div className="flex-shrink-0">
      {children || <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </div>
  </div>
);

interface ThemeOptionProps {
  mode: ThemeMode;
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

const ThemeOption = ({ mode, icon, label, selected, onClick }: ThemeOptionProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl border-2 transition-all min-h-[44px]",
      selected
        ? "border-primary bg-primary/5"
        : "border-transparent bg-secondary/50 hover:bg-secondary active:bg-secondary"
    )}
  >
    <div
      className={cn(
        "w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center",
        selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
      )}
    >
      {icon}
    </div>
    <span className={cn("text-xs md:text-sm font-medium", selected ? "text-primary" : "text-foreground")}>
      {label}
    </span>
    {selected && (
      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary flex items-center justify-center">
        <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary-foreground" />
      </div>
    )}
  </button>
);

const Settings = () => {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [notifications, setNotifications] = useState(true);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeMode;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <PageLayout maxWidth="4xl">
      {/* Page Header */}
      <div className="mb-6 md:mb-8 opacity-0 animate-fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2">设置</h1>
        <p className="text-sm md:text-base text-muted-foreground">管理您的账户和应用偏好设置</p>
      </div>

      {/* Theme Section */}
      <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-foreground">外观设置</h2>
            <p className="text-xs md:text-sm text-muted-foreground">自定义应用的显示主题</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <ThemeOption
            mode="light"
            icon={<Sun className="w-5 h-5 md:w-6 md:h-6" />}
            label="浅色模式"
            selected={theme === "light"}
            onClick={() => setTheme("light")}
          />
          <ThemeOption
            mode="dark"
            icon={<Moon className="w-5 h-5 md:w-6 md:h-6" />}
            label="深色模式"
            selected={theme === "dark"}
            onClick={() => setTheme("dark")}
          />
          <ThemeOption
            mode="system"
            icon={<Monitor className="w-5 h-5 md:w-6 md:h-6" />}
            label="跟随系统"
            selected={theme === "system"}
            onClick={() => setTheme("system")}
          />
        </div>
      </div>

      {/* Notifications Section */}
      <div className="glass-card rounded-xl md:rounded-2xl overflow-hidden mb-4 md:mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="p-3 md:p-4 border-b border-border">
          <h2 className="font-semibold text-foreground text-sm md:text-base">通知设置</h2>
        </div>
        <div className="divide-y divide-border">
          <SettingItem
            icon={<Bell className="w-5 h-5" />}
            title="推送通知"
            description="接收创作完成、系统更新等通知"
          >
            <button
              onClick={() => setNotifications(!notifications)}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative flex-shrink-0",
                notifications ? "bg-primary" : "bg-secondary"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow",
                  notifications ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </SettingItem>
          <SettingItem
            icon={<Volume2 className="w-5 h-5" />}
            title="声音提醒"
            description="任务完成时播放提示音"
          />
        </div>
      </div>

      {/* Account Section */}
      <div className="glass-card rounded-xl md:rounded-2xl overflow-hidden mb-4 md:mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="p-3 md:p-4 border-b border-border">
          <h2 className="font-semibold text-foreground text-sm md:text-base">账户与安全</h2>
        </div>
        <div className="divide-y divide-border">
          <SettingItem
            icon={<User className="w-5 h-5" />}
            title="个人信息"
            description="管理您的个人资料"
          />
          <SettingItem
            icon={<Shield className="w-5 h-5" />}
            title="账户安全"
            description="密码、两步验证等安全设置"
          />
          <SettingItem
            icon={<Globe className="w-5 h-5" />}
            title="语言与地区"
            description="简体中文"
          />
        </div>
      </div>

      {/* About Section */}
      <div className="glass-card rounded-xl md:rounded-2xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
        <div className="p-3 md:p-4 border-b border-border">
          <h2 className="font-semibold text-foreground text-sm md:text-base">关于</h2>
        </div>
        <div className="divide-y divide-border">
          <SettingItem
            icon={<SettingsIcon className="w-5 h-5" />}
            title="版本信息"
            description="当前版本 1.0.0"
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
