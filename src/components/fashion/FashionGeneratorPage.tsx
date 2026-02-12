import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  FolderUp,
  Image,
  Loader2,
  Palette,
  RefreshCw,
  Send,
  Sparkles,
  X,
  Zap,
  Ratio,
} from "lucide-react";

import { PageLayout } from "@/components/PageLayout";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import { Button } from "@/components/ui/button";
import { generateImage } from "@/lib/ai-image";
import { compressImage, downloadGeneratedImage } from "@/lib/image-utils";
import { saveGeneratedImageWork } from "@/lib/repositories/works";
import { cn } from "@/lib/utils";

export interface StyleOption {
  id: string;
  name: string;
  prompt: string;
  icon?: string;
  iconSrc?: string;
  description?: string;
  badge?: string;
}

interface FashionGeneratorPageProps {
  title: string;
  subtitle: string;
  iconSrc: string;
  basePrompt: string;
  styleOptions?: StyleOption[];
  styleSelectorVariant?: "dropdown" | "cards";
  resultAlt: string;
  downloadPrefix: string;
}

const ratioOptions = [
  { id: "1:1", name: "1:1" },
  { id: "4:3", name: "4:3" },
  { id: "16:9", name: "16:9" },
  { id: "9:16", name: "9:16" },
];

const lineOptions = [
  { id: "premium", name: "灵犀 Pro", line: "premium" as const, resolution: "2k" as const, badge: "优质" },
  { id: "standard", name: "灵犀标准", line: "standard" as const, resolution: "default" as const },
  { id: "standard_2k", name: "灵犀 2K", line: "standard" as const, resolution: "2k" as const },
  { id: "standard_4k", name: "灵犀 4K", line: "standard" as const, resolution: "4k" as const },
];

const MAX_IMAGES = 5;

export const FashionGeneratorPage = ({
  title,
  subtitle,
  iconSrc,
  basePrompt,
  styleOptions,
  styleSelectorVariant = "dropdown",
  resultAlt,
  downloadPrefix,
}: FashionGeneratorPageProps) => {
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedRatio, setSelectedRatio] = useState("9:16");
  const [selectedLine, setSelectedLine] = useState("standard");
  const [selectedStyleId, setSelectedStyleId] = useState(styleOptions?.[0]?.id ?? "");
  const [showRatioMenu, setShowRatioMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const shouldShowStyleCards = Boolean(styleOptions && styleOptions.length > 1 && styleSelectorVariant === "cards");
  const shouldShowStyleDropdown = Boolean(styleOptions && styleOptions.length > 1 && styleSelectorVariant !== "cards");
  const selectedStyleOption = styleOptions?.find((style) => style.id === selectedStyleId);

  const canGenerate = (prompt.trim() || imagePreviews.length > 0 || uploadedFiles.length > 0) && !isGenerating;

  const closeAllMenus = () => {
    setShowRatioMenu(false);
    setShowLineMenu(false);
    setShowStyleMenu(false);
  };

  const handleImageUpload = async (files: FileList | null) => {
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
          quality: 0.8,
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
  };

  const handleImageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(event.target.files);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const allFiles = Array.from(files);
    const imageFiles = allFiles.filter((file) => file.type.startsWith("image/"));
    const otherFiles = allFiles.filter((file) => !file.type.startsWith("image/"));

    if (imageFiles.length > 0) {
      const remainingSlots = MAX_IMAGES - imagePreviews.length;
      const filesToProcess = imageFiles.slice(0, remainingSlots);

      for (const file of filesToProcess) {
        try {
          const compressed = await compressImage(file, {
            maxWidth: 1024,
            maxHeight: 1024,
            quality: 0.8,
          });
          setImagePreviews((prev) => [...prev, compressed]);
          setGeneratedImage(null);
        } catch {
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            setImagePreviews((prev) => [...prev, readerEvent.target?.result as string]);
            setGeneratedImage(null);
          };
          reader.readAsDataURL(file);
        }
      }
    }

    if (otherFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...otherFiles]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const buildPrompt = () => {
    const userPrompt = prompt.trim();
    const activePrompt = styleOptions?.find((s) => s.id === selectedStyleId)?.prompt ?? basePrompt;
    const replacedPrompt = activePrompt.includes("{user_prompt}")
      ? activePrompt.replace("{user_prompt}", userPrompt || "参考上传服装图片")
      : `${activePrompt}${userPrompt ? `\n\n用户补充需求：${userPrompt}` : ""}`;

    if (uploadedFiles.length === 0) {
      return replacedPrompt;
    }

    const fileSummary = uploadedFiles.map((file) => file.name).join("、");
    return `${replacedPrompt}\n\n参考文件：${fileSummary}`;
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const selectedLineOption = lineOptions.find((lineOption) => lineOption.id === selectedLine) || lineOptions[1];
      const finalPrompt = buildPrompt();
      const data = await generateImage({
        prompt: finalPrompt,
        aspectRatio: selectedRatio,
        images: imagePreviews.length > 0 ? imagePreviews : undefined,
        line: selectedLineOption.line,
        resolution: selectedLineOption.resolution,
        hasFrameworkPrompt: true,
      });

      if (!data.success) {
        throw new Error(data.error || "生成失败");
      }

      const resultImage = data.imageUrl || data.imageBase64;
      if (!resultImage) {
        throw new Error("未能获取生成的图片");
      }

      setGeneratedImage(resultImage);

      const workTitle = prompt.trim() ? `${title}：${prompt.trim().slice(0, 24)}` : `${title}作品`;
      void saveGeneratedImageWork({
        title: workTitle,
        type: "drawing",
        tool: title,
        prompt: finalPrompt,
        imageDataUrl: resultImage,
        metadata: {
          selectedStyleId,
          selectedRatio,
          selectedLine,
          referenceImageCount: imagePreviews.length,
          fileCount: uploadedFiles.length,
        },
      }).catch((error) => {
        console.error("自动保存服装作品失败", error);
      });
    } catch (error) {
      alert(`生成失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      await downloadGeneratedImage(generatedImage, `${downloadPrefix}-${Date.now()}.png`);
    } catch {
      window.open(generatedImage, "_blank");
    }
  };

  return (
    <PageLayout className="pt-6 pb-2 md:py-8">
      <div onClick={closeAllMenus}>
        <button
          onClick={() => navigate("/clothing")}
          className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回服装</span>
        </button>

        <div className="hidden md:flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0">
            <img src={iconSrc} alt={title} className="w-14 h-14 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>
        </div>

        <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-4 md:mb-6 shadow-lg">
          {imagePreviews.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">已上传 {imagePreviews.length}/{MAX_IMAGES} 张图片</span>
                {imagePreviews.length > 1 && (
                  <button onClick={clearAllImages} className="text-xs text-muted-foreground hover:text-foreground">
                    清除全部
                  </button>
                )}
              </div>
              <div className="flex items-start gap-2 flex-wrap">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`参考图 ${index + 1}`}
                      className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-lg md:rounded-xl border border-border"
                    />
                    <button
                      onClick={() => clearImage(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center touch-target"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {imagePreviews.length < MAX_IMAGES && (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="h-16 w-16 md:h-20 md:w-20 rounded-lg md:rounded-xl border-2 border-dashed border-border hover:border-muted-foreground flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="text-2xl">+</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mb-4">
              <span className="text-xs text-muted-foreground">已上传文件 {uploadedFiles.length} 个</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/60 text-xs text-foreground">
                    <span className="max-w-[180px] truncate">{file.name}</span>
                    <button onClick={() => removeUploadedFile(index)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shouldShowStyleCards && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">生成模式</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {styleOptions?.map((style) => {
                  const isActive = selectedStyleId === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyleId(style.id)}
                      className={cn(
                        "text-left rounded-xl border p-2.5 md:p-3 transition-all duration-200 active:scale-[0.99]",
                        isActive
                          ? "border-orange-300 bg-orange-50/90 shadow-[0_8px_24px_-12px_rgba(234,88,12,0.45)]"
                          : "border-border bg-card/40 hover:border-orange-200 hover:bg-card/70",
                      )}
                    >
                      <div className="flex items-center justify-between gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                        <div className="flex items-center gap-1 min-w-0">
                          {style.iconSrc ? (
                            <img src={style.iconSrc} alt={style.name} className="w-4 h-4 rounded object-cover" />
                          ) : style.icon ? (
                            <span className="text-xs md:text-sm">{style.icon}</span>
                          ) : null}
                          <span className="text-xs md:text-sm font-medium text-foreground truncate">{style.name}</span>
                        </div>
                        {style.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] leading-none font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded whitespace-nowrap">
                            {style.badge}
                          </span>
                        )}
                      </div>
                      {style.description && <p className="hidden sm:block text-xs text-muted-foreground leading-relaxed">{style.description}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="输入你想要的服装效果..."
            rows={2}
            enterKeyHint="send"
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base leading-relaxed"
          />

          <div className="border-t border-border/50 my-2 md:my-3" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center gap-1 md:gap-1.5 flex-1 min-w-0 flex-wrap overflow-visible" style={{ rowGap: "6px" }}>
              {shouldShowStyleDropdown && (
                <div className="relative flex-shrink-0" onClick={(event) => event.stopPropagation()}>
                  <button
                    onClick={() => {
                      setShowStyleMenu(!showStyleMenu);
                      setShowRatioMenu(false);
                      setShowLineMenu(false);
                    }}
                    className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-[11px] md:text-sm transition-all duration-200 border bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 touch-target whitespace-nowrap"
                  >
                    {selectedStyleOption?.iconSrc ? (
                      <img src={selectedStyleOption.iconSrc} alt={selectedStyleOption.name} className="w-4 h-4 rounded object-cover" />
                    ) : selectedStyleOption?.icon ? (
                      <span className="text-xs md:text-sm">{selectedStyleOption.icon}</span>
                    ) : (
                      <Palette className="w-3.5 h-3.5 text-orange-500" />
                    )}
                    <span>{selectedStyleOption?.name}</span>
                    <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showStyleMenu && "rotate-180")} />
                  </button>
                  {showStyleMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-2 z-10 w-[220px] max-w-[calc(100vw-2rem)] max-h-[60vh] overflow-y-auto dropdown-panel">
                      {styleOptions.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => {
                            setSelectedStyleId(style.id);
                            setShowStyleMenu(false);
                          }}
                          className={cn(
                            "w-full flex items-start gap-2.5 px-3 md:px-4 py-2.5 hover:bg-secondary/50 active:bg-secondary transition-colors text-left touch-target",
                            selectedStyleId === style.id && "bg-orange-50",
                          )}
                        >
                          {style.iconSrc ? (
                            <img src={style.iconSrc} alt={style.name} className="w-6 h-6 rounded object-cover mt-0.5" />
                          ) : style.icon ? (
                            <span className="text-base leading-none mt-0.5">{style.icon}</span>
                          ) : null}
                          <div className="min-w-0">
                            <div className={cn("text-sm font-medium", selectedStyleId === style.id ? "text-orange-700" : "text-foreground")}>
                              {style.name}
                            </div>
                            {style.description && <div className="text-xs text-muted-foreground leading-relaxed">{style.description}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="relative flex-shrink-0" onClick={(event) => event.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowRatioMenu(!showRatioMenu);
                    setShowLineMenu(false);
                    setShowStyleMenu(false);
                  }}
                  className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-full text-[11px] md:text-sm bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all duration-200 border border-transparent touch-target whitespace-nowrap"
                >
                  <Ratio className="w-3.5 h-3.5" />
                  <span>{selectedRatio}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showRatioMenu && "rotate-180")} />
                </button>
                {showRatioMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 w-[100px] max-w-[calc(100vw-2rem)] animate-dropdown max-h-[128px] overflow-y-auto scrollbar-thin dropdown-panel">
                    {ratioOptions.map((ratioOption) => (
                      <button
                        key={ratioOption.id}
                        onClick={() => {
                          setSelectedRatio(ratioOption.id);
                          setShowRatioMenu(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target",
                          selectedRatio === ratioOption.id && "bg-orange-50 text-orange-700",
                        )}
                      >
                        {ratioOption.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative flex-shrink-0" onClick={(event) => event.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowLineMenu(!showLineMenu);
                    setShowRatioMenu(false);
                    setShowStyleMenu(false);
                  }}
                  className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-full text-[11px] md:text-sm bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all duration-200 border border-transparent touch-target whitespace-nowrap"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{lineOptions.find((lineOption) => lineOption.id === selectedLine)?.name}</span>
                  {lineOptions.find((lineOption) => lineOption.id === selectedLine)?.badge && (
                    <span className="px-1 py-0.5 text-[9px] md:text-[10px] leading-none font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded">
                      {lineOptions.find((lineOption) => lineOption.id === selectedLine)?.badge}
                    </span>
                  )}
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showLineMenu && "rotate-180")} />
                </button>
                {showLineMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 w-[130px] max-w-[calc(100vw-2rem)] animate-dropdown max-h-[180px] overflow-y-auto scrollbar-thin dropdown-panel">
                    {lineOptions.map((lineOption) => (
                      <button
                        key={lineOption.id}
                        onClick={() => {
                          setSelectedLine(lineOption.id);
                          setShowLineMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-1.5 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target",
                          selectedLine === lineOption.id && "bg-orange-50 text-orange-700",
                        )}
                      >
                        <span>{lineOption.name}</span>
                        {lineOption.badge && (
                          <span className="px-1 py-0.5 text-[9px] leading-none font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded">
                            {lineOption.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-4 bg-border mx-0.5" />

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageInputChange}
                className="hidden"
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 touch-target flex-shrink-0"
                title="上传参考图"
              >
                <Image className="w-3.5 h-3.5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.doc,.docx,.pdf,.png,.jpg,.jpeg,.csv,.xlsx"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 touch-target flex-shrink-0"
                title="上传文件"
              >
                <FolderUp className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={cn(
                  "w-full md:w-10 h-10 rounded-xl flex items-center justify-center gap-1 transition-all duration-200 touch-target flex-shrink-0",
                  canGenerate
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)]"
                    : "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed",
                )}
                aria-label="开始生成"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    <span className="text-sm md:hidden">生成中</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:hidden">开始生成</span>
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
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
                生成结果
              </h2>
              {generatedImage && !isGenerating && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleGenerate} className="touch-target">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">重新生成</span>
                  </Button>
                  <Button variant="outline" size="sm" className="touch-target" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">下载</span>
                  </Button>
                  <Button variant="outline" size="sm" className="touch-target" onClick={() => setGeneratedImage(null)} title="关闭">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {isGenerating ? (
              <GeneratingLoader message="正在生成中..." />
            ) : generatedImage ? (
              <div className="rounded-lg md:rounded-xl overflow-hidden bg-secondary/30 p-2 md:p-4">
                <img src={generatedImage} alt={resultAlt} className="max-h-[300px] md:max-h-[400px] w-full mx-auto rounded-lg object-contain" />
              </div>
            ) : null}
          </div>
        )}

        {!isGenerating && !generatedImage && (
          <div className="text-center py-8 md:py-16">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Sparkles className="w-7 h-7 md:w-10 md:h-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-xs md:text-base">上传服装图片或文件，输入需求开始创作</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
