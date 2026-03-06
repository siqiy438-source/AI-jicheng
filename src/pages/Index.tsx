import { PageLayout } from "@/components/PageLayout";
import { HomeQuickEntrances } from "@/components/HomeQuickEntrances";
import { ShowcaseSection } from "@/components/ShowcaseSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative mb-8 overflow-hidden rounded-[28px] border border-border/50 bg-background/45 px-4 py-6 opacity-0 animate-fade-in shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:px-6 md:mb-12 md:rounded-[32px] md:px-8 md:py-8" aria-labelledby="home-hero-title">
        {/* 装饰性浮动几何元素 */}
        <div aria-hidden="true" className="absolute -top-4 right-0 md:right-12 w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 blur-2xl animate-float pointer-events-none" />
        <div aria-hidden="true" className="absolute top-12 -left-8 w-16 h-16 rounded-full bg-gradient-to-tr from-accent/10 to-primary/5 blur-xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

        {/* 装饰标签 */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 md:mb-6">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">灵犀空间</span>
        </div>

        {/* 主标题 */}
        <h1 id="home-hero-title" className="mb-4 max-w-3xl text-[2rem] font-bold leading-[1.08] tracking-tight text-foreground text-balance min-[390px]:text-[2.25rem] md:mb-5 md:text-6xl">
          用 AI 快速生成
          <br />
          <span className="text-gradient">服装图、文案和创意内容</span>
        </h1>

        {/* 副标题 */}
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground/80 text-pretty md:text-base md:leading-relaxed">
          适合服装商家与内容创作者。上传素材或输入想法后，你可以更快完成出图、文案创作与内容整理。
        </p>

        <p className="mt-3 text-xs leading-6 text-muted-foreground/70 md:text-sm">
          适合服装商家、门店运营与内容创作者
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="xl" className="w-full sm:min-w-[168px] sm:w-auto">
            <Link to="/clothing">进入服装工具</Link>
          </Button>
          <Button asChild variant="outline" size="xl" className="w-full sm:min-w-[168px] sm:w-auto">
            <a href="#home-showcase">查看案例</a>
          </Button>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none md:mt-6 md:flex-wrap md:overflow-visible">
          {[
            "服装商家",
            "门店运营",
            "内容创作者",
          ].map((item) => (
            <span
              key={item}
              className="shrink-0 rounded-full border border-border/70 bg-background/75 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-[0_4px_18px_rgba(15,23,42,0.04)]"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <HomeQuickEntrances />

      {/* 产品介绍 + 精选案例 */}
      <ShowcaseSection />
    </PageLayout>
  );
};

export default Index;
