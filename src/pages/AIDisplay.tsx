import { useState, useRef } from "react";
import { PageLayout } from "@/components/PageLayout";
import {
  ArrowLeft,
  X,
  Sparkles,
  Download,
  RefreshCw,
  Loader2,
  Send,
  ChevronDown,
  Zap,
  ShirtIcon,
  Camera,
  Grip,
  Store,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateImage } from "@/lib/ai-image";
import { compressImage, mergeImagesToGrid } from "@/lib/image-utils";

// 陈列风格选项
const displayStyles = [
  {
    id: "auto",
    name: "智能推荐",
    icon: "✨",
    description: "AI 根据衣服风格自动搭配",
    prompt: "Analyze the clothing colors and styles, then choose the BEST color ombré gradient arrangement. Create a cohesive, curated boutique look.",
  },
  {
    id: "minimal-commute",
    name: "简约通勤",
    icon: "💼",
    description: "干练利落，职场精英感",
    prompt: "Minimalist professional palette: arrange in a clean gradient from white → cream → camel → gray → charcoal → black. Structured silhouettes grouped together. TheRow / COS boutique aesthetic. Ultra-clean, architectural feel.",
  },
  {
    id: "sweet-girl",
    name: "甜美少女",
    icon: "🎀",
    description: "粉嫩柔美，少女心满满",
    prompt: "Dreamy pastel gradient: white → baby pink → blush → lavender → lilac → soft mint. Lightweight fabrics flow beautifully. Add dried flower or ribbon accents between pieces. Soft, romantic, Instagram-worthy display.",
  },
  {
    id: "light-luxury",
    name: "轻奢高级",
    icon: "👑",
    description: "参考 Chanel/Dior 陈列美学",
    prompt: "Chanel/Dior luxury standard: monochromatic color story with ONE accent color. Maximum 6-8 pieces on display with extremely generous spacing. Each piece is a statement. Gold or brass rack details. Museum-like curation where every piece feels precious.",
  },
  {
    id: "street-trendy",
    name: "街头潮流",
    icon: "🔥",
    description: "个性混搭，潮酷态度",
    prompt: "Bold street style: intentional color contrast pairings (black+neon, denim+red). Oversized pieces next to fitted ones. Layered styling on some hangers. Raw, edgy energy but still organized. Supreme/Off-White store vibe.",
  },
  {
    id: "french-elegant",
    name: "法式优雅",
    icon: "🥐",
    description: "慵懒随性，高级不费力",
    prompt: "Parisian effortless chic: muted earth tone gradient (ivory → sand → taupe → olive → chocolate). Capsule wardrobe groupings of 2-3 pieces. Linen and silk textures. Sézane/Rouje boutique atmosphere. Relaxed but perfectly curated.",
  },
];

// 线路选项（复用 AI 绘图的线路）
const lineOptions = [
  { id: "premium", name: "灵犀 Pro", line: "premium" as const, resolution: "2k" as const, badge: "优质" },
  { id: "standard", name: "灵犀标准", line: "standard" as const, resolution: "default" as const },
  { id: "standard_2k", name: "灵犀 2K", line: "standard" as const, resolution: "2k" as const },
];

const MAX_CLOTHING_IMAGES = 30;

const AIDisplay = () => {
  const navigate = useNavigate();
  const clothingInputRef = useRef<HTMLInputElement>(null);
  const rackInputRef = useRef<HTMLInputElement>(null);

  // 状态管理
  const [clothingImages, setClothingImages] = useState<string[]>([]);
  const [rackImage, setRackImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("auto");
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [selectedLine, setSelectedLine] = useState("standard");
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // 处理衣服图片上传（批量，自动压缩）
  const handleClothingUpload = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_CLOTHING_IMAGES - clothingImages.length;
    const filesToProcess = Array.from(files).slice(0, remaining);

    for (const file of filesToProcess) {
      if (file.type.startsWith("image/")) {
        try {
          const compressed = await compressImage(file, {
            maxWidth: 512,
            maxHeight: 512,
            quality: 0.8,
          });
          setClothingImages(prev => [...prev, compressed]);
        } catch {
          const reader = new FileReader();
          reader.onload = (e) => {
            setClothingImages(prev => [...prev, e.target?.result as string]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // 处理货架图片上传
  const handleRackUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith("image/")) {
      try {
        const compressed = await compressImage(file, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.85,
        });
        setRackImage(compressed);
      } catch {
        const reader = new FileReader();
        reader.onload = (e) => setRackImage(e.target?.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const clearClothingImage = (index: number) => {
    setClothingImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllClothing = () => {
    setClothingImages([]);
    if (clothingInputRef.current) clothingInputRef.current.value = "";
  };

  // 核心：生成陈列效果图
  const handleGenerate = async () => {
    if (clothingImages.length === 0 || !rackImage) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // Step 1: 合并衣服图片为网格拼图
      setGenerationStep("正在整理衣服清单...");
      const gridImage = await mergeImagesToGrid(clothingImages, 256, 5);

      // Step 2: 构建陈列专用 Prompt
      setGenerationStep("正在设计陈列方案...");
      const style = displayStyles.find(s => s.id === selectedStyle) || displayStyles[0];

      const displayPrompt = `Create a stunning, magazine-editorial quality photograph of a luxury women's clothing boutique display.

REFERENCE IMAGES:
- Image 1: A numbered grid of ${clothingImages.length} clothing items (the inventory to display)
- Image 2: The actual store rack/display space to use

DISPLAY STYLE: ${style.name} - ${style.prompt}

CRITICAL AESTHETIC REQUIREMENTS (THIS IS NOT A SIMPLE RACK - IT MUST LOOK LIKE A LUXURY BOUTIQUE):

1. COLOR OMBRÉ ARRANGEMENT (MOST IMPORTANT): Arrange clothes in a beautiful color gradient flow - for example, cream → blush pink → dusty rose → burgundy → deep red, or ivory → sage → forest green. The color transition must be smooth and intentional, like a sunset gradient. NEVER place clashing colors next to each other.

2. LUXURY SPACING: Each piece must have generous breathing room between hangers (8-10cm gaps minimum). This is a HIGH-END boutique, NOT a crowded fast-fashion store. Less is more - if there are too many pieces, only display the best ones and leave others folded below.

3. VISUAL STORYTELLING: Group 2-3 pieces that form a complete outfit look together. Create mini "capsule stories" along the rack - a blazer next to its matching blouse, a coat next to a complementary dress.

4. HEIGHT RHYTHM: Create a pleasing wave pattern - alternate between longer pieces (coats, dresses) and shorter pieces (tops, jackets). The silhouette of the hanging clothes should create an elegant undulating line.

5. PREMIUM DETAILS: All clothes on matching high-quality wooden or velvet hangers. Fabric drapes naturally with beautiful folds. Sleeves and collars are perfectly arranged, not crumpled.

6. BOUTIQUE ATMOSPHERE: Warm, golden-hour directional lighting from above-left. Soft shadows. The overall mood should feel like walking into a Chanel or MaxMara boutique - serene, curated, aspirational.

7. FOCAL HERO PIECE: The most striking or colorful piece should be positioned at the center of the rack, slightly pulled forward, as the visual anchor of the entire display.

${additionalNotes ? `STORE OWNER'S NOTES: ${additionalNotes}` : ""}

OUTPUT: A photorealistic, high-resolution image that looks like it belongs in Vogue or Elle magazine's boutique feature. The clothes must maintain their EXACT original colors and patterns from the grid. NO text, NO watermarks, NO people. Aspect ratio 4:3.`;

      // Step 3: 调用 AI 生成
      setGenerationStep("AI 正在生成陈列效果图...");
      const selectedLineOption = lineOptions.find(l => l.id === selectedLine) || lineOptions[1];

      const data = await generateImage({
        prompt: displayPrompt,
        aspectRatio: "4:3",
        images: [gridImage, rackImage],
        line: selectedLineOption.line,
        resolution: selectedLineOption.resolution,
        hasFrameworkPrompt: true,
      });

      if (!data.success) {
        throw new Error(data.error || "生成失败");
      }

      const resultImage = data.imageUrl || data.imageBase64;
      if (resultImage) {
        setGeneratedImage(resultImage);
      } else {
        throw new Error("未能获取生成的图片");
      }
    } catch (error) {
      console.error("陈列生成失败:", error);
      alert(`生成失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  // 下载生成的图片
  const handleDownload = async () => {
    if (!generatedImage) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    try {
      const filename = `ai-display-${Date.now()}.png`;
      const response = await fetch(generatedImage);
      const blob = await response.blob();

      if (isMobile) {
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], filename, { type: "image/png" });
          const shareData = { files: [file] };
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        }
        const url = URL.createObjectURL(blob);
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>保存图片</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#000}img{max-width:100%;max-height:80vh;object-fit:contain}p{color:#fff;text-align:center;padding:20px;font-family:system-ui,sans-serif}</style></head><body><p>长按图片保存到相册</p><img src="${url}" alt="AI陈列效果图" /></body></html>`);
          newWindow.document.close();
        }
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(generatedImage, "_blank");
    }
  };

  const closeAllMenus = () => {
    setShowStyleMenu(false);
    setShowLineMenu(false);
  };

  const canGenerate = clothingImages.length > 0 && rackImage && !isGenerating;

  return (
    <PageLayout className="py-2 md:py-8">
      <div onClick={closeAllMenus}>
        {/* 返回按钮 - 仅桌面端 */}
        <button
          onClick={() => navigate("/")}
          className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回首页</span>
        </button>

        {/* 页面标题 */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-50 flex items-center justify-center flex-shrink-0">
            <Store className="w-7 h-7 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI 智能陈列</h1>
            <p className="text-muted-foreground text-sm">上传衣服和货架照片，AI 帮你设计专业陈列方案</p>
          </div>
        </div>

        {/* ===== Step 1: 上传衣服照片 ===== */}
        <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-3 md:mb-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <ShirtIcon className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-medium text-foreground">第一步：上传衣服照片</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {clothingImages.length}/{MAX_CLOTHING_IMAGES}
            </span>
          </div>

          {clothingImages.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  已上传 {clothingImages.length} 件衣服
                </span>
                <button
                  onClick={clearAllClothing}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  清除全部
                </button>
              </div>
              <div className="flex items-start gap-2 flex-wrap">
                {clothingImages.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`衣服 ${index + 1}`}
                      className="h-14 w-14 md:h-16 md:w-16 object-cover rounded-lg border border-border"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 rounded-b-lg">
                      #{index + 1}
                    </span>
                    <button
                      onClick={() => clearClothingImage(index)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {clothingImages.length < MAX_CLOTHING_IMAGES && (
                  <button
                    onClick={() => clothingInputRef.current?.click()}
                    className="h-14 w-14 md:h-16 md:w-16 rounded-lg border-2 border-dashed border-border hover:border-rose-300 flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    <span className="text-xl">+</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {clothingImages.length === 0 && (
            <button
              onClick={() => clothingInputRef.current?.click()}
              className="w-full py-6 md:py-8 rounded-xl border-2 border-dashed border-border hover:border-rose-300 flex flex-col items-center gap-2 text-muted-foreground hover:text-rose-500 transition-colors"
            >
              <ShirtIcon className="w-8 h-8" />
              <span className="text-sm">点击批量上传衣服照片</span>
              <span className="text-xs text-muted-foreground">支持最多 {MAX_CLOTHING_IMAGES} 件，每件拍一张</span>
            </button>
          )}

          <input
            ref={clothingInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              handleClothingUpload(e.target.files);
              if (clothingInputRef.current) clothingInputRef.current.value = "";
            }}
            className="hidden"
          />
        </div>

        {/* ===== Step 2: 上传货架照片 ===== */}
        <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-3 md:mb-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-foreground">第二步：上传货架照片</span>
          </div>

          {rackImage ? (
            <div className="relative group inline-block">
              <img
                src={rackImage}
                alt="货架照片"
                className="h-28 md:h-36 rounded-xl border border-border object-cover"
              />
              <button
                onClick={() => {
                  setRackImage(null);
                  if (rackInputRef.current) rackInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center touch-target"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => rackInputRef.current?.click()}
              className="w-full py-6 md:py-8 rounded-xl border-2 border-dashed border-border hover:border-blue-300 flex flex-col items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm">拍摄或上传货架/挂杆照片</span>
              <span className="text-xs text-muted-foreground">支持挂杆、墙面展架、展台等</span>
            </button>
          )}

          <input
            ref={rackInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              handleRackUpload(e.target.files);
              if (rackInputRef.current) rackInputRef.current.value = "";
            }}
            className="hidden"
          />
        </div>

        {/* ===== Step 3: 选择陈列风格 + 生成 ===== */}
        <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-4 md:mb-6 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Grip className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-foreground">第三步：选择陈列风格</span>
          </div>

          {/* 风格选择网格 */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            {displayStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl border transition-all duration-200 touch-target",
                  selectedStyle === style.id
                    ? "border-rose-300 bg-rose-50 text-rose-700 shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-rose-200 hover:bg-rose-50/50"
                )}
              >
                <span className="text-lg md:text-xl">{style.icon}</span>
                <span className="text-[10px] md:text-xs font-medium leading-tight text-center">{style.name}</span>
              </button>
            ))}
          </div>

          {/* 补充说明输入 */}
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="补充说明（可选）：如「主推红色大衣放C位」「按颜色深浅排列」..."
            rows={2}
            className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-rose-300 mb-3"
          />

          {/* 底部工具栏 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {/* 线路选择 */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowLineMenu(!showLineMenu);
                    setShowStyleMenu(false);
                  }}
                  className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-full text-[11px] md:text-sm bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all duration-200 border border-transparent touch-target whitespace-nowrap"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{lineOptions.find(l => l.id === selectedLine)?.name}</span>
                  {lineOptions.find(l => l.id === selectedLine)?.badge && (
                    <span className="px-1 py-0.5 text-[9px] md:text-[10px] leading-none font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded">
                      {lineOptions.find(l => l.id === selectedLine)?.badge}
                    </span>
                  )}
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showLineMenu && "rotate-180")} />
                </button>
                {showLineMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 w-[130px] animate-dropdown dropdown-panel">
                    {lineOptions.map((line) => (
                      <button
                        key={line.id}
                        onClick={() => {
                          setSelectedLine(line.id);
                          setShowLineMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-1.5 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target",
                          selectedLine === line.id && "bg-orange-50 text-orange-700"
                        )}
                      >
                        <span>{line.name}</span>
                        {line.badge && (
                          <span className="px-1 py-0.5 text-[9px] leading-none font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded">
                            {line.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={cn(
                "flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 touch-target",
                canGenerate
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25"
                  : "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isGenerating ? "生成中..." : "生成陈列方案"}</span>
            </button>
          </div>
        </div>

        {/* ===== 生成结果区域 ===== */}
        {(isGenerating || generatedImage) && (
          <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
              <h2 className="text-sm md:text-lg font-semibold text-foreground flex items-center gap-1.5 md:gap-2">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-rose-500" />
                陈列效果图
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="touch-target"
                    onClick={() => setGeneratedImage(null)}
                    title="关闭"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-16">
                <Loader2 className="w-8 h-8 md:w-12 md:h-12 text-rose-500 animate-spin mb-3 md:mb-4" />
                <p className="text-muted-foreground text-xs md:text-base">{generationStep || "正在生成中..."}</p>
                <p className="text-muted-foreground/60 text-[10px] md:text-xs mt-2">
                  正在将 {clothingImages.length} 件衣服智能陈列到货架上...
                </p>
              </div>
            ) : generatedImage ? (
              <div className="rounded-lg md:rounded-xl overflow-hidden bg-secondary/30 p-2 md:p-4">
                <img
                  src={generatedImage}
                  alt="AI 陈列效果图"
                  className="max-h-[300px] md:max-h-[500px] w-full mx-auto rounded-lg object-contain"
                />
              </div>
            ) : null}
          </div>
        )}

        {/* 空状态提示 */}
        {!isGenerating && !generatedImage && (
          <div className="text-center py-6 md:py-12">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Store className="w-7 h-7 md:w-10 md:h-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-xs md:text-base mb-1">上传衣服照片和货架照片，一键生成专业陈列方案</p>
            <p className="text-muted-foreground/60 text-[10px] md:text-xs">参考顶级奢侈品牌陈列美学，让你的店铺焕然一新</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AIDisplay;