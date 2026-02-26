import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Gift, Sparkles } from "lucide-react";

export const WechatBonusDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `wechat_popup_seen_${user.id}`;
    if (!localStorage.getItem(key)) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [user]);

  const handleClose = () => {
    if (user) localStorage.setItem(`wechat_popup_seen_${user.id}`, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="sm:max-w-[360px] p-0 overflow-hidden gap-0 border-0 [&>button:last-child]:hidden"
      >
        {/* 顶部渐变装饰区 — 淡金色 */}
        <div className="relative bg-gradient-to-br from-amber-600/90 to-yellow-700/80 px-6 pt-8 pb-6 text-white">
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="关闭"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>

          {/* 装饰光晕 */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-yellow-300/15 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-amber-300/15 blur-xl pointer-events-none" />

          {/* 标题区 */}
          <div className="relative flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-1">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">新用户专属福利</h2>
            <p className="text-sm text-white/80 leading-relaxed">
              添加创始人微信，备注「灵犀」<br />
              即可获赠
              <span className="inline-flex items-center gap-0.5 mx-1 px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-sm">
                <Sparkles className="w-3 h-3" />300 积分
              </span>
            </p>
          </div>
        </div>

        {/* 二维码区 */}
        <div className="bg-card px-6 py-5 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/10 blur-md" />
            <img
              src="/wechat-qr.jpg"
              alt="创始人微信二维码"
              className="relative w-48 rounded-2xl border-2 border-amber-500/20 bg-white p-1"
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            扫码或长按识别二维码 · 仅限新用户一次
          </p>

          <Button onClick={handleClose} className="w-full mt-1 rounded-xl h-11 bg-amber-600 hover:bg-amber-700 text-white">
            已添加微信，等待积分到账
          </Button>

          <button
            onClick={handleClose}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors pb-1"
          >
            暂不添加
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
