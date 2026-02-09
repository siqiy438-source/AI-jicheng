import { useState, useEffect } from "react";
import { PageLayout } from "@/components/PageLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
  ChevronRight,
  Check,
  Camera,
  Mail,
  Calendar,
  Lock,
  Smartphone,
  LogOut,
  Trash2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const { toast } = useToast();
  const { user } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [notifications, setNotifications] = useState(true);
  
  // Dialog states
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: user?.email?.split('@')[0] || "用户",
    email: user?.email || "",
    bio: "",
  });
  
  // Language state
  const [language, setLanguage] = useState<"zh-CN" | "en-US">("zh-CN");

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeMode;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Setting item handlers
  const handleProfileClick = () => {
    setProfileDialogOpen(true);
  };

  const handleSecurityClick = () => {
    setSecurityDialogOpen(true);
  };

  const handleLanguageClick = () => {
    setLanguageDialogOpen(true);
  };

  const handleVersionClick = () => {
    toast({
      title: "灵犀 AI 创作平台",
      description: "版本 1.0.0 • 最新版本",
    });
  };
  
  const handleProfileSave = () => {
    toast({
      title: "保存成功",
      description: "您的个人信息已更新",
    });
    setProfileDialogOpen(false);
  };
  
  const handlePasswordChange = () => {
    toast({
      title: "密码修改",
      description: "密码修改链接已发送到您的邮箱",
    });
  };
  
  const handleLanguageSave = () => {
    toast({
      title: "语言已切换",
      description: language === "zh-CN" ? "当前语言：简体中文" : "Current language: English",
    });
    setLanguageDialogOpen(false);
  };

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
            onClick={handleProfileClick}
          />
          <SettingItem
            icon={<Shield className="w-5 h-5" />}
            title="账户安全"
            description="密码、两步验证等安全设置"
            onClick={handleSecurityClick}
          />
          <SettingItem
            icon={<Globe className="w-5 h-5" />}
            title="语言与地区"
            description="简体中文"
            onClick={handleLanguageClick}
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
            onClick={handleVersionClick}
          />
        </div>
      </div>

      {/* 个人信息弹窗 */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>个人信息</DialogTitle>
            <DialogDescription>管理您的个人资料和公开信息</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* 头像 */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl text-primary-foreground font-semibold">
                {profileForm.username.charAt(0).toUpperCase()}
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Camera className="w-4 h-4" />
                更换头像
              </Button>
            </div>

            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                placeholder="请输入用户名"
              />
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="flex-1"
                />
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">邮箱地址不可修改</p>
            </div>

            {/* 个人简介 */}
            <div className="space-y-2">
              <Label htmlFor="bio">个人简介</Label>
              <Textarea
                id="bio"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="介绍一下自己..."
                rows={3}
              />
            </div>

            {/* 账户信息 */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>注册时间：2024 年 1 月</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleProfileSave} className="gap-2">
              <Save className="w-4 h-4" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 账户安全弹窗 */}
      <Dialog open={securityDialogOpen} onOpenChange={setSecurityDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>账户安全</DialogTitle>
            <DialogDescription>管理您的密码和安全设置</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 修改密码 */}
            <div
              className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={handlePasswordChange}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">修改密码</h3>
                  <p className="text-xs text-muted-foreground">上次修改：30 天前</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* 两步验证 */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">两步验证</h3>
                  <p className="text-xs text-muted-foreground">增强账户安全性</p>
                </div>
              </div>
              <button
                className={cn(
                  "w-12 h-7 rounded-full transition-colors relative flex-shrink-0 bg-secondary"
                )}
              >
                <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform shadow" />
              </button>
            </div>

            {/* 登录设备 */}
            <div className="p-4 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">登录设备</h3>
                  <p className="text-xs text-muted-foreground">管理已登录的设备</p>
                </div>
              </div>
              <div className="space-y-2 pl-13">
                <div className="flex items-center justify-between text-sm">
                  <span>当前设备 (macOS)</span>
                  <span className="text-xs text-green-600">活跃</span>
                </div>
              </div>
            </div>

            {/* 危险区域 */}
            <div className="pt-4 border-t border-border">
              <Button variant="destructive" size="sm" className="gap-2 w-full">
                <Trash2 className="w-4 h-4" />
                注销账户
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                此操作不可恢复，请谨慎操作
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSecurityDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 语言与地区弹窗 */}
      <Dialog open={languageDialogOpen} onOpenChange={setLanguageDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>语言与地区</DialogTitle>
            <DialogDescription>选择您偏好的语言和地区设置</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {/* 简体中文 */}
              <button
                onClick={() => setLanguage("zh-CN")}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                  language === "zh-CN"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🇨🇳</div>
                  <div className="text-left">
                    <div className="font-medium">简体中文</div>
                    <div className="text-xs text-muted-foreground">Simplified Chinese</div>
                  </div>
                </div>
                {language === "zh-CN" && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>

              {/* English */}
              <button
                onClick={() => setLanguage("en-US")}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                  language === "en-US"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🇺🇸</div>
                  <div className="text-left">
                    <div className="font-medium">English</div>
                    <div className="text-xs text-muted-foreground">美国英语</div>
                  </div>
                </div>
                {language === "en-US" && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                💡 更改语言后，部分内容需要刷新页面才能生效
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLanguageDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleLanguageSave}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Settings;
