import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Palette,
} from "lucide-react";

interface ToolItem {
  title: string;
  description: string;
  iconSrc: string;
  to: string;
}

const tools: ToolItem[] = [
  {
    title: "AI 海报",
    description: "专业场景海报，一键智能设计",
    iconSrc: "/icons/ai-poster-custom.png",
    to: "/ai-poster",
  },
  {
    title: "AI 绘图",
    description: "一句话生成图片，灵感即刻呈现",
    iconSrc: "/icons/ai-drawing-custom.png",
    to: "/ai-drawing",
  },
  {
    title: "AI PPT",
    description: "文字变演示，快速生成幻灯片",
    iconSrc: "/icons/ai-ppt-custom.png",
    to: "/ai-ppt",
  },
];

const CreativeTools = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gradient-main">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="mb-8 opacity-0 animate-fade-in">
              <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Palette className="w-6 h-6 text-primary" />
                创意工具
              </h1>
              <p className="text-muted-foreground">海报、绘图、PPT 等通用创意生成工具</p>
            </div>

            <div className="mb-10 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                工具列表
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tools.map((tool) => (
                  <button
                    key={tool.title}
                    onClick={() => navigate(tool.to)}
                    className="glass-card p-5 rounded-2xl hover:shadow-lg transition-all duration-300 group relative overflow-hidden text-left"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                      <img src={tool.iconSrc} alt={tool.title} className="w-10 h-10 object-contain" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

export default CreativeTools;
