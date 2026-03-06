import { Link } from "react-router-dom";
import { FileText, Palette, Shirt, Sparkles } from "lucide-react";

const entranceItems = [
  {
    title: "服装工具",
    description: "挂搭图、模特图、陈列图。",
    to: "/clothing",
    icon: Shirt,
    accent: "from-amber-100 via-amber-50 to-white",
    iconClassName: "text-amber-600",
  },
  {
    title: "文案工具",
    description: "卖点文案、故事文案、到店理由。",
    to: "/copywriting",
    icon: FileText,
    accent: "from-orange-100 via-orange-50 to-white",
    iconClassName: "text-orange-600",
  },
  {
    title: "创意工具",
    description: "图片、PPT 与更多创意内容。",
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
          选择你的开始方式
        </h2>
      </div>

      <p className="mb-4 max-w-2xl text-sm text-muted-foreground/80 text-pretty">
        先选最接近你当前任务的入口，再继续创作。
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-3">
        {entranceItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="group flex min-h-[132px] flex-col rounded-[20px] border border-border/60 bg-background/88 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:min-h-0 md:rounded-2xl md:p-5"
            >
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br md:mb-4 md:h-11 md:w-11 md:rounded-2xl ${item.accent}`}
              >
                <Icon className={`h-4.5 w-4.5 md:h-5 md:w-5 ${item.iconClassName}`} aria-hidden="true" />
              </div>
              <div className="mb-1.5 flex items-start justify-between gap-2 md:mb-2 md:items-center md:gap-3">
                <h3 className="text-[15px] font-semibold leading-5 text-foreground md:text-base">{item.title}</h3>
                <span className="text-[12px] font-medium text-primary md:text-xs">进入</span>
              </div>
              <p className="line-clamp-1 min-w-0 text-[12px] leading-5 text-muted-foreground md:text-sm md:leading-6">{item.description}</p>
              <div
                className="mt-auto pt-3"
                style={{ animationDelay: `${120 + index * 60}ms` }}
              >
                <div className="h-px bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
