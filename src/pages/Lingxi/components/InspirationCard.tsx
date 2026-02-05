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
    <article className="glass-card rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
      <div className="aspect-[16/9] bg-secondary/30 relative overflow-hidden">
        {/* 添加 width/height 防止布局偏移 */}
        <img
          src={item.thumbnail}
          alt={item.title}
          width={320}
          height={180}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-medium text-sm line-clamp-1">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-white/80 mt-1">
            <span>{item.category}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden="true" />
              <span className="tabular-nums">
                {item.uses.toLocaleString()}
              </span>{" "}
              人使用
            </span>
          </div>
        </div>
      </div>
    </article>
  );
});
