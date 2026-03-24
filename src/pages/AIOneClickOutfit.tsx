import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import { Button } from "@/components/ui/button";
import { CreditCostHint } from "@/components/CreditCostHint";
import { cn } from "@/lib/utils";
import {
  buildGarmentDetailStrip,
  buildHangoutfitReferenceBoard,
  compressImage,
  downloadGeneratedImage,
  mergeImagesToGridWithAccessories,
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
import type { AccessoryUploadInfo } from "@/lib/hangoutfit";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Footprints,
  Image,
  Loader2,
  Ratio,
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

const aspectRatioOptions = [
  { id: "9:16", label: "9:16", hint: "长竖版挂搭图" },
  { id: "4:3", label: "4:3", hint: "横版陈列画幅" },
  { id: "3:4", label: "3:4", hint: "常用竖版画幅" },
] as const;

const DEFAULT_TEMPLATE_ID = HANGOUTFIT_TEMPLATES[0]?.id ?? "default";

interface PreparedImageAsset {
  preview: string;
  source: string;
}

interface PreparedGarmentAsset extends PreparedImageAsset {
  detailStrip: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

async function prepareImageAsset(file: File): Promise<PreparedImageAsset> {
  const preferredSourceMime = file.type === "image/png" ? "image/png" : "image/jpeg";

  try {
    const [preview, source] = await Promise.all([
      compressImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.85,
      }),
      compressImage(file, {
        maxWidth: 1440,
        maxHeight: 1440,
        quality: 0.92,
        mimeType: preferredSourceMime,
        autoOptimize: false,
      }),
    ]);

    return { preview, source };
  } catch {
    const source = await readFileAsDataUrl(file);
    return { preview: source, source };
  }
}

async function prepareGarmentAsset(file: File): Promise<PreparedGarmentAsset> {
  const asset = await prepareImageAsset(file);

  try {
    const detailStrip = await buildGarmentDetailStrip(asset.source);
    return { ...asset, detailStrip };
  } catch {
    return { ...asset, detailStrip: asset.source };
  }
}

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
  const shoesInputRef = useRef<HTMLInputElement>(null);
  const bagInputRef = useRef<HTMLInputElement>(null);
  const ratioMenuRef = useRef<HTMLDivElement>(null);

  const [garmentAssets, setGarmentAssets] = useState<PreparedGarmentAsset[]>([]);
  const [shoesAsset, setShoesAsset] = useState<PreparedImageAsset | null>(null);
  const [bagAsset, setBagAsset] = useState<PreparedImageAsset | null>(null);
  const [selectedLine, setSelectedLine] = useState("speed");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<(typeof aspectRatioOptions)[number]["id"]>("9:16");
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showRatioMenu, setShowRatioMenu] = useState(false);
  const { statuses } = useLineStatus();

  const accessories: AccessoryUploadInfo = {
    hasShoesImage: Boolean(shoesAsset),
    hasBagImage: Boolean(bagAsset),
  };

  const selectedTemplate = useMemo(
    () => getHangoutfitTemplateById(selectedTemplateId) ?? HANGOUTFIT_TEMPLATES[0],
    [selectedTemplateId],
  );
  const maxImages = 3;
  const uploadDescription =
    "支持上传 2-3 张服装图。系统会把每张图都当成独立服装参考，按所选模板生成对应场景，并严格按上传件数展示。";

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

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = maxImages - garmentAssets.length;
    const filesToProcess = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remainingSlots);

    if (filesToProcess.length === 0) {
      return;
    }

    const preparedAssets = await Promise.all(filesToProcess.map((file) => prepareGarmentAsset(file)));
    setGarmentAssets((prev) => [...prev, ...preparedAssets]);
    setGeneratedImage(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const clearImage = (index: number) => {
    setGarmentAssets((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
    setGeneratedImage(null);
  };

  const clearAllImages = () => {
    setGarmentAssets([]);
    setGeneratedImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleAccessoryUpload = async (
    files: FileList | null,
    setter: (value: PreparedImageAsset | null) => void,
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) => {
    if (!files || files.length === 0) return;
    const file = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (!file) return;

    const preparedAsset = await prepareImageAsset(file);
    setter(preparedAsset);
    setGeneratedImage(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (garmentAssets.length < 2 || garmentAssets.length > maxImages) return;
    const selectedLineOption = lineOptions.find((option) => option.id === selectedLine) || lineOptions[0];
    const featureCode =
      selectedLineOption.resolution === "2k" || selectedLineOption.resolution === "4k"
        ? "ai_outfit_hd"
        : "ai_outfit_standard";
    if (!checkCredits(featureCode)) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const uploadedCount = garmentAssets.length;
      const garmentSourceImages = garmentAssets.map((asset) => asset.source);
      const garmentDetailStrips = garmentAssets.map((asset) => asset.detailStrip);
      const isDefaultTemplate = selectedTemplate.id === "default";
      let referenceImage: string;
      let prompt: string;
      let negativePrompt: string;

      if (isDefaultTemplate) {
        setGenerationStep("正在整理服装与模板参考...");
        referenceImage = await mergeImagesToGridWithAccessories(
          garmentSourceImages,
          380,
          1,
          { cellHeight: Math.round((380 * 16) / 9), fit: "contain" },
          { shoesImage: shoesAsset?.source, bagImage: bagAsset?.source },
        );
        prompt = buildDefaultHangoutfitPrompt({
          uploadedCount,
          notes: additionalNotes,
          accessories,
        });
        negativePrompt = buildDefaultHangoutfitNegativePrompt(uploadedCount, accessories);
      } else {
        setGenerationStep("正在整理服装与模板参考...");
        referenceImage = await buildHangoutfitReferenceBoard({
          garmentImages: garmentSourceImages,
          sceneReferenceSrc: selectedTemplate.sceneReferenceSrc,
          boardMode: selectedTemplate.referenceBoardMode,
          shoesImage: shoesAsset?.source,
          bagImage: bagAsset?.source,
        });
        prompt = buildHangoutfitPrompt({
          template: selectedTemplate,
          uploadedCount,
          notes: additionalNotes,
          accessories,
        });
        negativePrompt = buildHangoutfitNegativePrompt(selectedTemplate, uploadedCount, accessories);
      }

      const imagesToSend: string[] = [referenceImage, ...garmentSourceImages, ...garmentDetailStrips];
      if (shoesAsset?.source) imagesToSend.push(shoesAsset.source);
      if (bagAsset?.source) imagesToSend.push(bagAsset.source);

      setGenerationStep("AI 正在生成挂搭图...");
      const response = await generateImage({
        prompt,
        negativePrompt,
        aspectRatio: selectedAspectRatio,
        images: imagesToSend,
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
          referenceBoardMode: selectedTemplate.referenceBoardMode,
          hasShoesImage: accessories.hasShoesImage,
          hasBagImage: accessories.hasBagImage,
          detailStripCount: garmentDetailStrips.length,
          sentReferenceImageCount: imagesToSend.length,
          fidelityMode: "single-pass-prompt-plus-reference",
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

  const canGenerate = Boolean(garmentAssets.length >= 2 && garmentAssets.length <= maxImages && !isGenerating);

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
          {uploadDescription}
          </p>

        <div className="rounded-xl border border-border bg-card/60 p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Image className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">上传服装照片</span>
            <span className="text-xs text-muted-foreground ml-auto">{garmentAssets.length}/{maxImages}</span>
          </div>

          {garmentAssets.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">每张图都会作为独立服装参考使用</span>
                <button onClick={clearAllImages} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  清空全部
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {garmentAssets.map((asset, index) => (
                  <div key={`${asset.preview.slice(0, 24)}-${index}`} className="relative group">
                    <img
                      src={asset.preview}
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

                {garmentAssets.length < maxImages && (
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
              <span className="text-xs text-muted-foreground">{`支持最多 ${maxImages} 张图片`}</span>
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

      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-3 md:mb-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">第二步：上传配饰（可选）</span>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          可以上传你自己的鞋子或包包。不上传则系统自动搭配。
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* 鞋子上传槽 */}
          <div className="rounded-xl border border-border bg-card/60 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Footprints className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">鞋子</span>
            </div>

            {shoesAsset ? (
              <div className="relative group">
                <img
                  src={shoesAsset.preview}
                  alt="鞋子参考"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-28 md:h-36 object-cover rounded-lg border border-border bg-background"
                />
                <button
                  onClick={() => {
                    setShoesAsset(null);
                    setGeneratedImage(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => shoesInputRef.current?.click()}
                className="w-full h-28 md:h-36 rounded-lg border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs">上传鞋子</span>
              </button>
            )}

            <input
              ref={shoesInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleAccessoryUpload(event.target.files, setShoesAsset, shoesInputRef)}
            />
          </div>

          {/* 包包上传槽 */}
          <div className="rounded-xl border border-border bg-card/60 p-3">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">包包</span>
            </div>

            {bagAsset ? (
              <div className="relative group">
                <img
                  src={bagAsset.preview}
                  alt="包包参考"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-28 md:h-36 object-cover rounded-lg border border-border bg-background"
                />
                <button
                  onClick={() => {
                    setBagAsset(null);
                    setGeneratedImage(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => bagInputRef.current?.click()}
                className="w-full h-28 md:h-36 rounded-lg border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs">上传包包</span>
              </button>
            )}

            <input
              ref={bagInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleAccessoryUpload(event.target.files, setBagAsset, bagInputRef)}
            />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">第三步：选择画面模板</span>
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
          <span className="text-sm font-medium text-foreground">第四步：选择清晰度并生成</span>
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

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div ref={ratioMenuRef} className="relative inline-flex self-start" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowRatioMenu((prev) => !prev)}
              className={cn(
                "flex items-center gap-2 rounded-full border-2 bg-white px-4 py-2.5 shadow-sm transition-colors",
                showRatioMenu
                  ? "border-primary text-primary hover:bg-primary/5"
                  : "border-border text-foreground hover:border-primary/30 hover:bg-primary/5",
              )}
              aria-haspopup="menu"
              aria-expanded={showRatioMenu}
              aria-label={`画幅比例 ${selectedAspectRatio}`}
            >
              <Ratio className="w-4 h-4" />
              <span className="text-sm font-medium">{selectedAspectRatio}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", showRatioMenu && "rotate-180")} />
            </button>

            {showRatioMenu && (
              <div className="absolute left-0 top-full z-20 mt-3 w-[188px] overflow-hidden rounded-[24px] border border-primary/10 bg-white p-3 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.28)]">
                {aspectRatioOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSelectedAspectRatio(option.id);
                      setShowRatioMenu(false);
                    }}
                    className={cn(
                      "w-full rounded-2xl px-4 py-3 text-left transition-colors",
                      selectedAspectRatio === option.id
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-primary/5",
                    )}
                    role="menuitem"
                  >
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{option.hint}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
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
