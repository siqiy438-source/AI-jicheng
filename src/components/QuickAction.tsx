 import { cn } from "@/lib/utils";
 
 interface QuickActionProps {
   title: string;
   category: string;
   delay?: number;
 }
 
 export const QuickAction = ({ title, category, delay = 0 }: QuickActionProps) => {
   return (
     <button
       className={cn(
         "w-full p-4 text-left rounded-xl glass-card",
         "hover:scale-[1.01] hover:bg-accent/50 transition-all duration-200",
         "opacity-0 animate-fade-in"
       )}
       style={{ animationDelay: `${delay}ms` }}
     >
       <p className="text-sm text-foreground mb-1 line-clamp-1">"{title}"</p>
       <span className="text-xs text-muted-foreground">{category}</span>
     </button>
   );
 };