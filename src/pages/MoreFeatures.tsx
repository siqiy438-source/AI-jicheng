import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Zap,
  Clock,
  Palette,
  Store,
} from "lucide-react";

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "available" | "coming";
  color: string;
  to?: string;
}

const FeatureItem = ({ icon, title, description, status, color, to }: FeatureItemProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => to && navigate(to)}
      className={`glass-card p-5 rounded-2xl hover:shadow-lg transition-all duration-300 group relative overflow-hidden ${to ? "cursor-pointer" : "cursor-default"}`}
    >
    {status === "coming" && (
      <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs rounded-full flex items-center gap-1">
        <Clock className="w-3 h-3" />
        即将上线
      </div>
    )}
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}
    >
      {icon}
    </div>
    <h3 className="font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
  );
};

const MoreFeatures = () => {
  const features: FeatureItemProps[] = [
    {
      icon: <img src="/icons/ai-display-custom.png" alt="AI 陈列" className="w-10 h-10 object-contain" />,
      title: "AI 陈列",
      description: "智能搭配，一键生成专业店铺陈列方案",
      status: "available",
      color: "#f43f5e",
      to: "/ai-display",
    },
    {
      icon: <img src="/icons/ai-poster-custom.png" alt="AI 海报" className="w-10 h-10 object-contain" />,
      title: "AI 海报",
      description: "专业场景海报，一键智能设计",
      status: "available",
      color: "#f59e0b",
      to: "/ai-poster",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-main">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="mb-8 opacity-0 animate-fade-in">
              <h1 className="text-2xl font-bold text-foreground mb-2">更多功能</h1>
              <p className="text-muted-foreground">
                探索更多 AI 创作工具，持续更新中
              </p>
            </div>

            <div className="mb-10 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI 工具
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature) => (
                  <FeatureItem key={feature.title} {...feature} />
                ))}
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl text-center opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                更多功能持续开发中
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                我们正在努力开发更多强大的 AI 创作工具，敬请期待！
                如有功能建议，欢迎反馈给我们。
              </p>
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

export default MoreFeatures;
