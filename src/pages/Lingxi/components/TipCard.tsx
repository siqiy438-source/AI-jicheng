import { memo } from "react";
import { Lightbulb, ArrowRight } from "lucide-react";
import type { Tip } from "../constants";

interface TipCardProps {
  tip: Tip;
}

export const TipCard = memo(function TipCard({ tip }: TipCardProps) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
        <Lightbulb className="w-5 h-5 text-violet-600" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-foreground text-sm">{tip.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {tip.category} · 阅读 {tip.readTime}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground" />
    </div>
  );
});
