 import { Search, Send } from "lucide-react";
 import { useState } from "react";
 import { cn } from "@/lib/utils";
 
 export const SearchBar = () => {
   const [focused, setFocused] = useState(false);
   const [value, setValue] = useState("");
 
   return (
     <div
       className={cn(
         "relative w-full max-w-2xl mx-auto transition-all duration-300",
         focused && "scale-[1.02]"
       )}
     >
       <div
         className={cn(
           "flex items-center gap-3 px-5 py-4 rounded-2xl glass-card transition-all duration-300",
           focused && "ring-2 ring-primary/30"
         )}
       >
         <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
         <input
           type="text"
           value={value}
           onChange={(e) => setValue(e.target.value)}
           onFocus={() => setFocused(true)}
           onBlur={() => setFocused(false)}
           placeholder="请告诉我需要帮你做的事情..."
           className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
         />
         <span className="text-xs text-muted-foreground mr-2">{value.length}/500</span>
         <button
           className={cn(
             "p-2.5 rounded-xl transition-all duration-200",
             value.length > 0
               ? "bg-primary text-primary-foreground shadow-soft"
               : "bg-muted text-muted-foreground"
           )}
         >
           <Send className="w-4 h-4" />
         </button>
       </div>
     </div>
   );
 };