import { Bell, HelpCircle, User } from "lucide-react";

export const Header = () => {
  return (
    <header className="h-16 flex items-center justify-between px-6 glass border-b border-border">
      <div className="flex items-center gap-6">
        <nav className="flex items-center gap-1">
          <button className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
            创作中心
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2.5 rounded-xl hover:bg-accent transition-colors">
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
        </button>
        <button className="p-2.5 rounded-xl hover:bg-accent transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>
        <button className="ml-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-soft">
          登录
        </button>
      </div>
    </header>
  );
};
