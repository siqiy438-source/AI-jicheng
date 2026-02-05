import { memo } from "react";
import { Lightbulb, ArrowRight } from "lucide-react";
import type { Tip } from "../constants";

interface TipCardProps {
  tip: Tip;
}

export const TipCard = memo(function TipCard({ tip }: TipCardProps) {
  return (
    <article
      className="glass-card rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow touch-action-manipulation"
      role="button"
      tabIndex={0}
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
        <Lightbulb className="w-5 h-5 text-violet-600" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground text-sm truncate">
          {tip.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {tip.category} · 阅读 {tip.readTime}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
    </article>
  );
});
