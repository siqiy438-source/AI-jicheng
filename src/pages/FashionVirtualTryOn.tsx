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
import { findExposurePolicyViolation } from "@/lib/fashion-safety";
import {
  buildVirtualTryOnNegativePrompt,
  buildVirtualTryOnPrompt,
  type TryOnGarmentCategory,
  type TryOnGarmentRole,
  type TryOnReferenceMode,
} from "@/lib/virtual-tryon-prompts";

const MULTI_PIECE_MAX_IMAGES = 3;
const SINGLE_GARMENT_MAX_IMAGES = 3;

const ratioOptions = [
  { id: "9:16", label: "9:16" },
  { id: "3:4", label: "3:4" },
  { id: "1:1", label: "1:1" },
  { id: "4:3", label: "4:3" },
];

const lineOptions = [
  { id: "speed", name: "灵犀极速版", line: "standard" as const, resolution: "speed" as const },
  { id: "premium", name: "灵犀 Pro", line: "premium" as const, resolution: "2k" as const, badge: "优质" },
  { id: "standard_2k", name: "灵犀 2K", line: "standard" as const, resolution: "2k" as const },
  { id: "standard_4k", name: "灵犀 4K", line: "standard" as const, resolution: "4k" as const },
];

const categoryOptions: Array<{
  id: TryOnGarmentCategory;
  name: string;
  hint: string;
}> = [
  { id: "outfit", name: "整套穿搭", hint: "完整替换所有原有衣物，换上上传的服装" },
  { id: "dress", name: "连衣裙", hint: "适合连衣裙或连体款" },
];

const garmentRoleOptions: Array<{ id: TryOnGarmentRole; label: string }> = [
  { id: "outer", label: "外套" },
  { id: "top", label: "上衣" },
  { id: "inner", label: "内搭" },
  { id: "bottom", label: "下装" },
];

interface MultiPieceSlot {
  id: string;
  role: TryOnGarmentRole;
  image: string | null;
}

const createMultiPieceSlots = (): MultiPieceSlot[] => [
  { id: "piece-1", role: "top", image: null },
  { id: "piece-2", role: "bottom", image: null },
  { id: "piece-3", role: "outer", image: null },
];

const readImageAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve((event.target?.result as string) || "");
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
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
  const multiPieceInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [modelImage, setModelImage] = useState<string | null>(null);
  const [multiPieceSlots, setMultiPieceSlots] = useState<MultiPieceSlot[]>(createMultiPieceSlots);
  const [multiPieceMode, setMultiPieceMode] = useState<2 | 3>(2);
  const [selectedCategory, setSelectedCategory] = useState<TryOnGarmentCategory>("outfit");
  const [selectedRatio, setSelectedRatio] = useState("9:16");
  const [selectedLine, setSelectedLine] = useState("speed");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const referenceMode: TryOnReferenceMode = "multi-piece";
  const activeMultiPieceSlots = multiPieceSlots.slice(0, multiPieceMode);
  const garmentImages = activeMultiPieceSlots.filter((slot) => Boolean(slot.image)).map((slot) => slot.image as string);
  const garmentRoles: TryOnGarmentRole[] = activeMultiPieceSlots.filter((slot) => Boolean(slot.image)).map((slot) => slot.role);

  useEffect(() => {
    preloadDownloadImage(generatedImage);
  }, [generatedImage]);

  const currentLineOption = lineOptions.find((option) => option.id === selectedLine) ?? lineOptions[0];
  const featureCode = currentLineOption.line === "premium" ? "ai_fashion_premium" : (currentLineOption.resolution === "2k" || currentLineOption.resolution === "4k") ? "ai_fashion_hd" : "ai_fashion_standard";
  const hasRequiredGarments = garmentImages.length === multiPieceMode;
  const canGenerate = Boolean(modelImage && hasRequiredGarments && !isGenerating);

  const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const preview = await fileToPreview(file, 1280, 1280, 0.9);
    setModelImage(preview);
    setGeneratedImage(null);

    if (modelInputRef.current) {
      modelInputRef.current.value = "";
    }
  };

  const handlePieceUpload = async (event: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const preview = await fileToPreview(file, 1024, 1024, 0.85);

    setMultiPieceSlots((prev) => prev.map((slot, index) => (
      index === slotIndex ? { ...slot, image: preview } : slot
    )));

    const inputRef = multiPieceInputRefs.current[slotIndex];
    if (inputRef) {
      inputRef.value = "";
    }

    setGeneratedImage(null);
  };

  const clearPieceImage = (slotIndex: number) => {
    setMultiPieceSlots((prev) => prev.map((slot, index) => (
      index === slotIndex ? { ...slot, image: null } : slot
    )));
    setGeneratedImage(null);
  };

  const updatePieceRole = (slotIndex: number, role: TryOnGarmentRole) => {
    setMultiPieceSlots((prev) => prev.map((slot, index) => (
      index === slotIndex ? { ...slot, role } : slot
    )));
    setGeneratedImage(null);
  };

  const handleGenerate = async () => {
    if (!modelImage || !hasRequiredGarments || !canGenerate) return;
    const promptError = findExposurePolicyViolation(additionalNotes);
    if (promptError) {
      toast.error("补充说明不支持", { description: promptError });
      return;
    }
    if (!checkCredits(featureCode)) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      setGenerationStep("正在锁定模特、背景和动作...");
      const prompt = buildVirtualTryOnPrompt({
        garmentCount: garmentImages.length,
        category: selectedCategory,
        referenceMode,
        garmentRoles,
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
    <PageLayout className="px-3 pt-4 pb-6 md:px-6 md:pt-6 md:pb-2 md:py-8">
      <button
        onClick={() => navigate("/clothing")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 md:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回服装</span>
      </button>

      <div className="mb-4 flex items-center gap-3 md:hidden">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100/70 p-2">
          <img src="/icons/style-coordinator.png" alt="AI 定点换衣" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-foreground">AI 定点换衣</h1>
          <p className="text-xs leading-relaxed text-muted-foreground">默认 9:16，上传两件或三件都能直接生成，尽量锁定原图动作和构图</p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-1.5">
          <img src="/icons/style-coordinator.png" alt="AI 定点换衣" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI 定点换衣</h1>
          <p className="text-muted-foreground text-sm">默认输出 9:16，上传两件或三件服装图都能直接生成，尽量锁定人物、动作和背景</p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-amber-50/70 to-white p-3.5 shadow-[0_18px_50px_-28px_rgba(234,88,12,0.45)] md:p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-orange-500/10 p-2 text-orange-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">推荐上传方式</p>
            <p className="text-xs text-muted-foreground leading-relaxed">直接选 2件模式 或 3件模式，然后上传对应数量的服装图即可生成，不需要再手动切换参考图逻辑。</p>
            <p className="text-xs text-muted-foreground leading-relaxed">如果需要更稳定的层次效果，可以给每件衣服选外套、上衣、内搭、下装角色。</p>
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
                <img src={modelImage} alt="模特参考图" className="h-64 w-full rounded-xl border border-border object-cover bg-card sm:h-72" />
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
                    当前画幅：{selectedRatio}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => modelInputRef.current?.click()}
                className="flex min-h-44 w-full touch-manipulation flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/40 px-4 py-8 transition-colors hover:border-primary/45 md:py-10"
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
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">2</div>
              <div>
                <p className="text-sm font-medium text-foreground">上传服装参考图</p>
                <p className="text-xs text-muted-foreground">当前为 {multiPieceMode} 件模式，可为每件指定角色</p>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-secondary/70 px-2 py-1 text-[11px] text-muted-foreground">{garmentImages.length}/{multiPieceMode}</span>
            </div>

            <div className="space-y-3">
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">组合件数</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {[2, 3].map((count) => {
                      const active = multiPieceMode === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            setMultiPieceMode(count as 2 | 3);
                            setGeneratedImage(null);
                          }}
                          className={cn(
                            "min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm transition-colors touch-manipulation",
                            active
                              ? "border-orange-300 bg-orange-50 text-orange-700"
                              : "border-border bg-card/60 text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {count}件模式
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {activeMultiPieceSlots.map((piece, index) => (
                    <div key={piece.id} className="rounded-2xl border border-border/70 bg-card/40 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-foreground">单品 {index + 1}</p>
                        {piece.image ? (
                          <button
                            onClick={() => clearPieceImage(index)}
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3.5 h-3.5" />
                            清除
                          </button>
                        ) : null}
                      </div>
                      <div className="mb-3 grid grid-cols-2 gap-2">
                        {garmentRoleOptions.map((option) => {
                          const active = piece.role === option.id;
                          return (
                            <button
                              key={`${piece.id}-${option.id}`}
                              type="button"
                              onClick={() => updatePieceRole(index, option.id)}
                              className={cn(
                                "min-h-11 rounded-xl border px-2 py-2 text-xs transition-colors touch-manipulation",
                                active
                                  ? "border-orange-300 bg-orange-50 text-orange-700"
                                  : "border-border bg-card/60 text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      {piece.image ? (
                        <button
                          onClick={() => multiPieceInputRefs.current[index]?.click()}
                          className="group relative block w-full overflow-hidden rounded-xl border border-border bg-card touch-manipulation"
                        >
                          <img src={piece.image} alt={`单品 ${index + 1} 参考图`} className="h-36 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
                          <span className="absolute left-2 bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                            点击更换{garmentRoleOptions.find((option) => option.id === piece.role)?.label ?? "单品"}
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() => multiPieceInputRefs.current[index]?.click()}
                          className="flex h-36 w-full touch-manipulation flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/45 hover:text-primary"
                        >
                          <ImagePlus className="w-6 h-6" />
                          <span className="text-xs">上传{garmentRoleOptions.find((option) => option.id === piece.role)?.label ?? "单品"}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {garmentImages.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMultiPieceSlots(createMultiPieceSlots());
                        setGeneratedImage(null);
                      }}
                    >
                      清空服装图
                    </Button>
                  ) : null}
                </div>
              </div>
            {multiPieceSlots.map((piece, index) => (
              <input
                key={piece.id}
                ref={(node) => {
                  multiPieceInputRefs.current[index] = node;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handlePieceUpload(event, index)}
              />
            ))}
          </section>
        </div>

        <section className="space-y-3">
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
                      "min-h-14 rounded-2xl border px-3 py-3 text-left transition-all duration-200 touch-manipulation",
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
              placeholder="例如：外套必须敞开穿、内搭要露出领口、下装保持高腰比例。支持正常露肤设计，不支持裸体化或敏感部位裸露"
              rows={3}
              className="w-full rounded-2xl border border-border bg-card/40 px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              支持露腰、露肩、露手臂等正常时装露肤；不支持裸体化、近似裸体或敏感部位裸露。
            </p>
          </div>
        </section>

        <div className="border-t border-border/60 pt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">输出画幅</p>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {ratioOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedRatio(option.id)}
                    className={cn(
                      "min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm transition-colors touch-manipulation",
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

          <div className="rounded-2xl border border-orange-200/70 bg-gradient-to-r from-orange-50/90 to-white p-3 shadow-[0_14px_30px_-24px_rgba(234,88,12,0.5)]">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={cn(
                "flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-medium transition-all duration-200",
                canGenerate
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_14px_34px_-18px_rgba(234,88,12,0.65)] hover:from-orange-600 hover:to-orange-700"
                  : "border border-orange-200 bg-white text-muted-foreground",
              )}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isGenerating ? "生成中..." : "开始换衣"}</span>
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {canGenerate ? "已满足生成条件，点击开始换衣" : `请先上传 1 张模特图和 ${multiPieceMode} 张服装图`}
            </p>
          </div>
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
