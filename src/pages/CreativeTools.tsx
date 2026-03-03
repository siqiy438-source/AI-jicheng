import { PageLayout } from "@/components/PageLayout";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Palette,
  Grid2x2,
  Video,
  type LucideIcon,
} from "lucide-react";

interface ToolItem {
  title: string;
  description: string;
  to: string;
  iconSrc?: string;
  Icon?: LucideIcon;
}

const tools: ToolItem[] = [
  {
    title: "AI 绘图",
    description: "一句话描述创意，快速生成高质量图片。",
    iconSrc: "/icons/ai-drawing-custom.webp",
    to: "/ai-drawing",
  },
  {
    title: "AI PPT",
    description: "输入文字要点，自动生成结构清晰的演示文稿。",
    iconSrc: "/icons/ai-ppt-custom.webp",
    to: "/ai-ppt",
  },
  {
    title: "生成式报告",
    description: "上传图片自动分析，并一键生成可编辑 PPT 报告。",
    iconSrc: "/icons/generative-report-vintage.png",
    to: "/generative-report",
  },
  {
    title: "视频深度拉片",
    description: "上传视频进行 6 轮深度分析，提炼卖点和改进建议。",
    Icon: Video,
    to: "/video-analysis",
  },
  {
    title: "像素块生成",
    description: "上传图片生成 MARD 色号像素图，适合拼豆和十字绣配色参考。",
    Icon: Grid2x2,
    to: "/pixel-art",
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
        <p className="text-sm md:text-base text-muted-foreground">绘图、PPT 等通用创意生成工具</p>
      </div>

      <div className="mb-8 md:mb-10 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          工具列表
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {tools.map((tool, index) => (
            <button
              key={tool.title}
              onClick={() => navigate(tool.to)}
              className="glass-card p-3 md:p-5 rounded-xl md:rounded-2xl hover:shadow-lg transition-shadow duration-200 group relative overflow-hidden text-left active:scale-[0.98] opacity-0 animate-fade-in"
              style={{ animationDelay: `${160 + index * 80}ms` }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-2.5 md:mb-4 transition-transform group-hover:scale-110">
                {tool.iconSrc ? (
                  <img src={tool.iconSrc} alt={tool.title} loading="lazy" decoding="async" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                ) : tool.Icon ? (
                  <tool.Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                ) : null}
              </div>
              <h3 className="font-semibold text-foreground mb-1 md:mb-2 text-sm md:text-base leading-tight">{tool.title}</h3>
              <p className="text-[11px] md:text-xs font-medium text-primary/85 mb-1">功能介绍</p>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">{tool.description}</p>
            </button>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default CreativeTools;
