import { Link } from "react-router-dom";
import { ArrowUpRight, FileText, Palette, Shirt, Sparkles } from "lucide-react";

const entranceItems = [
  {
    label: "服装创作",
    title: "一件衣服，直接拓成挂拍、模特和陈列图",
    description: "适合上新、搭配展示、直播预热和门店视觉，一次把商品表现力拉满。",
    highlights: ["AI 一键挂搭图", "模特生成", "AI 陈列", "细节特写"],
    to: "/clothing",
    icon: Shirt,
    accent: "from-amber-100 via-amber-50 to-white",
    iconClassName: "text-amber-600",
  },
  {
    label: "文案创作",
    title: "一句卖点，继续长成故事、观点和到店理由",
    description: "适合短视频口播、朋友圈发布、商品详情页和活动预热，开口就更像成交内容。",
    highlights: ["讲观点文案", "讲故事文案", "晒过程文案", "到店理由文案"],
    to: "/copywriting",
    icon: FileText,
    accent: "from-orange-100 via-orange-50 to-white",
    iconClassName: "text-orange-600",
  },
  {
    label: "创意输出",
    title: "一个想法，再延展成海报、PPT 和分析报告",
    description: "适合做提案、包装灵感、出视觉草案和整理汇报，让零散想法更快变成可展示成果。",
    highlights: ["AI 绘图", "AI PPT", "生成式报告", "视频深度拉片"],
    to: "/creative-tools",
    icon: Palette,
    accent: "from-stone-100 via-white to-amber-50",
    iconClassName: "text-stone-700",
  },
] as const;

export const HomeQuickEntrances = () => {
  return (
    <section aria-labelledby="home-quick-start" className="mb-10 md:mb-14">
      <div className="flex items-center gap-2 mb-4 md:mb-5">
        <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
        <h2 id="home-quick-start" className="text-sm md:text-base font-semibold text-foreground">
          先挑一个你这次最想做出来的成品
        </h2>
      </div>

      <p className="mb-4 max-w-2xl text-sm text-muted-foreground/80 text-pretty">
        不是先认工具名，而是先选成果方向。点进去后，再细分到最适合你当前任务的工具。
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {entranceItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="group flex min-h-[210px] flex-col rounded-[24px] border border-border/60 bg-background/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:min-h-[228px] md:rounded-[28px] md:p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br md:h-11 md:w-11 ${item.accent}`}
                  >
                    <Icon className={`h-4.5 w-4.5 md:h-5 md:w-5 ${item.iconClassName}`} aria-hidden="true" />
                  </div>
                  <span className="rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-muted-foreground/90 md:text-xs">
                    {item.label}
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-primary/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </div>

              <h3 className="text-[17px] font-semibold leading-7 text-foreground md:text-[19px] md:leading-8">
                {item.title}
              </h3>

              <p className="mt-2 text-[13px] leading-6 text-muted-foreground md:text-sm md:leading-6">{item.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground md:text-xs"
                  >
                    {highlight}
                  </span>
                ))}
              </div>

              <div
                className="mt-auto pt-4"
                style={{ animationDelay: `${120 + index * 60}ms` }}
              >
                <div className="mb-3 flex items-center justify-between text-[12px] font-medium text-primary/85 md:text-xs">
                  <span>进入这一类</span>
                  <span>{item.highlights.length} 个高频入口</span>
                </div>
                <div className="h-px bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
