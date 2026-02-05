 import { useState } from "react";
 import {
   LayoutDashboard,
   ImageIcon,
   Video,
   FileText,
   Sparkles,
   Users,
   Star,
   Settings,
   FolderOpen,
   Upload,
   ChevronLeft,
   ChevronRight,
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface NavItemProps {
   icon: React.ReactNode;
   label: string;
   active?: boolean;
   badge?: string;
   collapsed?: boolean;
 }
 
 const NavItem = ({ icon, label, active, badge, collapsed }: NavItemProps) => (
   <button
     className={cn(
       "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
       "hover:bg-sidebar-accent group",
       active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
     )}
   >
     <span className={cn(
       "flex-shrink-0 transition-colors",
       active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
     )}>
       {icon}
     </span>
     {!collapsed && (
       <>
         <span className="flex-1 text-left text-sm">{label}</span>
         {badge && (
           <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded">
             {badge}
           </span>
         )}
       </>
     )}
   </button>
 );
 
 interface NavSectionProps {
   title: string;
   children: React.ReactNode;
   collapsed?: boolean;
 }
 
 const NavSection = ({ title, children, collapsed }: NavSectionProps) => (
   <div className="mb-4">
     {!collapsed && (
       <h3 className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
         {title}
       </h3>
     )}
     <div className="space-y-1">{children}</div>
   </div>
 );
 
 export const Sidebar = () => {
   const [collapsed, setCollapsed] = useState(false);
 
   return (
     <aside
       className={cn(
         "h-screen glass border-r border-sidebar-border flex flex-col transition-all duration-300",
         collapsed ? "w-[72px]" : "w-[240px]"
       )}
     >
       {/* Logo */}
       <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
         {!collapsed && (
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
               <Sparkles className="w-4 h-4 text-primary-foreground" />
             </div>
             <span className="font-semibold text-foreground">AI 创作</span>
           </div>
         )}
         {collapsed && (
           <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center mx-auto">
             <Sparkles className="w-4 h-4 text-primary-foreground" />
           </div>
         )}
         <button
           onClick={() => setCollapsed(!collapsed)}
           className={cn(
             "p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors",
             collapsed && "mx-auto mt-2"
           )}
         >
           {collapsed ? (
             <ChevronRight className="w-4 h-4 text-muted-foreground" />
           ) : (
             <ChevronLeft className="w-4 h-4 text-muted-foreground" />
           )}
         </button>
       </div>
 
       {/* Navigation */}
       <nav className="flex-1 overflow-y-auto p-3">
         <NavSection title="工作台" collapsed={collapsed}>
           <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="工作台" active collapsed={collapsed} />
           <NavItem icon={<Sparkles className="w-5 h-5" />} label="创作中心" collapsed={collapsed} />
         </NavSection>
 
         <NavSection title="智能工具" collapsed={collapsed}>
           <NavItem icon={<ImageIcon className="w-5 h-5" />} label="AI 海报" badge="HOT" collapsed={collapsed} />
           <NavItem icon={<ImageIcon className="w-5 h-5" />} label="AI 绘图" badge="NEW" collapsed={collapsed} />
           <NavItem icon={<FileText className="w-5 h-5" />} label="AI 文案" collapsed={collapsed} />
           <NavItem icon={<Star className="w-5 h-5" />} label="更多功能" collapsed={collapsed} />
         </NavSection>
 
         <NavSection title="素材" collapsed={collapsed}>
           <NavItem icon={<FolderOpen className="w-5 h-5" />} label="我的作品" collapsed={collapsed} />
           <NavItem icon={<Upload className="w-5 h-5" />} label="我的素材" collapsed={collapsed} />
         </NavSection>
       </nav>
 
       {/* Footer */}
       <div className="p-3 border-t border-sidebar-border">
         <NavItem icon={<Settings className="w-5 h-5" />} label="设置" collapsed={collapsed} />
       </div>
     </aside>
   );
 };