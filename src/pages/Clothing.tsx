import { PageLayout } from "@/components/PageLayout";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ShirtIcon,
} from "lucide-react";

interface ToolItem {
  title: string;
  description: string;
  iconSrc: string;
  to: string;
}

const tools: ToolItem[] = [
  {
    title: "AI 一键挂搭图",
    description: "上传内搭、上衣、裤子，自动补全包包与配饰",
    iconSrc: "/icons/ai-one-click-outfit-custom.png",
    to: "/ai-hangoutfit",
  },
  {
    title: "AI 陈列",
    description: "智能搭配，一键生成专业店铺陈列方案",
    iconSrc: "/icons/ai-display-custom.png",
    to: "/ai-display",
  },
  {
    title: "服装搭配",
    description: "生成女装平铺搭配图，展示完整单品组合",
    iconSrc: "/icons/fashion-outfit-custom.png",
    to: "/fashion-outfit",
  },
  {
    title: "服装模特搭配",
    description: "生成真实模特上身效果图，突出穿搭氛围",
    iconSrc: "/icons/fashion-model-custom.png",
    to: "/fashion-model-outfit",
  },
];

const Clothing = () => {
  const navigate = useNavigate();

  return (
    <PageLayout maxWidth="6xl" className="py-6 md:py-8">
      <div className="mb-6 md:mb-8 opacity-0 animate-fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <ShirtIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          服装
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">服装创作和商品展示相关工具都在这里</p>
      </div>

      <div className="mb-8 md:mb-10 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          服装工具
        </h2>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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

export default Clothing;
