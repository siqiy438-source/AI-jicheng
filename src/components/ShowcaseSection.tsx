import { ShowcaseCard } from "@/components/ShowcaseCard";
import { showcaseCategories } from "@/data/showcaseData";

export const ShowcaseSection = () => {
  let cardIndex = 0;
  return (
    <div className="space-y-8 sm:space-y-10">
      <IntroSection />
      {showcaseCategories.map((cat, catIdx) => {
        const baseDelay = 300 + catIdx * 200;
        return (
          <div key={cat.name} className="opacity-0 animate-fade-in" style={{ animationDelay: `${baseDelay}ms` }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary to-accent" />
              <h2 className="text-base font-bold text-foreground tracking-wide">{cat.name}</h2>
              <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {cat.items.map((item) => {
                const d = baseDelay + 100 + cardIndex * 80;
                cardIndex++;
                return <ShowcaseCard key={item.id} item={item} delay={d} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function IntroSection() {
  return (
    <div className="opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary to-accent" />
        <h2 className="text-base font-bold text-foreground tracking-wide">关于我们</h2>
        <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
      </div>
      <h3 className="text-lg md:text-xl font-bold text-foreground mb-3 leading-snug">
        AI 驱动的<span className="text-gradient">创意设计</span>平台
      </h3>
      <p className="text-sm text-muted-foreground leading-[1.8]">
        灵犀共鸣是一站式 AI 创意工具平台，专为服装行业和内容创作者打造。从模特试穿到平铺展示，从海报设计到智能文案，让创意想法快速落地。
      </p>
    </div>
  );
}
