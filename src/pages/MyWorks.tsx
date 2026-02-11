import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { deleteWork, listWorks, type WorkListItem } from "@/lib/repositories/works";
import { downloadGeneratedImage } from "@/lib/image-utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type WorkCategory = "image" | "copywriting";

const getWorkCategory = (workType: string): WorkCategory => {
  return workType === "copywriting" ? "copywriting" : "image";
};

// 获取类型图标
const getTypeIcon = (category: WorkCategory) => {
  switch (category) {
    case "copywriting":
      return <FileText className="w-4 h-4" />;
    default:
      return <ImageIcon className="w-4 h-4" />;
  }
};

// 获取类型颜色
const getTypeColor = (category: WorkCategory) => {
  switch (category) {
    case "copywriting":
      return "bg-orange-100 text-orange-600";
    default:
      return "bg-purple-100 text-purple-600";
  }
};

const MyWorks = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<WorkCategory | null>(null);
  const [selectedWork, setSelectedWork] = useState<string | null>(null);
  const [works, setWorks] = useState<WorkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const refreshWorks = async () => {
    try {
      setLoading(true);
      const data = await listWorks();
      setWorks(data);
    } catch (error) {
      console.error("加载作品失败", error);
      toast.error("加载作品失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshWorks();
  }, []);

  const confirmDeleteWork = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteWork(deleteConfirmId);
      setWorks((prev) => prev.filter((work) => work.id !== deleteConfirmId));
      toast.success("作品已删除");
    } catch (error) {
      console.error("删除作品失败", error);
      toast.error("删除作品失败");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handlePreview = (work: WorkListItem) => {
    setSelectedWork(work.id);
    if (work.thumbnail) {
      window.open(work.thumbnail, "_blank");
    }
  };

  const handleDownload = async (work: WorkListItem) => {
    if (!work.thumbnail) return;
    try {
      await downloadGeneratedImage(work.thumbnail, `${work.title || "work"}-${Date.now()}.png`);
    } catch {
      window.open(work.thumbnail, "_blank");
    }
  };

  // 过滤作品
  const filteredWorks = works.filter((work) => {
    const matchesSearch = work.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || getWorkCategory(work.type) === selectedType;
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
        <div className="hidden md:block text-sm text-muted-foreground">共 {filteredWorks.length} 个作品</div>
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
                onClick={() => setSelectedType("image")}
                className={cn(
                  "px-2.5 md:px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap",
                  selectedType === "image" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground active:text-foreground"
                )}
              >
                图片
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
            <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
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
      <div className="md:hidden text-sm text-muted-foreground mb-3">共 {filteredWorks.length} 个作品</div>

      {/* 作品列表 */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : filteredWorks.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {filteredWorks.map((work) => (
              <div
                key={work.id}
                className={cn(
                  "glass-card rounded-xl overflow-hidden group hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]",
                  selectedWork === work.id && "ring-2 ring-primary/30"
                )}
                onClick={() => handlePreview(work)}
              >
                {/* 缩略图 */}
                <div className="aspect-[4/3] bg-secondary/30 relative overflow-hidden">
                  {work.thumbnail ? (
                    <img
                      src={work.thumbnail}
                      alt={work.title}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3 md:p-4">
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-3 md:line-clamp-4 text-center">{work.content}</p>
                    </div>
                  )}
                  {/* 悬浮操作 - 桌面端显示 */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-2">
                    <button
                      className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(work);
                      }}
                    >
                      <Download className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (work.thumbnail) window.open(work.thumbnail, "_blank");
                      }}
                    >
                      <Share2 className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(work.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                {/* 信息 */}
                <div className="p-3 md:p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5 md:mb-2">
                    <h3 className="font-medium text-foreground text-sm md:text-base truncate">{work.title}</h3>
                    <span className={cn("flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full text-xs flex-shrink-0", getTypeColor(getWorkCategory(work.type)))}>
                      {getTypeIcon(getWorkCategory(work.type))}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="truncate">{work.createdAt}</span>
                    <span className="hidden md:inline">·</span>
                    <span className="hidden md:inline">{work.tool}</span>
                  </div>

                  <div className="mt-2.5 flex md:hidden items-center gap-1.5">
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-secondary/60 text-muted-foreground text-xs touch-target"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(work);
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-secondary/60 text-muted-foreground text-xs touch-target"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (work.thumbnail) window.open(work.thumbnail, "_blank");
                      }}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      分享
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs touch-target"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(work.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      删除
                    </button>
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
                onClick={() => handlePreview(work)}
              >
                {/* 缩略图 */}
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                  {work.thumbnail ? (
                    <img
                      src={work.thumbnail}
                      alt={work.title}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
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
                    <span className={cn("flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full text-xs flex-shrink-0", getTypeColor(getWorkCategory(work.type)))}>
                      {getTypeIcon(getWorkCategory(work.type))}
                      <span className="hidden md:inline">{work.tool}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{work.createdAt}</span>
                  </div>

                  <div className="mt-2 flex md:hidden items-center gap-1.5">
                    <button
                      className="p-2 rounded-lg bg-secondary/60 text-muted-foreground touch-target"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(work);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg bg-secondary/60 text-muted-foreground touch-target"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (work.thumbnail) window.open(work.thumbnail, "_blank");
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg bg-red-50 text-red-500 touch-target"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(work.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* 操作按钮 - 桌面端悬浮显示 */}
                <div className="hidden md:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(work);
                    }}
                  >
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (work.thumbnail) window.open(work.thumbnail, "_blank");
                    }}
                  >
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(work.id);
                    }}
                  >
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
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后将无法恢复，确定要删除这个作品吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={confirmDeleteWork}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
};

export default MyWorks;
