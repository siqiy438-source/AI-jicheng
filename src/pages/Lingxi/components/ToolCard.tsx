import { memo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { QuickTool } from "../constants";

interface ToolCardProps {
  tool: QuickTool;
}

export const ToolCard = memo(function ToolCard({ tool }: ToolCardProps) {
  const Icon = tool.icon;

  // 如果是即将上线的工具，使用 div 而非可交互元素
  if (tool.comingSoon) {
    return (
      <div
        className="glass-card rounded-xl p-4 text-center opacity-70 relative"
        aria-disabled="true"
      >
        <span className="absolute top-2 right-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
          即将上线
        </span>
        <div
          className={cn(
            "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center",
            tool.bgColor
          )}
        >
          <Icon className={cn("w-6 h-6", tool.textColor)} aria-hidden="true" />
        </div>
        <div className="font-medium text-foreground text-sm">{tool.name}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {tool.description}
        </div>
      </div>
    );
  }

  // 使用 Link 实现正确的导航语义
  return (
    <Link
      to={tool.path}
      className={cn(
        "glass-card rounded-xl p-4 text-center group relative block",
        "transition-shadow hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "touch-action-manipulation"
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center",
          "transition-transform duration-200 group-hover:scale-110",
          tool.bgColor
        )}
      >
        <Icon className={cn("w-6 h-6", tool.textColor)} aria-hidden="true" />
      </div>
      <div className="font-medium text-foreground text-sm">{tool.name}</div>
      <div className="text-xs text-muted-foreground mt-1">
        {tool.description}
      </div>
    </Link>
  );
});
