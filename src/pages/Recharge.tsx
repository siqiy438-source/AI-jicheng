import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { useCredits } from "@/contexts/CreditsContext";
import { RECHARGE_TIERS, FEATURE_PRICES, getPaymentOrders } from "@/lib/credits";
import { getAccessToken, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Coins, History, Check, Gift, Loader2, Zap, ImageIcon, FileText,
  Info, ChevronDown, Flame, Crown, Diamond,
} from "lucide-react";
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

/* ── 套餐视觉配置 ── */
const TIER_META: Record<string, {
  name: string;
  icon: typeof Zap;
  cardBg: string;
  iconBg: string;
  iconColor: string;
  ctaVariant: "outline" | "default" | "craft";
}> = {
  "tier_1":    { name: "体验包", icon: Zap,     cardBg: "bg-gradient-to-b from-amber-50/80 to-orange-50/40",   iconBg: "bg-amber-100",                                          iconColor: "text-amber-500",  ctaVariant: "outline" },
  "tier_9.9":  { name: "基础包", icon: Coins,   cardBg: "bg-gradient-to-b from-amber-50 to-orange-50/60",      iconBg: "bg-amber-200/70",                                       iconColor: "text-amber-600",  ctaVariant: "outline" },
  "tier_19.9": { name: "热门包", icon: Flame,   cardBg: "bg-gradient-to-b from-amber-50 to-orange-100/70",     iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",        iconColor: "text-white",      ctaVariant: "default" },
  "tier_39.9": { name: "超值包", icon: Crown,   cardBg: "bg-gradient-to-b from-orange-50 to-amber-100/60",     iconBg: "bg-gradient-to-br from-primary to-amber-500",           iconColor: "text-white",      ctaVariant: "default" },
  "tier_79.9": { name: "至尊包", icon: Diamond, cardBg: "bg-gradient-to-b from-amber-100/80 to-orange-100/60", iconBg: "bg-gradient-to-br from-primary via-amber-500 to-yellow-500", iconColor: "text-white", ctaVariant: "craft" },
};

/* 代表性功能，用于计算可用次数 */
const SHOWCASE_FEATURES = [
  { key: "ai_image_standard", label: "标准绘图" },
  { key: "ai_image_premium",  label: "Pro绘图" },
  { key: "ai_copywriting",    label: "AI文案" },
  { key: "ai_ppt_slide",      label: "PPT单页" },
];

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

  const handleRecharge = async (tierId?: TierId) => {
    const targetTier = tierId || selectedTier;
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
        body: JSON.stringify({ tier_id: targetTier, payment_method: "alipay" }),
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

      {/* Tier Carousel */}
      <div className="-mx-3 xs:-mx-4 md:mx-0 mb-6">
        <div className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory px-3 xs:px-4 md:px-0 pb-4 scrollbar-hide">
          {RECHARGE_TIERS.map((tier, index) => {
            const meta = TIER_META[tier.id];
            const TierIcon = meta.icon;
            const isSelected = selectedTier === tier.id;
            const usages = SHOWCASE_FEATURES.map((f) => ({
              label: f.label,
              count: Math.floor(tier.pointsTotal / (FEATURE_PRICES[f.key]?.cost || 50)),
            }));

            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={cn(
                  "relative flex flex-col rounded-2xl p-5 cursor-pointer",
                  "min-w-[72vw] xs:min-w-[62vw] md:min-w-0 md:flex-1",
                  "snap-center border",
                  meta.cardBg,
                  isSelected
                    ? "border-primary/50 ring-2 ring-primary/40 ring-offset-2 ring-offset-background shadow-lg shadow-primary/15"
                    : "border-border/50 shadow-md hover:shadow-lg hover:border-primary/30",
                  "opacity-0 animate-card-slide-in"
                )}
                style={{ animationDelay: `${index * 80 + 150}ms` }}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-2.5 right-4 z-10">
                    <span className={cn(
                      "px-3 py-1 text-[11px] font-bold rounded-full shadow-sm",
                      tier.badge === "最划算"
                        ? "bg-gradient-to-r from-primary to-amber-500 text-white"
                        : "bg-primary/90 text-white"
                    )}>
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Selected check */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}

                {/* Icon */}
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", meta.iconBg)}>
                  <TierIcon className={cn("w-5 h-5", meta.iconColor)} />
                </div>

                {/* Plan name */}
                <p className="text-sm font-medium text-muted-foreground mb-1">{meta.name}</p>

                {/* Price */}
                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className="text-xs text-foreground/50">¥</span>
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">{tier.amount}</span>
                </div>

                {/* Points */}
                <div className="text-base font-bold text-primary">
                  {tier.pointsBase} <span className="text-xs font-normal text-muted-foreground">积分</span>
                </div>
                {tier.pointsBonus > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Gift className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-emerald-600">+{tier.pointsBonus} 赠送</span>
                  </div>
                )}

                {/* Divider */}
                <div className="h-px bg-border/60 my-3" />

                {/* Feature usage */}
                <div className="flex-1 space-y-1.5 mb-4">
                  {usages.map((u) => (
                    <div key={u.label} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {u.label} <span className="font-semibold text-foreground">x{u.count}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Mobile CTA */}
                <Button
                  variant={meta.ctaVariant}
                  className="w-full md:hidden rounded-xl h-10 text-sm font-semibold"
                  disabled={loading}
                  onClick={(e) => { e.stopPropagation(); handleRecharge(tier.id); }}
                >
                  {loading && selectedTier === tier.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <Zap className="w-4 h-4 mr-1.5" />
                  )}
                  {loading && selectedTier === tier.id ? "创建中..." : "立即充值"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Payment Bar */}
      <div
        className="hidden md:flex items-center justify-between glass-card rounded-2xl px-6 py-4 mb-6 opacity-0 animate-fade-in"
        style={{ animationDelay: "550ms" }}
      >
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
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-2xl font-extrabold text-foreground">¥{selectedTierData.amount}</p>
              <p className="text-xs text-muted-foreground">
                共 <span className="text-primary font-semibold">{selectedTierData.pointsTotal}</span> 积分
              </p>
            </div>
            <Button
              className="min-w-[140px] h-12 text-base font-semibold rounded-xl"
              disabled={loading}
              onClick={() => handleRecharge()}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Zap className="w-5 h-5 mr-2" />
              )}
              {loading ? "创建订单..." : "立即充值"}
            </Button>
          </div>
        )}
      </div>

      {/* Pricing Guide (collapsible) */}
      <details
        className="glass-card rounded-2xl mb-6 overflow-hidden opacity-0 animate-fade-in group"
        style={{ animationDelay: "650ms" }}
      >
        <summary className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 cursor-pointer list-none select-none">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">积分消耗说明</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 md:px-6 md:pb-6 border-t border-border/40 pt-4 space-y-4">
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
      </details>

      {/* Orders History */}
      <div
        className="glass-card rounded-2xl overflow-hidden mb-6 opacity-0 animate-fade-in"
        style={{ animationDelay: "750ms" }}
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