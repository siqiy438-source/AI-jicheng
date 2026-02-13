import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useCredits } from "@/contexts/CreditsContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Status = "loading" | "paid" | "pending" | "failed";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshBalance } = useCredits();
  const orderNo = searchParams.get("out_trade_no") || "";

  const [status, setStatus] = useState<Status>("loading");
  const [credits, setCredits] = useState<number>(0);
  const pollCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const checkOrder = useCallback(async () => {
    if (!orderNo) {
      setStatus("failed");
      return;
    }
    const { data } = await supabase
      .from("payment_orders")
      .select("status, credits_total")
      .eq("order_no", orderNo)
      .single();

    if (!data) {
      setStatus("failed");
      return;
    }
    if (data.status === "paid") {
      setStatus("paid");
      setCredits(data.credits_total);
      await refreshBalance();
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (data.status === "failed") {
      setStatus("failed");
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    // still pending
    setStatus("pending");
    pollCount.current += 1;
    if (pollCount.current >= 10 && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [orderNo, refreshBalance]);

  useEffect(() => {
    checkOrder();
    timerRef.current = setInterval(() => {
      if (pollCount.current >= 10) {
        clearInterval(timerRef.current);
        return;
      }
      checkOrder();
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkOrder]);

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 md:p-12 max-w-sm w-full text-center space-y-6">
        {(status === "loading" || status === "pending") && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
            <h1 className="text-xl font-bold text-foreground">支付处理中...</h1>
            <p className="text-sm text-muted-foreground">
              正在确认支付结果，请稍候
            </p>
          </>
        )}

        {status === "paid" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold text-foreground">充值成功</h1>
            <p className="text-3xl font-bold text-primary">+{credits} 积分</p>
            <p className="text-sm text-muted-foreground">积分已到账，快去创作吧</p>
            <Button className="w-full" size="lg" onClick={() => navigate("/")}>
              返回首页
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold text-foreground">支付失败</h1>
            <p className="text-sm text-muted-foreground">
              支付未完成或订单不存在
            </p>
            <Button className="w-full" size="lg" onClick={() => navigate("/recharge")}>
              重新充值
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;
