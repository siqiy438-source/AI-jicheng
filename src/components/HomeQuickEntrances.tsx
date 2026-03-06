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

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
        {entranceItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="group w-[82vw] max-w-[320px] shrink-0 snap-start rounded-2xl border border-border/60 bg-background/88 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:w-auto md:max-w-none md:p-5"
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent}`}
              >
                <Icon className={`w-5 h-5 ${item.iconClassName}`} aria-hidden="true" />
              </div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <span className="text-xs font-medium text-primary">进入</span>
              </div>
              <p className="min-w-0 text-sm leading-6 text-muted-foreground">{item.description}</p>
              <div
                className="mt-4 h-px bg-gradient-to-r from-primary/20 via-primary/5 to-transparent"
                style={{ animationDelay: `${120 + index * 60}ms` }}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
};
