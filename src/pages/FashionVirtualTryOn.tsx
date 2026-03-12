import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ImagePlus,
  Loader2,
  RefreshCw,
  Send,
  ShirtIcon,
  Sparkles,
  X,
} from "lucide-react";

import { PageLayout } from "@/components/PageLayout";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import { Button } from "@/components/ui/button";
import { CreditCostHint } from "@/components/CreditCostHint";
import { LineStatusSelector } from "@/components/LineStatusSelector";
import { InsufficientBalanceDialog } from "@/components/InsufficientBalanceDialog";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { useLineStatus } from "@/hooks/use-line-status";
import { generateImage } from "@/lib/ai-image";
import { compressImage, downloadGeneratedImage, preloadDownloadImage } from "@/lib/image-utils";
import { saveGeneratedImageWork } from "@/lib/repositories/works";
import { cn } from "@/lib/utils";
import {
  buildVirtualTryOnNegativePrompt,
  buildVirtualTryOnPrompt,
  type TryOnGarmentCategory,
  type TryOnReferenceMode,
} from "@/lib/virtual-tryon-prompts";

const GARMENT_MAX_IMAGES = 3;

const ratioOptions = [
  { id: "3:4", label: "3:4" },
  { id: "9:16", label: "9:16" },
  { id: "1:1", label: "1:1" },
  { id: "4:3", label: "4:3" },
];

const ratioScores: Record<string, number> = {
  "3:4": 3 / 4,
  "9:16": 9 / 16,
  "1:1": 1,
  "4:3": 4 / 3,
};

const lineOptions = [
  { id: "speed", name: "灵犀极速版", line: "standard" as const, resolution: "speed" as const },
  { id: "premium", name: "灵犀 Pro", line: "premium" as const, resolution: "2k" as const, badge: "优质" },
  { id: "standard", name: "灵犀标准", line: "standard" as const, resolution: "default" as const },
  { id: "standard_2k", name: "灵犀 2K", line: "standard" as const, resolution: "2k" as const },
  { id: "standard_4k", name: "灵犀 4K", line: "standard" as const, resolution: "4k" as const },
];

const categoryOptions: Array<{
  id: TryOnGarmentCategory;
  name: string;
  hint: string;
}> = [
  { id: "outfit", name: "整套穿搭", hint: "多件单品一起替换，适合外层 + 内搭 + 下装" },
  { id: "auto", name: "自动识别", hint: "推荐，AI 自动判断上衣/下装/连衣裙" },
  { id: "top", name: "上衣", hint: "只换上半身衣服，尽量保留原下装" },
  { id: "bottom", name: "下装", hint: "只换裤子/裙子，尽量保留原上衣" },
  { id: "dress", name: "连衣裙", hint: "适合连衣裙或连体款" },
];

const referenceModeOptions: Array<{
  id: TryOnReferenceMode;
  name: string;
  hint: string;
}> = [
  {
    id: "multi-piece",
    name: "多件组合",
    hint: "每张图都是独立单品，会一起穿到模特身上；上传顺序建议外层 -> 内搭 -> 下装",
  },
  {
    id: "single-garment",
    name: "单件多视角",
    hint: "1-3 张图是同一件衣服的不同角度或细节，只替换这一件",
  },
];

const readImageAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve((event.target?.result as string) || "");
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });

const detectClosestRatio = (imageUrl: string) =>
  new Promise<string>((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const actualRatio = img.width / img.height;
      const bestMatch = ratioOptions.reduce((best, option) => {
        const score = Math.abs(actualRatio - ratioScores[option.id]);
        return score < best.score ? { id: option.id, score } : best;
      }, { id: "3:4", score: Number.POSITIVE_INFINITY });
      resolve(bestMatch.id);
    };
    img.onerror = () => resolve("3:4");
    img.src = imageUrl;
  });

async function fileToPreview(file: File, maxWidth: number, maxHeight: number, quality: number) {
  try {
    return await compressImage(file, { maxWidth, maxHeight, quality });
  } catch {
    return readImageAsDataUrl(file);
  }
}

const FashionVirtualTryOn = () => {
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

  const modelInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  const [modelImage, setModelImage] = useState<string | null>(null);
  const [garmentImages, setGarmentImages] = useState<string[]>([]);
  const [referenceMode, setReferenceMode] = useState<TryOnReferenceMode>("multi-piece");
  const [selectedCategory, setSelectedCategory] = useState<TryOnGarmentCategory>("auto");
  const [selectedRatio, setSelectedRatio] = useState("3:4");
  const [selectedLine, setSelectedLine] = useState("speed");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  useEffect(() => {
    preloadDownloadImage(generatedImage);
  }, [generatedImage]);

  useEffect(() => {
    if (referenceMode === "multi-piece" && garmentImages.length > 1 && selectedCategory === "auto") {
      setSelectedCategory("outfit");
      return;
    }

    if (referenceMode === "single-garment" && selectedCategory === "outfit") {
      setSelectedCategory("auto");
    }
  }, [referenceMode, garmentImages.length, selectedCategory]);

  const currentLineOption = lineOptions.find((option) => option.id === selectedLine) ?? lineOptions[0];
  const featureCode = currentLineOption.line === "premium" ? "ai_fashion_premium" : "ai_fashion_standard";
  const canGenerate = Boolean(modelImage && garmentImages.length > 0 && !isGenerating);

  const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const preview = await fileToPreview(file, 1280, 1280, 0.9);
    setModelImage(preview);
    setGeneratedImage(null);
    setSelectedRatio(await detectClosestRatio(preview));

    if (modelInputRef.current) {
      modelInputRef.current.value = "";
    }
  };

  const handleGarmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const remainingSlots = GARMENT_MAX_IMAGES - garmentImages.length;
    const filesToProcess = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remainingSlots);

    if (!filesToProcess.length) return;

    const previews = await Promise.all(
      filesToProcess.map((file) => fileToPreview(file, 1024, 1024, 0.85)),
    );

    setGarmentImages((prev) => [...prev, ...previews]);
    setGeneratedImage(null);

    if (garmentInputRef.current) {
      garmentInputRef.current.value = "";
    }
  };

  const clearGarmentImage = (index: number) => {
    setGarmentImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
    setGeneratedImage(null);
  };

  const handleGenerate = async () => {
    if (!modelImage || garmentImages.length === 0 || !canGenerate) return;
    if (!checkCredits(featureCode)) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      setGenerationStep("正在锁定模特、背景和动作...");
      const prompt = buildVirtualTryOnPrompt({
        garmentCount: garmentImages.length,
        category: selectedCategory,
        referenceMode,
        additionalNotes,
      });
      const negativePrompt = buildVirtualTryOnNegativePrompt(selectedCategory, referenceMode);

      setGenerationStep("正在按服装参考图做局部换衣...");
      const response = await generateImage({
        prompt,
        negativePrompt,
        aspectRatio: selectedRatio,
        images: [modelImage, ...garmentImages],
        line: currentLineOption.line,
        resolution: currentLineOption.resolution,
        hasFrameworkPrompt: true,
        featureCode,
      });

      if (!response.success) {
        throw new Error(response.error || "生成失败");
      }

      const result = response.imageUrl || response.imageBase64;
      if (!result) {
        throw new Error("未获取到换衣结果图");
      }

      setGeneratedImage(result);
      void refreshBalance();

      const title = additionalNotes.trim()
        ? `定点换衣：${additionalNotes.trim().slice(0, 24)}`
        : "AI 定点换衣";

      void saveGeneratedImageWork({
        title,
        type: "drawing",
        tool: "AI 定点换衣",
        prompt: `${prompt}\n\nNegative Prompt:\n${negativePrompt}`,
        imageDataUrl: result,
        metadata: {
          referenceMode,
          category: selectedCategory,
          line: selectedLine,
          aspectRatio: selectedRatio,
          garmentReferenceCount: garmentImages.length,
        },
      }).catch((error) => {
        console.error("自动保存定点换衣作品失败", error);
      });
    } catch (error) {
      console.error("定点换衣生成失败:", error);
      toast.error("生成失败", { description: error instanceof Error ? error.message : "未知错误" });
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      await downloadGeneratedImage(generatedImage, `fashion-virtual-tryon-${Date.now()}.png`);
    } catch {
      window.open(generatedImage, "_blank");
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
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-1.5">
          <img src="/icons/style-coordinator.png" alt="AI 定点换衣" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI 定点换衣</h1>
          <p className="text-muted-foreground text-sm">上传 1 张模特图和最多 3 张同款服装参考图，尽量锁定人物、动作和背景，只替换衣服</p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-amber-50/70 to-white p-4 shadow-[0_18px_50px_-28px_rgba(234,88,12,0.45)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-orange-500/10 p-2 text-orange-600">
            <Sparkles className="w-5 h-5" />
          </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">推荐上传方式</p>
              <p className="text-xs text-muted-foreground leading-relaxed">如果是多件穿搭，建议按上传顺序放：外层 / 主单品 → 内搭 → 下装，这样内搭和层次更容易被保留。</p>
              <p className="text-xs text-muted-foreground leading-relaxed">如果只是同一件衣服的多角度图，请切换到“单件多视角”；如果是背心 + 内搭 + 裤子这种组合，请用“多件组合 + 整套穿搭”。</p>
            </div>
          </div>
        </div>

      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-4 shadow-lg space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded-2xl border border-border/70 bg-card/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">1</div>
              <div>
                <p className="text-sm font-medium text-foreground">上传模特参考图</p>
                <p className="text-xs text-muted-foreground">人物、动作、背景、机位都会尽量按这张图锁定</p>
              </div>
            </div>

            {modelImage ? (
              <div className="space-y-3">
                <img src={modelImage} alt="模特参考图" className="h-72 w-full rounded-xl border border-border object-cover bg-card" />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => modelInputRef.current?.click()}>
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    更换模特图
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setModelImage(null);
                      setGeneratedImage(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    清除
                  </Button>
                  <span className="inline-flex items-center rounded-full bg-secondary/70 px-2.5 py-1 text-[11px] text-muted-foreground">
                    画幅已匹配：{selectedRatio}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => modelInputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/45 bg-card/40 px-4 py-10 flex flex-col items-center gap-2 transition-colors"
              >
                <ImagePlus className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">点击上传模特图</p>
                <p className="text-xs text-muted-foreground">建议单人、清晰、正面或轻侧面、背景完整</p>
              </button>
            )}

            <input
              ref={modelInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleModelUpload}
            />
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">2</div>
              <div>
                <p className="text-sm font-medium text-foreground">上传服装参考图</p>
                <p className="text-xs text-muted-foreground">最多 3 张，当前按{referenceMode === "multi-piece" ? "多件组合" : "单件多视角"}逻辑处理</p>
              </div>
              <span className="ml-auto text-xs text-muted-foreground">{garmentImages.length}/{GARMENT_MAX_IMAGES}</span>
            </div>

            {garmentImages.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {garmentImages.map((preview, index) => (
                    <div key={`${preview.slice(0, 24)}-${index}`} className="relative group">
                      <img src={preview} alt={`服装参考图 ${index + 1}`} className="h-32 w-full rounded-xl border border-border object-cover bg-card" />
                      <button
                        onClick={() => clearGarmentImage(index)}
                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white shadow-sm"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute left-2 bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                        参考 {index + 1}
                      </span>
                    </div>
                  ))}
                  {garmentImages.length < GARMENT_MAX_IMAGES ? (
                    <button
                      onClick={() => garmentInputRef.current?.click()}
                      className="h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/45 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ImagePlus className="w-6 h-6" />
                      <span className="text-xs">继续上传</span>
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => garmentInputRef.current?.click()} disabled={garmentImages.length >= GARMENT_MAX_IMAGES}>
                    <ImagePlus className="w-4 h-4 mr-1.5" />
                    添加服装图
                  </Button>
                  {garmentImages.length > 1 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setGarmentImages([]);
                        setGeneratedImage(null);
                      }}
                    >
                      清空服装图
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <button
                onClick={() => garmentInputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/45 bg-card/40 px-4 py-10 flex flex-col items-center gap-2 transition-colors"
              >
                <ShirtIcon className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">点击上传服装参考图</p>
                <p className="text-xs text-muted-foreground">建议正面图做主图，侧面/细节图做补充</p>
              </button>
            )}

            <input
              ref={garmentInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              multiple
              onChange={handleGarmentUpload}
            />
          </section>
        </div>

        <section className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">参考图逻辑</p>
            <div className="grid gap-2 md:grid-cols-2">
              {referenceModeOptions.map((option) => {
                const active = referenceMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setReferenceMode(option.id)}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left transition-all duration-200",
                      active
                        ? "border-orange-300 bg-orange-50 shadow-sm"
                        : "border-border bg-card/40 hover:border-orange-200 hover:bg-orange-50/40",
                    )}
                  >
                    <p className={cn("text-sm font-medium", active ? "text-orange-700" : "text-foreground")}>{option.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{option.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">服装类型</p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {categoryOptions.map((option) => {
                const active = selectedCategory === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedCategory(option.id)}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left transition-all duration-200",
                      active
                        ? "border-orange-300 bg-orange-50 shadow-sm"
                        : "border-border bg-card/40 hover:border-orange-200 hover:bg-orange-50/40",
                    )}
                  >
                    <p className={cn("text-sm font-medium", active ? "text-orange-700" : "text-foreground")}>{option.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{option.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">补充说明（可选）</p>
            <textarea
              value={additionalNotes}
              onChange={(event) => setAdditionalNotes(event.target.value)}
              placeholder={referenceMode === "multi-piece"
                ? "例如：黄色背心在外面，白色蕾丝内搭必须露出领口和袖口，牛仔裤保持高腰版型"
                : "例如：袖口要完整、领型不要变、尽量保留原图头发遮挡关系"}
              rows={3}
              className="w-full rounded-2xl border border-border bg-card/40 px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </section>

        <div className="border-t border-border/60 pt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">输出画幅</p>
              <div className="flex flex-wrap gap-2">
                {ratioOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedRatio(option.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition-colors",
                      selectedRatio === option.id
                        ? "border-orange-300 bg-orange-50 text-orange-700"
                        : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LineStatusSelector
                selectedLine={selectedLine}
                lineOptions={lineOptions}
                statuses={statuses}
                onSelect={setSelectedLine}
                alignRight
              />
              <CreditCostHint featureCode={featureCode} />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={cn(
              "h-11 px-5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-sm font-medium",
              canGenerate
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-[0_14px_34px_-18px_rgba(234,88,12,0.65)]"
                : "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed",
            )}
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isGenerating ? "生成中..." : "开始换衣"}</span>
          </button>
        </div>
      </div>

      {(isGenerating || generatedImage) ? (
        <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div>
              <h2 className="text-sm md:text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                换衣结果
              </h2>
              <p className="text-xs text-muted-foreground mt-1">系统会尽量锁定模特身份、动作和背景，只编辑衣服区域</p>
            </div>
            {generatedImage && !isGenerating ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  重新生成
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  下载
                </Button>
              </div>
            ) : null}
          </div>

          {isGenerating ? (
            <GeneratingLoader message={generationStep || "正在生成中..."} />
          ) : generatedImage ? (
            <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
              <div className="space-y-3 rounded-2xl border border-border/70 bg-card/35 p-3">
                <div>
                  <p className="text-xs font-medium text-foreground mb-2">模特图</p>
                  {modelImage ? <img src={modelImage} alt="模特参考图" className="h-36 w-full rounded-xl object-cover border border-border" /> : null}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground mb-2">服装参考图</p>
                  <div className="grid grid-cols-3 gap-2">
                    {garmentImages.map((image, index) => (
                      <img key={`${image.slice(0, 24)}-result-${index}`} src={image} alt={`服装参考图 ${index + 1}`} className="h-20 w-full rounded-lg object-cover border border-border" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-secondary/20 p-2 md:p-4">
                <img src={generatedImage} alt="定点换衣结果图" className="max-h-[720px] w-full rounded-xl object-contain bg-card/40" />
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-center py-10 md:py-16">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <ShirtIcon className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/50" />
          </div>
          <p className="text-sm md:text-base text-muted-foreground">先上传模特图和服装参考图，再开始生成换衣结果</p>
        </div>
      )}

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

export default FashionVirtualTryOn;
