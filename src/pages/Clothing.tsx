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
    iconSrc: "/icons/ai-one-click-outfit-custom.webp",
    to: "/ai-hangoutfit",
  },
  {
    title: "AI 陈列",
    description: "智能搭配，一键生成专业店铺陈列方案",
    iconSrc: "/icons/ai-display-custom.webp",
    to: "/ai-display",
  },
  {
    title: "平铺/摆拍生成",
    description: "上传单品图，生成平铺或人形摆拍效果",
    iconSrc: "/icons/fashion-outfit-custom.webp",
    to: "/fashion-outfit",
  },
  {
    title: "模特生成",
    description: "支持对镜自拍和标准模特上身图",
    iconSrc: "/icons/fashion-model-custom.webp",
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {tools.map((tool, index) => (
            <button
              key={tool.title}
              onClick={() => navigate(tool.to)}
              className="glass-card p-3 md:p-5 rounded-xl md:rounded-2xl hover:shadow-lg transition-shadow duration-200 group relative overflow-hidden text-left active:scale-[0.98] opacity-0 animate-fade-in"
              style={{ animationDelay: `${160 + index * 80}ms` }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-2.5 md:mb-4 transition-transform group-hover:scale-110">
                <img src={tool.iconSrc} alt={tool.title} loading="lazy" decoding="async" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
              </div>
              <h3 className="font-semibold text-foreground mb-1 md:mb-2 text-sm md:text-base leading-tight">{tool.title}</h3>
              <p className="hidden sm:block text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">{tool.description}</p>
            </button>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default Clothing;
