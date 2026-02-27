import { type ChangeEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import { CreditCostHint } from "@/components/CreditCostHint";
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
  Plus,
  X,
  RefreshCw,
  Check,
  Upload,
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
  saveSingleSlideImage,
} from "@/lib/ai-ppt";
import { useToast } from "@/hooks/use-toast";
import { saveWork, updateWork } from "@/lib/repositories/works";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { InsufficientBalanceDialog } from "@/components/InsufficientBalanceDialog";

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
  { id: "ink", name: "国风墨绘", icon: "🏯", prompt: "Traditional Chinese ink wash painting style, elegant brush strokes, artistic Zen atmosphere, high-end oriental aesthetic, minimalist ink textures, subtle watercolor gradients, cultural and sophisticated." },
  { id: "watercolor", name: "唯美水彩", icon: "💧", prompt: "Elegant watercolor wash, soft fluid textures, artistic bleeding effects, dreamy and light atmosphere, delicate hand-painted feel, pastel color palette, minimalist artistic expression." },
  { id: "popart", name: "波普艺术", icon: "🎯", prompt: "Vibrant pop art style, bold black outlines, halftone patterns, high-contrast saturated colors, Andy Warhol aesthetic, energetic and retro, repetitive patterns, strong visual impact." },
  { id: "crayon", name: "蜡笔色粉笔", icon: "🖍️", prompt: "Whimsical crayon drawing style, vibrant oil pastel textures, messy but charming lines, colorful scribbles, soft paper background, childlike imagination, bright primary colors, heartwarming and playful, high resolution." },
];

const PPT_TEMPLATES = [
  { id: "none", name: "无模板", icon: "📄", prompt: "" },
  { id: "visual-note", name: "视觉笔记风", icon: "📝", prompt: "Professional Digital Whiteboard Illustration, hand-drawn marker sketch style, minimalist infographic doodles, creamy white paper texture with subtle grain, clean black ink outlines, hand-drawn arrows and emphasis markers, soft accent colors (orange/blue), organized visual thinking layout, high resolution, vector art feel, trending on Pinterest." },
  { id: "swiss-minimal", name: "瑞士极简风", icon: "🔲", prompt: "High-end corporate PPT slide, Swiss Modernism, ultra-minimalist layout, massive negative space, bold sans-serif typography, professional color palette (Deep Navy, Slate Gray, Crisp White), grid-based alignment, perfect geometric shapes, thin professional lines, authoritative and clean, Apple website aesthetic." },
  { id: "isometric", name: "2.5D 等距视角", icon: "🧊", prompt: "Isometric 3D infographic design, 45-degree angle orthographic view, clean vector 3D models, soft pastel color grading with professional gradients, neutral light gray background, elements perfectly aligned on a 3D grid, sophisticated organized tech-oriented visualization, C4D render style, soft shadows, clean edges." },
  { id: "glassmorphism", name: "磨砂玻璃风", icon: "🪟", prompt: "Futuristic Glassmorphism style, translucent frosted glass cards floating in space, deep vibrant mesh gradient background (purple, blue, and teal), glowing neon edges, soft blur effects, typography: thin white sans-serif text, high-tech UI elements, floating 3D spheres, elegant refraction, cinematic lighting, Unreal Engine 5 render." },
  { id: "claymorphism", name: "黏土拟物风", icon: "🧸", prompt: "Claymorphism 3D style, soft matte texture, rounded organic shapes, volumetric studio lighting, playful and friendly aesthetic, Morandi color palette, 3D icons with soft depth, cute and modern, high-quality 3D render, minimalist composition, friendly atmosphere." },
  { id: "dark-cinematic", name: "深色电影感", icon: "🎬", prompt: "Dark cinematic presentation slide, charcoal gray textured background, dramatic spot lighting, high contrast, glowing gold and white accents, elegant serif typography, luxury brand aesthetic, sophisticated light and shadow play, 8k resolution, minimalist but powerful composition." },
  { id: "neo-brutalism", name: "新野兽派", icon: "⚡", prompt: "Neo-brutalism design, bold thick black outlines, high-saturation pop colors (Yellow, Cyan, Red), thick hard shadows, asymmetrical experimental layout, avant-garde typography, vibrant energy, flat vector shapes, confident and modern, trending on Dribbble." },
  { id: "editorial", name: "高级杂志风", icon: "📰", prompt: "High-end editorial magazine layout, fashion aesthetic, sophisticated mix of bold Serif and light Sans-serif fonts, professional white space management, photography-centric composition, minimalist artistic style, clean margins, elegant typography-focused design, premium print feel." },
];

const PPT_RATIOS = [
  { id: "16:9", name: "16:9" },
  { id: "4:3", name: "4:3" },
  { id: "3:4", name: "3:4" },
  { id: "1:1", name: "1:1" },
];

const PAGE_COUNTS = [3, 5, 8, 10, 12];

// 线路选项
const PPT_LINE_OPTIONS = [
  { id: "standard", name: "灵犀标准", line: "standard" as const, resolution: "default" as const },
  { id: "standard_2k", name: "灵犀 2K", line: "standard" as const, resolution: "2k" as const },
  { id: "standard_4k", name: "灵犀 4K", line: "standard" as const, resolution: "4k" as const },
];

// ==================== Placeholder helpers ====================
const PLACEHOLDERS: Record<string, string> = {
  sentence: "输入主题，例如：《高效能人士的七个习惯》读书笔记",
  outline: "输入大纲内容，每行一个要点...",
  description: "输入详细描述内容...",
};

const WORD_EXTENSIONS = [".docx"];
const TEXT_EXTENSIONS = [".txt", ".md", ".markdown", ".csv", ".json"];

const decodeXmlEntities = (value: string): string =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");

const extractTextFromDocxXml = (xml: string): string => {
  const paragraphs = xml.split("</w:p>");
  const lines = paragraphs
    .map((paragraph) => {
      const matches = [...paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)];
      if (matches.length === 0) return "";
      const line = matches.map((m) => decodeXmlEntities(m[1] || "")).join("");
      return line.trim();
    })
    .filter(Boolean);
  return lines.join("\n");
};

// ==================== Component ====================
const AIPPT = () => {
  const navigate = useNavigate();
  const { checkCredits, showInsufficientDialog, requiredAmount, featureName, currentBalance, goToRecharge, dismissDialog, refreshBalance } = useCreditCheck();

  // Step control
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1 states
  const [generationMode, setGenerationMode] = useState<"sentence" | "outline" | "description">("sentence");
  const [inputContent, setInputContent] = useState("");
  const [pageCount, setPageCount] = useState(8);
  const [style, setStyle] = useState("free");
  const [template, setTemplate] = useState("none");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [selectedLine, setSelectedLine] = useState("standard_2k");
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isParsingFile, setIsParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 2 states
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Step 3 states
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [savedWorkId, setSavedWorkId] = useState<string | null>(null);

  // Dropdown states
  const [showPageCountMenu, setShowPageCountMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showRatioMenu, setShowRatioMenu] = useState(false);

  // Step 3 accordion states
  const [outlineExpanded, setOutlineExpanded] = useState(true);
  const [descriptionExpanded, setDescriptionExpanded] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // ==================== Handlers ====================

  const { toast } = useToast();

  const persistPptWork = async (options?: {
    format?: "pptx" | "pdf" | "images" | "image";
    nextSlides?: SlideData[];
    nextProjectTitle?: string;
    forceCreate?: boolean;
  }) => {
    const activeSlides = options?.nextSlides ?? slides;
    const firstSlideImage = activeSlides.find((slide) => Boolean(slide.generatedImage))?.generatedImage || null;
    const payload = {
      title: (options?.nextProjectTitle ?? projectTitle)?.trim() || "AI PPT 作品",
      type: "ppt",
      tool: "AI PPT",
      thumbnailDataUrl: firstSlideImage,
      content: {
        text: inputContent.trim() || "AI PPT 项目",
        format: options?.format || "draft",
        slideCount: activeSlides.length,
        generatedSlideCount: activeSlides.filter((slide) => Boolean(slide.generatedImage)).length,
        aspectRatio,
        style,
        template,
      },
    };

    try {
      if (!options?.forceCreate && savedWorkId) {
        await updateWork(savedWorkId, payload);
      } else {
        const created = await saveWork(payload);
        if (created?.id) {
          setSavedWorkId(created.id);
        }
      }
    } catch (error) {
      console.error("自动保存 AI PPT 作品失败", error);
    }
  };

  const parseUploadedFile = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase();
    const isDocx = WORD_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    const isTextFile = TEXT_EXTENSIONS.some((ext) => fileName.endsWith(ext));

    if (isDocx) {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const docXmlFile = zip.file("word/document.xml");
      if (!docXmlFile) {
        throw new Error("未读取到 Word 正文内容，请检查文件是否损坏");
      }
      const xml = await docXmlFile.async("string");
      return extractTextFromDocxXml(xml);
    }

    if (isTextFile) {
      return await file.text();
    }

    if (fileName.endsWith(".doc")) {
      throw new Error("暂不支持 .doc，请先另存为 .docx 后上传");
    }

    throw new Error("仅支持 .docx / .txt / .md / .csv / .json 文件");
  };

  const handleUploadDocument = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    try {
      const content = (await parseUploadedFile(file)).trim();
      if (!content) {
        throw new Error("文件内容为空，无法用于生成 PPT");
      }

      setInputContent(content);
      setUploadedFileName(file.name);
      setGenerationMode("description");
      toast({
        title: "导入成功",
        description: `已读取 ${file.name}，并切换到“从描述生成”模式`,
      });
    } catch (error) {
      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "请更换文件后重试",
        variant: "destructive",
      });
    } finally {
      setIsParsingFile(false);
      event.target.value = "";
    }
  };

  const handleStartGenerate = async () => {
    if (!inputContent.trim()) return;
    if (!checkCredits('ai_ppt_outline')) return;
    setIsGeneratingOutline(true);

    const result = await generateOutline({
      content: inputContent.trim(),
      mode: generationMode,
      pageCount,
      style,
    });

    setIsGeneratingOutline(false);

    if (result.success && result.slides) {
      const nextTitle = result.projectTitle || inputContent.trim().slice(0, 30);
      setSlides(result.slides);
      setProjectTitle(nextTitle);
      setSelectedSlideIndex(0);
      setCurrentStep(2);
      void refreshBalance();
      void persistPptWork({
        nextSlides: result.slides,
        nextProjectTitle: nextTitle,
        forceCreate: true,
      });
    } else {
      toast({ title: "生成失败", description: result.error || "请稍后重试", variant: "destructive" });
    }
  };

  const handleGenerateDescription = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide) return;
    if (!checkCredits("ai_ppt_slide")) return;
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
      void refreshBalance();
      void persistPptWork({ nextSlides: newSlides });
    } else {
      toast({ title: "生成描述失败", description: result.error || "请稍后重试", variant: "destructive" });
    }
  };

  const handleBatchGenerateDescriptions = async () => {
    const needGenerateIndexes = slides
      .map((slide, index) => (slide.description?.trim() ? -1 : index))
      .filter((index) => index >= 0);

    if (needGenerateIndexes.length === 0) {
      toast({ title: "无需生成", description: "所有页面已有描述" });
      return;
    }

    setIsGeneratingDescription(true);
    const updatedSlides = [...slides];
    let successCount = 0;
    let failCount = 0;

    for (const index of needGenerateIndexes) {
      const slide = updatedSlides[index];
      if (!slide) continue;
      if (!checkCredits("ai_ppt_slide")) {
        failCount += (needGenerateIndexes.length - successCount - failCount);
        break;
      }

      const result = await generateSlideDescription({
        slideTitle: slide.title,
        outlinePoints: slide.outlinePoints,
        overallTheme: projectTitle,
        style,
        slideIndex: slide.id,
        totalSlides: updatedSlides.length,
      });

      if (result.success && result.description) {
        updatedSlides[index] = { ...slide, description: result.description };
        setSlides([...updatedSlides]);
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsGeneratingDescription(false);
    void refreshBalance();
    void persistPptWork({ nextSlides: updatedSlides });

    if (failCount === 0) {
      toast({ title: "批量描述完成", description: `已生成 ${successCount} 页描述` });
    } else {
      toast({ title: "部分生成完成", description: `成功 ${successCount} 页，失败 ${failCount} 页`, variant: "destructive" });
    }
  };

  const canGenerateImageFromSlide = (slide: SlideData): boolean => {
    const hasDescription = Boolean(slide.description?.trim());
    const hasOutline = slide.outlinePoints.some((point) => Boolean(point?.trim()));
    const hasTitle = Boolean(slide.title?.trim());
    return hasDescription || hasOutline || hasTitle;
  };

  const buildImageDescriptionFromSlide = (slide: SlideData): string => {
    const description = slide.description?.trim();
    if (description) return description;

    const title = slide.title?.trim() || "未命名页面";
    const outlineText = slide.outlinePoints
      .map((point) => point.trim())
      .filter(Boolean)
      .map((point, index) => `${index + 1}. ${point}`)
      .join("\n");

    return `请根据以下 PPT 页面大纲信息生成一张演示页面视觉图。
页面标题：${title}
核心要点：
${outlineText || "暂无要点，请基于标题延展"}

要求：
- 强调信息层级与重点结论
- 将要点转化为清晰可视化布局
- 画面适合商业演示场景`;
  };

  const handleGenerateImage = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide) return;
    if (!canGenerateImageFromSlide(slide)) {
      toast({ title: "内容不足", description: "请至少补充页面标题、大纲要点或内容描述后再出图", variant: "destructive" });
      return;
    }
    if (!checkCredits('ai_ppt_image_standard')) return;
    setIsGeneratingImage(true);

    const imageDescription = buildImageDescriptionFromSlide(slide);
    const selectedLineOption = PPT_LINE_OPTIONS.find(l => l.id === selectedLine) || PPT_LINE_OPTIONS[0];
    const result = await generateSlideImage({
      description: imageDescription,
      style,
      template,
      aspectRatio,
      line: selectedLineOption.line,
      resolution: selectedLineOption.resolution,
      featureCode: "ai_ppt_image_standard",
    });

    setIsGeneratingImage(false);

    if (result.success && (result.imageUrl || result.imageBase64)) {
      const newSlides = [...slides];
      newSlides[slideIndex] = { ...newSlides[slideIndex], generatedImage: result.imageUrl || result.imageBase64 };
      setSlides(newSlides);
      void refreshBalance();
      void persistPptWork({ nextSlides: newSlides });
    } else {
      toast({ title: "图片生成失败", description: result.error || "请稍后重试", variant: "destructive" });
    }
  };

  const handleBatchGenerateImages = async () => {
    const slidesNeedingImages = slides.filter((s) => !s.generatedImage && canGenerateImageFromSlide(s));
    if (slidesNeedingImages.length === 0) {
      toast({ title: "无需生成", description: "没有可出图的页面（请先补充标题/要点/描述）" });
      return;
    }
    if (!checkCredits('ai_ppt_image_standard')) return;
    setIsGeneratingImage(true);

    const selectedLineOption2 = PPT_LINE_OPTIONS.find(l => l.id === selectedLine) || PPT_LINE_OPTIONS[0];
    const newSlides = [...slides];
    for (let i = 0; i < newSlides.length; i++) {
      if (newSlides[i].generatedImage || !canGenerateImageFromSlide(newSlides[i])) continue;
      const imageDescription = buildImageDescriptionFromSlide(newSlides[i]);
      const result = await generateSlideImage({
        description: imageDescription,
        style,
        template,
        aspectRatio,
        line: selectedLineOption2.line,
        resolution: selectedLineOption2.resolution,
        featureCode: "ai_ppt_image_standard",
      });
      if (result.success && (result.imageUrl || result.imageBase64)) {
        newSlides[i] = { ...newSlides[i], generatedImage: result.imageUrl || result.imageBase64 };
        setSlides([...newSlides]);
      }
    }

    setIsGeneratingImage(false);
    void refreshBalance();
    toast({ title: "批量出图完成" });
    void persistPptWork({ nextSlides: newSlides });
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
      void persistPptWork({ format });

      toast({ title: "导出成功" });
    } catch (error) {
      toast({ title: "导出失败", description: error instanceof Error ? error.message : "请稍后重试", variant: "destructive" });
    }
  };

  const handleSaveCurrentSlideImage = async () => {
    const slide = slides[selectedSlideIndex];
    if (!slide?.generatedImage) {
      toast({ title: "暂无可保存图片", description: "请先为当前页面生成图片", variant: "destructive" });
      return;
    }

    try {
      await saveSingleSlideImage(slide, projectTitle, selectedSlideIndex);
      void persistPptWork({ format: "image" });
      toast({ title: "保存成功" });
    } catch (error) {
      toast({ title: "保存失败", description: error instanceof Error ? error.message : "请稍后重试", variant: "destructive" });
    }
  };

  const handleShare = () => {
    toast({ title: "分享功能", description: "即将上线，敬请期待" });
  };

  const closeAllMenus = () => {
    setShowPageCountMenu(false);
    setShowStyleMenu(false);
    setShowTemplateMenu(false);
    setShowRatioMenu(false);
    setShowLineMenu(false);
    setShowExportMenu(false);
  };

  const currentSlide = slides[selectedSlideIndex];

  // ==================== Step 1: Input & Config ====================
  const renderStep1 = () => (
    <PageLayout className="py-2 md:py-8" maxWidth="4xl">
      <div onClick={closeAllMenus}>
        {/* Title area */}
        <div className="text-center mb-8 md:mb-12 pt-4 md:pt-8">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img 
              src="/icons/ai-ppt-custom.webp" 
              alt="AI PPT" 
              className="w-14 h-14 md:w-16 md:h-16 object-contain"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">今天想创作什么？</h1>
          <p className="text-muted-foreground text-sm md:text-base">把想法转化为精美演示文稿</p>
        </div>

        {/* Mode tabs - 移动端使用横向滚动 */}
        <div className="flex items-center justify-center gap-0.5 md:gap-1 mb-4 md:mb-6 overflow-x-auto scrollbar-none">
          {([
            { key: "sentence" as const, label: "一句话生成" },
            { key: "outline" as const, label: "从大纲生成" },
            { key: "description" as const, label: "从描述生成" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setGenerationMode(tab.key)}
              className={cn(
                "px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap",
                generationMode === tab.key
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-muted-foreground hover:text-foreground active:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* File upload */}
        <div className="glass-card rounded-xl p-3 md:p-4 mb-4 border border-border/50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">上传文档快速生成</p>
              <p className="text-xs text-muted-foreground">支持 Word(.docx)、TXT、MD、CSV、JSON</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingFile}
              className="text-xs"
            >
              {isParsingFile ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              {isParsingFile ? "读取中..." : "上传文件"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.txt,.md,.markdown,.csv,.json,.doc"
              onChange={handleUploadDocument}
              className="hidden"
            />
          </div>
          {uploadedFileName ? (
            <p className="mt-2 text-xs text-muted-foreground truncate">已导入：{uploadedFileName}</p>
          ) : null}
        </div>

        {/* Textarea */}
        <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5 mb-4 shadow-lg border border-border/50 focus-within:border-orange-400 transition-colors">
          <textarea
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder={PLACEHOLDERS[generationMode]}
            rows={generationMode === "sentence" ? 4 : 8}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base leading-relaxed"
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-muted-foreground">{inputContent.length} 字</span>
          </div>
        </div>

        {/* Parameter bar - 移动端自动换行 */}
        <div className="flex items-center gap-1.5 md:gap-3 flex-wrap mb-4 md:mb-6">
          {/* Page count selector */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowPageCountMenu(!showPageCountMenu); setShowStyleMenu(false); setShowTemplateMenu(false); setShowRatioMenu(false); setShowLineMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-secondary/50 hover:bg-secondary border border-border/50 transition-all"
            >
              <span>🖥</span>
              <span>{pageCount} 页</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showPageCountMenu && "rotate-180")} />
            </button>
            {showPageCountMenu && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 w-[100px] max-w-[calc(100vw-2rem)] max-h-[168px] overflow-y-auto scrollbar-thin dropdown-panel">
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
              onClick={() => { setShowStyleMenu(!showStyleMenu); setShowPageCountMenu(false); setShowTemplateMenu(false); setShowRatioMenu(false); setShowLineMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-secondary/50 hover:bg-secondary border border-border/50 transition-all"
            >
              <span>{PPT_STYLES.find((s) => s.id === style)?.icon}</span>
              <span>{PPT_STYLES.find((s) => s.id === style)?.name}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showStyleMenu && "rotate-180")} />
            </button>
            {showStyleMenu && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 w-[140px] max-w-[calc(100vw-2rem)] max-h-[168px] overflow-y-auto scrollbar-thin dropdown-panel">
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

          {/* Template selector */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowTemplateMenu(!showTemplateMenu); setShowPageCountMenu(false); setShowStyleMenu(false); setShowRatioMenu(false); setShowLineMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-secondary/50 hover:bg-secondary border border-border/50 transition-all"
            >
              <span>{PPT_TEMPLATES.find((t) => t.id === template)?.icon}</span>
              <span className="hidden xs:inline">{PPT_TEMPLATES.find((t) => t.id === template)?.name}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showTemplateMenu && "rotate-180")} />
            </button>
            {showTemplateMenu && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 w-[160px] max-w-[calc(100vw-2rem)] max-h-[200px] overflow-y-auto scrollbar-thin dropdown-panel">
                {PPT_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTemplate(t.id); setShowTemplateMenu(false); }}
                    className={cn("w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/50 text-left", template === t.id && "bg-orange-50 text-orange-700")}
                  >
                    <span>{t.icon}</span>
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ratio selector */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowRatioMenu(!showRatioMenu); setShowPageCountMenu(false); setShowStyleMenu(false); setShowTemplateMenu(false); setShowLineMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-secondary/50 hover:bg-secondary border border-border/50 transition-all"
            >
              <span>{aspectRatio}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showRatioMenu && "rotate-180")} />
            </button>
            {showRatioMenu && (
              <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 w-[90px] max-w-[calc(100vw-2rem)] max-h-[168px] overflow-y-auto scrollbar-thin dropdown-panel">
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

          {/* 线路选择 */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowLineMenu(!showLineMenu); setShowPageCountMenu(false); setShowStyleMenu(false); setShowTemplateMenu(false); setShowRatioMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-secondary/50 hover:bg-secondary border border-border/50 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{PPT_LINE_OPTIONS.find(l => l.id === selectedLine)?.name}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showLineMenu && "rotate-180")} />
            </button>
            {showLineMenu && (
              <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 w-[130px] max-w-[calc(100vw-2rem)] max-h-[180px] overflow-y-auto scrollbar-thin dropdown-panel">
                {PPT_LINE_OPTIONS.map((line) => (
                  <button
                    key={line.id}
                    onClick={() => { setSelectedLine(line.id); setShowLineMenu(false); }}
                    className={cn("w-full px-3 py-2 text-sm hover:bg-secondary/50 text-left", selectedLine === line.id && "bg-orange-50 text-orange-700")}
                  >
                    {line.name}
                  </button>
                ))}
              </div>
            )}
          </div>


        </div>

        {/* Generate button */}
        <div className="flex flex-col items-center gap-2 mb-10">
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
          <CreditCostHint featureCode="ai_ppt_outline" />
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
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Top navbar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5 bg-white border-b border-border shrink-0 relative z-20 gap-2">
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
          <button onClick={() => navigate("/")} className="p-1.5 md:p-2 rounded-lg hover:bg-secondary transition-colors shrink-0" title="主页" aria-label="主页">
            <Home className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => setCurrentStep(1)} className="p-1.5 md:p-2 rounded-lg hover:bg-secondary transition-colors shrink-0" title="返回" aria-label="返回">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-px h-5 bg-border mx-0.5 md:mx-1 shrink-0" />
          <input
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 min-w-0 max-w-[100px] md:max-w-[200px]"
            placeholder="项目标题"
          />
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-orange-50 text-orange-600 border border-orange-100 shrink-0">
            <Pencil className="w-3 h-3" />
            第2步 · 描述
          </span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {slides.filter((s) => s.description).length}/{slides.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleBatchGenerateDescriptions(); }}
            disabled={isGeneratingDescription}
            className="text-xs min-h-[36px]"
          >
            {isGeneratingDescription ? <Loader2 className="w-3.5 h-3.5 md:mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 md:mr-1" />}
            <span className="hidden md:inline">{isGeneratingDescription ? "生成中..." : "批量描述（每页5分）"}</span>
          </Button>
          <Button size="sm" onClick={() => setCurrentStep(3)} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs min-h-[36px]">
            下一步
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Mobile slide selector */}
      <div className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-gray-50/80 border-b border-border overflow-x-auto shrink-0 scrollbar-none">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setSelectedSlideIndex(index)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0 transition-all",
              selectedSlideIndex === index
                ? "bg-blue-100 text-blue-700 font-medium"
                : "bg-white text-muted-foreground border border-border/50"
            )}
          >
            <span className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium",
              slide.description ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
            )}>
              {index + 1}
            </span>
            <span className="max-w-[80px] truncate">{slide.title}</span>
          </button>
        ))}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
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
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                      slide.description
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    )}>
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{slide.title}</p>
                      <p className="text-xs text-muted-foreground">{slide.outlinePoints.length} 个要点</p>
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
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    value={currentSlide.title}
                    onChange={(e) => {
                      const newSlides = [...slides];
                      newSlides[selectedSlideIndex].title = e.target.value;
                      setSlides(newSlides);
                    }}
                    className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 flex-1 min-w-0"
                    placeholder="输入页面标题..."
                  />
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full shrink-0">
                    {selectedSlideIndex + 1}/{slides.length}
                  </span>
                </div>
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
                      <div key={i} className="flex items-start gap-2 group">
                        <input
                          value={point}
                          onChange={(e) => {
                            const newSlides = [...slides];
                            newSlides[selectedSlideIndex].outlinePoints[i] = e.target.value;
                            setSlides(newSlides);
                          }}
                          className="flex-1 text-sm bg-transparent border-none focus:outline-none focus:ring-0 py-1"
                        />
                        <button
                          onClick={() => {
                            const newSlides = [...slides];
                            newSlides[selectedSlideIndex].outlinePoints.splice(i, 1);
                            setSlides([...newSlides]);
                          }}
                          className="p-1 rounded hover:bg-red-50 active:bg-red-50 text-muted-foreground/40 hover:text-red-500 active:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0 touch-target"
                          title="删除要点"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-2">暂无大纲要点，点击 AI 生成</p>
                  )}
                  <button
                    onClick={() => {
                      const newSlides = [...slides];
                      newSlides[selectedSlideIndex].outlinePoints.push("");
                      setSlides([...newSlides]);
                    }}
                    className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 active:text-orange-600 py-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加要点
                  </button>
                </div>
              </div>

              {/* Description section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">内容描述</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateDescription(selectedSlideIndex)}
                    disabled={isGeneratingDescription}
                    className="text-xs"
                  >
                    {isGeneratingDescription ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                    生成（5积分）
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  建议先生成详细描述：会补充关键信息、表达逻辑和版式建议，让最终 PPT 更完整、更专业。
                </p>
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
                <span className="text-xs text-muted-foreground shrink-0 hidden md:inline">Ctrl+Enter 提交 · Esc 取消</span>
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
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Top navbar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5 bg-white border-b border-border shrink-0 gap-2">
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
          <button onClick={() => navigate("/")} className="p-1.5 md:p-2 rounded-lg hover:bg-secondary transition-colors shrink-0" title="主页">
            <Home className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => setCurrentStep(2)} className="p-1.5 md:p-2 rounded-lg hover:bg-secondary transition-colors shrink-0" title="返回">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-px h-5 bg-border mx-0.5 md:mx-1 shrink-0" />
          <span className="text-sm font-medium truncate min-w-0 max-w-[80px] md:max-w-[200px]">{projectTitle || "未命名项目"}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {selectedSlideIndex + 1}/{slides.length}
          </span>
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-green-50 text-green-600 border border-green-100 shrink-0">
            <Eye className="w-3 h-3" />
            第3步 · 预览
          </span>
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* Style dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowStyleMenu(!showStyleMenu); setShowTemplateMenu(false); setShowLineMenu(false); }}
              className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-lg text-xs bg-secondary/50 hover:bg-secondary border border-border/50 transition-all"
            >
              <span>{PPT_STYLES.find((s) => s.id === style)?.icon}</span>
              <span className="hidden md:inline">{PPT_STYLES.find((s) => s.id === style)?.name}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showStyleMenu && (
              <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 w-[130px] max-w-[calc(100vw-2rem)] max-h-[168px] overflow-y-auto scrollbar-thin dropdown-panel">
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
          {/* Template dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowTemplateMenu(!showTemplateMenu); setShowStyleMenu(false); setShowLineMenu(false); }}
              className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-lg text-xs bg-secondary/50 hover:bg-secondary border border-border/50 transition-all"
            >
              <span>{PPT_TEMPLATES.find((t) => t.id === template)?.icon}</span>
              <span className="hidden md:inline">{PPT_TEMPLATES.find((t) => t.id === template)?.name}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showTemplateMenu && (
              <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 w-[160px] max-w-[calc(100vw-2rem)] max-h-[200px] overflow-y-auto scrollbar-thin dropdown-panel">
                {PPT_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTemplate(t.id); setShowTemplateMenu(false); }}
                    className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/50 text-left", template === t.id && "bg-orange-50 text-orange-700")}
                  >
                    <span>{t.icon}</span><span>{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Resolution dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowLineMenu(!showLineMenu); setShowStyleMenu(false); setShowTemplateMenu(false); }}
              className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-lg text-xs bg-secondary/50 hover:bg-secondary border border-border/50 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{PPT_LINE_OPTIONS.find((l) => l.id === selectedLine)?.name}</span>
              <span className="md:hidden">画质</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showLineMenu && (
              <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 w-[130px] max-w-[calc(100vw-2rem)] max-h-[180px] overflow-y-auto scrollbar-thin dropdown-panel">
                {PPT_LINE_OPTIONS.map((line) => (
                  <button
                    key={line.id}
                    onClick={() => { setSelectedLine(line.id); setShowLineMenu(false); }}
                    className={cn("w-full px-3 py-2 text-xs hover:bg-secondary/50 text-left", selectedLine === line.id && "bg-orange-50 text-orange-700")}
                  >
                    {line.name}
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
            className="text-xs min-h-[36px]"
          >
            <Sparkles className="w-3.5 h-3.5 md:mr-1" />
            <span className="hidden md:inline">批量出图</span>
          </Button>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" onClick={() => setShowExportMenu(!showExportMenu)} className="text-xs">
              <Download className="w-3.5 h-3.5 md:mr-1" />
              <span className="hidden md:inline">导出</span>
              <ChevronDown className="w-3 h-3 ml-0.5 md:ml-1" />
            </Button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 w-[148px] max-w-[calc(100vw-2rem)] dropdown-panel">
                <button onClick={() => { handleExport("pptx"); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/50 text-left">PPT 格式</button>
                <button onClick={() => { handleExport("pdf"); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/50 text-left">PDF 格式</button>
                <button onClick={() => { handleSaveCurrentSlideImage(); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/50 text-left">保存当前页图片</button>
                <button onClick={() => { handleExport("images"); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/50 text-left">图片 ZIP</button>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleShare} className="text-xs">
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Mobile slide selector */}
      <div className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-gray-50/80 border-b border-border overflow-x-auto shrink-0 scrollbar-none">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setSelectedSlideIndex(index)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0 transition-all",
              selectedSlideIndex === index
                ? "bg-blue-100 text-blue-700 font-medium"
                : "bg-white text-muted-foreground border border-border/50"
            )}
          >
            <span className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium",
              slide.generatedImage ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
            )}>
              {index + 1}
            </span>
            <span className="max-w-[80px] truncate">{slide.title}</span>
          </button>
        ))}
      </div>

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
                    <img src={slide.generatedImage} alt={slide.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
                      <Presentation className="w-6 h-6" />
                      <span className="text-xs">未生成</span>
                    </div>
                  )}
                  <span className="absolute top-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">
                    {index + 1}
                  </span>
                </div>
                <div className="px-2 py-1.5 bg-white">
                  <p className="text-xs font-medium truncate text-left">{slide.title}</p>
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
              <div className="mb-6 rounded-xl overflow-hidden bg-secondary/20 border border-border/50 relative group">
                {currentSlide.generatedImage ? (
                  <>
                    <img src={currentSlide.generatedImage} alt={currentSlide.title} loading="lazy" decoding="async" className="w-full" />
                    {/* 桌面端 hover 覆盖层 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all hidden md:flex items-center justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSlides = [...slides];
                          newSlides[selectedSlideIndex] = { ...newSlides[selectedSlideIndex], generatedImage: undefined };
                          setSlides(newSlides);
                          handleGenerateImage(selectedSlideIndex);
                        }}
                        disabled={isGeneratingImage}
                        className="opacity-0 group-hover:opacity-100 transition-all bg-white/90 hover:bg-white text-xs"
                      >
                        {isGeneratingImage ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                        重新生成
                      </Button>
                    </div>
                    {/* 移动端始终显示的重新生成按钮 */}
                    <div className="absolute bottom-2 right-2 md:hidden">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSlides = [...slides];
                          newSlides[selectedSlideIndex] = { ...newSlides[selectedSlideIndex], generatedImage: undefined };
                          setSlides(newSlides);
                          handleGenerateImage(selectedSlideIndex);
                        }}
                        disabled={isGeneratingImage}
                        className="bg-white/90 active:bg-white text-xs shadow-md"
                      >
                        {isGeneratingImage ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                        重新生成
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    {isGeneratingImage ? (
                      <GeneratingLoader message="正在生成图片..." />
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
                    <input
                      value={currentSlide.title}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        newSlides[selectedSlideIndex].title = e.target.value;
                        setSlides(newSlides);
                      }}
                      className="text-sm font-medium text-foreground mb-2 w-full bg-transparent border-none focus:outline-none focus:ring-0"
                      placeholder="输入页面标题..."
                    />
                    {currentSlide.outlinePoints.length > 0 ? (
                      currentSlide.outlinePoints.map((point, i) => (
                        <div key={i} className="flex items-start gap-1.5 group pl-3 border-l-2 border-orange-200">
                          <input
                            value={point}
                            onChange={(e) => {
                              const newSlides = [...slides];
                              newSlides[selectedSlideIndex].outlinePoints[i] = e.target.value;
                              setSlides(newSlides);
                            }}
                            className="flex-1 text-sm text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-0 py-0.5"
                          />
                          <button
                            onClick={() => {
                              const newSlides = [...slides];
                              newSlides[selectedSlideIndex].outlinePoints.splice(i, 1);
                              setSlides([...newSlides]);
                            }}
                            className="p-1 rounded hover:bg-red-50 active:bg-red-50 text-muted-foreground/40 hover:text-red-500 active:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0 touch-target"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">暂无大纲</p>
                    )}
                    <button
                      onClick={() => {
                        const newSlides = [...slides];
                        newSlides[selectedSlideIndex].outlinePoints.push("");
                        setSlides([...newSlides]);
                      }}
                      className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 py-1 pl-3 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      添加要点
                    </button>
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
  const stepContent = currentStep === 2 ? renderStep2() : currentStep === 3 ? renderStep3() : renderStep1();
  return (
    <>
      {stepContent}
      <InsufficientBalanceDialog
        open={showInsufficientDialog}
        onOpenChange={dismissDialog}
        balance={currentBalance}
        required={requiredAmount}
        featureName={featureName}
        onRecharge={goToRecharge}
      />
    </>
  );
};

export default AIPPT;
