import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Grid2x2, ImagePlus, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { processImage, renderPixelGrid, downloadCanvas, type PixelArtResult, type ColorUsage } from "@/lib/pixel-art";
import { rgbToHex } from "@/lib/mard-palette";
import { generateImage } from "@/lib/ai-image";
import { compressImage } from "@/lib/image-utils";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { InsufficientBalanceDialog } from "@/components/InsufficientBalanceDialog";

const GRID_OPTIONS = [
  { label: "20×20", value: 20, desc: "颗粒粗" },
  { label: "30×30", value: 30, desc: "中等" },
  { label: "50×50", value: 50, desc: "细腻" },
] as const;

type GridSize = 20 | 30 | 50;

type Step = "idle" | "ai-generating" | "mapping" | "done";

const PixelArt = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkCredits, showInsufficientDialog, refreshBalance } = useCreditCheck();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<GridSize>(50);
  const [step, setStep] = useState<Step>("idle");
  const [result, setResult] = useState<PixelArtResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef<string>(crypto.randomUUID());
  const isRequestingRef = useRef(false);

  const isProcessing = step === "ai-generating" || step === "mapping";

  const loadImageElement = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = src;
    });

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "请选择图片文件", variant: "destructive" });
      return;
    }
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setStep("idle");
    requestIdRef.current = crypto.randomUUID();
  }, [imagePreviewUrl, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleGenerate = useCallback(async () => {
    if (!imageFile) {
      toast({ title: "请先上传图片", variant: "destructive" });
      return;
    }
    if (isRequestingRef.current) return;
    if (!checkCredits("ai_pixel_art")) return;

    isRequestingRef.current = true;
    setResult(null);
    setStep("ai-generating");

    try {
      const compressed = await compressImage(imageFile, { maxSize: 1024, quality: 0.85 });

      const aiResult = await generateImage({
        images: [compressed],
        aspectRatio: "1:1",
        line: "standard",
        resolution: "default",
        featureCode: "ai_pixel_art",
        requestId: requestIdRef.current,
      });

      if (!aiResult.success) {
        throw new Error(aiResult.error || "AI 生成失败");
      }

      setStep("mapping");
      const aiImageSrc = aiResult.imageUrl || aiResult.imageBase64;
      if (!aiImageSrc) throw new Error("AI 未返回图片");

      const aiImgEl = await loadImageElement(aiImageSrc);
      await new Promise(resolve => setTimeout(resolve, 10));

      const pixelResult = processImage(aiImgEl, gridSize);
      setResult(pixelResult);

      await new Promise(resolve => setTimeout(resolve, 50));
      if (canvasRef.current) {
        renderPixelGrid(canvasRef.current, pixelResult, gridSize);
      }

      refreshBalance();
      setStep("done");
    } catch (err) {
      setStep("idle");
      toast({
        title: "生成失败",
        description: err instanceof Error ? err.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      isRequestingRef.current = false;
    }
  }, [imageFile, gridSize, checkCredits, refreshBalance, toast]);

  useEffect(() => {
    if (result && canvasRef.current) {
      renderPixelGrid(canvasRef.current, result, gridSize);
    }
  }, [result, gridSize]);

  const handleDownload = () => {
    if (!canvasRef.current || !result) return;
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    downloadCanvas(canvasRef.current, `mard-pixel-${gridSize}x${gridSize}-${ts}.png`);
  };

  const stepLabel: Record<Step, string> = {
    idle: "",
    "ai-generating": "AI 艺术化中…",
    mapping: "MARD 色号映射中…",
    done: "",
  };

  return (
    <PageLayout maxWidth="6xl" className="py-4 md:py-6">
      {/* 顶部 */}
      <div className="flex items-center gap-3 mb-4 md:mb-6 opacity-0 animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Grid2x2 className="w-5 h-5 text-primary" />
          <h1 className="text-lg md:text-xl font-bold text-foreground">像素块生成</h1>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          拼豆 / 十字绣
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 md:gap-6">
        {/* 左侧 */}
        <div className="space-y-4">
          {/* 上传区 */}
          <div
            className={cn(
              "glass-card rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50",
              imagePreviewUrl ? "p-3" : "p-8 md:p-12"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {imagePreviewUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={imagePreviewUrl}
                  alt="预览"
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{imageFile?.name}</p>
                  <p className="text-xs text-muted-foreground">点击更换图片</p>
                </div>
                <RefreshCw className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ImagePlus className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">
                    <span className="md:hidden">点击上传图片</span>
                    <span className="hidden md:inline">点击上传或拖拽图片</span>
                  </p>
                  <p className="text-sm text-muted-foreground">支持 JPG、PNG、WEBP 等格式</p>
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />

          {/* 格数 + 生成按钮 */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">像素格数</p>
              <p className="text-xs text-muted-foreground">切换格数无需重新生成</p>
            </div>
            <div className="flex gap-2">
              {GRID_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setGridSize(opt.value as GridSize)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                    gridSize === opt.value
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  <span className="block">{opt.label}</span>
                  <span className="block text-[10px] opacity-70 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!imageFile || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {stepLabel[step]}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 生成像素图
                  <span className="ml-2 text-xs opacity-70">50 积分</span>
                </>
              )}
            </Button>

            {isProcessing && (
              <div className="text-xs text-muted-foreground text-center">
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    step === "ai-generating" ? "bg-primary animate-pulse" : "bg-muted"
                  )} />
                  <span className={step === "ai-generating" ? "text-foreground" : ""}>① AI 像素艺术化</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    step === "mapping" ? "bg-primary animate-pulse" : "bg-muted"
                  )} />
                  <span className={step === "mapping" ? "text-foreground" : ""}>② MARD 色号映射</span>
                </div>
              </div>
            )}
          </div>

          {/* 结果 canvas */}
          {result && (
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">结果预览</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result.gridWidth}×{result.gridHeight} 格 · {result.usedColors.length} 种色号
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={handleDownload} className="flex-shrink-0">
                  <Download className="w-4 h-4 mr-1.5" />
                  下载
                </Button>
              </div>
              <div
                className="overflow-auto rounded-lg border border-border bg-muted/30"
                style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
              >
                <canvas
                  ref={canvasRef}
                  className="block max-w-full"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                切换格数可立即重新渲染 · 下载高清 PNG 可打印为拼豆/十字绣底稿
              </p>
            </div>
          )}
        </div>

        {/* 右侧色号图例 */}
        <div className={cn(
          "glass-card rounded-xl p-4 h-fit lg:sticky lg:top-4",
          !result && "opacity-40 pointer-events-none"
        )}>
          <p className="text-sm font-semibold text-foreground mb-3">
            MARD 色号图例
            {result && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                共 {result.usedColors.length} 种
              </span>
            )}
          </p>

          {!result ? (
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-x-3 gap-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 animate-pulse">
                  <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-sm bg-muted flex-shrink-0" />
                  <div className="h-3 bg-muted rounded w-8" />
                  <div className="h-2 bg-muted rounded flex-1 hidden lg:block" />
                  <div className="h-3 bg-muted rounded w-6 lg:w-8" />
                </div>
              ))}
              <p className="col-span-2 lg:col-span-1 text-xs text-muted-foreground text-center mt-2">生成后显示</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-x-3 gap-y-0.5 lg:gap-y-1 max-h-[45vh] lg:max-h-[70vh] overflow-y-auto pr-1">
              {result.usedColors.map(({ color, count }: ColorUsage) => (
                <div key={color.code} className="flex items-center gap-1.5 py-0.5 lg:gap-2">
                  <div
                    className="w-4 h-4 lg:w-5 lg:h-5 rounded-sm border border-border/50 flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: rgbToHex(color.rgb) }}
                  />
                  <span className="text-xs font-mono font-semibold text-foreground w-7 flex-shrink-0 lg:w-8">
                    {color.code}
                  </span>
                  {/* 进度条：仅桌面端显示 */}
                  <div className="hidden lg:block flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-primary/50 rounded-full"
                      style={{
                        width: `${Math.round((count / result.usedColors[0].count) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 lg:w-10 lg:text-right ml-auto lg:ml-0">
                    {count}格
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <InsufficientBalanceDialog
        open={showInsufficientDialog}
        onOpenChange={() => {}}
      />
    </PageLayout>
  );
};

export default PixelArt;
