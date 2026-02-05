import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { FeatureCard } from "@/components/FeatureCard";
import {
  ImageIcon,
  Video,
  FileText,
  Palette,
  Wand2,
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Palette,
      title: "AI 海报",
      description: "专门场景设计全场景海报设计",
      badge: "HOT",
      color: "blue" as const,
    },
    {
      icon: ImageIcon,
      title: "AI 绘图",
      description: "一句话生成，从AI绘画看灵感",
      badge: "NEW",
      color: "purple" as const,
    },
    {
      icon: FileText,
      title: "AI 文案",
      description: "智能写作，助力内容创造",
      color: "orange" as const,
    },
    {
      icon: Wand2,
      title: "更多功能",
      description: "持续更新中",
      color: "pink" as const,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-main">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-12">
            {/* Hero Section */}
            <div className="text-center mb-10 opacity-0 animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
                创作无限可能，一念成形
              </h1>
              <p className="text-muted-foreground">
                Hi，欢迎使用 AI 创作平台！我是你的专属创作助手
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-12">
              <SearchBar />
            </div>

            {/* Quick Tags */}
            <div className="flex flex-wrap justify-center gap-2 mb-12 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
              {["素材创作", "创意视频", "文案编辑", "品牌创作"].map((tag) => (
                <button
                  key={tag}
                  className="px-4 py-2 text-sm text-muted-foreground bg-secondary/60 hover:bg-secondary rounded-full transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
              {features.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  {...feature}
                  delay={150 + index * 50}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
