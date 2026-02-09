import { PageLayout } from "@/components/PageLayout";
import { SearchBar } from "@/components/SearchBar";
import { FeatureCard } from "@/components/FeatureCard";
import {
  ImageIcon,
  FileText,
  Presentation,
  Wand2,
} from "lucide-react";

const Index = () => {
  const features = [
    {
      customIcon: "/icons/ai-ppt-custom.png",
      title: "AI PPT",
      description: "文字变演示，智能生成幻灯片",
      color: "amber" as const,
      to: "/ai-ppt",
    },
    {
      customIcon: "/icons/ai-drawing-custom.png",
      title: "AI 绘图",
      description: "一句话生成，灵感即刻呈现",
      color: "indigo" as const,
      to: "/ai-drawing",
    },
    {
      customIcon: "/icons/ai-copywriting-custom.png",
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
    <PageLayout>
      {/* Hero Section - 不对称排版 */}
      <div className="mb-10 md:mb-16 opacity-0 animate-fade-in">
        {/* 装饰标签 */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 md:mb-6 rounded-full bg-primary/10 border border-primary/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">创作者工坊</span>
        </div>

        {/* 主标题 - 移动端字号稍小 */}
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 md:mb-4 tracking-tight leading-[1.1]">
          创作无限可能
          <br />
          <span className="text-gradient">一念成形</span>
        </h1>

        {/* 副标题 */}
        <p className="text-base md:text-lg text-muted-foreground max-w-md">
          Hi，欢迎使用 AI 创作平台
          <br />
          <span className="text-foreground/70">我是你的专属创作助手</span>
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-10 md:mb-16 opacity-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <SearchBar />
      </div>

      {/* Feature Cards Section */}
      <div className="opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
        {/* 分组标题 */}
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            核心功能
          </h2>
          <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
        </div>

        {/* 卡片网格 - 移动端保持 2 列，间距调整 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={300 + index * 80}
            />
          ))}
        </div>
      </div>

      {/* 底部装饰 - 移动端简化 */}
      <div className="mt-12 md:mt-20 pt-6 md:pt-8 border-t border-border/50 opacity-0 animate-fade-in" style={{ animationDelay: '600ms' }}>
        <p className="text-sm text-muted-foreground/50 text-center">
          Powered by AI · 让创意触手可及
        </p>
      </div>
    </PageLayout>
  );
};

export default Index;
