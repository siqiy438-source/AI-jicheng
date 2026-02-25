interface FeatureBarListProps {
  data: { feature: string; total_credits: number }[];
}

export const FeatureBarList = ({ data }: FeatureBarListProps) => {
  const max = data.length > 0 ? Math.max(...data.map((d) => d.total_credits)) : 1;

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm font-medium mb-3">功能积分消耗分布</p>
      {data.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
          暂无数据
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground truncate max-w-[60%]">{item.feature}</span>
                <span className="text-xs tabular-nums text-muted-foreground flex-shrink-0">
                  {Number(item.total_credits).toFixed(0)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(item.total_credits / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
