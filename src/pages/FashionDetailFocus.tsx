import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateImage } from "@/lib/ai-image";
import { compressImage, downloadGeneratedImage } from "@/lib/image-utils";
import { saveGeneratedImageWork } from "@/lib/repositories/works";
import { cn } from "@/lib/utils";

interface DetailSlot {
  id: string;
  title: string;
  instruction: string;
}

interface GeneratedFrame {
  kind: "main" | "detail";
  title: string;
  image: string;
  prompt: string;
}

const DETAIL_SLOTS: DetailSlot[] = [
  {
    id: "structure",
    title: "细节 1 · 结构特写",
    instruction:
      "自动识别单品类型：若是外套/上衣，重点特写领口与袖口；若是裤装，重点特写腰头与裤脚。必须是近景。",
  },
  {
    id: "hardware",
    title: "细节 2 · 五金特写",
    instruction:
      "聚焦纽扣、拉链、铆钉等五金件的近景，强调材质反光、边缘细节和工艺精度，不展示整件。",
  },
  {
    id: "craft",
    title: "细节 3 · 工艺纹理特写",
    instruction:
      "聚焦特殊工艺花纹、刺绣、提花、压纹或典型走线纹理；如果没有花纹，展示最有代表性的面料纹理。",
  },
];

const DEFAULT_RATIO = "3:4";
const DEFAULT_LINE = "standard" as const;
const DEFAULT_RESOLUTION = "default" as const;

const buildMainPrompt = () => {
  return `你是高端时尚电商摄影总监。请基于参考图，生成一张“高级感完整主图”。这是第 1 张图。

硬性要求：
1. 只允许同一件单品，版型、颜色、纹理、花纹必须与参考图一致，不得新增或替换服装。
2. 自动识别这是外套/上衣还是裤装，并完整展示单品主体结构。
3. 画面必须高级、干净、商业成片感强，适合品牌商品页封面。
4. 光线自然高级，面料质感清晰，禁止塑料感、过度滤镜、过曝。
5. 禁止文字、水印、logo、拼图、杂物、人物面部。`;
};

const buildDetailPrompt = (slot: DetailSlot, index: number) => {
  return `你是高端时尚摄影师。现在要生成第 ${index} 张细节特写图（近景）。

细节任务：${slot.instruction}

硬性要求：
1. 仍然是同一件单品，不能变款、变色、变面料，也不能新增其他服装。
2. 必须是近景特写，细节主体占画面 60% 以上。
3. 光线和调性与主图保持一致，整体高级感统一。
4. 呈现真实纤维、缝线、五金、纹理细节，避免糊和假。
5. 禁止文字、水印、logo、拼图和夸张滤镜。`;
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
  const inputRef = useRef<HTMLInputElement>(null);

  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [mainFrame, setMainFrame] = useState<GeneratedFrame | null>(null);
  const [detailFrames, setDetailFrames] = useState<GeneratedFrame[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingText, setGeneratingText] = useState("正在生成...");

  const allFrames = [mainFrame, ...detailFrames].filter((item): item is GeneratedFrame => Boolean(item));
  const activeFrame = allFrames[activeIndex] || null;
  const nextSlot = DETAIL_SLOTS[detailFrames.length];
  const canGenerateMain = Boolean(sourceImage && !mainFrame && !isGenerating);
  const canGenerateNext = Boolean(sourceImage && mainFrame && nextSlot && !isGenerating);

  const resetFlow = () => {
    setMainFrame(null);
    setDetailFrames([]);
    setActiveIndex(0);
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

  const handleGenerateMain = async () => {
    if (!sourceImage || !canGenerateMain) return;

    setIsGenerating(true);
    setGeneratingText("正在生成高级主图...");

    try {
      const prompt = buildMainPrompt();
      const data = await generateImage({
        prompt,
        images: [sourceImage],
        aspectRatio: DEFAULT_RATIO,
        line: DEFAULT_LINE,
        resolution: DEFAULT_RESOLUTION,
        hasFrameworkPrompt: true,
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

      void saveGeneratedImageWork({
        title: "细节特写：高级主图",
        type: "drawing",
        tool: "AI 细节特写",
        prompt,
        imageDataUrl: image,
        metadata: {
          stage: "main",
          ratio: DEFAULT_RATIO,
          line: DEFAULT_LINE,
        },
      }).catch((error) => {
        console.error("保存主图失败", error);
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateNext = async () => {
    if (!sourceImage || !mainFrame || !nextSlot || !canGenerateNext) return;

    setIsGenerating(true);
    setGeneratingText(`正在生成${nextSlot.title}...`);

    try {
      const index = detailFrames.length + 1;
      const prompt = buildDetailPrompt(nextSlot, index);
      const data = await generateImage({
        prompt,
        images: [sourceImage, mainFrame.image],
        aspectRatio: DEFAULT_RATIO,
        line: DEFAULT_LINE,
        resolution: DEFAULT_RESOLUTION,
        hasFrameworkPrompt: true,
      });

      if (!data.success) throw new Error(data.error || "细节图生成失败");
      const image = data.imageUrl || data.imageBase64;
      if (!image) throw new Error("未返回有效图片");

      const frame: GeneratedFrame = {
        kind: "detail",
        title: nextSlot.title,
        image,
        prompt,
      };
      setDetailFrames((prev) => [...prev, frame]);
      setActiveIndex(index);

      void saveGeneratedImageWork({
        title: `细节特写：${nextSlot.title}`,
        type: "drawing",
        tool: "AI 细节特写",
        prompt,
        imageDataUrl: image,
        metadata: {
          stage: "detail",
          detailIndex: index,
          slotId: nextSlot.id,
          ratio: DEFAULT_RATIO,
          line: DEFAULT_LINE,
        },
      }).catch((error) => {
        console.error("保存细节图失败", error);
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    } finally {
      setIsGenerating(false);
    }
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
      <button
        onClick={() => navigate("/clothing")}
        className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回服装</span>
      </button>

      <div className="hidden md:flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0">
          <img src="/icons/fashion-outfit-custom.webp" alt="AI 细节特写" className="w-14 h-14 object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI 细节特写</h1>
          <p className="text-muted-foreground text-sm">上传单品后，先出主图，再点击继续逐张生成细节</p>
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
            <p className="text-xs text-muted-foreground">只要上传后点击生成即可</p>
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
                <p className="text-xs text-muted-foreground">系统会自动识别品类，并按“主图到细节图”的流程生成</p>
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

        <div className="flex flex-wrap gap-2 items-center">
          <Button onClick={handleGenerateMain} disabled={!canGenerateMain} className="rounded-full">
            {isGenerating && !mainFrame ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
            生成主图
          </Button>

          <Button onClick={handleGenerateNext} disabled={!canGenerateNext} variant="secondary" className="rounded-full">
            {isGenerating && mainFrame ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Zap className="w-4 h-4 mr-1.5" />}
            {nextSlot ? "继续生成细节图" : "已完成"}
          </Button>

          <Button onClick={handleDownloadCurrent} disabled={!activeFrame} variant="outline" className="rounded-full">
            <Download className="w-4 h-4 mr-1.5" />
            下载当前图
          </Button>

          <Button onClick={() => inputRef.current?.click()} disabled={isGenerating} variant="outline" className="rounded-full">
            更换图片
          </Button>
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          当前进度：{allFrames.length}/4（1 张主图 + 3 张细节图）
        </div>

        {isGenerating ? (
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
                <p className="text-xs text-orange-700/75 mt-1">AI 正在精修构图与质感，请耐心等待几秒</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-orange-200/60 overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {allFrames.length > 0 ? (
        <section className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 shadow-lg">
          <div className="flex flex-wrap gap-2 mb-3">
            {allFrames.map((frame, index) => (
              <button
                key={`${frame.kind}-${index}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs border transition-colors",
                  index === activeIndex
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-card/40 border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {index === 0 ? "主图" : `细节 ${index}`}
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
    </PageLayout>
  );
};

export default FashionDetailFocus;
