import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { useNavigate } from "react-router-dom";
import {
  Wand2,
  Video,
  Music,
  Type,
  Layers,
  Scissors,
  Camera,
  Mic,
  FileVideo,
  Sparkles,
  Zap,
  Brush,
  ImagePlus,
  ScanFace,
  Languages,
  Bot,
  Clock,
  Palette,
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
      style={{ backgroundColor: `${color}20` }}
    >
      <span style={{ color }}>{icon}</span>
    </div>
    <h3 className="font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
  );
};

const MoreFeatures = () => {
  const aiFeatures: FeatureItemProps[] = [
    {
      icon: <Video className="w-6 h-6" />,
      title: "AI 视频生成",
      description: "文字描述一键生成精彩视频内容",
      status: "coming",
      color: "#ef4444",
    },
    {
      icon: <Music className="w-6 h-6" />,
      title: "AI 音乐生成",
      description: "智能创作背景音乐和配乐",
      status: "coming",
      color: "#8b5cf6",
    },
    {
      icon: <Mic className="w-6 h-6" />,
      title: "AI 配音",
      description: "多种音色，智能文字转语音",
      status: "coming",
      color: "#06b6d4",
    },
    {
      icon: <ScanFace className="w-6 h-6" />,
      title: "AI 数字人",
      description: "打造专属虚拟形象主播",
      status: "coming",
      color: "#ec4899",
    },
    {
      icon: <Languages className="w-6 h-6" />,
      title: "AI 翻译",
      description: "多语言智能翻译，保持风格一致",
      status: "coming",
      color: "#14b8a6",
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: "AI 客服",
      description: "智能对话机器人，7×24小时服务",
      status: "coming",
      color: "#6366f1",
    },
  ];

  const editingTools: FeatureItemProps[] = [
    {
      icon: <Scissors className="w-6 h-6" />,
      title: "智能抠图",
      description: "一键去除背景，精准边缘处理",
      status: "available",
      color: "#10b981",
    },
    {
      icon: <Wand2 className="w-6 h-6" />,
      title: "图片增强",
      description: "提升清晰度，智能修复画质",
      status: "available",
      color: "#f59e0b",
    },
    {
      icon: <ImagePlus className="w-6 h-6" />,
      title: "图片扩展",
      description: "AI 智能扩展图片边界内容",
      status: "coming",
      color: "#3b82f6",
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "图层编辑",
      description: "专业级图层管理与编辑",
      status: "available",
      color: "#a855f7",
    },
    {
      icon: <Brush className="w-6 h-6" />,
      title: "智能修复",
      description: "去除瑕疵，修复老照片",
      status: "available",
      color: "#f43f5e",
    },
    {
      icon: <Type className="w-6 h-6" />,
      title: "文字特效",
      description: "丰富的艺术字效果库",
      status: "available",
      color: "#0ea5e9",
    },
  ];

  const creativeTools: FeatureItemProps[] = [
    {
      icon: <Palette className="w-6 h-6" />,
      title: "AI 海报",
      description: "专业场景海报，一键智能设计",
      status: "available",
      color: "#f59e0b",
      to: "/ai-poster",
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: "产品摄影",
      description: "AI 生成专业级产品展示图",
      status: "coming",
      color: "#84cc16",
    },
    {
      icon: <FileVideo className="w-6 h-6" />,
      title: "视频模板",
      description: "海量精美视频模板一键套用",
      status: "coming",
      color: "#f97316",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "品牌套件",
      description: "统一品牌视觉，批量生成素材",
      status: "coming",
      color: "#eab308",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "批量处理",
      description: "一次处理多张图片，提升效率",
      status: "available",
      color: "#22c55e",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-main">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Page Header */}
            <div className="mb-8 opacity-0 animate-fade-in">
              <h1 className="text-2xl font-bold text-foreground mb-2">更多功能</h1>
              <p className="text-muted-foreground">
                探索更多 AI 创作工具，持续更新中
              </p>
            </div>

            {/* AI Features Section */}
            <div className="mb-10 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI 智能功能
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiFeatures.map((feature) => (
                  <FeatureItem key={feature.title} {...feature} />
                ))}
              </div>
            </div>

            {/* Editing Tools Section */}
            <div className="mb-10 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-green-500" />
                编辑工具
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {editingTools.map((feature) => (
                  <FeatureItem key={feature.title} {...feature} />
                ))}
              </div>
            </div>

            {/* Creative Tools Section */}
            <div className="mb-10 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-500" />
                创意工具
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {creativeTools.map((feature) => (
                  <FeatureItem key={feature.title} {...feature} />
                ))}
              </div>
            </div>

            {/* Coming Soon Banner */}
            <div className="glass-card p-6 rounded-2xl text-center opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
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
