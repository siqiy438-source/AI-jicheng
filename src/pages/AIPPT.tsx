import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import {
  Zap,
  Loader2,
  Home,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Sparkles,
  GripVertical,
  Share2,
  Download,
  Eye,
  Pencil,
  Save,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  generateOutline,
  generateSlideDescription,
  generateSlideImage,
  exportToPDF,
  exportToPPTX,
  exportToImages,
} from "@/lib/ai-ppt";
import { useToast } from "@/hooks/use-toast";

// ==================== Types ====================
interface SlideData {
  id: number;
  title: string;
  outlinePoints: string[];
  description: string;
  generatedImage?: string;
}

// ==================== Constants ====================
const PPT_STYLES = [
  { id: "free", name: "自由风格", icon: "✨", prompt: "" },
  { id: "sketch", name: "手绘风格", icon: "🖌️", prompt: "hand-drawn sketch style, journal aesthetic" },
  { id: "cute", name: "卡通可爱", icon: "🎀", prompt: "cute cartoon kawaii style, pastel colors" },
  { id: "art", name: "艺术插画", icon: "🎨", prompt: "artistic illustration style, creative visual" },
];

const PPT_RATIOS = [
  { id: "16:9", name: "16:9" },
  { id: "4:3", name: "4:3" },
  { id: "3:4", name: "3:4" },
  { id: "1:1", name: "1:1" },
];

const PAGE_COUNTS = [3, 5, 8, 10, 12];

// ==================== Placeholder helpers ====================
const PLACEHOLDERS: Record<string, string> = {
  sentence: "输入主题，例如：《高效能人士的七个习惯》读书笔记",
  outline: "输入大纲内容，每行一个要点...",
  description: "输入详细描述内容...",
};

// ==================== Component ====================
const AIPPT = () => {
  const navigate = useNavigate();

  // Step control
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1 states
  const [generationMode, setGenerationMode] = useState<"sentence" | "outline" | "description">("sentence");
  const [inputContent, setInputContent] = useState("");
  const [pageCount, setPageCount] = useState(8);
  const [style, setStyle] = useState("free");
  const [aspectRatio, setAspectRatio] = useState("16:9");

  // Step 2 states
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Step 3 states
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");

  // Dropdown states
  const [showPageCountMenu, setShowPageCountMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showRatioMenu, setShowRatioMenu] = useState(false);

  // Step 3 accordion states
  const [outlineExpanded, setOutlineExpanded] = useState(true);
  const [descriptionExpanded, setDescriptionExpanded] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // ==================== Handlers ====================

  const { toast } = useToast();

  const handleStartGenerate = async () => {
    if (!inputContent.trim()) return;
    setIsGeneratingOutline(true);

    const result = await generateOutline({
      content: inputContent.trim(),
      mode: generationMode,
      pageCount,
      style,
    });

    setIsGeneratingOutline(false);

    if (result.success && result.slides) {
      setSlides(result.slides);
      setProjectTitle(result.projectTitle || inputContent.trim().slice(0, 30));
      setSelectedSlideIndex(0);
      setCurrentStep(2);
    } else {
      toast({ title: "生成失败", description: result.error || "请稍后重试", variant: "destructive" });
    }
  };

  const handleGenerateDescription = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide) return;
    setIsGeneratingDescription(true);

    const result = await generateSlideDescription({
      slideTitle: slide.title,
      outlinePoints: slide.outlinePoints,
      overallTheme: projectTitle,
      style,
      slideIndex: slide.id,
      totalSlides: slides.length,
    });

    setIsGeneratingDescription(false);

    if (result.success && result.description) {
      const newSlides = [...slides];
      newSlides[slideIndex] = { ...newSlides[slideIndex], description: result.description };
      setSlides(newSlides);
    } else {
      toast({ title: "生成描述失败", description: result.error || "请稍后重试", variant: "destructive" });
    }
  };

  const handleBatchGenerateDescriptions = async () => {
    const needGenerate = slides.filter((s) => !s.description || !s.description.trim());
    if (needGenerate.length === 0) {
      toast({ title: "无需生成", description: "所有页面已有描述" });
      return;
    }

    setIsGeneratingDescription(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      // 跳过已有描述的
      if (slide.description && slide.description.trim()) continue;

      const result = await generateSlideDescription({
        slideTitle: slide.title,
        outlinePoints: slide.outlinePoints,
        overallTheme: projectTitle,
        style,
        slideIndex: slide.id,
        totalSlides: slides.length,
      });

      if (result.success && result.description) {
        // 每生成一页就立即更新 UI
        setSlides((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], description: result.description! };
          return updated;
        });
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsGeneratingDescription(false);
    if (failCount === 0) {
      toast({ title: "批量生成完成", description: `已生成 ${successCount} 页描述` });
    } else {
      toast({ title: "部分生成完成", description: `成功 ${successCount} 页，失败 ${failCount} 页`, variant: "destructive" });
    }
  };

  const handleGenerateImage = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide || !slide.description) {
      toast({ title: "请先生成描述", description: "需要先为该页生成内容描述", variant: "destructive" });
      return;
    }
    setIsGeneratingImage(true);

    const result = await generateSlideImage({
      description: slide.description,
      style,
      aspectRatio,
    });

    setIsGeneratingImage(false);

    if (result.success && result.imageBase64) {
      const newSlides = [...slides];
      newSlides[slideIndex] = { ...newSlides[slideIndex], generatedImage: result.imageBase64 };
      setSlides(newSlides);
    } else {
      toast({ title: "图片生成失败", description: result.error || "请稍后重试", variant: "destructive" });
    }
  };

  const handleBatchGenerateImages = async () => {
    const slidesNeedingImages = slides.filter((s) => !s.generatedImage && s.description);
    if (slidesNeedingImages.length === 0) {
      toast({ title: "无需生成", description: "所有有描述的页面已生成图片" });
      return;
    }
    setIsGeneratingImage(true);

    const newSlides = [...slides];
    for (let i = 0; i < newSlides.length; i++) {
      if (newSlides[i].generatedImage || !newSlides[i].description) continue;
      const result = await generateSlideImage({
        description: newSlides[i].description,
        style,
        aspectRatio,
      });
      if (result.success && result.imageBase64) {
        newSlides[i] = { ...newSlides[i], generatedImage: result.imageBase64 };
        setSlides([...newSlides]);
      }
    }

    setIsGeneratingImage(false);
    toast({ title: "批量出图完成" });
  };

  const handleExport = async (format: "pptx" | "pdf" | "images" = "pptx") => {
    try {
      if (format === "pdf") {
        await exportToPDF(slides, projectTitle);
      } else if (format === "images") {
        await exportToImages(slides, projectTitle);
      } else {
        await exportToPPTX(slides, projectTitle);
      }
      toast({ title: "导出成功" });
    } catch (error) {
      toast({ title: "导出失败", description: error instanceof Error ? error.message : "请稍后重试", variant: "destructive" });
    }
  };

  const handleShare = () => {
    toast({ title: "分享功能", description: "即将上线，敬请期待" });
  };

  const closeAllMenus = () => {
    setShowPageCountMenu(false);
    setShowStyleMenu(false);
    setShowRatioMenu(false);
    setShowExportMenu(false);
  };

  const undescribedCount = slides.filter((s) => !s.description).length;
  const ungeneratedImageCount = slides.filter((s) => !s.generatedImage).length;
  const currentSlide = slides[selectedSlideIndex];

  // ==================== Step 1: Input & Config ====================
  const renderStep1 = () => (
    <PageLayout className="py-2 md:py-8" maxWidth="4xl">
      <div onClick={closeAllMenus}>
        {/* Title area */}
        <div className="text-center mb-8 md:mb-12 pt-4 md:pt-8">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center mx-auto mb-4">
            <Presentation className="w-7 h-7 md:w-8 md:h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">今天想创作什么？</h1>
          <p className="text-muted-foreground text-sm md:text-base">把想法转化为精美演示文稿</p>
        </div>

        {/* Mode tabs */}
        <div className="flex items-center justify-center gap-1 mb-6">
          {([
            { key: "sentence" as const, label: "一句话生成" },
            { key: "outline" as const, label: "从大纲生成" },
            { key: "description" as const, label: "从描述生成" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setGenerationMode(tab.key)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2",
                generationMode === tab.key
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5 mb-4 shadow-lg border border-border/50 focus-within:border-orange-400 transition-colors">
          <textarea
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder={PLACEHOLDERS[generationMode]}
            rows={generationMode === "sentence" ? 3 : 6}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base leading-relaxed"
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-muted-foreground">{inputContent.length} 字</span>
          </div>
        </div>

        {/* Parameter bar */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap mb-6">
          {/* Page count selector */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowPageCountMenu(!showPageCountMenu); setShowStyleMenu(false); setShowRatioMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-secondary/50 hover:bg-secondary border border-border/50 transition-all"
            >
              <span>🖥</span>
              <span>{pageCount} 页</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showPageCountMenu && "rotate-180")} />
            </button>
            {showPageCountMenu && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 min-w-[100px]">
                {PAGE_COUNTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setPageCount(c); setShowPageCountMenu(false); }}
                    className={cn("w-full px-3 py-2 text-sm hover:bg-secondary/50 text-left", pageCount === c && "bg-orange-50 text-orange-700")}
                  >
                    {c} 页
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Style selector */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowStyleMenu(!showStyleMenu); setShowPageCountMenu(false); setShowRatioMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-secondary/50 hover:bg-secondary border border-border/50 transition-all"
            >
              <span>{PPT_STYLES.find((s) => s.id === style)?.icon}</span>
              <span>{PPT_STYLES.find((s) => s.id === style)?.name}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showStyleMenu && "rotate-180")} />
            </button>
            {showStyleMenu && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 min-w-[140px]">
                {PPT_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setStyle(s.id); setShowStyleMenu(false); }}
                    className={cn("w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/50 text-left", style === s.id && "bg-orange-50 text-orange-700")}
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ratio selector */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowRatioMenu(!showRatioMenu); setShowPageCountMenu(false); setShowStyleMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-secondary/50 hover:bg-secondary border border-border/50 transition-all"
            >
              <span>{aspectRatio}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showRatioMenu && "rotate-180")} />
            </button>
            {showRatioMenu && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 min-w-[90px]">
                {PPT_RATIOS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setAspectRatio(r.id); setShowRatioMenu(false); }}
                    className={cn("w-full px-3 py-2 text-sm hover:bg-secondary/50 text-left", aspectRatio === r.id && "bg-orange-50 text-orange-700")}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model badge */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-blue-50 text-blue-600 border border-blue-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini 3 Pro</span>
          </div>
        </div>

        {/* Generate button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleStartGenerate}
            disabled={!inputContent.trim() || isGeneratingOutline}
            className={cn(
              "flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-medium transition-all duration-200 shadow-lg",
              inputContent.trim() && !isGeneratingOutline
                ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600 hover:shadow-xl active:scale-[0.98]"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            {isGeneratingOutline ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
            {isGeneratingOutline ? "生成中..." : "开始生成"}
          </button>
        </div>

        {/* Recent projects placeholder */}
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">最近项目将显示在这里</p>
        </div>
      </div>
    </PageLayout>
  );

  // ==================== Step 2: Outline & Description ====================
  const renderStep2 = () => (
    <div className="flex flex-col h-screen bg-background">
      {/* Top navbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-border shrink-0 relative z-20">
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="主页">
            <Home className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => setCurrentStep(1)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="返回">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <input
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 max-w-[200px]"
            placeholder="项目标题"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-orange-50 text-orange-600 border border-orange-100">
            <Pencil className="w-3 h-3" />
            第2步 · 描述
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {slides.filter((s) => s.description).length}/{slides.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleBatchGenerateDescriptions(); }}
            disabled={isGeneratingDescription}
            className="text-xs"
          >
            {isGeneratingDescription ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
            {isGeneratingDescription ? "生成中..." : "批量生成"}
          </Button>
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600 border border-blue-100">
            <Sparkles className="w-3 h-3" />
            Gemini 3 Pro
          </span>
          <Button size="sm" onClick={() => setCurrentStep(3)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
            下一步
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Warning banner */}
      {undescribedCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 shrink-0 relative z-10">
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>还有 {undescribedCount} 页未生成描述，建议先批量生成</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleBatchGenerateDescriptions(); }}
            disabled={isGeneratingDescription}
            className="text-xs border-orange-200 text-orange-700 hover:bg-orange-100 shrink-0 ml-2"
          >
            {isGeneratingDescription ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
            {isGeneratingDescription ? "生成中..." : "批量生成"}
          </Button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - slide list */}
        <div className="w-56 border-r border-border bg-gray-50/50 overflow-y-auto shrink-0 hidden md:block">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">幻灯片</h3>
            <div className="space-y-1">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setSelectedSlideIndex(index)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-2.5 rounded-lg text-left transition-all duration-150 group",
                    selectedSlideIndex === index
                      ? "bg-blue-50 border-l-2 border-blue-500"
                      : "hover:bg-secondary/50 border-l-2 border-transparent"
                  )}
                >
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 cursor-grab" />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0",
                      slide.description
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    )}>
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{slide.title}</p>
                      <p className="text-[10px] text-muted-foreground">{slide.outlinePoints.length} 个要点</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - editor */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {currentSlide ? (
            <div className="max-w-2xl mx-auto">
              {/* Slide header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{currentSlide.title}</h2>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {selectedSlideIndex + 1}/{slides.length}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateDescription(selectedSlideIndex)}
                  disabled={isGeneratingDescription}
                  className="text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  AI 生成
                </Button>
              </div>

              {/* Outline section */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  内容大纲
                </h3>
                <div className="space-y-2 pl-4 border-l-2 border-orange-200">
                  {currentSlide.outlinePoints.length > 0 ? (
                    currentSlide.outlinePoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <input
                          value={point}
                          onChange={(e) => {
                            const newSlides = [...slides];
                            newSlides[selectedSlideIndex].outlinePoints[i] = e.target.value;
                            setSlides(newSlides);
                          }}
                          className="flex-1 text-sm bg-transparent border-none focus:outline-none focus:ring-0 py-1"
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-2">暂无大纲要点，点击 AI 生成</p>
                  )}
                </div>
              </div>

              {/* Description section */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">内容描述</h3>
                <textarea
                  value={currentSlide.description}
                  onChange={(e) => {
                    const newSlides = [...slides];
                    newSlides[selectedSlideIndex].description = e.target.value;
                    setSlides(newSlides);
                  }}
                  placeholder="详细描述这一页幻灯片的内容和布局..."
                  rows={6}
                  className="w-full rounded-xl border border-border bg-secondary/20 p-3 text-sm focus:outline-none focus:border-orange-400 resize-none transition-colors"
                />
              </div>

              {/* Optimization input */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30 border border-border/50">
                <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                <input
                  placeholder="输入优化要求..."
                  className="flex-1 text-sm bg-transparent border-none focus:outline-none"
                />
                <span className="text-[10px] text-muted-foreground shrink-0">Ctrl+Enter 提交 · Esc 取消</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              请从左侧选择一页幻灯片
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ==================== Step 3: Preview & Export ====================
  const renderStep3 = () => (
    <div className="flex flex-col h-screen bg-background">
      {/* Top navbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="主页">
            <Home className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => setCurrentStep(2)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="返回">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <span className="text-sm font-medium truncate max-w-[200px]">{projectTitle || "未命名项目"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-green-50 text-green-600 border border-green-100">
            <Eye className="w-3 h-3" />
            第3步 · 预览
          </span>
          <span className="text-xs text-muted-foreground">
            {selectedSlideIndex + 1}/{slides.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Style dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-secondary/50 hover:bg-secondary border border-border/50 transition-all"
            >
              <span>{PPT_STYLES.find((s) => s.id === style)?.icon}</span>
              <span className="hidden md:inline">{PPT_STYLES.find((s) => s.id === style)?.name}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showStyleMenu && (
              <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 min-w-[130px]">
                {PPT_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setStyle(s.id); setShowStyleMenu(false); }}
                    className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/50 text-left", style === s.id && "bg-orange-50 text-orange-700")}
                  >
                    <span>{s.icon}</span><span>{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="hidden md:inline text-xs text-muted-foreground px-2 py-1 rounded-lg bg-secondary/50">简体中文</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBatchGenerateImages}
            disabled={isGeneratingImage}
            className="text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            批量出图
          </Button>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" onClick={() => setShowExportMenu(!showExportMenu)} className="text-xs">
              <Download className="w-3.5 h-3.5 mr-1" />
              <span className="hidden md:inline">导出</span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 min-w-[120px]">
                <button onClick={() => { handleExport("pptx"); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/50 text-left">PPT 格式</button>
                <button onClick={() => { handleExport("pdf"); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/50 text-left">PDF 格式</button>
                <button onClick={() => { handleExport("images"); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/50 text-left">图片 ZIP</button>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleShare} className="text-xs">
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Warning banner */}
      {ungeneratedImageCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 shrink-0 relative z-10">
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>还有 {ungeneratedImageCount} 页未生成图片，建议批量出图</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleBatchGenerateImages(); }}
            disabled={isGeneratingImage}
            className="text-xs border-orange-200 text-orange-700 hover:bg-orange-100 shrink-0 ml-2"
          >
            {isGeneratingImage ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
            {isGeneratingImage ? "生成中..." : "批量出图"}
          </Button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden" onClick={closeAllMenus}>
        {/* Left panel - thumbnails */}
        <div className="w-48 border-r border-border bg-gray-50/50 overflow-y-auto shrink-0 hidden md:block">
          <div className="p-3 space-y-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setSelectedSlideIndex(index)}
                className={cn(
                  "w-full rounded-lg overflow-hidden border-2 transition-all duration-150",
                  selectedSlideIndex === index
                    ? "border-blue-500 shadow-md"
                    : "border-transparent hover:border-border"
                )}
              >
                <div className="aspect-video bg-white flex items-center justify-center relative">
                  {slide.generatedImage ? (
                    <img src={slide.generatedImage} alt={slide.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
                      <Presentation className="w-6 h-6" />
                      <span className="text-[10px]">未生成</span>
                    </div>
                  )}
                  <span className="absolute top-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                    {index + 1}
                  </span>
                </div>
                <div className="px-2 py-1.5 bg-white">
                  <p className="text-[11px] font-medium truncate text-left">{slide.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel - preview & details */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {currentSlide ? (
            <div className="max-w-2xl mx-auto">
              {/* Generated image preview */}
              <div className="mb-6 rounded-xl overflow-hidden bg-secondary/20 border border-border/50">
                {currentSlide.generatedImage ? (
                  <img src={currentSlide.generatedImage} alt={currentSlide.title} className="w-full" />
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                        <p className="text-sm">正在生成图片...</p>
                      </>
                    ) : (
                      <>
                        <Presentation className="w-10 h-10 text-muted-foreground/30" />
                        <p className="text-sm">点击下方按钮生成图片</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateImage(selectedSlideIndex)}
                          className="text-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          生成图片
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Outline accordion */}
              <div className="mb-4 rounded-xl border border-border/50 overflow-hidden">
                <button
                  onClick={() => setOutlineExpanded(!outlineExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  <h3 className="text-sm font-medium">页面大纲</h3>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", outlineExpanded && "rotate-180")} />
                </button>
                {outlineExpanded && (
                  <div className="px-4 py-3 space-y-1.5">
                    <p className="text-sm font-medium text-foreground mb-2">{currentSlide.title}</p>
                    {currentSlide.outlinePoints.length > 0 ? (
                      currentSlide.outlinePoints.map((point, i) => (
                        <p key={i} className="text-sm text-muted-foreground pl-3 border-l-2 border-orange-200">{point}</p>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">暂无大纲</p>
                    )}
                  </div>
                )}
              </div>

              {/* Description accordion */}
              <div className="mb-6 rounded-xl border border-border/50 overflow-hidden">
                <button
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  <h3 className="text-sm font-medium">页面描述</h3>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", descriptionExpanded && "rotate-180")} />
                </button>
                {descriptionExpanded && (
                  <div className="px-4 py-3">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {currentSlide.description || "暂无描述"}
                    </p>
                  </div>
                )}
              </div>

              {/* Style & extra requirements */}
              <div className="space-y-3 p-4 rounded-xl bg-secondary/20 border border-border/50">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">风格描述</label>
                  <input
                    placeholder="输入额外的风格描述..."
                    className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">额外要求</label>
                  <input
                    placeholder="输入额外要求..."
                    className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 transition-colors"
                  />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" className="text-xs bg-orange-500 hover:bg-orange-600 text-white">
                    <Save className="w-3.5 h-3.5 mr-1" />
                    保存
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              请从左侧选择一页幻灯片
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ==================== Main Render ====================
  if (currentStep === 2) return renderStep2();
  if (currentStep === 3) return renderStep3();
  return renderStep1();
};

export default AIPPT;