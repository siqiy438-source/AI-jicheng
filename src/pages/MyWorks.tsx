import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import {
  ArrowLeft,
  FolderOpen,
  Grid3X3,
  List,
  Search,
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
    <PageLayout maxWidth="6xl" className="py-4 md:py-8">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors touch-target"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">返回首页</span>
      </button>

      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
            <FolderOpen className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">我的作品</h1>
            <p className="text-muted-foreground text-sm">管理你创作的所有作品</p>
          </div>
        </div>
        <div className="hidden md:block text-sm text-muted-foreground">
          共 {filteredWorks.length} 个作品
        </div>
      </div>

      {/* 工具栏 */}
      <div className="glass-card rounded-xl p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          {/* 搜索框 */}
          <div className="relative flex-1 md:min-w-[200px] md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索作品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputMode="search"
              enterKeyHint="search"
              className="w-full pl-10 pr-4 py-2.5 md:py-2 bg-secondary/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3">
            {/* 类型筛选 - 移动端横向滚动 */}
            <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg overflow-x-auto">
              <button
                onClick={() => setSelectedType(null)}
                className={cn(
                  "px-2.5 md:px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap",
                  !selectedType ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground active:text-foreground"
                )}
              >
                全部
              </button>
              <button
                onClick={() => setSelectedType("poster")}
                className={cn(
                  "px-2.5 md:px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap",
                  selectedType === "poster" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground active:text-foreground"
                )}
              >
                海报
              </button>
              <button
                onClick={() => setSelectedType("drawing")}
                className={cn(
                  "px-2.5 md:px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap",
                  selectedType === "drawing" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground active:text-foreground"
                )}
              >
                绘图
              </button>
              <button
                onClick={() => setSelectedType("copywriting")}
                className={cn(
                  "px-2.5 md:px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap",
                  selectedType === "copywriting" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground active:text-foreground"
                )}
              >
                文案
              </button>
            </div>

            {/* 视图切换 */}
            <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg flex-shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-md transition-all touch-target",
                  viewMode === "grid" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground active:text-foreground"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-md transition-all touch-target",
                  viewMode === "list" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground active:text-foreground"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端作品数量 */}
      <div className="md:hidden text-sm text-muted-foreground mb-3">
        共 {filteredWorks.length} 个作品
      </div>

      {/* 作品列表 */}
      {filteredWorks.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {filteredWorks.map((work) => (
              <div
                key={work.id}
                className="glass-card rounded-xl overflow-hidden group hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => setSelectedWork(work.id)}
              >
                {/* 缩略图 */}
                <div className="aspect-[4/3] bg-secondary/30 relative overflow-hidden">
                  {work.thumbnail ? (
                    <img
                      src={work.thumbnail}
                      alt={work.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3 md:p-4">
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-3 md:line-clamp-4 text-center">
                        {work.content}
                      </p>
                    </div>
                  )}
                  {/* 悬浮操作 - 桌面端显示 */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-2">
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
                <div className="p-3 md:p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5 md:mb-2">
                    <h3 className="font-medium text-foreground text-sm md:text-base truncate">{work.title}</h3>
                    <span className={cn("flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full text-xs flex-shrink-0", getTypeColor(work.type))}>
                      {getTypeIcon(work.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="truncate">{work.createdAt}</span>
                    <span className="hidden md:inline">·</span>
                    <span className="hidden md:inline">{work.tool}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {filteredWorks.map((work) => (
              <div
                key={work.id}
                className="glass-card rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
              >
                {/* 缩略图 */}
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                  {work.thumbnail ? (
                    <img
                      src={work.thumbnail}
                      alt={work.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground text-sm md:text-base truncate">{work.title}</h3>
                    <span className={cn("flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full text-xs flex-shrink-0", getTypeColor(work.type))}>
                      {getTypeIcon(work.type)}
                      <span className="hidden md:inline">{work.tool}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{work.createdAt}</span>
                  </div>
                </div>
                {/* 操作按钮 - 桌面端悬浮显示 */}
                <div className="hidden md:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <div className="text-center py-12 md:py-16">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground mb-2">暂无作品</p>
          <p className="text-sm text-muted-foreground/70">开始创作你的第一个作品吧</p>
        </div>
      )}
    </PageLayout>
  );
};

export default MyWorks;
