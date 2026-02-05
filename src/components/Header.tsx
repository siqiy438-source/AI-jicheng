import { Bell, HelpCircle, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { user, loading, signOut } = useAuth();

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

        {loading ? (
          <div className="ml-2 w-20 h-9 bg-muted animate-pulse rounded-xl" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-2 flex items-center gap-2 px-3 py-2 bg-accent hover:bg-accent/80 rounded-xl text-sm font-medium transition-colors">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="max-w-[120px] truncate">
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
            className="ml-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-soft"
          >
            登录
          </Link>
        )}
      </div>
    </header>
  );
};
