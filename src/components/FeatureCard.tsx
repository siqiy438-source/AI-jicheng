 import { cn } from "@/lib/utils";
 import { LucideIcon } from "lucide-react";
 
 interface FeatureCardProps {
   icon: LucideIcon;
   title: string;
   description: string;
   badge?: string;
   color: "blue" | "purple" | "green" | "orange" | "pink";
   delay?: number;
 }
 
 const colorVariants = {
   blue: "from-blue-400/20 to-blue-500/10 text-blue-600",
   purple: "from-purple-400/20 to-purple-500/10 text-purple-600",
   green: "from-emerald-400/20 to-emerald-500/10 text-emerald-600",
   orange: "from-orange-400/20 to-orange-500/10 text-orange-600",
   pink: "from-pink-400/20 to-pink-500/10 text-pink-600",
 };
 
 const iconBgVariants = {
   blue: "bg-gradient-to-br from-blue-100 to-blue-50",
   purple: "bg-gradient-to-br from-purple-100 to-purple-50",
   green: "bg-gradient-to-br from-emerald-100 to-emerald-50",
   orange: "bg-gradient-to-br from-orange-100 to-orange-50",
   pink: "bg-gradient-to-br from-pink-100 to-pink-50",
 };
 
 export const FeatureCard = ({
   icon: Icon,
   title,
   description,
   badge,
   color,
   delay = 0,
 }: FeatureCardProps) => {
   return (
     <div
       className={cn(
         "group relative p-5 rounded-2xl glass-card cursor-pointer",
         "hover:scale-[1.02] hover:shadow-lg transition-all duration-300",
         "opacity-0 animate-fade-in"
       )}
       style={{ animationDelay: `${delay}ms` }}
     >
       {badge && (
         <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground rounded-full">
           {badge}
         </span>
       )}
       <div
         className={cn(
           "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
           "bg-gradient-to-br",
           iconBgVariants[color]
         )}
       >
         <Icon className={cn("w-7 h-7", colorVariants[color].split(" ").pop())} />
       </div>
       <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
       <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
     </div>
   );
 };