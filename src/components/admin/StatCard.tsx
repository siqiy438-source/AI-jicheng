interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
}

export const StatCard = ({ title, value, sub, icon }: StatCardProps) => (
  <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
    {icon && (
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
    )}
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground mb-0.5">{title}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  </div>
);
