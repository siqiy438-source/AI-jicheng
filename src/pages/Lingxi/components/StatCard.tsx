import { memo } from "react";
import type { Stat } from "../constants";

interface StatCardProps {
  stat: Stat;
}

export const StatCard = memo(function StatCard({ stat }: StatCardProps) {
  const Icon = stat.icon;

  return (
    <article className="glass-card rounded-xl p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
        {stat.change && (
          <span className="text-xs text-green-500 font-medium tabular-nums">
            {stat.change}
          </span>
        )}
      </div>
      {/* tabular-nums 确保数字对齐 */}
      <div className="text-2xl font-bold text-foreground tabular-nums">
        {stat.value}
      </div>
      <div className="text-sm text-muted-foreground">{stat.label}</div>
    </article>
  );
});
