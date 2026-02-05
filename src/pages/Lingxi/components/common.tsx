import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  onViewMore?: () => void;
  linkTo?: string;
  viewMoreText?: string;
  headingId?: string;
}

export const SectionHeader = memo(function SectionHeader({
  title,
  icon: Icon,
  iconColor,
  onViewMore,
  linkTo,
  viewMoreText = "查看更多",
  headingId,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2
        id={headingId}
        className="text-lg font-semibold text-foreground flex items-center gap-2 text-balance"
      >
        <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
        {title}
      </h2>
      {/* 使用 Link 实现正确的导航语义 */}
      {linkTo ? (
        <Link
          to={linkTo}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          {viewMoreText}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      ) : onViewMore ? (
        <button
          onClick={onViewMore}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm touch-action-manipulation"
          aria-label={`${viewMoreText}${title}`}
        >
          {viewMoreText}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      ) : null}
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
      <Icon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" aria-hidden="true" />
      <p className="text-muted-foreground text-sm">{title}</p>
      <p className="text-muted-foreground/60 text-xs mt-1">{description}</p>
    </div>
  );
});
