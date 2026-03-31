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

interface ToolSection {
  title: string;
  description: string;
  tools: ToolItem[];
}

const toolSections: ToolSection[] = [
  {
    title: "做商品展示图",
    description: "适合先把单品做成能上新、能展示、能突出卖点的商品图。",
    tools: [
      {
        title: "AI 一键挂搭图",
        description: "支持 2-3 张服装图生成挂搭效果，完整展示版型与细节。",
        iconSrc: "/icons/ai-one-click-outfit-custom.webp",
        to: "/ai-hangoutfit",
      },
      {
        title: "平铺/摆拍生成",
        description: "上传服饰单品，快速生成平铺或摆拍展示图。",
        iconSrc: "/icons/fashion-outfit-custom.webp",
        to: "/fashion-outfit",
      },
      {
        title: "AI 细节特写",
        description: "先生成主图，再由你选择 3 个真实细节，一键批量生成特写。",
        iconSrc: "/icons/fashion-detail-focus-custom.png",
        to: "/fashion-detail-focus",
      },
    ],
  },
  {
    title: "做模特上身图",
    description: "适合把服装快速放到真人或指定模特身上，看上身效果和穿搭感觉。",
    tools: [
      {
        title: "模特生成",
        description: "支持自拍照或标准模特图，智能生成上身效果。",
        iconSrc: "/icons/fashion-model-custom.webp",
        to: "/fashion-model-outfit",
      },
      {
        title: "AI 定点换衣",
        description: "上传 1 张模特图 + 1-3 张同款服装图，尽量只替换衣服不改人和背景。",
        iconSrc: "/icons/style-coordinator.png",
        to: "/fashion-virtual-tryon",
      },
      {
        title: "裤子上身效果",
        description: "上传裤子图，AI 自动配上衣，生成腰到脚模特上身图。",
        iconSrc: "/icons/fashion-pants-custom.png",
        to: "/fashion-pants",
      },
    ],
  },
  {
    title: "做搭配与陈列",
    description: "适合需要整套搭配建议、穿搭拆解图或店铺陈列方案的时候。",
    tools: [
      {
        title: "AI 陈列",
        description: "根据商品风格，一键生成店铺陈列与搭配方案。",
        iconSrc: "/icons/ai-display-custom.webp",
        to: "/ai-display",
      },
      {
        title: "穿搭拆解图",
        description: "上传模特穿搭图，一键生成左模特右单品的拆解效果图。",
        iconSrc: "/icons/outfit-combo-vintage.png",
        to: "/fashion-breakdown",
      },
      {
        title: "专业搭配师",
        description: "上传一件单品，20年资深服装搭配师为你提供穿搭方案。",
        iconSrc: "/icons/outfit-recommend-custom.png",
        to: "/outfit-recommend",
      },
    ],
  },
  {
    title: "做说明与分析",
    description: "适合补充面料卖点、顾客能看懂的说明文案和营销表达。",
    tools: [
      {
        title: "面料说明生成器",
        description: "拍一张水洗标，自动生成面向顾客的面料营销话术。",
        iconSrc: "/icons/fabric-analysis-custom.png",
        to: "/fabric-analysis",
      },
    ],
  },
];

const Clothing = () => {
  const navigate = useNavigate();

  return (
    <PageLayout maxWidth="6xl" className="py-5 md:py-8">
      <div className="mb-5 md:mb-8 opacity-0 animate-fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <ShirtIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          服装
        </h1>
        <p className="max-w-2xl text-sm leading-6 md:text-base md:leading-7 text-muted-foreground">
          先看你这次想做商品图、上身图、搭配陈列，还是补说明文案。
        </p>
      </div>

      <div
        className="mb-6 rounded-[24px] border border-border/50 bg-background/45 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] opacity-0 animate-fade-in md:mb-7 md:rounded-[28px] md:p-5"
        style={{ animationDelay: "100ms" }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          <h2 className="text-base md:text-lg font-semibold text-foreground">服装工具</h2>
        </div>
        <p className="mt-2 text-xs leading-5 md:text-sm md:leading-6 text-muted-foreground/80">
          手机上会按结果分组展示，你只需要先找“想做出来的图”，再点进对应工具。
        </p>
      </div>

      <div className="space-y-5 md:space-y-8">
        {toolSections.map((section, sectionIndex) => (
          <section
            key={section.title}
            className="rounded-[24px] border border-border/50 bg-background/35 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)] opacity-0 animate-fade-in md:rounded-[28px] md:p-5"
            style={{ animationDelay: `${140 + sectionIndex * 120}ms` }}
          >
            <div className="mb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-[10px] font-semibold tracking-[0.12em] text-primary md:h-7 md:min-w-7 md:text-[11px]">
                      0{sectionIndex + 1}
                    </span>
                    <h3 className="text-sm md:text-base font-semibold text-foreground">{section.title}</h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 md:text-sm md:leading-6 text-muted-foreground/80">
                    {section.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] md:text-xs text-muted-foreground/70">
                  {section.tools.length} 个工具
                </span>
              </div>
              <div className="mt-4 h-px bg-gradient-to-r from-primary/35 via-border to-transparent" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4">
              {section.tools.map((tool, index) => (
                <button
                  key={tool.title}
                  onClick={() => navigate(tool.to)}
                  className="glass-card min-h-[138px] md:min-h-[150px] p-3.5 md:p-5 rounded-[20px] md:rounded-2xl hover:shadow-lg transition-shadow duration-200 group relative overflow-hidden text-left active:scale-[0.98] opacity-0 animate-fade-in"
                  style={{ animationDelay: `${220 + sectionIndex * 140 + index * 70}ms` }}
                >
                  <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-2.5 md:mb-4 transition-transform group-hover:scale-110">
                    <img src={tool.iconSrc} alt={tool.title} loading="lazy" decoding="async" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1.5 md:mb-2 text-sm md:text-base leading-tight line-clamp-2">{tool.title}</h4>
                  <p className="text-[11px] md:text-xs font-medium text-primary/85 mb-1">功能介绍</p>
                  <p className="text-[11px] md:text-sm text-muted-foreground leading-relaxed line-clamp-2 md:line-clamp-2">
                    {tool.description}
                  </p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageLayout>
  );
};

export default Clothing;
