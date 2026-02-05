import { memo } from "react";
import type { Stat } from "../constants";

interface StatCardProps {
  stat: Stat;
}

export const StatCard = memo(function StatCard({ stat }: StatCardProps) {
  const Icon = stat.icon;

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-muted-foreground" />
        {stat.change && (
          <span className="text-xs text-green-500 font-medium">
            {stat.change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
      <div className="text-sm text-muted-foreground">{stat.label}</div>
    </div>
  );
});
