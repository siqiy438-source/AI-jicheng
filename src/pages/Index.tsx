import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { FeatureCard } from "@/components/FeatureCard";
import {
  ImageIcon,
  FileText,
  Palette,
  Wand2,
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Palette,
      title: "AI 海报",
      description: "专业场景海报，一键智能设计",
      color: "amber" as const,
      to: "/ai-poster",
    },
    {
      icon: ImageIcon,
      title: "AI 绘图",
      description: "一句话生成，灵感即刻呈现",
      color: "indigo" as const,
      to: "/ai-drawing",
    },
    {
      icon: FileText,
      title: "AI 文案",
      description: "智能写作，助力内容创造",
      color: "emerald" as const,
      to: "/ai-copywriting",
    },
    {
      icon: Wand2,
      title: "更多功能",
      description: "持续更新中",
      color: "violet" as const,
      to: "/more-features",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-main">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-4xl mx-auto px-6 py-16">
            {/* Hero Section - 不对称排版 */}
            <div className="mb-16 opacity-0 animate-fade-in">
              {/* 装饰标签 */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">创作者工坊</span>
              </div>

              {/* 主标题 */}
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight leading-[1.1]">
                创作无限可能
                <br />
                <span className="text-gradient">一念成形</span>
              </h1>

              {/* 副标题 */}
              <p className="text-lg text-muted-foreground max-w-md">
                Hi，欢迎使用 AI 创作平台
                <br />
                <span className="text-foreground/70">我是你的专属创作助手</span>
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-16 opacity-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <SearchBar />
            </div>

            {/* Feature Cards Section */}
            <div className="opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
              {/* 分组标题 */}
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                  核心功能
                </h2>
                <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              </div>

              {/* 卡片网格 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {features.map((feature, index) => (
                  <FeatureCard
                    key={feature.title}
                    {...feature}
                    delay={300 + index * 80}
                  />
                ))}
              </div>
            </div>

            {/* 底部装饰 */}
            <div className="mt-20 pt-8 border-t border-border/50 opacity-0 animate-fade-in" style={{ animationDelay: '600ms' }}>
              <p className="text-xs text-muted-foreground/50 text-center">
                Powered by AI · 让创意触手可及
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
