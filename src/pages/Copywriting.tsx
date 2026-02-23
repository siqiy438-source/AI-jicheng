import { PageLayout } from "@/components/PageLayout";
import { useNavigate } from "react-router-dom";
import { Sparkles, FileText } from "lucide-react";

interface ToolItem {
  title: string;
  description: string;
  iconSrc: string;
  to: string;
  badge?: string;
}

const tools: ToolItem[] = [
  {
    title: "讲观点文案",
    description: "输出有态度、有说服力的观点内容。",
    iconSrc: "/icons/copywriting-opinion.png",
    to: "/copywriting-opinion",
    badge: "热门",
  },
  {
    title: "教知识文案",
    description: "把专业知识转化为通俗易懂的科普内容。",
    iconSrc: "/icons/copywriting-knowledge.png",
    to: "/copywriting-knowledge",
  },
  {
    title: "晒过程文案",
    description: "展示制作、成长过程的幕后内容。",
    iconSrc: "/icons/copywriting-process.png",
    to: "/copywriting-process",
  },
  {
    title: "讲故事文案",
    description: "用叙事手法包装产品、品牌或经历。",
    iconSrc: "/icons/copywriting-story.png",
    to: "/copywriting-story",
    badge: "热门",
  },
  {
    title: "选题引擎",
    description: "批量生成有吸引力的内容选题灵感。",
    iconSrc: "/icons/copywriting-topic.png",
    to: "/copywriting-topic",
  },
  {
    title: "到店理由文案",
    description: "提炼吸引顾客到店消费的核心理由。",
    iconSrc: "/icons/copywriting-store-visit.png",
    to: "/copywriting-store-visit",
  },
];

const Copywriting = () => {
  const navigate = useNavigate();

  return (
    <PageLayout maxWidth="6xl" className="py-6 md:py-8">
      <div className="mb-6 md:mb-8 opacity-0 animate-fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          文案工具
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">多种文案框架，快速生成高质量内容</p>
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
              {tool.badge && (
                <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                  {tool.badge}
                </span>
              )}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-2.5 md:mb-4 transition-transform group-hover:scale-110">
                <img src={tool.iconSrc} alt={tool.title} loading="lazy" decoding="async" className="w-6 h-6 md:w-8 md:h-8 object-contain" />
              </div>
              <h3 className="font-semibold text-foreground mb-1 md:mb-2 text-sm md:text-base leading-tight">{tool.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">{tool.description}</p>
            </button>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default Copywriting;
