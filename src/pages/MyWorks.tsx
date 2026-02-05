import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
  FolderOpen,
  Grid3X3,
  List,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Trash2,
  Share2,
  Clock,
  ImageIcon,
  FileText,
  Palette,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// 模拟作品数据
const mockWorks = [
  {
    id: "1",
    title: "双十一促销海报",
    type: "poster",
    thumbnail: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400",
    createdAt: "2024-01-15 14:30",
    tool: "AI 海报",
  },
  {
    id: "2",
    title: "产品宣传图",
    type: "drawing",
    thumbnail: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400",
    createdAt: "2024-01-14 10:20",
    tool: "AI 绘图",
  },
  {
    id: "3",
    title: "小红书种草文案",
    type: "copywriting",
    thumbnail: null,
    content: "姐妹们！今天必须给你们安利这个宝藏好物！用了一周真的绝绝子～",
    createdAt: "2024-01-13 16:45",
    tool: "AI 文案",
  },
  {
    id: "4",
    title: "品牌形象海报",
    type: "poster",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400",
    createdAt: "2024-01-12 09:15",
    tool: "AI 海报",
  },
  {
    id: "5",
    title: "抖音短视频脚本",
    type: "copywriting",
    thumbnail: null,
    content: "等等！先别划走！这个东西你一定要知道...",
    createdAt: "2024-01-11 11:30",
    tool: "AI 文案",
  },
  {
    id: "6",
    title: "节日祝福海报",
    type: "poster",
    thumbnail: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400",
    createdAt: "2024-01-10 15:00",
    tool: "AI 海报",
  },
];

// 获取类型图标
const getTypeIcon = (type: string) => {
  switch (type) {
    case "poster":
      return <Palette className="w-4 h-4" />;
    case "drawing":
      return <ImageIcon className="w-4 h-4" />;
    case "copywriting":
      return <FileText className="w-4 h-4" />;
    default:
      return <ImageIcon className="w-4 h-4" />;
  }
};

// 获取类型颜色
const getTypeColor = (type: string) => {
  switch (type) {
    case "poster":
      return "bg-blue-100 text-blue-600";
    case "drawing":
      return "bg-purple-100 text-purple-600";
    case "copywriting":
      return "bg-orange-100 text-orange-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const MyWorks = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedWork, setSelectedWork] = useState<string | null>(null);

  // 过滤作品
  const filteredWorks = mockWorks.filter((work) => {
    const matchesSearch = work.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || work.type === selectedType;
    return matchesSearch && matchesType;
  });

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
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                  <FolderOpen className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">我的作品</h1>
                  <p className="text-muted-foreground text-sm">管理你创作的所有作品</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                共 {filteredWorks.length} 个作品
              </div>
            </div>

            {/* 工具栏 */}
            <div className="glass-card rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* 搜索框 */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索作品..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-secondary/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {/* 类型筛选 */}
                  <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
                    <button
                      onClick={() => setSelectedType(null)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm transition-all",
                        !selectedType ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      全部
                    </button>
                    <button
                      onClick={() => setSelectedType("poster")}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm transition-all",
                        selectedType === "poster" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      海报
                    </button>
                    <button
                      onClick={() => setSelectedType("drawing")}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm transition-all",
                        selectedType === "drawing" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      绘图
                    </button>
                    <button
                      onClick={() => setSelectedType("copywriting")}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm transition-all",
                        selectedType === "copywriting" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      文案
                    </button>
                  </div>

                  {/* 视图切换 */}
                  <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "p-2 rounded-md transition-all",
                        viewMode === "grid" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-2 rounded-md transition-all",
                        viewMode === "list" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 作品列表 */}
            {filteredWorks.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWorks.map((work) => (
                    <div
                      key={work.id}
                      className="glass-card rounded-xl overflow-hidden group hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => setSelectedWork(work.id)}
                    >
                      {/* 缩略图 */}
                      <div className="aspect-[4/3] bg-secondary/30 relative overflow-hidden">
                        {work.thumbnail ? (
                          <img
                            src={work.thumbnail}
                            alt={work.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <p className="text-sm text-muted-foreground line-clamp-4 text-center">
                              {work.content}
                            </p>
                          </div>
                        )}
                        {/* 悬浮操作 */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                            <Download className="w-4 h-4 text-gray-700" />
                          </button>
                          <button className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                            <Share2 className="w-4 h-4 text-gray-700" />
                          </button>
                          <button className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      {/* 信息 */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-medium text-foreground truncate">{work.title}</h3>
                          <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs", getTypeColor(work.type))}>
                            {getTypeIcon(work.type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{work.createdAt}</span>
                          <span>·</span>
                          <span>{work.tool}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredWorks.map((work) => (
                    <div
                      key={work.id}
                      className="glass-card rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group"
                    >
                      {/* 缩略图 */}
                      <div className="w-16 h-16 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                        {work.thumbnail ? (
                          <img
                            src={work.thumbnail}
                            alt={work.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground truncate">{work.title}</h3>
                          <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs", getTypeColor(work.type))}>
                            {getTypeIcon(work.type)}
                            <span>{work.tool}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{work.createdAt}</span>
                        </div>
                      </div>
                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                          <Share2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground mb-2">暂无作品</p>
                <p className="text-sm text-muted-foreground/70">开始创作你的第一个作品吧</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyWorks;
