import { memo } from "react";
import { Users } from "lucide-react";
import type { Inspiration } from "../constants";

interface InspirationCardProps {
  item: Inspiration;
}

export const InspirationCard = memo(function InspirationCard({
  item,
}: InspirationCardProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
      <div className="aspect-[16/9] bg-secondary/30 relative overflow-hidden">
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-white font-medium text-sm">{item.title}</div>
          <div className="flex items-center gap-2 text-xs text-white/80 mt-1">
            <span>{item.category}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {item.uses.toLocaleString()} 人使用
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
