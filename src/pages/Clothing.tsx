import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
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
    iconSrc: "/icons/ai-drawing-custom.png",
    to: "/fashion-outfit",
  },
  {
    title: "服装模特搭配",
    description: "生成真实模特上身效果图，突出穿搭氛围",
    iconSrc: "/icons/ai-drawing-custom.png",
    to: "/fashion-model-outfit",
  },
];

const Clothing = () => {
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
                <ShirtIcon className="w-6 h-6 text-primary" />
                服装
              </h1>
              <p className="text-muted-foreground">服装创作和商品展示相关工具都在这里</p>
            </div>

            <div className="mb-10 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                服装工具
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

export default Clothing;
