import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Download,
  ImagePlus,
  Loader2,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import { CreditCostHint } from "@/components/CreditCostHint";
import { InsufficientBalanceDialog } from "@/components/InsufficientBalanceDialog";
import { LineStatusSelector } from "@/components/LineStatusSelector";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  type DetailOption,
  type DetailOptionCategory,
  getDetailFocusOptions,
  getFallbackDetailFocusOptions,
} from "@/lib/fashion-detail-focus";
import { generateImage } from "@/lib/ai-image";
import { getFeatureCost } from "@/lib/credits";
import {
  compressImage,
  downloadGeneratedImage,
  preloadDownloadImage,
} from "@/lib/image-utils";
import { saveGeneratedImageWork } from "@/lib/repositories/works";
import { cn } from "@/lib/utils";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { useLineStatus } from "@/hooks/use-line-status";
import { useToast } from "@/hooks/use-toast";

interface GeneratedFrame {
  kind: "main" | "detail";
  title: string;
  image: string;
  prompt: string;
  optionId?: string;
  optionTitle?: string;
  optionCategory?: DetailOptionCategory;
  isCustom?: boolean;
}

interface DetailGenerationTask {
  option: DetailOption;
  status: "pending" | "generating" | "success" | "error";
  frame?: GeneratedFrame;
  error?: string;
}

const DEFAULT_RATIO = "3:4";
const CUSTOM_OPTION_ID = "custom-user-option";
const MAX_DETAIL_SELECTION = 3;

const LINE_OPTIONS = [
  { id: "speed", name: "灵犀极速版", line: "standard" as const, resolution: "speed" as const },
  { id: "premium", name: "灵犀 Pro", line: "premium" as const, resolution: "2k" as const, badge: "优质" },
  { id: "standard_2k", name: "灵犀 2K", line: "standard" as const, resolution: "2k" as const },
  { id: "standard_4k", name: "灵犀 4K", line: "standard" as const, resolution: "4k" as const },
];

const CATEGORY_LABELS: Record<DetailOptionCategory, string> = {
  structure: "结构",
  feature: "元素",
  craft: "工艺",
  fabric: "面料",
  custom: "自定义",
};

const buildMainPrompt = () => {
  return `你是高端时尚电商摄影总监。请基于参考图，生成一张“高级感完整主图”。这是第 1 张图。

硬性要求：
1. 只允许同一件单品，版型、颜色、纹理、花纹必须与参考图一致，不得新增或替换服装。
2. 自动识别这是外套/上衣还是裤装，并完整展示单品主体结构。
3. 画面必须高级、干净、商业成片感强，适合品牌商品页封面。
4. 光线自然高级，面料质感清晰，禁止塑料感、过度滤镜、过曝。
5. 禁止文字、水印、logo、拼图、杂物、人物面部。`;
};

const buildDetailPrompt = (option: DetailOption, index: number) => {
  return `你是高端时尚摄影师。现在要生成第 ${index + 1} 张细节特写图（近景）。

细节任务：${option.instruction}

硬性要求：
1. 仍然是同一件单品，不能变款、变色、变面料，也不能新增其他服装。
2. 必须是近景特写，细节主体占画面 60% 以上。
3. 光线和调性与主图保持一致，整体高级感统一。
4. 只允许拍摄参考图和主图中真实存在、真实可见的细节；如果当前目标细节不存在，自动切换为这件衣服其他真实存在的相近细节。
5. 禁止为了完成任务而臆造五金、纽扣、拉链、口袋、刺绣、压花或其他不存在的元素。
6. 呈现真实纤维、缝线、纹理和材质细节，避免糊和假。
7. 禁止文字、水印、logo、拼图和夸张滤镜。`;
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });

const FashionDetailFocus = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    checkCredits,
    showInsufficientDialog,
    requiredAmount,
    featureName,
    currentBalance,
    goToRecharge,
    dismissDialog,
    refreshBalance,
  } = useCreditCheck();
  const inputRef = useRef<HTMLInputElement>(null);

  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [mainFrame, setMainFrame] = useState<GeneratedFrame | null>(null);
  const [detailOptions, setDetailOptions] = useState<DetailOption[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [detailTasks, setDetailTasks] = useState<DetailGenerationTask[]>([]);
  const [customPromptInput, setCustomPromptInput] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isGeneratingMain, setIsGeneratingMain] = useState(false);
  const [isAnalyzingOptions, setIsAnalyzingOptions] = useState(false);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [generatingText, setGeneratingText] = useState("正在生成...");
  const [selectedLine, setSelectedLine] = useState("speed");
  const [analysisSummary, setAnalysisSummary] = useState("");
  const [detectedItemType, setDetectedItemType] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { statuses } = useLineStatus();

  const currentLineOption = LINE_OPTIONS.find((option) => option.id === selectedLine) ?? LINE_OPTIONS[0];
  const featureCode =
    currentLineOption.line === "premium"
      ? "ai_detail_premium"
      : currentLineOption.resolution === "2k" || currentLineOption.resolution === "4k"
        ? "ai_detail_hd"
        : "ai_detail_standard";
  const detailUnitCost = getFeatureCost(featureCode);

  const successfulDetailFrames = detailTasks
    .filter((task): task is DetailGenerationTask & { frame: GeneratedFrame } => task.status === "success" && Boolean(task.frame))
    .map((task) => task.frame);
  const allFrames = [mainFrame, ...successfulDetailFrames].filter((item): item is GeneratedFrame => Boolean(item));
  const activeFrame = allFrames[activeIndex] || null;
  const selectedOptions = selectedOptionIds
    .map((optionId) => detailOptions.find((option) => option.id === optionId) ?? null)
    .filter((option): option is DetailOption => Boolean(option));
  const failedTasks = detailTasks.filter((task) => task.status === "error");
  const completedDetailCount = detailTasks.filter((task) => task.status === "success").length;
  const isBusy = isGeneratingMain || isAnalyzingOptions || isGeneratingDetails;
  const canGenerateMain = Boolean(sourceImage && !mainFrame && !isBusy);
  const canGenerateDetails = Boolean(
    sourceImage &&
      mainFrame &&
      selectedOptions.length === MAX_DETAIL_SELECTION &&
      !isBusy &&
      (detailTasks.length === 0 || failedTasks.length > 0),
  );

  useEffect(() => {
    preloadDownloadImage(activeFrame?.image);
  }, [activeFrame?.image]);

  useEffect(() => {
    if (activeIndex >= allFrames.length) {
      setActiveIndex(Math.max(0, allFrames.length - 1));
    }
  }, [activeIndex, allFrames.length]);

  const resetFlow = () => {
    setMainFrame(null);
    setDetailOptions([]);
    setSelectedOptionIds([]);
    setDetailTasks([]);
    setCustomPromptInput("");
    setActiveIndex(0);
    setAnalysisSummary("");
    setDetectedItemType("");
    setSessionId(null);
  };

  const resetDetailGeneration = (nextActiveIndex = 0) => {
    setDetailTasks([]);
    setActiveIndex(nextActiveIndex);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    try {
      const compressed = await compressImage(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.85,
      });
      setSourceImage(compressed);
    } catch {
      const fallback = await fileToDataUrl(file);
      setSourceImage(fallback);
    }

    resetFlow();
    if (inputRef.current) inputRef.current.value = "";
  };

  const applyAnalyzedOptions = (options: DetailOption[], summary: string, itemType: string) => {
    setDetailOptions(options);
    setSelectedOptionIds([]);
    setDetailTasks([]);
    setCustomPromptInput("");
    setAnalysisSummary(summary);
    setDetectedItemType(itemType);
  };

  const analyzeDetailOptions = async (sourceImageValue: string, mainImageValue: string) => {
    setIsAnalyzingOptions(true);
    try {
      const result = await getDetailFocusOptions(sourceImageValue, mainImageValue);
      applyAnalyzedOptions(result.suggestions, result.summary, result.itemType);
    } catch (error) {
      const fallback = getFallbackDetailFocusOptions();
      applyAnalyzedOptions(fallback.suggestions, fallback.summary, fallback.itemType);
      toast({
        title: "已切换到默认细节建议",
        description: error instanceof Error ? error.message : "AI 建议分析失败，已为你准备通用细节选项",
      });
    } finally {
      setIsAnalyzingOptions(false);
    }
  };

  const handleGenerateMain = async () => {
    if (!sourceImage || !canGenerateMain) return;
    if (!checkCredits(featureCode)) return;

    const nextSessionId = crypto.randomUUID();
    setSessionId(nextSessionId);
    setIsGeneratingMain(true);
    setGeneratingText("正在生成高级主图...");

    try {
      const prompt = buildMainPrompt();
      const data = await generateImage({
        prompt,
        images: [sourceImage],
        aspectRatio: DEFAULT_RATIO,
        line: currentLineOption.line,
        resolution: currentLineOption.resolution,
        hasFrameworkPrompt: true,
        featureCode,
      });

      if (!data.success) throw new Error(data.error || "主图生成失败");
      const image = data.imageUrl || data.imageBase64;
      if (!image) throw new Error("未返回有效图片");

      const frame: GeneratedFrame = {
        kind: "main",
        title: "主图 · 高级完整图",
        image,
        prompt,
      };
      setMainFrame(frame);
      setActiveIndex(0);
      void refreshBalance();

      void saveGeneratedImageWork({
        title: "细节特写：高级主图",
        type: "drawing",
        tool: "AI 细节特写",
        prompt,
        imageDataUrl: image,
        metadata: {
          stage: "main",
          ratio: DEFAULT_RATIO,
          line: currentLineOption.line,
          lineId: selectedLine,
          sourceSessionId: nextSessionId,
        },
      }).catch((error) => {
        console.error("保存主图失败", error);
      });

      await analyzeDetailOptions(sourceImage, image);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    } finally {
      setIsGeneratingMain(false);
    }
  };

  const toggleOptionSelection = (optionId: string) => {
    if (isBusy) return;

    setSelectedOptionIds((current) => {
      const exists = current.includes(optionId);
      if (exists) {
        resetDetailGeneration(0);
        return current.filter((id) => id !== optionId);
      }
      if (current.length >= MAX_DETAIL_SELECTION) {
        toast({
          title: `最多选择 ${MAX_DETAIL_SELECTION} 个细节`,
          description: "可以先取消一个，再选择新的细节项。",
        });
        return current;
      }
      resetDetailGeneration(0);
      return [...current, optionId];
    });
  };

  const handleAddCustomOption = () => {
    const trimmed = customPromptInput.trim();
    if (!trimmed) {
      toast({
        title: "先写下你想看的细节",
        description: "例如：领口车线、纽扣质感、裤脚收口、面料绒感。",
      });
      return;
    }

    const customOption: DetailOption = {
      id: CUSTOM_OPTION_ID,
      category: "custom",
      title: trimmed.length > 16 ? `自定义 · ${trimmed.slice(0, 16)}...` : `自定义 · ${trimmed}`,
      instruction: trimmed,
      reason: "这是你手动指定的细节特写要求，生成时会优先按这个描述执行。",
      priority: 999,
    };

    setDetailOptions((current) => {
      const others = current.filter((item) => item.id !== CUSTOM_OPTION_ID);
      return [customOption, ...others];
    });

    setSelectedOptionIds((current) => {
      if (current.includes(CUSTOM_OPTION_ID)) {
        return current;
      }
      if (current.length >= MAX_DETAIL_SELECTION) {
        toast({
          title: `最多选择 ${MAX_DETAIL_SELECTION} 个细节`,
          description: "如果要使用自定义项，请先取消一个已选细节。",
        });
        return current;
      }
      resetDetailGeneration(0);
      return [...current, CUSTOM_OPTION_ID];
    });
  };

  const runDetailGeneration = async (taskIndexes: number[], taskSnapshot?: DetailGenerationTask[]) => {
    if (!sourceImage || !mainFrame || taskIndexes.length === 0) return;

    setIsGeneratingDetails(true);
    const tasksSource = taskSnapshot ?? detailTasks;

    for (let index = 0; index < taskIndexes.length; index += 1) {
      const taskIndex = taskIndexes[index];
      const targetTask = tasksSource[taskIndex];
      if (!targetTask) continue;

      setGeneratingText(`正在生成 ${targetTask.option.title}...`);
      setDetailTasks((current) =>
        current.map((task, currentIndex) =>
          currentIndex === taskIndex
            ? { ...task, status: "generating", error: undefined }
            : task,
        ),
      );

      try {
        const prompt = buildDetailPrompt(targetTask.option, taskIndex);
        const data = await generateImage({
          prompt,
          images: [sourceImage, mainFrame.image],
          aspectRatio: DEFAULT_RATIO,
          line: currentLineOption.line,
          resolution: currentLineOption.resolution,
          hasFrameworkPrompt: true,
          featureCode,
        });

        if (!data.success) throw new Error(data.error || "细节图生成失败");
        const image = data.imageUrl || data.imageBase64;
        if (!image) throw new Error("未返回有效图片");

        const frame: GeneratedFrame = {
          kind: "detail",
          title: targetTask.option.title,
          image,
          prompt,
          optionId: targetTask.option.id,
          optionTitle: targetTask.option.title,
          optionCategory: targetTask.option.category,
          isCustom: targetTask.option.category === "custom",
        };

        setDetailTasks((current) =>
          current.map((task, currentIndex) =>
            currentIndex === taskIndex
              ? { ...task, status: "success", frame, error: undefined }
              : task,
          ),
        );
        void refreshBalance();

        void saveGeneratedImageWork({
          title: `细节特写：${targetTask.option.title}`,
          type: "drawing",
          tool: "AI 细节特写",
          prompt,
          imageDataUrl: image,
          metadata: {
            stage: "detail",
            detailIndex: taskIndex + 1,
            ratio: DEFAULT_RATIO,
            line: currentLineOption.line,
            lineId: selectedLine,
            selectedOptionId: targetTask.option.id,
            selectedOptionTitle: targetTask.option.title,
            selectedOptionCategory: targetTask.option.category,
            isCustom: targetTask.option.category === "custom",
            sourceSessionId: sessionId,
          },
        }).catch((error) => {
          console.error("保存细节图失败", error);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "请稍后重试";
        setDetailTasks((current) =>
          current.map((task, currentIndex) =>
            currentIndex === taskIndex
              ? { ...task, status: "error", error: message }
              : task,
          ),
        );
      }
    }

    setIsGeneratingDetails(false);
  };

  const handleGenerateDetails = async () => {
    if (!canGenerateDetails) return;

    if (detailTasks.length === 0) {
      const requiredCredits = detailUnitCost * selectedOptions.length;
      if (!checkCredits(featureCode, requiredCredits)) return;

      const nextTasks: DetailGenerationTask[] = selectedOptions.map((option) => ({
        option,
        status: "pending",
      }));
      setDetailTasks(nextTasks);
      await runDetailGeneration(nextTasks.map((_, index) => index), nextTasks);
      return;
    }

    const retryIndexes = detailTasks.flatMap((task, index) => (task.status === "error" ? [index] : []));
    if (retryIndexes.length === 0) return;

    const requiredCredits = detailUnitCost * retryIndexes.length;
    if (!checkCredits(featureCode, requiredCredits)) return;
    await runDetailGeneration(retryIndexes);
  };

  const handleDownloadCurrent = async () => {
    if (!activeFrame) return;
    try {
      await downloadGeneratedImage(activeFrame.image, `fashion-detail-${activeIndex + 1}-${Date.now()}.png`);
    } catch {
      window.open(activeFrame.image, "_blank");
    }
  };

  return (
    <PageLayout className="pt-6 pb-2 md:py-8">
      <div onClick={() => {}}>
        <button
          onClick={() => navigate("/clothing")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 md:mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回服装</span>
        </button>

        <div className="hidden md:flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0">
            <img src="/icons/fashion-detail-focus-custom.png" alt="AI 细节特写" className="w-14 h-14 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI 细节特写</h1>
            <p className="text-muted-foreground text-sm">先生成主图，再由你选择 3 个想看的细节，一键批量生成</p>
          </div>
        </div>

        <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-4 md:mb-6 shadow-lg">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

          {!sourceImage ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/45 bg-card/40 p-8 flex flex-col items-center gap-2 transition-colors"
            >
              <ImagePlus className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm md:text-base font-medium">上传单品图（外套或裤子）</p>
              <p className="text-xs text-muted-foreground">先出主图，再从 AI 推荐中挑 3 个细节图</p>
            </button>
          ) : (
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-3">
              <img
                src={sourceImage}
                alt="参考图"
                className="w-full md:w-28 h-40 md:h-28 rounded-xl border border-border object-cover bg-card"
              />
              <div className="flex-1 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">已上传参考图</p>
                  <p className="text-xs text-muted-foreground">主图生成后，系统会分析这件衣服最值得展示的真实细节，供你自行选择</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSourceImage(null);
                    resetFlow();
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  清除
                </Button>
              </div>
            </div>
          )}

          <div className="border-t border-border/50 my-3" />

          <div className="flex flex-wrap gap-2 items-center mb-2.5">
            <LineStatusSelector
              selectedLine={selectedLine}
              lineOptions={LINE_OPTIONS}
              statuses={statuses}
              onSelect={(id) => {
                setSelectedLine(id);
                if (mainFrame) resetFlow();
              }}
            />
            <CreditCostHint featureCode={featureCode} />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={handleGenerateMain} disabled={!canGenerateMain} className="rounded-full">
              {isGeneratingMain ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
              生成主图并分析细节
            </Button>

            <Button onClick={handleGenerateDetails} disabled={!canGenerateDetails} variant="secondary" className="rounded-full">
              {isGeneratingDetails ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : failedTasks.length > 0 ? <RefreshCw className="w-4 h-4 mr-1.5" /> : <Zap className="w-4 h-4 mr-1.5" />}
              {failedTasks.length > 0 ? "重试失败项" : `生成 ${MAX_DETAIL_SELECTION} 张细节图`}
            </Button>

            <Button onClick={handleDownloadCurrent} disabled={!activeFrame} variant="outline" className="rounded-full">
              <Download className="w-4 h-4 mr-1.5" />
              下载当前图
            </Button>

            <Button onClick={() => inputRef.current?.click()} disabled={isBusy} variant="outline" className="rounded-full">
              更换图片
            </Button>
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            主图：{mainFrame ? "已完成" : "未生成"} · 细节图：{completedDetailCount}/{MAX_DETAIL_SELECTION}
          </div>

          {isBusy ? (
            <div className="mt-4 rounded-xl border border-orange-200/60 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 p-3 md:p-4 shadow-[0_8px_24px_-16px_rgba(234,88,12,0.55)]">
              <div className="flex items-start gap-3">
                <div className="relative mt-0.5">
                  <span className="absolute inset-0 rounded-full bg-orange-300/35 animate-ping" />
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-orange-700">{generatingText}</p>
                  <p className="text-xs text-orange-700/75 mt-1">
                    {isAnalyzingOptions ? "AI 正在判断这件衣服值得展示哪些真实细节" : "AI 正在精修构图与质感，请耐心等待几秒"}
                  </p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-orange-200/60 overflow-hidden">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {mainFrame ? (
          <section className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-4 md:mb-6 shadow-lg">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-foreground">选择你想要的细节图</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {detectedItemType ? `${detectedItemType} · ` : ""}{analysisSummary || "从 AI 推荐里挑 3 个细节，也可以加入 1 个自定义要求。"}
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                已选择 {selectedOptions.length}/{MAX_DETAIL_SELECTION}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {detailOptions.map((option) => {
                const isSelected = selectedOptionIds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleOptionSelection(option.id)}
                    className={cn(
                      "text-left rounded-xl border p-4 transition-colors",
                      isSelected
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "border-border bg-card/40 hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground shrink-0">
                          {CATEGORY_LABELS[option.category]}
                        </span>
                        <span className="text-sm font-medium text-foreground truncate">{option.title}</span>
                      </div>
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border shrink-0",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-transparent",
                        )}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-5">{option.reason}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-dashed border-border p-4 bg-card/30">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-foreground">更多选项</p>
                  <p className="text-xs text-muted-foreground mt-1">输入你想拍的部位、风格或细节。自定义项会占用 3 个名额中的 1 个。</p>
                </div>
                {selectedOptionIds.includes(CUSTOM_OPTION_ID) ? (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    onClick={() => toggleOptionSelection(CUSTOM_OPTION_ID)}
                  >
                    <X className="w-3.5 h-3.5" />
                    取消自定义项
                  </button>
                ) : null}
              </div>
              <Textarea
                className="mt-3 min-h-[92px] resize-none"
                placeholder="例如：想拍纽扣表面质感、领口压线、裤脚收口、面料绒感，或者更偏高级近距离特写。"
                value={customPromptInput}
                onChange={(event) => setCustomPromptInput(event.target.value)}
                disabled={isBusy}
              />
              <div className="flex justify-end mt-3">
                <Button type="button" variant="outline" className="rounded-full" onClick={handleAddCustomOption} disabled={isBusy}>
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  使用自定义选项
                </Button>
              </div>
            </div>

            {detailTasks.length > 0 ? (
              <div className="mt-4 rounded-xl border border-border bg-card/30 p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">细节图生成进度</h3>
                  <span className="text-xs text-muted-foreground">成功 {completedDetailCount}/{MAX_DETAIL_SELECTION}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  {detailTasks.map((task, index) => (
                    <div key={task.option.id} className="rounded-xl border border-border bg-background/80 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{index + 1}. {task.option.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{CATEGORY_LABELS[task.option.category]}</p>
                        </div>
                        <span
                          className={cn(
                            "text-[11px] rounded-full px-2 py-0.5",
                            task.status === "success" && "bg-emerald-500/10 text-emerald-600",
                            task.status === "generating" && "bg-orange-500/10 text-orange-600",
                            task.status === "error" && "bg-red-500/10 text-red-600",
                            task.status === "pending" && "bg-muted text-muted-foreground",
                          )}
                        >
                          {task.status === "success" ? "已完成" : task.status === "generating" ? "生成中" : task.status === "error" ? "失败" : "待生成"}
                        </span>
                      </div>
                      {task.error ? (
                        <p className="text-xs text-red-500 mt-2 leading-5">{task.error}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2 leading-5">{task.option.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
                {failedTasks.length > 0 ? (
                  <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>已有成功结果会保留，点击上方“重试失败项”即可只补生成失败的细节图。</div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {allFrames.length > 0 ? (
          <section className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 shadow-lg">
            <div className="flex flex-wrap gap-2 mb-3">
              {allFrames.map((frame, index) => (
                <button
                  key={`${frame.kind}-${frame.optionId || "main"}-${index}`}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs border transition-colors",
                    index === activeIndex
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-card/40 border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {index === 0 ? "主图" : frame.optionTitle || `细节 ${index}`}
                </button>
              ))}
            </div>

            {activeFrame ? (
              <div>
                <p className="text-sm font-medium mb-2">{activeFrame.title}</p>
                <img
                  src={activeFrame.image}
                  alt={activeFrame.title}
                  className="w-full max-h-[720px] rounded-lg object-contain bg-card/40 border border-border"
                />
              </div>
            ) : null}
          </section>
        ) : null}

        <InsufficientBalanceDialog
          open={showInsufficientDialog}
          onOpenChange={dismissDialog}
          balance={currentBalance}
          required={requiredAmount}
          featureName={featureName}
          onRecharge={goToRecharge}
        />
      </div>
    </PageLayout>
  );
};

export default FashionDetailFocus;
