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
  Clock,
  Star,
  ArrowRight,
  Zap,
  Target,
  Lightbulb,
  Calendar,
  BarChart3,
  Users,
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

// 创作数据统计 - 新用户默认为零
const stats = [
  { label: "本月创作", value: "0", icon: BarChart3, change: "" },
  { label: "累计作品", value: "0", icon: Star, change: "" },
  { label: "节省时间", value: "0h", icon: Clock, change: "" },
  { label: "使用天数", value: "0", icon: Calendar, change: "" },
];

// 创作灵感/热门模板 - 新用户为空
const inspirations: Array<{
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  uses: number;
}> = [];

// 最近创作 - 新用户为空
const recentWorks: Array<{
  id: string;
  title: string;
  tool: string;
  time: string;
  thumbnail: string | null;
}> = [];

// 创作技巧 - 新用户为空
const tips: Array<{
  id: string;
  title: string;
  category: string;
  readTime: string;
}> = [];

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
                  {inspirations.length > 0 ? (
                    inspirations.map((item) => (
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
                    ))
                  ) : (
                    <div className="col-span-2 glass-card rounded-xl p-8 text-center">
                      <Lightbulb className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">暂无创作灵感</p>
                      <p className="text-muted-foreground/60 text-xs mt-1">开始创作后，这里会为你推荐灵感</p>
                    </div>
                  )}
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
                    {tips.length > 0 ? (
                      tips.map((tip) => (
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
                      ))
                    ) : (
                      <div className="glass-card rounded-xl p-6 text-center">
                        <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">暂无创作技巧</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">更多技巧即将上线</p>
                      </div>
                    )}
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
                    {recentWorks.length > 0 ? (
                      recentWorks.map((work) => (
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
                      ))
                    ) : (
                      <div className="glass-card rounded-xl p-6 text-center">
                        <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">暂无创作记录</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">开始你的第一次创作吧</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 每日任务 */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-foreground">每日任务</span>
                    <span className="ml-auto text-xs text-muted-foreground">0/3 已完成</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-border" />
                      <span className="text-sm text-foreground">登录签到</span>
                      <span className="ml-auto text-xs text-muted-foreground">+10积分</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-border" />
                      <span className="text-sm text-foreground">创作1个作品</span>
                      <span className="ml-auto text-xs text-muted-foreground">+20积分</span>
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
