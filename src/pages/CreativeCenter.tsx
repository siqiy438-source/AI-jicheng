import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
  Sparkles,
  Palette,
  ImageIcon,
  FileText,
  Video,
  Mic,
  Wand2,
  TrendingUp,
  Clock,
  Star,
  ArrowRight,
  Zap,
  Target,
  Lightbulb,
  Rocket,
  Crown,
  Gift,
  Calendar,
  BarChart3,
  Users,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// 快捷工具
const quickTools = [
  {
    id: "poster",
    name: "AI 海报",
    description: "一键生成营销海报",
    icon: Palette,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    path: "/ai-poster",
  },
  {
    id: "drawing",
    name: "AI 绘图",
    description: "创意图像生成",
    icon: ImageIcon,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
    path: "/ai-drawing",
  },
  {
    id: "copywriting",
    name: "AI 文案",
    description: "智能文案写作",
    icon: FileText,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
    path: "/ai-copywriting",
  },
  {
    id: "video",
    name: "AI 视频",
    description: "短视频创作",
    icon: Video,
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-50",
    textColor: "text-pink-600",
    path: "#",
    comingSoon: true,
  },
  {
    id: "voice",
    name: "AI 配音",
    description: "智能语音合成",
    icon: Mic,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    path: "#",
    comingSoon: true,
  },
  {
    id: "magic",
    name: "一键改图",
    description: "智能图片编辑",
    icon: Wand2,
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-600",
    path: "#",
    comingSoon: true,
  },
];

// 创作灵感/热门模板
const inspirations = [
  {
    id: "1",
    title: "双十一大促海报",
    category: "电商促销",
    thumbnail: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400",
    uses: 12500,
  },
  {
    id: "2",
    title: "新品上市宣传",
    category: "品牌推广",
    thumbnail: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
    uses: 8900,
  },
  {
    id: "3",
    title: "小红书种草笔记",
    category: "社交媒体",
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400",
    uses: 15600,
  },
  {
    id: "4",
    title: "春节祝福海报",
    category: "节日营销",
    thumbnail: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=400",
    uses: 9800,
  },
];

// 最近创作
const recentWorks = [
  {
    id: "1",
    title: "产品宣传图",
    tool: "AI 绘图",
    time: "2小时前",
    thumbnail: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=200",
  },
  {
    id: "2",
    title: "小红书文案",
    tool: "AI 文案",
    time: "5小时前",
    thumbnail: null,
  },
  {
    id: "3",
    title: "双十一海报",
    tool: "AI 海报",
    time: "昨天",
    thumbnail: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=200",
  },
];

// 创作数据统计
const stats = [
  { label: "本月创作", value: "128", icon: BarChart3, change: "+23%" },
  { label: "累计作品", value: "1,256", icon: Star, change: "" },
  { label: "节省时间", value: "86h", icon: Clock, change: "" },
  { label: "使用天数", value: "45", icon: Calendar, change: "" },
];

// 创作技巧
const tips = [
  {
    id: "1",
    title: "如何写出爆款小红书文案",
    category: "文案技巧",
    readTime: "5分钟",
  },
  {
    id: "2",
    title: "AI绘图提示词优化指南",
    category: "绘图技巧",
    readTime: "8分钟",
  },
  {
    id: "3",
    title: "海报设计的黄金法则",
    category: "设计技巧",
    readTime: "6分钟",
  },
];

const CreativeCenter = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gradient-main">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* 返回按钮 */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回首页</span>
            </button>

            {/* 页面标题 */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">创作中心</h1>
                <p className="text-muted-foreground text-sm">发现灵感，高效创作，成就非凡</p>
              </div>
            </div>

            {/* 数据统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-5 h-5 text-muted-foreground" />
                    {stat.change && (
                      <span className="text-xs text-green-500 font-medium">{stat.change}</span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* 快捷工具 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  快捷工具
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {quickTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => !tool.comingSoon && navigate(tool.path)}
                    className={cn(
                      "glass-card rounded-xl p-4 text-center hover:shadow-lg transition-all group relative",
                      tool.comingSoon && "opacity-70"
                    )}
                  >
                    {tool.comingSoon && (
                      <span className="absolute top-2 right-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        即将上线
                      </span>
                    )}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-transform group-hover:scale-110",
                        tool.bgColor
                      )}
                    >
                      <tool.icon className={cn("w-6 h-6", tool.textColor)} />
                    </div>
                    <div className="font-medium text-foreground text-sm">{tool.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{tool.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧：创作灵感 */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    创作灵感
                  </h2>
                  <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    查看更多
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {inspirations.map((item) => (
                    <div
                      key={item.id}
                      className="glass-card rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
                    >
                      <div className="aspect-[16/9] bg-secondary/30 relative overflow-hidden">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="text-white font-medium text-sm">{item.title}</div>
                          <div className="flex items-center gap-2 text-xs text-white/80 mt-1">
                            <span>{item.category}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {item.uses.toLocaleString()} 人使用
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 创作技巧 */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Target className="w-5 h-5 text-red-500" />
                      创作技巧
                    </h2>
                    <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                      查看更多
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {tips.map((tip) => (
                      <div
                        key={tip.id}
                        className="glass-card rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground text-sm">{tip.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {tip.category} · 阅读 {tip.readTime}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 右侧：最近创作 + 会员权益 */}
              <div className="space-y-6">
                {/* 最近创作 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      最近创作
                    </h2>
                    <button
                      onClick={() => navigate("/my-works")}
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      全部
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentWorks.map((work) => (
                      <div
                        key={work.id}
                        className="glass-card rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="w-12 h-12 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                          {work.thumbnail ? (
                            <img
                              src={work.thumbnail}
                              alt={work.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground text-sm truncate">
                            {work.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {work.tool} · {work.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 会员权益卡片 */}
                <div className="glass-card rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5" />
                      <span className="font-semibold">创作会员</span>
                    </div>
                    <p className="text-sm text-white/90">解锁全部高级功能，创作无限可能</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <Zap className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-foreground">无限次数生成</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <Rocket className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-foreground">优先使用新功能</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <Gift className="w-3 h-3 text-purple-600" />
                      </div>
                      <span className="text-foreground">专属模板素材</span>
                    </div>
                    <button className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all">
                      立即开通
                    </button>
                  </div>
                </div>

                {/* 每日任务 */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-foreground">每日任务</span>
                    <span className="ml-auto text-xs text-muted-foreground">2/3 已完成</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-muted-foreground line-through">登录签到</span>
                      <span className="ml-auto text-xs text-green-500">+10积分</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-muted-foreground line-through">创作1个作品</span>
                      <span className="ml-auto text-xs text-green-500">+20积分</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-border" />
                      <span className="text-sm text-foreground">分享作品到社交平台</span>
                      <span className="ml-auto text-xs text-muted-foreground">+30积分</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreativeCenter;
