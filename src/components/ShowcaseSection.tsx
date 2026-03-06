import { ShowcaseCard } from "@/components/ShowcaseCard";
import { showcaseCategories } from "@/data/showcaseData";

const categoryDescriptions: Record<string, string> = {
  "服装工具": "把单品素材更快变成可展示的成品图。",
  "创意工具": "把一句想法更快变成内容与视觉成果。",
};

export const ShowcaseSection = () => {
  let cardIndex = 0;
  return (
    <section id="home-showcase" className="space-y-8 scroll-mt-24 sm:space-y-10" aria-labelledby="home-showcase-title">
      <IntroSection />
      {showcaseCategories.map((cat, catIdx) => {
        const baseDelay = 300 + catIdx * 200;
        const visibleItems = cat.items.slice(0, 2);
        return (
          <div key={cat.name} className="opacity-0 animate-fade-in" style={{ animationDelay: `${baseDelay}ms` }}>
            <div className="mb-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary to-accent" aria-hidden="true" />
              <div>
                <h2 className="text-base font-bold text-foreground tracking-wide">{cat.name}</h2>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  {categoryDescriptions[cat.name]}
                </p>
              </div>
              <span className="hidden h-px flex-1 bg-gradient-to-r from-border to-transparent sm:block" aria-hidden="true" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {visibleItems.map((item) => {
                const d = baseDelay + 100 + cardIndex * 80;
                cardIndex++;
                return <ShowcaseCard key={item.id} item={item} delay={d} />;
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
};

function IntroSection() {
  return (
    <div className="opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary to-accent" aria-hidden="true" />
        <h2 id="home-showcase-title" className="text-base font-bold text-foreground tracking-wide">你可以用灵犀完成什么</h2>
        <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
      </div>
      <h3 className="text-lg md:text-xl font-bold text-foreground mb-3 leading-snug text-balance">
        从素材到成品，<span className="text-gradient">更快完成内容创作</span>
      </h3>
      <p className="max-w-2xl text-sm text-muted-foreground leading-[1.8] text-pretty">
        你可以先选一个最接近当前任务的入口，再参考真实案例快速开始。首页只保留最常用的能力，帮助你更短路径进入创作。
      </p>
    </div>
  );
}
