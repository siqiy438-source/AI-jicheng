import { PageLayout } from "@/components/PageLayout";
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
    <PageLayout maxWidth="6xl" className="py-6 md:py-8">
      <div className="mb-6 md:mb-8 opacity-0 animate-fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Palette className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          创意工具
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">海报、绘图、PPT 等通用创意生成工具</p>
      </div>

      <div className="mb-8 md:mb-10 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          工具列表
        </h2>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {tools.map((tool, index) => (
            <button
              key={tool.title}
              onClick={() => navigate(tool.to)}
              className="glass-card p-4 md:p-5 rounded-xl md:rounded-2xl hover:shadow-lg transition-all duration-300 group relative overflow-hidden text-left active:scale-[0.98] opacity-0 animate-fade-in"
              style={{ animationDelay: `${160 + index * 80}ms` }}
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4 transition-transform group-hover:scale-110">
                <img src={tool.iconSrc} alt={tool.title} className="w-9 h-9 md:w-10 md:h-10 object-contain" />
              </div>
              <h3 className="font-semibold text-foreground mb-1.5 md:mb-2 text-sm md:text-base">{tool.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">{tool.description}</p>
            </button>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default CreativeTools;
