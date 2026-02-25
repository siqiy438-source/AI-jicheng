import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Users, TrendingUp, DollarSign, Zap, Trophy } from "lucide-react";
import { StatCard } from "./StatCard";
import { TrendChart } from "./TrendChart";
import { FeatureBarList } from "./FeatureBarList";
import { formatCredits } from "@/lib/credits";

interface DashboardStats {
  total_users: number;
  today_users: number;
  month_users: number;
  total_revenue: number;
  today_revenue: number;
  month_revenue: number;
  total_deduct: number;
  today_deduct: number;
}

interface LeaderboardRow {
  email: string;
  current_balance: number;
  total_deduct: number;
  deduct_count: number;
}

export const DashboardTab = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [regTrend, setRegTrend] = useState<{ date: string; count: number }[]>([]);
  const [revTrend, setRevTrend] = useState<{ date: string; revenue: number }[]>([]);
  const [featureUsage, setFeatureUsage] = useState<{ feature: string; total_credits: number }[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [statsRes, regRes, revRes, featureRes, leaderRes] = await Promise.all([
      supabase.rpc("admin_get_dashboard_stats"),
      supabase.rpc("admin_get_registration_trend"),
      supabase.rpc("admin_get_revenue_trend"),
      supabase.rpc("admin_get_feature_usage"),
      supabase.rpc("admin_get_user_leaderboard", { p_limit: 20 }),
    ]);

    if (statsRes.error || !statsRes.data?.success) {
      toast({ title: "加载失败", description: statsRes.error?.message, variant: "destructive" });
    } else {
      setStats(statsRes.data);
    }
    if (regRes.data?.success) setRegTrend(regRes.data.data || []);
    if (revRes.data?.success) setRevTrend(revRes.data.data || []);
    if (featureRes.data?.success) setFeatureUsage(featureRes.data.data || []);
    if (leaderRes.data?.success) setLeaderboard(leaderRes.data.data || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return <div className="py-16 text-center text-muted-foreground text-sm">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="总用户数"
          value={stats?.total_users ?? "-"}
          sub={`今日 +${stats?.today_users ?? 0} · 本月 +${stats?.month_users ?? 0}`}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          title="总收入"
          value={`¥${Number(stats?.total_revenue ?? 0).toFixed(2)}`}
          sub={`今日 ¥${Number(stats?.today_revenue ?? 0).toFixed(2)} · 本月 ¥${Number(stats?.month_revenue ?? 0).toFixed(2)}`}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          title="积分消耗总量"
          value={Number(stats?.total_deduct ?? 0).toFixed(0)}
          sub={`今日消耗 ${Number(stats?.today_deduct ?? 0).toFixed(0)}`}
          icon={<Zap className="w-4 h-4" />}
        />
        <StatCard
          title="本月新增用户"
          value={stats?.month_users ?? "-"}
          sub={`今日新增 ${stats?.today_users ?? 0}`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      {/* 趋势图 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TrendChart data={regTrend} dataKey="count" label="近 30 天注册趋势" color="#6366f1" />
        <TrendChart
          data={revTrend} dataKey="revenue" label="近 30 天收入趋势（元）"
          color="#10b981" formatter={(v) => `¥${v.toFixed(2)}`}
        />
      </div>

      {/* 功能消耗分布 + 用户排行榜 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeatureBarList data={featureUsage} />

        {/* 用户使用排行榜 */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-medium">用户使用排行榜</p>
            <span className="text-xs text-muted-foreground ml-auto">按积分消耗</span>
          </div>
          {leaderboard.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">暂无数据</div>
          ) : (
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
              {leaderboard.map((row, i) => (
                <div key={row.email} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50">
                  <span className={`w-5 text-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate">{row.email}</span>
                  <span className="text-xs tabular-nums text-muted-foreground flex-shrink-0">
                    {formatCredits(row.total_deduct)} 积分
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
