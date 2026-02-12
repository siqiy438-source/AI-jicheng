import { cn } from "@/lib/utils";

interface GeneratingLoaderProps {
  /** 主提示文字，如"正在生成海报..." */
  message?: string;
  /** 副提示文字 */
  subMessage?: string;
  /** 尺寸：compact 用于内联场景（如聊天气泡），default 用于全屏场景 */
  size?: "compact" | "default";
}

export const GeneratingLoader = ({
  message,
  subMessage,
  size = "default",
}: GeneratingLoaderProps) => {

  if (size === "compact") {
    return (
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <div className="relative w-5 h-5 flex-shrink-0">
          <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <span className="relative block w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary/70" />
        </div>
        <span className="text-sm">{message || "灵犀正在创作中..."}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 md:py-16">
      {/* Logo 呼吸动画 */}
      <div className="relative mb-5 md:mb-6">
        {/* 外圈光晕 */}
        <div className="absolute inset-0 -m-3 rounded-full bg-primary/10 animate-pulse" />
        <div className="absolute inset-0 -m-6 rounded-full bg-primary/5 animate-pulse [animation-delay:300ms]" />
        {/* Logo */}
        <img
          src="/logo.webp"
          alt="灵犀"
          className={cn(
            "relative w-12 h-12 md:w-16 md:h-16 object-cover rounded-2xl",
            "animate-float"
          )}
        />
        {/* 底部光点 */}
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary/30 blur-sm" />
      </div>

      {/* Slogan */}
      <p className="text-sm md:text-base font-medium text-foreground/80 mb-1.5">
        {message || "灵犀正在为你创作..."}
      </p>
      <p className="text-xs md:text-sm text-muted-foreground/60 italic">
        {subMessage || "灵感涌现，创意成型"}
      </p>

      {/* 进度点动画 */}
      <div className="flex gap-1.5 mt-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/50"
            style={{
              animation: "pulse-soft 1.2s ease-in-out infinite",
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
