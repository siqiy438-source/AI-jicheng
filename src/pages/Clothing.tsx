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
    description: "支持 2-3 张服装图生成挂搭效果，完整展示版型与细节。",
    iconSrc: "/icons/ai-one-click-outfit-custom.webp",
    to: "/ai-hangoutfit",
  },
  {
    title: "AI 陈列",
    description: "根据商品风格，一键生成店铺陈列与搭配方案。",
    iconSrc: "/icons/ai-display-custom.webp",
    to: "/ai-display",
  },
  {
    title: "平铺/摆拍生成",
    description: "上传服饰单品，快速生成平铺或摆拍展示图。",
    iconSrc: "/icons/fashion-outfit-custom.webp",
    to: "/fashion-outfit",
  },
  {
    title: "模特生成",
    description: "支持自拍照或标准模特图，智能生成上身效果。",
    iconSrc: "/icons/fashion-model-custom.webp",
    to: "/fashion-model-outfit",
  },
  {
    title: "裤子上身效果",
    description: "上传裤子图，AI 自动配上衣，生成腰到脚模特上身图。",
    iconSrc: "/icons/fashion-outfit-custom.webp",
    to: "/fashion-pants",
  },
  {
    title: "AI 细节特写",
    description: "先生成主图，再按衣服真实存在的元素输出细节特写。",
    iconSrc: "/icons/fashion-outfit-custom.webp",
    to: "/fashion-detail-focus",
  },
  {
    title: "专业搭配师",
    description: "上传一件单品，20年资深服装搭配师为你提供穿搭方案。",
    iconSrc: "/icons/fashion-outfit-custom.webp",
    to: "/outfit-recommend",
  },
  {
    title: "面料说明生成器",
    description: "拍一张水洗标，自动生成面向顾客的面料营销话术。",
    iconSrc: "/icons/fashion-outfit-custom.webp",
    to: "/fabric-analysis",
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
              <p className="text-[11px] md:text-xs font-medium text-primary/85 mb-1">功能介绍</p>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">{tool.description}</p>
            </button>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default Clothing;
