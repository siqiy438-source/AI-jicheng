import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { useCredits } from "@/contexts/CreditsContext";
import { RECHARGE_TIERS, FEATURE_PRICES, getPaymentOrders, getCreditTransactions } from "@/lib/credits";
import { getAccessToken, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Coins, History, Check, Gift, Loader2, Zap, ImageIcon, FileText,
  Info, ChevronDown, Flame, Crown, Diamond, ArrowDownCircle, ArrowUpCircle,
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

interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

/* feature_code → 中文名映射 */
const FEATURE_LABELS: Record<string, string> = {
  ai_image_standard: "标准绘图", ai_image_premium: "Pro绘图",
  ai_poster_standard: "海报(标准)", ai_poster_premium: "海报(Pro)",
  ai_display_standard: "陈列图(标准)", ai_display_premium: "陈列图(Pro)",
  ai_outfit_standard: "挂搭图(标准)", ai_outfit_premium: "挂搭图(Pro)",
  ai_fashion_standard: "模特图(标准)", ai_fashion_premium: "模特图(Pro)",
  ai_detail_standard: "细节特写(标准)", ai_detail_premium: "细节特写(Pro)",
  ai_flatlay_standard: "平铺摆拍(标准)", ai_flatlay_premium: "平铺摆拍(Pro)",
  ai_copywriting: "AI文案", ai_ppt_outline: "PPT大纲",
  ai_ppt_slide: "PPT单页", ai_report_page: "报告生成",
};

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
  "tier_1":    { name: "尝鲜版", icon: Zap,     cardBg: "bg-white",                                                    iconBg: "bg-stone-100",                                                  iconColor: "text-stone-400",  ctaVariant: "outline" },
  "tier_9.9":  { name: "轻享版", icon: Coins,   cardBg: "bg-gradient-to-b from-orange-50/60 to-amber-50/30",            iconBg: "bg-amber-100",                                                  iconColor: "text-amber-500",  ctaVariant: "outline" },
  "tier_19.9": { name: "畅创版", icon: Flame,   cardBg: "bg-gradient-to-b from-amber-50 to-orange-100/80",              iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",                iconColor: "text-white",      ctaVariant: "default" },
  "tier_39.9": { name: "专业版", icon: Crown,   cardBg: "bg-gradient-to-b from-orange-100/70 to-amber-200/50",          iconBg: "bg-gradient-to-br from-orange-500 to-amber-600",                iconColor: "text-white",      ctaVariant: "default" },
  "tier_79.9": { name: "旗舰版", icon: Diamond, cardBg: "bg-gradient-to-b from-amber-200/60 to-yellow-100/50",          iconBg: "bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-400",  iconColor: "text-white",      ctaVariant: "craft" },
};

const Recharge = () => {
  const { balance } = useCredits();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<TierId>("tier_19.9");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [historyTab, setHistoryTab] = useState<"recharge" | "consume">("recharge");

  const selectedTierData = RECHARGE_TIERS.find((t) => t.id === selectedTier);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    const { data } = await getPaymentOrders(1, 20);
    setOrders((data as PaymentOrder[]) || []);
    setOrdersLoading(false);
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    const { data } = await getCreditTransactions(1, 30);
    setTransactions((data as CreditTransaction[]) || []);
    setTxLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchTransactions();
  }, [fetchOrders, fetchTransactions]);

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

      {/* Tier Grid */}
      <div className="mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 items-start">
          {RECHARGE_TIERS.map((tier, index) => {
            const meta = TIER_META[tier.id];
            const TierIcon = meta.icon;
            const isSelected = selectedTier === tier.id;
            const usages = [
              { label: "标准绘图", count: Math.floor(tier.pointsTotal / 50) },
              { label: "Pro绘图", count: Math.floor(tier.pointsTotal / 100) },
              { label: "AI文案", count: Math.floor(tier.pointsTotal / 20) },
              { label: "PPT单页", count: Math.floor(tier.pointsTotal / 50) },
            ];

            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={cn(
                  "relative flex flex-col items-center rounded-2xl px-4 pt-5 pb-4 cursor-pointer border text-center",
                  meta.cardBg,
                  isSelected
                    ? "border-primary/50 ring-2 ring-primary/40 ring-offset-2 ring-offset-background shadow-lg shadow-primary/15"
                    : "border-border/50 shadow-sm hover:shadow-md hover:border-primary/30",
                  "opacity-0 animate-card-slide-in"
                )}
                style={{ animationDelay: `${index * 60 + 150}ms` }}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                    <span className={cn(
                      "px-2.5 py-0.5 text-[10px] font-bold rounded-full shadow-sm whitespace-nowrap",
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
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}

                {/* Icon */}
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2", meta.iconBg)}>
                  <TierIcon className={cn("w-5 h-5", meta.iconColor)} />
                </div>

                {/* Plan name */}
                <p className="text-xs font-medium text-muted-foreground mb-1.5">{meta.name}</p>

                {/* Price */}
                <div className="flex items-baseline justify-center gap-0.5 mb-1">
                  <span className="text-sm font-bold text-foreground/60">¥</span>
                  <span className="text-4xl font-black text-foreground tracking-tight">{tier.amount}</span>
                </div>

                {/* Points */}
                <div className="text-sm font-bold text-primary">
                  {tier.pointsBase} <span className="text-[10px] font-normal text-muted-foreground">积分</span>
                </div>
                {tier.pointsBonus > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Gift className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-emerald-600">+{tier.pointsBonus} 赠送</span>
                  </div>
                )}

                {/* Divider */}
                <div className="w-full h-px bg-border/50 my-3" />

                {/* Feature checklist */}
                <div className="inline-flex flex-col space-y-2">
                  {usages.map((u) => (
                    <div key={u.label} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {u.label} <span className="font-semibold text-foreground">×{u.count}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Action */}
      <div
        className="glass-card rounded-2xl p-4 md:p-6 mb-6 opacity-0 animate-fade-in"
        style={{ animationDelay: "450ms" }}
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
          onClick={() => handleRecharge()}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Zap className="w-5 h-5 mr-2" />
          )}
          {loading ? "正在创建订单..." : "立即充值"}
        </Button>
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

      {/* History Tabs */}
      <div
        className="glass-card rounded-2xl overflow-hidden mb-6 opacity-0 animate-fade-in"
        style={{ animationDelay: "750ms" }}
      >
        {/* Tab Header */}
        <div className="flex border-b border-border/60">
          <button
            onClick={() => setHistoryTab("recharge")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors",
              historyTab === "recharge"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            充值记录
          </button>
          <button
            onClick={() => setHistoryTab("consume")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors",
              historyTab === "consume"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            消费记录
          </button>
        </div>

        {/* Recharge Tab */}
        {historyTab === "recharge" && (
          <>
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
          </>
        )}

        {/* Consume Tab */}
        {historyTab === "consume" && (
          <>
            {txLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">暂无消费记录</div>
            ) : (
              <div className="divide-y divide-border/50">
                {transactions.map((tx) => {
                  const isDeduct = tx.type === "deduct";
                  const label = tx.description ? (FEATURE_LABELS[tx.description] || tx.description) : (isDeduct ? "积分消费" : "积分变动");
                  return (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(tx.created_at).toLocaleString("zh-CN")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className={cn("text-sm font-bold", isDeduct ? "text-red-500" : "text-emerald-600")}>
                            {isDeduct ? "-" : "+"}{tx.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">余额 {tx.balance_after}</p>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-medium",
                          isDeduct
                            ? "bg-red-500/10 text-red-500 border-red-200"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                        )}>
                          {isDeduct ? "消费" : tx.type === "refund" ? "退款" : tx.type === "purchase" ? "充值" : "增加"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default Recharge;