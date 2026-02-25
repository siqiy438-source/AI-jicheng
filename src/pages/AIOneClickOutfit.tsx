import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import { Button } from "@/components/ui/button";
import { CreditCostHint } from "@/components/CreditCostHint";
import { cn } from "@/lib/utils";
import { compressImage, mergeImagesToGrid, downloadGeneratedImage } from "@/lib/image-utils";
import { generateImage } from "@/lib/ai-image";
import { saveGeneratedImageWork } from "@/lib/repositories/works";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { InsufficientBalanceDialog } from "@/components/InsufficientBalanceDialog";
import {
  ArrowLeft,
  Download,
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

type OutfitSlot = "inner" | "top" | "pants";

interface OutfitImageState {
  inner: string | null;
  top: string | null;
  pants: string | null;
}

const lineOptions = [
  { id: "standard", name: "灵犀标准", line: "standard" as const, resolution: "default" as const },
  { id: "standard_2k", name: "灵犀 2K", line: "standard" as const, resolution: "2k" as const },
  { id: "standard_4k", name: "灵犀 4K", line: "standard" as const, resolution: "4k" as const },
];

const uploadSlots: { key: OutfitSlot; title: string; desc: string }[] = [
  { key: "inner", title: "内搭", desc: "如 T 恤、衬衣、针织打底" },
  { key: "top", title: "上衣", desc: "如外套、西装、夹克" },
  { key: "pants", title: "裤子", desc: "如牛仔裤、西裤、半裙" },
];

const AIOneClickOutfit = () => {
  const navigate = useNavigate();
  const { checkCredits, showInsufficientDialog, requiredAmount, featureName, currentBalance, goToRecharge, dismissDialog, refreshBalance } = useCreditCheck();
  const innerInputRef = useRef<HTMLInputElement>(null);
  const topInputRef = useRef<HTMLInputElement>(null);
  const pantsInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<OutfitImageState>({
    inner: null,
    top: null,
    pants: null,
  });
  const [selectedLine, setSelectedLine] = useState("standard");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const getInputRef = (slot: OutfitSlot) => {
    if (slot === "inner") return innerInputRef;
    if (slot === "top") return topInputRef;
    return pantsInputRef;
  };

  const handleUpload = async (slot: OutfitSlot, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;

    try {
      const compressed = await compressImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.85,
      });
      setImages((prev) => ({ ...prev, [slot]: compressed }));
      setGeneratedImage(null);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((prev) => ({ ...prev, [slot]: e.target?.result as string }));
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    } finally {
      const ref = getInputRef(slot);
      if (ref.current) ref.current.value = "";
    }
  };

  const clearImage = (slot: OutfitSlot) => {
    setImages((prev) => ({ ...prev, [slot]: null }));
    setGeneratedImage(null);
  };

  const handleGenerate = async () => {
    if (!images.inner || !images.top || !images.pants) return;
    const selectedLineOption = lineOptions.find((option) => option.id === selectedLine) || lineOptions[0];
    const featureCode = selectedLineOption.line === 'premium' ? 'ai_outfit_premium' : 'ai_outfit_standard';
    if (!checkCredits(featureCode)) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      setGenerationStep("正在整理服装信息...");
      const outfitReference = await mergeImagesToGrid([images.inner, images.top, images.pants], 380, 1);
      const referenceImages = [outfitReference];

      const prompt = `[Core Setup: Minimal Hanging Rod]
A real photograph of garments displayed on a slim, simple horizontal metal rod that spans across the frame. The rod is thin and understated — plain silver or light chrome, not thick or heavy. The garments hang on natural wooden hangers, giving a warm, authentic boutique feel.

[Instruction: Input Garment & Realism Patch]
Using the items from the input image, display them with natural gravity and relaxed drape. Show realistic fabric weight, gentle natural wrinkles, and true-to-life textile textures. The clothes should look like they were casually hung up in a real store, not perfectly arranged for a catalog.

[CRITICAL: Garment Fidelity]
Each garment MUST be an exact reproduction of the input reference image. Strictly preserve:
- The exact color, pattern, and print of each garment (do not alter hue, saturation, or pattern layout)
- The exact silhouette, cut, and style (neckline, sleeve length, hem shape, collar type)
- All design details: buttons, zippers, pockets, stitching, embroidery, logos, labels
- The exact fabric texture and material appearance (knit, woven, denim, silk, linen, etc.)
Do NOT reinterpret, simplify, or creatively modify any garment. The output garments must look identical to the input photos.

[Instruction: Styling & Accessories]
This is a women's fashion display. Add small feminine accessories to complete the scene: a delicate women's handbag or crossbody bag hanging on the rod, and a pair of women's shoes (heels, ballet flats, Mary Janes, or ankle boots) placed casually on a small metal stool or directly on the floor beneath the rack. You may also add one or two tiny decorative touches like a small postcard or photo clipped to the rod, or a green plant branch at the edge of the frame.
Keep the scene minimal and curated: at most one bag, one pair of women's footwear, and one small decorative item. Do not add extra props beyond these.

[Photography & Lighting]
Shot from a near-frontal angle with a very slight offset. Soft, even, natural diffused daylight — as if coming from a large window nearby. The lighting is flat and gentle with minimal shadows. No dramatic side lighting, no strong directional light, no visible light source. Shadows are extremely subtle and soft.

[Environment & Vibe]
Set in a cozy, minimalist clothing boutique. The background is a clean, plain off-white or light gray wall. The overall mood is warm, natural, and inviting — like a real indie fashion store, not a luxury showroom. The image should look like a casual iPhone photo taken in a well-lit shop.

[Hard Constraints: Separation Is Mandatory]
- You receive exactly 3 uploaded garments (#1, #2, #3).
- Display all 3 garments in one scene on the same slim rod, each on its own wooden hanger with clear spacing.
- One garment per hanger only. Never combine two garments on one hanger.
- Do not style them as one worn outfit set; present them as three separate hanging pieces.
- Keep full length visible for each garment (no heavy crop).
- Generate exactly one final image only.

${additionalNotes ? `[Additional Notes]\n${additionalNotes}` : ""}`;

      const negativePrompt = `[Crucial Removal]
studio equipment, light stands, softboxes, lighting gear, umbrella reflector, cables, behind the scenes elements, visible edge of softbox in frame, messy environment, cluttered background.

[Lighting Control]
harsh shadows, dramatic side lighting, cinematic lighting, strong directional light, deep shadows, high contrast lighting, studio flash, HDR effect, specular highlights on metal, glossy reflections.

[Quality Control]
cropped garments, partial view, flat lay, low quality, blurry, distorted fabric, CGI artifacts, CGI rendering, plastic texture, overly sharp, over-processed, merged garments, layered on same hanger, one complete worn outfit look, two garments fused together, too many props, overly busy composition.`;

      setGenerationStep("AI 正在生成挂搭图...");
      const response = await generateImage({
        prompt,
        negativePrompt,
        aspectRatio: "3:4",
        images: referenceImages,
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
        : "AI 一键挂搭图";
      void saveGeneratedImageWork({
        title,
        type: "drawing",
        tool: "AI 一键挂搭图",
        prompt: `${prompt}\n\n${additionalNotes}`,
        imageDataUrl: result,
        metadata: {
          line: selectedLine,
          hasAdditionalNotes: Boolean(additionalNotes.trim()),
        },
      }).catch((error) => {
        console.error("自动保存挂搭图失败", error);
      });
    } catch (error) {
      console.error("一键挂搭图生成失败:", error);
      alert(`生成失败：${error instanceof Error ? error.message : "未知错误"}`);
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

  const canGenerate = Boolean(images.inner && images.top && images.pants && !isGenerating);

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
          <p className="text-muted-foreground text-sm">上传内搭、上衣、裤子，自动补全包包和配饰</p>
        </div>
      </div>

      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-3 md:mb-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <ShirtIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">第一步：上传三件服装</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {uploadSlots.map((slot) => {
            const image = images[slot.key];
            return (
              <div key={slot.key} className="rounded-xl border border-border bg-card/60 p-3">
                <div className="mb-2">
                  <div className="text-sm font-medium text-foreground">{slot.title}</div>
                  <div className="text-xs text-muted-foreground">{slot.desc}</div>
                </div>

                {image ? (
                  <div className="relative group">
                    <img src={image} alt={slot.title} loading="lazy" decoding="async" className="w-full h-44 object-cover rounded-lg border border-border" />
                    <button
                      onClick={() => clearImage(slot.key)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => getInputRef(slot.key).current?.click()}
                    className="w-full h-44 rounded-lg border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-xs">点击上传{slot.title}</span>
                  </button>
                )}

                <input
                  ref={getInputRef(slot.key)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleUpload(slot.key, event.target.files)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-4 md:mb-6 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">第二步：选择清晰度并生成</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {lineOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedLine(option.id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition-all",
                selectedLine === option.id
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/25"
              )}
            >
              {option.name}
            </button>
          ))}
        </div>

        <div className="mb-3 rounded-lg border border-primary/20 bg-primary/10 p-2.5 text-xs text-primary flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          <span>系统自动匹配 1 个包包</span>
          <Star className="w-3.5 h-3.5 ml-2" />
          <span>系统自动匹配 1 个配饰</span>
        </div>

        <textarea
          value={additionalNotes}
          onChange={(event) => setAdditionalNotes(event.target.value)}
          placeholder="补充说明（可选）：如“更偏轻熟通勤”“配色要低饱和”"
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
                : "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isGenerating ? "生成中..." : "生成挂搭图"}</span>
          </button>
          <CreditCostHint
            featureCode={lineOptions.find(o => o.id === selectedLine)?.line === 'premium' ? 'ai_outfit_premium' : 'ai_outfit_standard'}
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
