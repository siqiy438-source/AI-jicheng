import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { useCredits } from "@/contexts/CreditsContext";
import { RECHARGE_TIERS, getPaymentOrders } from "@/lib/credits";
import { getAccessToken, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Coins, History, Check, Gift, Loader2, Zap, ImageIcon, FileText, Presentation, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type TierId = (typeof RECHARGE_TIERS)[number]["id"];

interface PaymentOrder {
  id: string;
  order_no: string;
  amount: number;
  credits_total: number;
  status: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "处理中", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  paid: { label: "已完成", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  failed: { label: "失败", color: "bg-red-500/10 text-red-500 border-red-200" },
};

const Recharge = () => {
  const { balance } = useCredits();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<TierId>("tier_19.9");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const selectedTierData = RECHARGE_TIERS.find((t) => t.id === selectedTier);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    const { data } = await getPaymentOrders(1, 20);
    setOrders((data as PaymentOrder[]) || []);
    setOrdersLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRecharge = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        toast({ title: "请先登录", description: "您需要登录后才能充值" });
        return;
      }
      const response = await fetch(`${supabaseUrl}/functions/v1/payment-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier_id: selectedTier, payment_method: "alipay" }),
      });
      if (!response.ok) {
        const text = await response.text();
        let msg = "请稍后重试";
        try { const j = JSON.parse(text); msg = j.error || j.message || msg; } catch {}
        toast({ title: "创建订单失败", description: msg });
        return;
      }
      const result = await response.json();
      if (result.success && result.payment_url) {
        window.location.href = result.payment_url;
      } else {
        toast({ title: "创建订单失败", description: result.error || "请稍后重试" });
      }
    } catch {
      toast({ title: "网络错误", description: "请检查网络连接后重试" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout maxWidth="4xl">
      {/* Balance Hero */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6 opacity-0 animate-fade-in"
        style={{ animationDelay: "50ms" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-amber-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative px-5 py-6 md:px-8 md:py-8 flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/70 text-xs md:text-sm mb-1">当前积分余额</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-extrabold text-primary-foreground tracking-tight">
                {balance ?? "—"}
              </span>
              <span className="text-primary-foreground/60 text-sm">积分</span>
            </div>
            <p className="text-primary-foreground/50 text-[11px] md:text-xs mt-1.5">一次购买，永久有效，无到期时间</p>
          </div>
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <Coins className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Tier Selection */}
      <div className="mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {RECHARGE_TIERS.map((tier) => {
            const isSelected = selectedTier === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={cn(
                  "relative group rounded-2xl p-4 md:p-5 text-left transition-all duration-200 overflow-hidden",
                  "border-2",
                  isSelected
                    ? "border-primary bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 shadow-lg shadow-primary/10 scale-[1.02]"
                    : "border-border/60 bg-card hover:border-primary/40 hover:shadow-md"
                )}
              >
                {tier.badge && (
                  <span className={cn(
                    "absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    tier.badge === "最划算"
                      ? "bg-gradient-to-r from-primary to-amber-500 text-white"
                      : "bg-primary/10 text-primary"
                  )}>
                    {tier.badge}
                  </span>
                )}

                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}

                <div className={cn("text-xl md:text-2xl font-extrabold text-foreground mb-1", tier.badge && "mt-5")}>
                  {tier.label}
                </div>
                <div className="text-base md:text-lg font-bold text-primary">
                  {tier.pointsBase} <span className="text-xs font-normal text-muted-foreground">积分</span>
                </div>
                {tier.pointsBonus > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <Gift className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-emerald-600">
                      +{tier.pointsBonus} 赠送
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pricing Guide */}
      <div
        className="glass-card rounded-2xl p-4 md:p-6 mb-6 opacity-0 animate-fade-in"
        style={{ animationDelay: "250ms" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">积分消耗说明</h2>
        </div>

        <div className="space-y-4">
          {/* Image Generation */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ImageIcon className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">图片生成</span>
              <span className="text-[10px] text-muted-foreground">（绘图 / 海报 / 陈列 / 挂搭 / 模特 / 细节特写 / 平铺摆拍）</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/40">
                <span className="text-xs text-muted-foreground">标准模式</span>
                <span className="text-xs font-bold text-foreground">50 积分/次</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/40">
                <span className="text-xs text-muted-foreground">Pro 模式</span>
                <span className="text-xs font-bold text-foreground">100 积分/次</span>
              </div>
            </div>
          </div>

          {/* Text & PPT & Report */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">文案 / PPT / 报告</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/40">
                <span className="text-xs text-muted-foreground">AI 文案</span>
                <span className="text-xs font-bold text-foreground">20 积分/次</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/40">
                <span className="text-xs text-muted-foreground">PPT 大纲</span>
                <span className="text-xs font-bold text-foreground">30 积分/次</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/40">
                <span className="text-xs text-muted-foreground">PPT 单页</span>
                <span className="text-xs font-bold text-foreground">50 积分/次</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/40">
                <span className="text-xs text-muted-foreground">报告生成</span>
                <span className="text-xs font-bold text-foreground">40 积分/页</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Action */}
      <div
        className="glass-card rounded-2xl p-4 md:p-6 mb-6 opacity-0 animate-fade-in"
        style={{ animationDelay: "350ms" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1677FF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              支
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">支付宝支付</p>
              <p className="text-xs text-muted-foreground">安全快捷</p>
            </div>
          </div>
          {selectedTierData && (
            <div className="text-right">
              <p className="text-xl font-extrabold text-foreground">¥{selectedTierData.amount}</p>
              <p className="text-xs text-muted-foreground">
                共 <span className="text-primary font-semibold">{selectedTierData.pointsTotal}</span> 积分
              </p>
            </div>
          )}
        </div>

        <Button
          className="w-full h-12 text-base font-semibold rounded-xl"
          disabled={loading}
          onClick={handleRecharge}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Zap className="w-5 h-5 mr-2" />
          )}
          {loading ? "正在创建订单..." : "立即充值"}
        </Button>
      </div>

      {/* Orders History */}
      <div
        className="glass-card rounded-2xl overflow-hidden mb-6 opacity-0 animate-fade-in"
        style={{ animationDelay: "450ms" }}
      >
        <div className="px-4 py-3 md:px-5 md:py-4 border-b border-border/60 flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground text-sm">充值记录</h2>
        </div>

        {ordersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">暂无充值记录</div>
        ) : (
          <div className="divide-y divide-border/50">
            {orders.map((order) => {
              const st = statusMap[order.status] || statusMap.pending;
              return (
                <div key={order.id} className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">积分充值</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        ¥{Number(order.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-primary font-medium">{order.credits_total} 积分</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] font-medium", st.color)}>
                      {st.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Recharge;
