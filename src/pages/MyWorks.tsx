import { useCallback, useEffect, useState } from "react";
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
  X,
  Shirt,
  Tag,
  ShieldAlert,
  LayoutGrid,
  Lightbulb,
  Palette,
  MessageCircle,
  Copy,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { deleteWork, listWorks, WORKS_PAGE_SIZE, type WorkListItem } from "@/lib/repositories/works";
import { downloadGeneratedImage } from "@/lib/image-utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ProgressiveImage } from "@/components/ProgressiveImage";
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
import type { OutfitRecommendResult } from "@/lib/outfit-recommend";

type WorkCategory = "image" | "copywriting";

const getWorkCategory = (workType: string): WorkCategory => {
  return (workType === "copywriting" || workType === "outfit-recommend") ? "copywriting" : "image";
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

// 将 contentJson 转为纯文本用于复制
const outfitResultToText = (r: OutfitRecommendResult): string => {
  const lines: string[] = [];
  const a = r.inputAnalysis;
  lines.push(`【单品分析】`, `类型：${a.itemType}`, `颜色：${a.color}`, `风格：${a.style}`, `面料：${a.material}`);
  if (a.silhouette) lines.push(`版型：${a.silhouette}`);
  if (a.bestFor) lines.push(`适合：${a.bestFor}`);

  if (r.productProfile) {
    const p = r.productProfile;
    lines.push("", `【商品档案】`, `风格标签：${p.styleTags}`, `陈列区域：${p.displayArea}`, `目标客群：${p.targetCustomer}`, `体型适配：${p.bodyFit}`);
    lines.push(`搭配色 - 安全牌：${p.colorMatch.safe}`, `搭配色 - 进阶牌：${p.colorMatch.advanced}`, `搭配色 - 避雷：${p.colorMatch.avoid}`);
  }

  r.combinations.slice(0, 2).forEach((c, i) => {
    lines.push("", `【搭配方案${i + 1}】${c.name}`, `主题：${c.theme}`);
    if (c.targetBody) lines.push(`适合体型：${c.targetBody}`);
    c.items.forEach((item) => lines.push(`  ${item.category}：${item.description}（${item.colorSuggestion}）- ${item.styleTip}`));
    if (c.matchingLogic) lines.push(`搭配逻辑：${c.matchingLogic}`);
    if (c.stylingTips.length) lines.push(`搭配技巧：${c.stylingTips.join("；")}`);
    lines.push(`整体效果：${c.overallLook}`);
    if (c.salesTalk) lines.push(`推荐话术：${c.salesTalk}`);
  });

  if (r.objectionHandling) {
    const o = r.objectionHandling;
    lines.push("", `【客诉应对】`, `显胖：${o.looksFat}`, `太贵：${o.tooExpensive}`, `不适合：${o.notSuitable}`);
  }

  if (r.displayGuide) {
    const d = r.displayGuide;
    lines.push("", `【陈列指导】`, `分区：${d.zone}`, `VP展示：${d.vpDisplay}`, `色彩排列：${d.colorArrangement}`, `衣架卡：${d.tagTip}`);
  }

  if (r.generalTips?.length) {
    lines.push("", `【通用建议】`, ...r.generalTips.map((t) => `• ${t}`));
  }
  return lines.join("\n");
};

const CopywritingDetailDialog = ({ work, open, onClose }: { work: WorkListItem | null; open: boolean; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  if (!work || !open) return null;

  const content = work.content?.trim();
  if (!content) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 animate-fade-in" />
      <div
        className="relative z-10 w-full md:max-w-3xl max-h-[85vh] bg-background rounded-t-2xl md:rounded-2xl overflow-hidden animate-slide-up md:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/30 px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">{work.title}</h2>
            <p className="text-xs text-muted-foreground">{work.createdAt} · {work.tool}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="复制文案">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[calc(85vh-56px)] p-4 md:p-5">
          <div className="rounded-xl bg-muted/30 p-4 md:p-5">
            <p className="whitespace-pre-wrap break-words text-sm md:text-base leading-relaxed text-foreground">
              {content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 搭配师详情弹窗
const OutfitDetailDialog = ({ work, open, onClose }: { work: WorkListItem | null; open: boolean; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  if (!work || !open) return null;
  const result = work.contentJson as unknown as OutfitRecommendResult | undefined;
  if (!result?.inputAnalysis) return null;

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(outfitResultToText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 animate-fade-in" />
      <div
        className="relative z-10 w-full md:max-w-lg max-h-[85vh] bg-background rounded-t-2xl md:rounded-2xl overflow-hidden animate-slide-up md:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/30 px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">{work.title}</h2>
            <p className="text-xs text-muted-foreground">{work.createdAt} · {work.tool}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleCopyAll} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="复制全部文案">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="overflow-y-auto max-h-[calc(85vh-56px)] p-4 space-y-4">
          {/* 单品分析 */}
          <div className="rounded-xl bg-muted/30 p-3.5">
            <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2"><Shirt className="w-4 h-4" /> 单品分析</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-primary font-medium mr-2">类型</span>{result.inputAnalysis.itemType}</p>
              <p><span className="text-primary font-medium mr-2">颜色</span>{result.inputAnalysis.color}</p>
              <p><span className="text-primary font-medium mr-2">风格</span>{result.inputAnalysis.style}</p>
              <p><span className="text-primary font-medium mr-2">面料</span>{result.inputAnalysis.material}</p>
              {result.inputAnalysis.silhouette && <p><span className="text-primary font-medium mr-2">版型</span>{result.inputAnalysis.silhouette}</p>}
              {result.inputAnalysis.bestFor && <p><span className="text-primary font-medium mr-2">适合</span>{result.inputAnalysis.bestFor}</p>}
            </div>
          </div>

          {/* 商品档案 */}
          {result.productProfile && (
            <div className="rounded-xl bg-muted/30 p-3.5">
              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2"><Tag className="w-4 h-4" /> 商品档案</h3>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-muted-foreground mr-2">风格标签</span>{result.productProfile.styleTags}</p>
                <p><span className="text-muted-foreground mr-2">陈列区域</span>{result.productProfile.displayArea}</p>
                <p><span className="text-muted-foreground mr-2">目标客群</span>{result.productProfile.targetCustomer}</p>
                <p><span className="text-muted-foreground mr-2">体型适配</span>{result.productProfile.bodyFit}</p>
                <div className="mt-2 p-2.5 rounded-lg bg-background/60">
                  <p className="text-xs font-medium mb-1 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5 text-primary" /> 搭配色建议</p>
                  <div className="space-y-0.5 text-xs">
                    <p><span className="text-green-600 mr-1.5">安全牌</span><span className="text-muted-foreground">{result.productProfile.colorMatch.safe}</span></p>
                    <p><span className="text-amber-600 mr-1.5">进阶牌</span><span className="text-muted-foreground">{result.productProfile.colorMatch.advanced}</span></p>
                    <p><span className="text-red-500 mr-1.5">避雷</span><span className="text-muted-foreground">{result.productProfile.colorMatch.avoid}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 搭配方案 */}
          {result.combinations.slice(0, 2).map((combo, idx) => (
            <div key={idx} className="rounded-xl bg-muted/30 p-3.5">
              <h3 className="text-base font-semibold text-foreground">{combo.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{combo.theme}</p>
              {combo.targetBody && <span className="inline-block mt-1.5 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{combo.targetBody}</span>}
              <div className="space-y-2 mt-3">
                {combo.items.map((item, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-background/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">{item.category}</span>
                      <span className="text-xs text-muted-foreground">{item.colorSuggestion}</span>
                    </div>
                    <p className="text-sm text-foreground mt-0.5">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.styleTip}</p>
                  </div>
                ))}
              </div>
              {combo.matchingLogic && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{combo.matchingLogic}</p>
                </div>
              )}
              {combo.stylingTips.length > 0 && (
                <div className="mt-2.5">
                  <h4 className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-amber-500" /> 搭配小技巧</h4>
                  <ul className="space-y-0.5">
                    {combo.stylingTips.map((tip, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-primary">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="border-t border-border/30 pt-2.5 mt-2.5 space-y-2">
                <p className="text-sm text-foreground leading-relaxed">{combo.overallLook}</p>
                {combo.salesTalk && (
                  <div className="bg-primary/5 rounded-lg p-2.5">
                    <h4 className="text-xs font-semibold text-primary mb-1 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> 推荐话术</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{combo.salesTalk}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 客诉应对 */}
          {result.objectionHandling && (
            <div className="rounded-xl bg-muted/30 p-3.5">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-primary" /> 客诉应对话术</h3>
              <div className="space-y-2">
                {[
                  { label: "客人说「显胖」", text: result.objectionHandling.looksFat },
                  { label: "客人说「太贵」", text: result.objectionHandling.tooExpensive },
                  { label: "客人说「不适合」", text: result.objectionHandling.notSuitable },
                ].map((item, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-background/60">
                    <p className="text-xs font-medium text-foreground mb-0.5">{item.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 陈列指导 */}
          {result.displayGuide && (
            <div className="rounded-xl bg-muted/30 p-3.5">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-primary" /> 陈列指导</h3>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-muted-foreground mr-2">分区建议</span>{result.displayGuide.zone}</p>
                <p><span className="text-muted-foreground mr-2">VP展示</span>{result.displayGuide.vpDisplay}</p>
                <p><span className="text-muted-foreground mr-2">色彩排列</span>{result.displayGuide.colorArrangement}</p>
                <p><span className="text-muted-foreground mr-2">衣架卡</span>{result.displayGuide.tagTip}</p>
              </div>
            </div>
          )}

          {/* 通用建议 */}
          {result.generalTips?.length > 0 && (
            <div className="rounded-xl bg-muted/30 p-3.5">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" /> 通用搭配建议</h3>
              <ul className="space-y-1">
                {result.generalTips.map((tip, i) => (
                  <li key={i} className="text-sm text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-primary">{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MyWorks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<WorkCategory | null>(null);
  const [selectedWork, setSelectedWork] = useState<string | null>(null);
  const [works, setWorks] = useState<WorkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [detailWork, setDetailWork] = useState<WorkListItem | null>(null);
  const [copyDetailWork, setCopyDetailWork] = useState<WorkListItem | null>(null);

  const refreshWorks = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const result = await listWorks(0);
      setWorks(result.items);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("加载作品失败", error);
      if (!silent) toast.error("加载作品失败");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    try {
      setLoadingMore(true);
      const result = await listWorks(works.length);
      setWorks((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("加载更多失败", error);
      toast.error("加载更多失败");
    } finally {
      setLoadingMore(false);
    }
  }, [works.length]);

  useEffect(() => {
    if (!user?.id) {
      setWorks([]);
      setLoading(false);
      return;
    }
    void refreshWorks();
  }, [user?.id, refreshWorks]);

  useEffect(() => {
    if (!user?.id) return;

    const handleFocus = () => {
      void refreshWorks(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshWorks(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.id, refreshWorks]);

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
    if (work.type === "outfit-recommend" && work.contentJson) {
      setDetailWork(work);
      return;
    }
    if (getWorkCategory(work.type) === "copywriting" && work.content?.trim()) {
      setCopyDetailWork(work);
      return;
    }
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
      {/* 返回按钮 - 仅桌面端 */}
      <button
        onClick={() => navigate("/")}
        className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors touch-target"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">返回首页</span>
      </button>

      {/* 移动端页面切换 Tab */}
      <div className="flex md:hidden gap-1 p-1 bg-secondary/50 rounded-xl mb-4 w-fit">
        <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white shadow-sm text-foreground">
          我的作品
        </button>
        <button
          onClick={() => navigate("/my-materials")}
          className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          我的素材
        </button>
      </div>

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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl overflow-hidden">
              <div className="aspect-[4/3] bg-secondary/30 animate-pulse" />
              <div className="p-3 md:p-4 space-y-2">
                <div className="h-4 w-2/3 bg-secondary/40 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-secondary/30 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
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
                  {work.type === "outfit-recommend" && work.contentJson ? (() => {
                    const r = work.contentJson as unknown as OutfitRecommendResult;
                    const combo = r?.combinations?.[0];
                    return (
                      <div className="w-full h-full p-3 flex flex-col justify-between bg-gradient-to-br from-primary/5 to-primary/10">
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs font-medium text-primary truncate">{r?.inputAnalysis?.itemType} · {r?.inputAnalysis?.style}</p>
                          {combo && <p className="text-xs font-semibold text-foreground truncate">{combo.name}</p>}
                          {combo && <p className="text-[11px] text-muted-foreground line-clamp-2">{combo.overallLook}</p>}
                        </div>
                        {combo && combo.items.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {combo.items.slice(0, 3).map((item, i) => (
                              <span key={i} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full truncate max-w-[80px]">{item.category}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })() : work.thumbnail ? (
                    <ProgressiveImage
                      src={work.thumbnail}
                      alt={work.title}
                      containerClassName="w-full h-full"
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
                    <ProgressiveImage
                      src={work.thumbnail}
                      alt={work.title}
                      containerClassName="w-full h-full"
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

      {/* 加载更多 */}
      {hasMore && !loading && filteredWorks.length > 0 && (
        <div className="text-center py-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-full bg-secondary/70 text-sm text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {loadingMore ? "加载中..." : "加载更多"}
          </button>
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
      <OutfitDetailDialog work={detailWork} open={!!detailWork} onClose={() => setDetailWork(null)} />
      <CopywritingDetailDialog work={copyDetailWork} open={!!copyDetailWork} onClose={() => setCopyDetailWork(null)} />
    </PageLayout>
  );
};

export default MyWorks;
