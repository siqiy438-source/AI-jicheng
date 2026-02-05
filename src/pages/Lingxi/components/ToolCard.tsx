import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { QuickTool } from "../constants";

interface ToolCardProps {
  tool: QuickTool;
}

export const ToolCard = memo(function ToolCard({ tool }: ToolCardProps) {
  const navigate = useNavigate();
  const Icon = tool.icon;

  const handleClick = useCallback(() => {
    if (!tool.comingSoon) {
      navigate(tool.path);
    }
  }, [tool.comingSoon, tool.path, navigate]);

  return (
    <button
      onClick={handleClick}
      className={cn(
        "glass-card rounded-xl p-4 text-center hover:shadow-lg transition-all group relative",
        tool.comingSoon && "opacity-70"
      )}
    >
      {tool.comingSoon && (
        <span className="absolute top-2 right-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
          即将上线
        </span>
      )}
      <div
        className={cn(
          "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-transform group-hover:scale-110",
          tool.bgColor
        )}
      >
        <Icon className={cn("w-6 h-6", tool.textColor)} />
      </div>
      <div className="font-medium text-foreground text-sm">{tool.name}</div>
      <div className="text-xs text-muted-foreground mt-1">
        {tool.description}
      </div>
    </button>
  );
});
