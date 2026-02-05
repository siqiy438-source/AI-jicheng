import { memo, type ReactNode } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  onViewMore?: () => void;
  viewMoreText?: string;
}

export const SectionHeader = memo(function SectionHeader({
  title,
  icon: Icon,
  iconColor,
  onViewMore,
  viewMoreText = "查看更多",
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        {title}
      </h2>
      {onViewMore && (
        <button
          onClick={onViewMore}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          {viewMoreText}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="glass-card rounded-xl p-6 text-center">
      <Icon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
      <p className="text-muted-foreground text-sm">{title}</p>
      <p className="text-muted-foreground/60 text-xs mt-1">{description}</p>
    </div>
  );
});
