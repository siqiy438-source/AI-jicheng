import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Image,
  Loader2,
  Ratio,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { PageLayout } from "@/components/PageLayout";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import { Button } from "@/components/ui/button";
import { CreditCostHint } from "@/components/CreditCostHint";
import { InsufficientBalanceDialog } from "@/components/InsufficientBalanceDialog";
import { LineStatusSelector } from "@/components/LineStatusSelector";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { useLineStatus } from "@/hooks/use-line-status";
import { generateImage } from "@/lib/ai-image";
import { compressImage, downloadGeneratedImage, preloadDownloadImage } from "@/lib/image-utils";
import { saveGeneratedImageWork } from "@/lib/repositories/works";
import { findExposurePolicyViolation } from "@/lib/fashion-safety";
import { buildFashionBreakdownPrompt, type FashionBreakdownAspectRatio } from "@/lib/fashion-prompts";
import { cn } from "@/lib/utils";

const ratioOptions: Array<{ id: FashionBreakdownAspectRatio; label: string; hint: string }> = [
  { id: "3:4", label: "3:4", hint: "竖版拆解图" },
  { id: "4:3", label: "4:3", hint: "横版左右分栏" },
];

const lineOptions = [
  { id: "speed", name: "灵犀极速版", line: "standard" as const, resolution: "speed" as const },
  { id: "premium", name: "灵犀 Pro", line: "premium" as const, resolution: "2k" as const, badge: "优质" },
  { id: "standard_2k", name: "灵犀 2K", line: "standard" as const, resolution: "2k" as const },
  { id: "standard_4k", name: "灵犀 4K", line: "standard" as const, resolution: "4k" as const },
];

const getFeatureCode = (selectedLine: string) => {
  const selectedLineOption = lineOptions.find((option) => option.id === selectedLine) ?? lineOptions[0];
  return selectedLineOption.line === "premium"
    ? "ai_fashion_breakdown_premium"
    : selectedLineOption.resolution === "2k" || selectedLineOption.resolution === "4k"
      ? "ai_fashion_breakdown_hd"
      : "ai_fashion_breakdown_standard";
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve((event.target?.result as string) || "");
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });

const FashionBreakdown = () => {
  const navigate = useNavigate();
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
  const { statuses } = useLineStatus();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const ratioMenuRef = useRef<HTMLDivElement>(null);

  const [modelPreview, setModelPreview] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<FashionBreakdownAspectRatio>("3:4");
  const [selectedLine, setSelectedLine] = useState("speed");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showRatioMenu, setShowRatioMenu] = useState(false);

  useEffect(() => {
    preloadDownloadImage(generatedImage);
  }, [generatedImage]);

  useEffect(() => {
    if (!showRatioMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (ratioMenuRef.current && !ratioMenuRef.current.contains(event.target as Node)) {
        setShowRatioMenu(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showRatioMenu]);

  const currentFeatureCode = getFeatureCode(selectedLine);
  const canGenerate = Boolean(modelPreview) && !isGenerating;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    try {
      const preview = await compressImage(file, {
        maxWidth: 1280,
        maxHeight: 1600,
        quality: 0.9,
      });
      setModelPreview(preview);
    } catch {
      const preview = await readFileAsDataUrl(file);
      setModelPreview(preview);
    }

    setGeneratedImage(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!modelPreview || isGenerating) return;

    const promptError = findExposurePolicyViolation(additionalNotes);
    if (promptError) {
      toast.error("补充说明不支持", { description: promptError });
      return;
    }

    if (!checkCredits(currentFeatureCode)) return;

    const selectedLineOption = lineOptions.find((option) => option.id === selectedLine) ?? lineOptions[0];
    const finalPrompt = buildFashionBreakdownPrompt(selectedRatio, additionalNotes);

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await generateImage({
        prompt: finalPrompt,
        aspectRatio: selectedRatio,
        images: [modelPreview],
        line: selectedLineOption.line,
        resolution: selectedLineOption.resolution,
        hasFrameworkPrompt: true,
        featureCode: currentFeatureCode,
      });

      if (!response.success) {
        throw new Error(response.error || "生成失败");
      }

      const resultImage = response.imageUrl || response.imageBase64;
      if (!resultImage) {
        throw new Error("未获取到拆解结果图");
      }

      setGeneratedImage(resultImage);
      void refreshBalance();

      const title = additionalNotes.trim()
        ? `穿搭拆解图：${additionalNotes.trim().slice(0, 24)}`
        : "穿搭拆解图作品";

      void saveGeneratedImageWork({
        title,
        type: "drawing",
        tool: "穿搭拆解图",
        prompt: finalPrompt,
        imageDataUrl: resultImage,
        metadata: {
          aspectRatio: selectedRatio,
          line: selectedLine,
          hasAdditionalNotes: Boolean(additionalNotes.trim()),
          referenceImageCount: 1,
          toolVariant: "fashion-breakdown",
        },
      }).catch((error) => {
        console.error("自动保存穿搭拆解图作品失败", error);
      });
    } catch (error) {
      toast.error("生成失败", { description: error instanceof Error ? error.message : "未知错误" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      await downloadGeneratedImage(generatedImage, `fashion-breakdown-${Date.now()}.png`);
    } catch {
      window.open(generatedImage, "_blank");
    }
  };

  const clearImage = () => {
    setModelPreview(null);
    setGeneratedImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  return (
    <PageLayout className="pt-6 pb-2 md:py-8">
      <button
        onClick={() => navigate("/clothing")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 md:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回服装</span>
      </button>

      <div className="hidden md:flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-orange-50">
          <img src="/icons/outfit-combo-vintage.png" alt="穿搭拆解图" className="w-10 h-10 object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">穿搭拆解图</h1>
          <p className="text-muted-foreground text-sm">上传 1 张模特穿搭图，生成左模特右单品的拆解效果图</p>
        </div>
      </div>

      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-4 md:mb-6 shadow-lg">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Image className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">上传模特穿搭图</span>
            <span className="text-xs text-muted-foreground ml-auto">{modelPreview ? "1/1" : "0/1"}</span>
          </div>

          {modelPreview ? (
            <div className="relative group rounded-2xl overflow-hidden border border-border bg-secondary/20">
              <img
                src={modelPreview}
                alt="模特参考图"
                className="w-full max-h-[420px] object-contain bg-white"
              />
              <button
                onClick={clearImage}
                className="absolute top-3 right-3 w-8 h-8 bg-black/70 text-white rounded-full flex items-center justify-center touch-target"
                aria-label="移除参考图"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-full mt-2 py-8 md:py-10 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Image className="w-8 h-8" />
              <span className="text-sm font-medium">点击上传模特穿搭图</span>
              <span className="text-xs text-muted-foreground">仅支持 1 张图片，用于生成左右分栏拆解图</span>
            </button>
          )}

          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            AI 会尽量保留左侧模特原场景，并在右侧白底区域仅拆出画面里清晰可见且真实穿着的服饰单品。不会添加价格、品牌名和文字标签。
          </p>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Ratio className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">画幅比例</span>
          </div>
          <div ref={ratioMenuRef} className="relative inline-flex" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowRatioMenu((prev) => !prev)}
              className={cn(
                "flex items-center gap-2 rounded-full border-2 bg-white px-4 py-2.5 shadow-sm transition-colors",
                showRatioMenu
                  ? "border-orange-500 text-orange-700 hover:bg-orange-50"
                  : "border-border text-foreground hover:border-orange-200 hover:bg-orange-50/40",
              )}
              aria-haspopup="menu"
              aria-expanded={showRatioMenu}
              aria-label={`画幅比例 ${selectedRatio}`}
            >
              <Ratio className="w-4 h-4" />
              <span className="text-base font-medium">{selectedRatio}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", showRatioMenu && "rotate-180")} />
            </button>

            {showRatioMenu && (
              <div className="absolute left-0 top-full z-20 mt-3 w-[180px] overflow-hidden rounded-[28px] border border-orange-100 bg-white p-3 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.28)]">
                {ratioOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSelectedRatio(option.id);
                      setShowRatioMenu(false);
                    }}
                    className={cn(
                      "w-full rounded-2xl px-4 py-3 text-left transition-colors",
                      selectedRatio === option.id
                        ? "bg-orange-50 text-orange-700"
                        : "text-foreground hover:bg-orange-50/60",
                    )}
                    role="menuitem"
                  >
                    <div className="text-base font-medium">{option.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{option.hint}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <textarea
          value={additionalNotes}
          onChange={(event) => setAdditionalNotes(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void handleGenerate();
            }
          }}
          placeholder="补充说明（可选），例如：右侧更工整一点、整体更像杂志穿搭拆解页"
          rows={3}
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base leading-relaxed"
        />

        <div className="border-t border-border/50 my-3" />

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <LineStatusSelector
              selectedLine={selectedLine}
              lineOptions={lineOptions}
              statuses={statuses}
              onSelect={setSelectedLine}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <CreditCostHint featureCode={currentFeatureCode} />
            <button
              onClick={() => void handleGenerate()}
              disabled={!canGenerate}
              className={cn(
                "h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 touch-target",
                canGenerate
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)]"
                  : "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed",
              )}
              aria-label="生成拆解图"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">生成中</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="text-sm">生成拆解图</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {(isGenerating || generatedImage) && (
        <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
            <h2 className="text-sm md:text-lg font-semibold text-foreground flex items-center gap-1.5 md:gap-2">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
              生成结果
            </h2>
            {generatedImage && !isGenerating && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => void handleGenerate()} className="touch-target">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">重新生成</span>
                </Button>
                <Button variant="outline" size="sm" className="touch-target" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">下载</span>
                </Button>
              </div>
            )}
          </div>

          {isGenerating ? (
            <GeneratingLoader message="AI 正在生成穿搭拆解图..." />
          ) : generatedImage ? (
            <img
              src={generatedImage}
              alt="穿搭拆解效果图"
              className="max-h-[320px] md:max-h-[480px] w-full mx-auto rounded-xl object-contain bg-white"
            />
          ) : null}
        </div>
      )}

      <InsufficientBalanceDialog
        open={showInsufficientDialog}
        requiredAmount={requiredAmount}
        featureName={featureName}
        currentBalance={currentBalance}
        onClose={dismissDialog}
        onRecharge={goToRecharge}
      />
    </PageLayout>
  );
};

export default FashionBreakdown;
