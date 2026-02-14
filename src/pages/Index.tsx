import { PageLayout } from "@/components/PageLayout";
import { ShowcaseSection } from "@/components/ShowcaseSection";

const Index = () => {
  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="mb-8 md:mb-12 opacity-0 animate-fade-in relative">
        {/* 装饰性浮动几何元素 */}
        <div className="absolute -top-4 right-0 md:right-12 w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 blur-2xl animate-float pointer-events-none" />
        <div className="absolute top-12 -left-8 w-16 h-16 rounded-full bg-gradient-to-tr from-accent/10 to-primary/5 blur-xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

        {/* 装饰标签 */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 md:mb-6 rounded-full bg-primary/10 border border-primary/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">灵犀空间</span>
        </div>

        {/* 主标题 */}
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 md:mb-5 tracking-tight leading-[1.05]">
          灵犀共鸣
          <br />
          <span className="text-gradient">想法成型</span>
        </h1>

        {/* 副标题 */}
        <p className="text-sm md:text-base text-muted-foreground/80 max-w-md leading-relaxed">
          用 AI 释放创意，让每一个灵感都能变成作品
        </p>
      </div>

      {/* 产品介绍 + 精选案例 */}
      <ShowcaseSection />
    </PageLayout>
  );
};

export default Index;
