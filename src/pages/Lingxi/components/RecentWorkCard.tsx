import { memo } from "react";
import { FileText } from "lucide-react";
import type { RecentWork } from "../constants";

interface RecentWorkCardProps {
  work: RecentWork;
}

export const RecentWorkCard = memo(function RecentWorkCard({
  work,
}: RecentWorkCardProps) {
  return (
    <div className="glass-card rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all">
      <div className="w-12 h-12 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
        {work.thumbnail ? (
          <img
            src={work.thumbnail}
            alt={work.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground text-sm truncate">
          {work.title}
        </div>
        <div className="text-xs text-muted-foreground">
          {work.tool} · {work.time}
        </div>
      </div>
    </div>
  );
});
