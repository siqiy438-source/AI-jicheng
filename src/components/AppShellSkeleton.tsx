export const AppShellSkeleton = () => (
  <div className="flex h-[100dvh] flex-col bg-gradient-main">
    {/* Header skeleton */}
    <div className="min-h-14 flex items-center justify-between px-4 border-b border-border/50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
        <div className="w-12 h-4 rounded bg-muted animate-pulse" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16 h-8 rounded-xl bg-muted animate-pulse" />
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
      </div>
    </div>

    {/* Content skeleton */}
    <div className="flex-1 px-4 py-6 overflow-hidden">
      <div className="w-24 h-5 rounded bg-muted animate-pulse mb-4" />
      <div className="w-48 h-7 rounded bg-muted animate-pulse mb-2" />
      <div className="w-32 h-7 rounded bg-muted animate-pulse mb-8" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>

    {/* Bottom nav skeleton (mobile only) */}
    <div className="h-[72px] border-t border-border/50 flex items-center justify-around px-4 md:hidden">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 rounded bg-muted animate-pulse" />
          <div className="w-8 h-3 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);
