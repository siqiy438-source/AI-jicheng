import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import { Button } from "@/components/ui/button";
import { CreditCostHint } from "@/components/CreditCostHint";
import { cn } from "@/lib/utils";
import {
  buildHangoutfitReferenceBoard,
  compressImage,
  downloadGeneratedImage,
  mergeImagesToGrid,
  preloadDownloadImage,
} from "@/lib/image-utils";
import { generateImage } from "@/lib/ai-image";
import { saveGeneratedImageWork } from "@/lib/repositories/works";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { useLineStatus } from "@/hooks/use-line-status";
import { InsufficientBalanceDialog } from "@/components/InsufficientBalanceDialog";
import { LineStatusSelector } from "@/components/LineStatusSelector";
import {
  buildDefaultHangoutfitNegativePrompt,
  buildDefaultHangoutfitPrompt,
  buildHangoutfitNegativePrompt,
  buildHangoutfitPrompt,
  buildHangoutfitWorkMetadata,
  getHangoutfitTemplateById,
  HANGOUTFIT_TEMPLATES,
} from "@/lib/hangoutfit";
import {
  ArrowLeft,
  Download,
  Image,
  Loader2,
  RefreshCw,
  Send,
  ShirtIcon,
  Sparkles,
  Star,
  Upload,
  X,
  ShoppingBag,
} from "lucide-react";

const lineOptions = [
  { id: "speed", name: "灵犀极速版", line: "standard" as const, resolution: "speed" as const },
  { id: "standard_2k", name: "灵犀 2K", line: "standard" as const, resolution: "2k" as const },
  { id: "standard_4k", name: "灵犀 4K", line: "standard" as const, resolution: "4k" as const },
];

const MAX_IMAGES = 3;
const DEFAULT_TEMPLATE_ID = HANGOUTFIT_TEMPLATES[0]?.id ?? "default";

const AIOneClickOutfit = () => {
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
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedLine, setSelectedLine] = useState("speed");
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { statuses } = useLineStatus();

  const selectedTemplate = useMemo(
    () => getHangoutfitTemplateById(selectedTemplateId) ?? HANGOUTFIT_TEMPLATES[0],
    [selectedTemplateId],
  );

  useEffect(() => {
    preloadDownloadImage(generatedImage);
  }, [generatedImage]);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = MAX_IMAGES - imagePreviews.length;
    const filesToProcess = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remainingSlots);

    for (const file of filesToProcess) {
      try {
        const compressed = await compressImage(file, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.85,
        });
        setImagePreviews((prev) => [...prev, compressed]);
        setGeneratedImage(null);
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreviews((prev) => [...prev, event.target?.result as string]);
          setGeneratedImage(null);
        };
        reader.readAsDataURL(file);
      }
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const clearImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
    setGeneratedImage(null);
  };

  const clearAllImages = () => {
    setImagePreviews([]);
    setGeneratedImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (imagePreviews.length < 2) return;
    const selectedLineOption = lineOptions.find((option) => option.id === selectedLine) || lineOptions[0];
    const featureCode =
      selectedLineOption.resolution === "2k" || selectedLineOption.resolution === "4k"
        ? "ai_outfit_hd"
        : "ai_outfit_standard";
    if (!checkCredits(featureCode)) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      setGenerationStep("正在整理服装与模板参考...");
      const uploadedCount = imagePreviews.length;
      const isDefaultTemplate = selectedTemplate.id === "default";
      const referenceImage = isDefaultTemplate
        ? await mergeImagesToGrid(imagePreviews, 380, 1, {
            cellHeight: Math.round((380 * 16) / 9),
            fit: "contain",
          })
        : await buildHangoutfitReferenceBoard({
            garmentImages: imagePreviews,
            sceneReferenceSrc: selectedTemplate.sceneReferenceSrc,
          });
      const prompt = isDefaultTemplate
        ? buildDefaultHangoutfitPrompt({
            uploadedCount,
            notes: additionalNotes,
          })
        : buildHangoutfitPrompt({
            template: selectedTemplate,
            uploadedCount,
            notes: additionalNotes,
          });
      const negativePrompt = isDefaultTemplate
        ? buildDefaultHangoutfitNegativePrompt(uploadedCount)
        : buildHangoutfitNegativePrompt(selectedTemplate, uploadedCount);

      setGenerationStep("AI 正在生成挂搭图...");
      const response = await generateImage({
        prompt,
        negativePrompt,
        aspectRatio: "3:4",
        images: [referenceImage],
        line: selectedLineOption.line,
        resolution: selectedLineOption.resolution,
        hasFrameworkPrompt: true,
        featureCode,
      });

      if (!response.success) {
        throw new Error(response.error || "生成失败");
      }

      const result = response.imageUrl || response.imageBase64;
      if (!result) {
        throw new Error("未获取到生成图片");
      }

      setGeneratedImage(result);
      void refreshBalance();

      const title = additionalNotes.trim()
        ? `一键挂搭：${additionalNotes.trim().slice(0, 24)}`
        : `AI 一键挂搭图·${selectedTemplate.name}`;

      void saveGeneratedImageWork({
        title,
        type: "drawing",
        tool: "AI 一键挂搭图",
        prompt,
        imageDataUrl: result,
        metadata: buildHangoutfitWorkMetadata({
          line: selectedLine,
          hasAdditionalNotes: Boolean(additionalNotes.trim()),
          uploadedImageCount: uploadedCount,
          selectedTemplateId: selectedTemplate.id,
        }),
      }).catch((error) => {
        console.error("自动保存挂搭图失败", error);
      });
    } catch (error) {
      console.error("一键挂搭图生成失败:", error);
      toast.error("生成失败", { description: error instanceof Error ? error.message : "未知错误" });
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      await downloadGeneratedImage(generatedImage, `ai-one-click-outfit-${Date.now()}.png`);
    } catch {
      window.open(generatedImage, "_blank");
    }
  };

  const canGenerate = Boolean(imagePreviews.length >= 2 && !isGenerating);

  return (
    <PageLayout className="py-2 md:py-8">
      <button
        onClick={() => navigate("/clothing")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 md:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回服装</span>
      </button>

      <div className="hidden md:flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-1.5">
          <img
            src="/icons/ai-one-click-outfit-custom.webp"
            alt="AI 一键挂搭图"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI 一键挂搭图</h1>
          <p className="text-muted-foreground text-sm">上传 2-3 张服装图，选择挂拍模板，生成店铺陈列效果图</p>
        </div>
      </div>

      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-3 md:mb-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <ShirtIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">第一步：上传服装</span>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          支持上传 2-3 张服装图。系统会把每张图都当成独立服装参考，完整展示版型和细节；只上传 2 张时，不会补第三件衣服。
        </p>

        <div className="rounded-xl border border-border bg-card/60 p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Image className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">上传服装照片</span>
            <span className="text-xs text-muted-foreground ml-auto">{imagePreviews.length}/{MAX_IMAGES}</span>
          </div>

          {imagePreviews.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">每张图都会作为独立服装参考使用</span>
                <button onClick={clearAllImages} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  清空全部
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {imagePreviews.map((image, index) => (
                  <div key={`${image.slice(0, 24)}-${index}`} className="relative group">
                    <img
                      src={image}
                      alt={`参考图 ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-32 md:h-44 object-cover rounded-lg border border-border bg-background"
                    />
                    <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white">
                      {`参考图 ${index + 1}`}
                    </div>
                    <button
                      onClick={() => clearImage(index)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {imagePreviews.length < MAX_IMAGES && (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="h-32 md:h-44 rounded-lg border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-xs">继续上传</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-full py-8 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm">点击上传服装照片</span>
              <span className="text-xs text-muted-foreground">支持最多 3 张图片</span>
            </button>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleUpload(event.target.files)}
          />
        </div>
      </div>

      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">第二步：选择画画模板</span>
        </div>

        <div className="space-y-2.5">
          {HANGOUTFIT_TEMPLATES.map((template) => {
            const active = template.id === selectedTemplate.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  setSelectedTemplateId(template.id);
                  setGeneratedImage(null);
                }}
                className={cn(
                  "w-full rounded-2xl border text-left transition-all bg-card/70 px-4 py-3",
                  active
                    ? "border-primary/50 ring-2 ring-primary/25 shadow-lg shadow-primary/10"
                    : "border-border hover:border-primary/30 hover:bg-card",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={cn("text-sm font-medium", active ? "text-primary" : "text-foreground")}>
                        {template.name}
                      </span>
                      {template.id === "default" && (
                        <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                          当前默认
                        </span>
                      )}
                      {active && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                          已选中
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">{template.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs text-primary/90 leading-5">
          当前模板会固定墙面、挂杆、道具和氛围构图，系统只替换成你上传的服装，并保持每件衣服独立悬挂。
        </div>
      </div>

      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-4 md:mb-6 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">第三步：选择清晰度并生成</span>
        </div>

        <div className="mb-3">
          <LineStatusSelector
            selectedLine={selectedLine}
            lineOptions={lineOptions}
            statuses={statuses}
            onSelect={setSelectedLine}
          />
        </div>

        <div className="mb-3 rounded-lg border border-primary/20 bg-primary/10 p-2.5 text-xs text-primary flex items-center gap-2 flex-wrap">
          <ShoppingBag className="w-4 h-4" />
          <span>系统会复用模板里的陈列道具</span>
          <Star className="w-3.5 h-3.5 ml-1" />
          <span>自动保留挂杆、墙面、椅子/配饰等场景锚点</span>
        </div>

        <textarea
          value={additionalNotes}
          onChange={(event) => setAdditionalNotes(event.target.value)}
          placeholder="补充说明（可选）：如“更偏轻熟通勤”“整体再低饱和一点”"
          rows={3}
          className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 mb-3"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={cn(
              "w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              canGenerate
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                : "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed",
            )}
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isGenerating ? "生成中..." : "生成挂搭图"}</span>
          </button>
          <CreditCostHint
            featureCode={
              lineOptions.find((option) => option.id === selectedLine)?.resolution === "2k" ||
              lineOptions.find((option) => option.id === selectedLine)?.resolution === "4k"
                ? "ai_outfit_hd"
                : "ai_outfit_standard"
            }
          />
        </div>
      </div>

      {(isGenerating || generatedImage) && (
        <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
            <h2 className="text-sm md:text-lg font-semibold text-foreground flex items-center gap-1.5 md:gap-2">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              AI 挂搭效果图
            </h2>

            {generatedImage && !isGenerating && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">重新生成</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">下载</span>
                </Button>
              </div>
            )}
          </div>

          {isGenerating && (
            <GeneratingLoader message={generationStep || "AI 正在生成中，请稍候..."} />
          )}

          {generatedImage && !isGenerating && (
            <img
              src={generatedImage}
              alt="AI 一键挂搭图"
              className="w-full max-w-xl mx-auto rounded-xl border border-border shadow-lg"
            />
          )}
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

export default AIOneClickOutfit;
