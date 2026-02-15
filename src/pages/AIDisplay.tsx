import { useState, useRef } from "react";
import { PageLayout } from "@/components/PageLayout";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import {
  ArrowLeft,
  X,
  Sparkles,
  Download,
  RefreshCw,
  Send,
  ChevronDown,
  Zap,
  ShirtIcon,
  Store,
  Mountain,
  Focus,
  ScanEye,
  ListOrdered,
  Shirt,
  ImageIcon,
  ChevronUp,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateImage } from "@/lib/ai-image";
import { compressImage, mergeImagesToGrid, downloadGeneratedImage } from "@/lib/image-utils";
import { analyzeClothingForDisplay, identifyAllGarments, type VMAnalysisResult, type SceneType } from "@/lib/vm-analysis";
import { buildVMGenerationPrompt } from "@/lib/vm-prompt-builder";
import { saveGeneratedImageWork } from "@/lib/repositories/works";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { InsufficientBalanceDialog } from "@/components/InsufficientBalanceDialog";
import AnalyzingAnimation from "@/components/display/AnalyzingAnimation";
import AnalysisReview from "@/components/display/AnalysisReview";

// 阶段类型
type DisplayPhase = "upload" | "identifying" | "analyzing" | "review" | "generating" | "result";

// 线路选项
const lineOptions = [
  { id: "premium", name: "灵犀 Pro", line: "premium" as const, resolution: "2k" as const, badge: "优质" },
  { id: "standard", name: "灵犀标准", line: "standard" as const, resolution: "default" as const },
  { id: "standard_2k", name: "灵犀 2K", line: "standard" as const, resolution: "2k" as const },
];

const MAX_CLOTHING_IMAGES = 12;

const sceneOptions: { id: SceneType; name: string; desc: string; icon: typeof Mountain }[] = [
  { id: "wide", name: "远景", desc: "完整精品店环境", icon: Mountain },
  { id: "medium", name: "中景", desc: "聚焦衣服细节", icon: Focus },
  { id: "closeup", name: "近景", desc: "面料质感特写", icon: ScanEye },
];

const AIDisplay = () => {
  const navigate = useNavigate();
  const { checkCredits, showInsufficientDialog, requiredAmount, featureName, currentBalance, goToRecharge, dismissDialog, refreshBalance } = useCreditCheck();
  const clothingInputRef = useRef<HTMLInputElement>(null);

  // 阶段状态
  const [phase, setPhase] = useState<DisplayPhase>("upload");

  // 上传状态
  const [clothingImages, setClothingImages] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedLine, setSelectedLine] = useState("standard");
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [selectedScene, setSelectedScene] = useState<SceneType>("wide");

  // 分析状态
  const [analysis, setAnalysis] = useState<VMAnalysisResult | null>(null);
  const [garmentList, setGarmentList] = useState<string[]>([]);
  const [identifyProgress, setIdentifyProgress] = useState({ current: 0, total: 0 });

  // 生成状态
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState("");
  const [showExpertDetail, setShowExpertDetail] = useState(false);

  // 处理衣服图片上传（批量，自动压缩）
  const handleClothingUpload = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_CLOTHING_IMAGES - clothingImages.length;
    const filesToProcess = Array.from(files).slice(0, remaining);

    for (const file of filesToProcess) {
      if (file.type.startsWith("image/")) {
        try {
          const compressed = await compressImage(file, {
            maxWidth: 768,
            maxHeight: 768,
            quality: 0.9,
          });
          setClothingImages(prev => [...prev, compressed]);
        } catch {
          const reader = new FileReader();
          reader.onload = (e) => {
            setClothingImages(prev => [...prev, e.target?.result as string]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const clearClothingImage = (index: number) => {
    setClothingImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllClothing = () => {
    setClothingImages([]);
    if (clothingInputRef.current) clothingInputRef.current.value = "";
  };

  // Phase 1: 逐件识别衣服
  const handleStartAnalysis = async () => {
    if (clothingImages.length === 0) return;
    setPhase("identifying");
    setGarmentList([]);
    setAnalysis(null);
    setIdentifyProgress({ current: 0, total: clothingImages.length });

    try {
      // 逐件识别每件衣服
      const identified = await identifyAllGarments(
        clothingImages,
        (current, total, _desc) => {
          setIdentifyProgress({ current, total });
        }
      );

      setGarmentList(identified);

      // 识别完成后自动开始陈列分析
      setPhase("analyzing");

      const result = await analyzeClothingForDisplay(
        identified,
        clothingImages.length,
        additionalNotes || undefined
      );

      // 把识别结果写入 analysis 的 displayGuide
      if (result.displayGuide) {
        result.displayGuide.garmentList = identified;
      }

      setAnalysis(result);
      setPhase("review");
    } catch (error) {
      console.error("分析失败:", error);
      alert(`分析失败: ${error instanceof Error ? error.message : "未知错误"}`);
      setPhase("upload");
    }
  };

  // Phase 2: 确认方案 → 生成参考图
  const handleGenerate = async () => {
    if (!analysis || clothingImages.length === 0) return;
    const selectedLineOption = lineOptions.find(l => l.id === selectedLine) || lineOptions[1];
    const featureCode = selectedLineOption.line === 'premium' ? 'ai_display_premium' : 'ai_display_standard';
    if (!checkCredits(featureCode)) return;
    setPhase("generating");
    setGeneratedImage(null);

    try {
      setGenerationStep("正在整理衣服清单...");
      const gridImage = await mergeImagesToGrid(clothingImages, 512, 4);

      setGenerationStep("正在构建陈列方案...");
      const displayPrompt = buildVMGenerationPrompt(
        analysis,
        clothingImages.length,
        selectedScene,
        additionalNotes || undefined
      );

      setGenerationStep("AI 正在生成参考效果图...");
      const allImages = [gridImage, ...clothingImages];

      const data = await generateImage({
        prompt: displayPrompt,
        aspectRatio: "4:3",
        images: allImages,
        line: selectedLineOption.line,
        resolution: selectedLineOption.resolution,
        hasFrameworkPrompt: true,
        featureCode,
      });

      if (!data.success) {
        throw new Error(data.error || "生成失败");
      }

      const resultImage = data.imageUrl || data.imageBase64;
      if (resultImage) {
        setGeneratedImage(resultImage);
        setPhase("result");
        void refreshBalance();

        const title = additionalNotes.trim()
          ? `AI 陈列：${additionalNotes.trim().slice(0, 24)}`
          : "AI 陈列作品";
        void saveGeneratedImageWork({
          title,
          type: "display",
          tool: "AI 陈列",
          prompt: displayPrompt,
          imageDataUrl: resultImage,
          metadata: {
            clothingCount: clothingImages.length,
            line: selectedLine,
            scene: selectedScene,
            hasAdditionalNotes: Boolean(additionalNotes.trim()),
          },
        }).catch((error) => {
          console.error("自动保存陈列作品失败", error);
        });
      } else {
        throw new Error("未能获取生成的图片");
      }
    } catch (error) {
      console.error("参考图生成失败:", error);
      alert(`生成失败: ${error instanceof Error ? error.message : "未知错误"}`);
      setPhase("review");
    } finally {
      setGenerationStep("");
    }
  };

  // 下载生成的图片
  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      await downloadGeneratedImage(generatedImage, `ai-display-${Date.now()}.png`);
    } catch {
      window.open(generatedImage, "_blank");
    }
  };

  // 重置到上传阶段
  const handleNewAnalysis = () => {
    setPhase("upload");
    setAnalysis(null);
    setGeneratedImage(null);
    setShowExpertDetail(false);
    setGarmentList([]);
  };

  const canStartAnalysis = clothingImages.length > 0 && phase === "upload";

  return (
    <PageLayout className="py-2 md:py-8">
      <div onClick={() => setShowLineMenu(false)}>
        {/* 返回按钮 - 仅桌面端 */}
        <button
          onClick={() => navigate("/clothing")}
          className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回服装</span>
        </button>

        {/* 页面标题 */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0">
            <img
              src="/icons/ai-display-custom.webp"
              alt="AI 陈列"
              className="w-14 h-14 object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI 智能陈列</h1>
            <p className="text-muted-foreground text-sm">上传衣服照片，AI 专家团队为你设计专业陈列方案</p>
          </div>
        </div>

        {/* ===== Step 1: 上传衣服照片（upload 阶段显示） ===== */}
        {phase === "upload" && (
          <>
            <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-3 md:mb-4 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <ShirtIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">上传衣服照片</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {clothingImages.length}/{MAX_CLOTHING_IMAGES}
                </span>
              </div>

              {clothingImages.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      已上传 {clothingImages.length} 件衣服
                    </span>
                    <button
                      onClick={clearAllClothing}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      清除全部
                    </button>
                  </div>
                  <div className="flex items-start gap-2 flex-wrap">
                    {clothingImages.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`衣服 ${index + 1}`}
                          className="h-14 w-14 md:h-16 md:w-16 object-cover rounded-lg border border-border"
                        />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 rounded-b-lg">
                          #{index + 1}
                        </span>
                        <button
                          onClick={() => clearClothingImage(index)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    {clothingImages.length < MAX_CLOTHING_IMAGES && (
                      <button
                        onClick={() => clothingInputRef.current?.click()}
                        className="h-14 w-14 md:h-16 md:w-16 rounded-lg border-2 border-dashed border-border hover:border-primary/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                      >
                        <span className="text-xl">+</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {clothingImages.length === 0 && (
                <button
                  onClick={() => clothingInputRef.current?.click()}
                  className="w-full py-6 md:py-8 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <ShirtIcon className="w-8 h-8" />
                  <span className="text-sm">点击批量上传衣服照片</span>
                  <span className="text-xs text-muted-foreground">支持最多 {MAX_CLOTHING_IMAGES} 件，每件拍一张</span>
                </button>
              )}

              <input
                ref={clothingInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  handleClothingUpload(e.target.files);
                  if (clothingInputRef.current) clothingInputRef.current.value = "";
                }}
                className="hidden"
              />
            </div>

            {/* 陈列模式选择 */}
            <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-3 md:mb-4 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <ScanEye className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">陈列模式</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {sceneOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = selectedScene === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedScene(opt.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200 touch-target",
                        isActive
                          ? "border-primary bg-primary/8 text-primary"
                          : "border-border/50 bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:bg-secondary/40"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                      <span className="text-xs font-medium">{opt.name}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 补充说明 + 线路选择 + 开始分析按钮 */}
            <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-4 md:mb-6 shadow-lg">
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="补充说明（可选）：如「主推红色大衣放C位」「按颜色深浅排列」..."
                rows={3}
                className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 mb-3"
              />

              <div className="flex items-center justify-between gap-2">
                {/* 线路选择 */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowLineMenu(!showLineMenu)}
                    className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-full text-[11px] md:text-sm bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all duration-200 border border-transparent touch-target whitespace-nowrap"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{lineOptions.find(l => l.id === selectedLine)?.name}</span>
                    {lineOptions.find(l => l.id === selectedLine)?.badge && (
                      <span className="px-1 py-0.5 text-[9px] md:text-[10px] leading-none font-medium bg-primary text-primary-foreground rounded">
                        {lineOptions.find(l => l.id === selectedLine)?.badge}
                      </span>
                    )}
                    <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showLineMenu && "rotate-180")} />
                  </button>
                  {showLineMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 w-[130px] animate-dropdown dropdown-panel">
                      {lineOptions.map((line) => (
                        <button
                          key={line.id}
                          onClick={() => {
                            setSelectedLine(line.id);
                            setShowLineMenu(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-1.5 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target",
                            selectedLine === line.id && "bg-primary/10 text-primary"
                          )}
                        >
                          <span>{line.name}</span>
                          {line.badge && (
                            <span className="px-1 py-0.5 text-[9px] leading-none font-medium bg-primary text-primary-foreground rounded">
                              {line.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 开始分析按钮 */}
                <button
                  onClick={handleStartAnalysis}
                  disabled={!canStartAnalysis}
                  className={cn(
                    "flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 touch-target",
                    canStartAnalysis
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                      : "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed"
                  )}
                >
                  <Send className="w-4 h-4" />
                  <span>开始分析</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ===== 逐件识别中 ===== */}
        {phase === "identifying" && (
          <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <ShirtIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">正在逐件识别衣服...</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {identifyProgress.current}/{identifyProgress.total}
              </span>
            </div>
            <div className="w-full bg-secondary/30 rounded-full h-2 mb-4">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${identifyProgress.total > 0 ? (identifyProgress.current / identifyProgress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {clothingImages.map((img, i) => (
                <div key={i} className="relative">
                  <img
                    src={img}
                    alt={`衣服 ${i + 1}`}
                    className={cn(
                      "w-full aspect-square object-cover rounded-lg border-2 transition-all",
                      i < identifyProgress.current
                        ? "border-primary/60 opacity-100"
                        : "border-border/30 opacity-40"
                    )}
                  />
                  {i < identifyProgress.current && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white rounded-full text-[10px] flex items-center justify-center">✓</span>
                  )}
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 rounded-b-lg">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== 分析中动画 ===== */}
        {phase === "analyzing" && (
          <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 shadow-lg">
            <AnalyzingAnimation />
          </div>
        )}

        {/* ===== 分析结果：文字陈列指南 ===== */}
        {phase === "review" && analysis && (
          <div className="space-y-3 md:space-y-4">
            {/* 整体陈列思路 + 风格定位 */}
            <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5 shadow-lg border-l-4 border-primary/60">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">陈列指导方案</span>
              </div>
              {analysis.displayGuide?.railStyle && (
                <div className="mb-3">
                  <span className="inline-block px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    {analysis.displayGuide.railStyle}
                  </span>
                </div>
              )}
              <p className="text-sm md:text-base text-foreground leading-relaxed">
                {analysis.displayGuide?.overallNarrative || analysis.summary}
              </p>
            </div>

            {/* AI 识别的衣服清单 */}
            {analysis.displayGuide?.garmentList && analysis.displayGuide.garmentList.length > 0 && (
              <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <ShirtIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">AI 识别的衣服</span>
                  <span className="text-[10px] text-muted-foreground">共 {analysis.displayGuide.garmentList.length} 件</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.displayGuide.garmentList.map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-secondary/50 rounded-lg text-foreground">
                      <span className="w-4 h-4 rounded-full bg-muted-foreground/15 text-muted-foreground text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 排列步骤 */}
            {analysis.displayGuide?.arrangementSteps && (
              <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <ListOrdered className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-foreground">排列步骤</span>
                </div>
                <ol className="space-y-2.5">
                  {analysis.displayGuide.arrangementSteps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-foreground">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 text-xs font-medium flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* 错落感说明 */}
            {analysis.displayGuide?.heightRhythmDescription && (
              <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <span className="text-sm font-semibold text-foreground">高度错落节奏</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {analysis.displayGuide.heightRhythmDescription}
                </p>
              </div>
            )}

            {/* 搭配建议 */}
            {analysis.displayGuide?.pairingAdvice && (
              <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Shirt className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-semibold text-foreground">搭配建议</span>
                </div>
                <ul className="space-y-2">
                  {analysis.displayGuide.pairingAdvice.map((advice, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-foreground">
                      <span className="flex-shrink-0 text-purple-400 mt-1">•</span>
                      <span className="leading-relaxed">{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 销售话术 */}
            {analysis.displayGuide?.salesTalk && (
              <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-foreground">推荐话术</span>
                </div>
                <ul className="space-y-3">
                  {analysis.displayGuide.salesTalk.map((talk, i) => (
                    <li key={i} className="text-sm text-foreground bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                      <span className="leading-relaxed">"{talk}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 专家分析详情（可折叠） */}
            <div className="glass-card rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
              <button
                onClick={() => setShowExpertDetail(!showExpertDetail)}
                className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ScanEye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">专家分析详情</span>
                  <span className="text-[10px] text-muted-foreground">色彩 · 风格 · 构图 · 灯光</span>
                </div>
                {showExpertDetail ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {showExpertDetail && (
                <div className="px-3 pb-3 md:px-4 md:pb-4 border-t border-border/50">
                  <AnalysisReview
                    analysis={analysis}
                    onConfirm={handleGenerate}
                    onReanalyze={handleStartAnalysis}
                    hideButtons
                  />
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleStartAnalysis}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary transition-all touch-target"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                重新分析
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all touch-target"
              >
                <ImageIcon className="w-4 h-4" />
                生成参考效果图
              </button>
            </div>
          </div>
        )}

        {/* ===== 生成中（仅在首次从 review 跳转时短暂显示） ===== */}
        {phase === "generating" && (
          <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-6">
            <GeneratingLoader
              message={generationStep || "正在生成中..."}
              subMessage="正在准备陈列指导方案..."
            />
          </div>
        )}

        {/* ===== 生成结果：参考效果图 ===== */}
        {phase === "result" && generatedImage && (
          <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
              <h2 className="text-sm md:text-lg font-semibold text-foreground flex items-center gap-1.5 md:gap-2">
                <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                参考效果图
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerate} className="touch-target">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">重新生成</span>
                </Button>
                <Button variant="outline" size="sm" className="touch-target" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">下载</span>
                </Button>
                <Button variant="outline" size="sm" className="touch-target" onClick={() => setPhase("review")} title="返回陈列指南">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="rounded-lg md:rounded-xl overflow-hidden bg-secondary/30 p-2 md:p-4">
              <img
                src={generatedImage}
                alt="AI 陈列参考效果图"
                className="max-h-[300px] md:max-h-[500px] w-full mx-auto rounded-lg object-contain"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              * 效果图仅供参考，请以陈列指南中的文字指导为准进行实际陈列
            </p>
          </div>
        )}

        {/* 空状态提示 */}
        {phase === "upload" && clothingImages.length === 0 && (
          <div className="text-center py-6 md:py-12">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Store className="w-7 h-7 md:w-10 md:h-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-xs md:text-base mb-1">上传衣服照片，AI 专家团队为你打造高端陈列方案</p>
            <p className="text-muted-foreground/60 text-[10px] md:text-xs">4 位 AI 专家协同分析：色彩 · 风格 · 构图 · 灯光</p>
          </div>
        )}
      </div>
      <InsufficientBalanceDialog
        open={showInsufficientDialog}
        onOpenChange={dismissDialog}
        balance={currentBalance}
        required={requiredAmount}
        featureName={featureName}
        onRecharge={goToRecharge}
      />
    </PageLayout>
  );
};

export default AIDisplay;
