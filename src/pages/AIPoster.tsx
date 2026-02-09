import { useState, useRef } from "react";
import { PageLayout } from "@/components/PageLayout";
import {
  ArrowLeft,
  Palette,
  X,
  Sparkles,
  Download,
  RefreshCw,
  Loader2,
  Wand2,
  Send,
  Image,
  Ratio,
  ChevronDown,
  Zap,
  FolderUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateImage } from "@/lib/ai-image";
import { compressImage } from "@/lib/image-utils";

// 海报类别选项
const posterCategories = [
  {
    id: "ecommerce",
    name: "电商海报",
    icon: "🛒",
    description: "促销、活动、新品上市",
    prompt: "e-commerce promotional poster design, clear product focus, prominent price display, strong call-to-action, eye-catching discount badges, clean product photography style, professional commercial layout, high conversion design"
  },
  {
    id: "social",
    name: "社交媒体",
    icon: "📱",
    description: "小红书、朋友圈、公众号",
    prompt: "social media post design, attention-grabbing visual, shareable content layout, mobile-optimized composition, trendy aesthetic, engaging typography, platform-friendly format, Instagram/WeChat/Xiaohongshu style"
  },
  {
    id: "event",
    name: "活动海报",
    icon: "🎉",
    description: "展会、会议、活动宣传",
    prompt: "event poster design, clear event information hierarchy, prominent date and location, strong visual impact, festive atmosphere, professional event branding, clear information structure with title/time/venue"
  },
  {
    id: "brand",
    name: "品牌海报",
    icon: "🏢",
    description: "品牌形象、企业宣传",
    prompt: "brand identity poster design, professional corporate aesthetic, consistent brand tone, logo prominence, sophisticated layout, premium quality feel, brand storytelling visual, high-end commercial design"
  },
  {
    id: "festival",
    name: "节日海报",
    icon: "🎊",
    description: "节日祝福、节庆活动",
    prompt: "festival celebration poster design, festive atmosphere, holiday-themed visual elements, warm greeting message, cultural celebration aesthetic, joyful color palette, seasonal decoration style, emotional connection design"
  },
  {
    id: "food",
    name: "美食海报",
    icon: "🍔",
    description: "餐饮、美食、菜单",
    prompt: "food poster design, appetizing food photography style, vibrant color palette, mouth-watering presentation, professional food styling, clear menu information, restaurant branding, delicious visual appeal"
  },
];

// 设计风格选项
const stylePresets = [
  {
    id: "modern",
    name: "现代简约",
    icon: "✨",
    prompt: "modern minimalist design, clean lines, elegant simplicity, solid colors, professional layout"
  },
  {
    id: "flat",
    name: "扁平设计",
    icon: "📐",
    prompt: "flat design style, solid color blocks, no shadows, geometric shapes, contemporary aesthetic"
  },
  {
    id: "retro",
    name: "复古风格",
    icon: "🎞️",
    prompt: "vintage retro style, nostalgic aesthetic, classic design, aged texture, timeless feel"
  },
  {
    id: "minimal",
    name: "极简设计",
    icon: "⬜",
    prompt: "ultra minimalist, maximum white space, less is more, refined typography, sophisticated"
  },
  {
    id: "bold",
    name: "大胆撞色",
    icon: "🎨",
    prompt: "bold modern color blocking with sophisticated palette, high contrast using complementary colors (blue and orange, purple and yellow, or teal and coral), clean geometric shapes, contemporary design, professional color harmony, striking but elegant visual impact, avoid garish or overly saturated colors"
  },
  {
    id: "elegant",
    name: "优雅轻奢",
    icon: "💎",
    prompt: "elegant luxury design, sophisticated aesthetic, premium feel, refined details, high-end"
  },
];

// 尺寸选项
const sizeOptions = [
  { id: "1:1", name: "1:1 正方形", ratio: "1:1" },
  { id: "3:4", name: "3:4 竖版", ratio: "3:4" },
  { id: "4:3", name: "4:3 横版", ratio: "4:3" },
  { id: "9:16", name: "9:16 故事", ratio: "9:16" },
  { id: "16:9", name: "16:9 横幅", ratio: "16:9" },
];

// 线路选项
const lineOptions = [
  { id: "premium", name: "优质线路" },
  { id: "standard", name: "普通线路" },
];

const AIPoster = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);

  // 状态管理
  const [prompt, setPrompt] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(posterCategories[0]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [selectedLine, setSelectedLine] = useState<"standard" | "premium">("standard");

  // 处理图片上传（支持多张，最多5张）
  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;

    const maxImages = 5;
    const remainingSlots = maxImages - imagePreviews.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      if (file.type.startsWith("image/")) {
        try {
          // 压缩图片：最大 1024px，质量 80%
          const compressedBase64 = await compressImage(file, {
            maxWidth: 1024,
            maxHeight: 1024,
            quality: 0.8,
          });
          setImagePreviews(prev => [...prev, compressedBase64]);
          setGeneratedImage(null);
        } catch (err) {
          console.error('图片压缩失败:', err);
          // 压缩失败时使用原图
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreviews(prev => [...prev, e.target?.result as string]);
            setGeneratedImage(null);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e.target.files);
    // 重置 input 以便可以重复选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 清除单张图片
  const clearImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 清除所有图片
  const clearAllImages = () => {
    setImagePreviews([]);
    setGeneratedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 一键优化提示词
  const optimizePrompt = () => {
    if (!prompt.trim()) return;
    const optimizations: Record<string, string> = {
      ecommerce: "，要求：突出促销信息、价格醒目、产品清晰、引导下单",
      social: "，要求：吸引眼球、适合分享、比例适配、风格年轻化",
      event: "，要求：活动主题突出、时间地点清晰、视觉冲击力强",
      brand: "，要求：品牌调性统一、专业大气、logo突出",
      festival: "，要求：节日氛围浓厚、祝福语醒目、喜庆热闹",
      food: "，要求：色彩诱人、食欲感强、主体突出",
    };
    setPrompt(prompt + (optimizations[selectedCategory.id] || ""));
  };

  // 处理素材上传
  const handleMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      alert(`已选择 ${files.length} 个文件，将上传到素材库`);
    }
  };

  // 调用 AI 生成
  const handleGenerate = async () => {
    if (!prompt.trim() && imagePreviews.length === 0) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // 构建最终提示词：语言要求 + 海报类别 + 用户输入 + 风格
      let finalPrompt = "";

      // 0. 添加语言要求（最重要，放在最前面）
      const languageInstruction = "IMPORTANT: ALL text in the image must be in Chinese (Simplified Chinese characters only). Do not use English. Use pure Chinese for all labels, titles, descriptions, prices, and any text content.";
      finalPrompt = languageInstruction;

      // 1. 添加海报类别提示词
      finalPrompt += ` ${selectedCategory.prompt}`;

      // 2. 添加用户输入
      if (prompt.trim()) {
        finalPrompt += `, ${prompt}`;
      }

      // 3. 添加风格提示词（如果选择）
      if (selectedStyle) {
        const style = stylePresets.find(s => s.id === selectedStyle);
        if (style && style.prompt) {
          finalPrompt += `, ${style.prompt}`;
        }
      }

      // 调试信息
      console.log('=== AI 海报调试信息 ===');
      console.log('海报类别:', selectedCategory.name);
      console.log('设计风格:', selectedStyle || '无');
      console.log('最终提示词长度:', finalPrompt.length);
      console.log('最终提示词:', finalPrompt);
      console.log('比例:', selectedSize.ratio);
      console.log('线路:', selectedLine);
      console.log('参考图数量:', imagePreviews.length);

      const data = await generateImage({
        prompt: finalPrompt,
        styleId: undefined,
        aspectRatio: selectedSize.ratio,
        images: imagePreviews.length > 0 ? imagePreviews : undefined,
        line: selectedLine,
      });

      console.log('API 返回结果:', data);

      if (!data.success) {
        throw new Error(data.error || '生成失败');
      }

      // 优先使用 imageUrl，其次使用 base64
      const resultImage = data.imageUrl || data.imageBase64;
      if (resultImage) {
        setGeneratedImage(resultImage);
      } else {
        throw new Error('未能获取生成的图片');
      }
    } catch (error) {
      console.error('生成失败:', error);
      alert(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载生成的图片
  const handleDownload = async () => {
    if (!generatedImage) return;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    try {
      const filename = `ai-poster-${Date.now()}.png`;

      // 获取图片 blob
      const response = await fetch(generatedImage);
      const blob = await response.blob();

      // 手机端：使用 Web Share API（如果支持）或打开新窗口让用户长按保存
      if (isMobile) {
        // 尝试使用 Web Share API（支持分享/保存到相册）
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], filename, { type: 'image/png' });
          const shareData = { files: [file] };

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        }

        // 如果 Web Share API 不支持，打开图片让用户长按保存
        const url = URL.createObjectURL(blob);
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>保存图片</title>
                <style>
                  body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #000; }
                  img { max-width: 100%; max-height: 80vh; object-fit: contain; }
                  p { color: #fff; text-align: center; padding: 20px; font-family: system-ui, sans-serif; }
                </style>
              </head>
              <body>
                <p>长按图片保存到相册</p>
                <img src="${url}" alt="AI生成海报" />
              </body>
            </html>
          `);
          newWindow.document.close();
        }
        return;
      }

      // 桌面端：直接下载
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
      // 如果失败，直接打开图片
      window.open(generatedImage, '_blank');
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // 关闭所有下拉菜单
  const closeAllMenus = () => {
    setShowCategoryMenu(false);
    setShowStyleMenu(false);
    setShowSizeMenu(false);
    setShowLineMenu(false);
  };

  return (
    <PageLayout className="py-2 md:py-8">
      <div onClick={closeAllMenus}>
        {/* 返回按钮 - 仅桌面端显示 */}
        <button
          onClick={() => navigate("/")}
          className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回首页</span>
        </button>

        {/* 页面标题 */}
        <div className="flex items-center gap-2.5 md:gap-4 mb-4 md:mb-8">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center flex-shrink-0">
            <Palette className="w-5 h-5 md:w-7 md:h-7 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-foreground">AI 海报</h1>
            <p className="text-muted-foreground text-xs md:text-sm">选择模板，描述需求，智能生成</p>
          </div>
        </div>

        {/* 输入卡片 */}
        <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-5 mb-4 md:mb-6 shadow-lg">
          {/* 已上传的图片预览 */}
          {imagePreviews.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">已上传 {imagePreviews.length}/5 张图片</span>
                {imagePreviews.length > 1 && (
                  <button
                    onClick={clearAllImages}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
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
                {imagePreviews.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-16 w-16 md:h-20 md:w-20 rounded-lg md:rounded-xl border-2 border-dashed border-border hover:border-muted-foreground flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="text-2xl">+</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 输入区域 */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你想要的海报内容，如：双十一促销海报，主推运动鞋，红色背景..."
            rows={2}
            enterKeyHint="send"
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base leading-relaxed"
          />

          {/* 分隔线 */}
          <div className="border-t border-border/50 my-2 md:my-3" />

          {/* 工具栏 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 md:gap-1.5 flex-1 min-w-0 flex-wrap overflow-visible">
              {/* 海报类别选择 */}
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowCategoryMenu(!showCategoryMenu);
                    setShowStyleMenu(false);
                    setShowSizeMenu(false);
                    setShowLineMenu(false);
                  }}
                  className={cn(
                    "flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-xs md:text-sm transition-all duration-200 border touch-target",
                    "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                  )}
                >
                  <span>{selectedCategory.icon}</span>
                  <span className="hidden sm:inline">{selectedCategory.name}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showCategoryMenu && "rotate-180")} />
                </button>
                {showCategoryMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 min-w-[200px] md:min-w-[220px] animate-dropdown max-h-[176px] overflow-y-auto scrollbar-thin">
                    {posterCategories.map((category, index) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowCategoryMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-2.5 text-left transition-all duration-150 hover:bg-secondary/50 active:bg-secondary touch-target",
                          selectedCategory.id === category.id && "bg-amber-50 text-amber-700"
                        )}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <span className="text-lg">{category.icon}</span>
                        <div>
                          <div className={cn(
                            "text-sm font-medium",
                            selectedCategory.id === category.id ? "text-amber-700" : "text-foreground"
                          )}>
                            {category.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{category.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 风格选择 */}
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowStyleMenu(!showStyleMenu);
                    setShowCategoryMenu(false);
                    setShowSizeMenu(false);
                    setShowLineMenu(false);
                  }}
                  className={cn(
                    "flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-xs md:text-sm transition-all duration-200 border touch-target",
                    selectedStyle
                      ? "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary border-transparent"
                  )}
                >
                  <span>{stylePresets.find(s => s.id === selectedStyle)?.icon || "🎨"}</span>
                  <span className="hidden sm:inline">{stylePresets.find(s => s.id === selectedStyle)?.name || "风格"}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showStyleMenu && "rotate-180")} />
                </button>
                {showStyleMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 min-w-[140px] md:min-w-[150px] animate-dropdown max-h-[128px] overflow-y-auto scrollbar-thin">
                    {stylePresets.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setSelectedStyle(style.id);
                          setShowStyleMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 md:py-2 text-sm transition-all duration-150 hover:bg-secondary/50 active:bg-secondary touch-target",
                          selectedStyle === style.id && "bg-pink-50 text-pink-700"
                        )}
                      >
                        <span>{style.icon}</span>
                        <span>{style.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 尺寸选择 */}
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowSizeMenu(!showSizeMenu);
                    setShowCategoryMenu(false);
                    setShowStyleMenu(false);
                    setShowLineMenu(false);
                  }}
                  className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-full text-xs md:text-sm bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all duration-200 border border-transparent touch-target"
                >
                  <Ratio className="w-3.5 h-3.5" />
                  <span>{selectedSize.ratio}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showSizeMenu && "rotate-180")} />
                </button>
                {showSizeMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 min-w-[130px] md:min-w-[140px] animate-dropdown max-h-[128px] overflow-y-auto scrollbar-thin">
                    {sizeOptions.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => {
                          setSelectedSize(size);
                          setShowSizeMenu(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2.5 md:py-2 text-sm text-left transition-all duration-150 hover:bg-secondary/50 active:bg-secondary touch-target",
                          selectedSize.id === size.id && "bg-amber-50 text-amber-700"
                        )}
                      >
                        {size.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 线路选择 */}
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowLineMenu(!showLineMenu);
                    setShowCategoryMenu(false);
                    setShowStyleMenu(false);
                    setShowSizeMenu(false);
                  }}
                  className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-full text-xs md:text-sm bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all duration-200 border border-transparent touch-target"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{lineOptions.find(l => l.id === selectedLine)?.name}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showLineMenu && "rotate-180")} />
                </button>
                {showLineMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 min-w-[110px] animate-dropdown max-h-[128px] overflow-y-auto scrollbar-thin">
                    {lineOptions.map((line) => (
                      <button
                        key={line.id}
                        onClick={() => {
                          setSelectedLine(line.id as "standard" | "premium");
                          setShowLineMenu(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target",
                          selectedLine === line.id && "bg-amber-50 text-amber-700"
                        )}
                      >
                        {line.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 分隔符 */}
              <div className="w-px h-4 bg-border mx-0.5 hidden sm:block" />

              {/* 上传图片按钮 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 touch-target flex-shrink-0"
                title="上传参考图"
              >
                <Image className="w-3.5 h-3.5" />
              </button>

              {/* 上传素材到素材库 */}
              <input
                ref={materialInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleMaterialUpload}
                className="hidden"
              />
              <button
                onClick={() => materialInputRef.current?.click()}
                className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 touch-target flex-shrink-0"
                title="上传素材到素材库"
              >
                <FolderUp className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 右侧按钮 */}
            <div className="flex items-center gap-1.5">
              {/* 一键优化 */}
              <button
                onClick={optimizePrompt}
                disabled={!prompt.trim()}
                className={cn(
                  "hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs md:text-sm transition-all duration-200 border touch-target",
                  prompt.trim()
                    ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                    : "bg-secondary/30 border-transparent text-muted-foreground/50 cursor-not-allowed"
                )}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>一键优化</span>
              </button>

              {/* 发送按钮 */}
              <button
                onClick={handleGenerate}
                disabled={(!prompt.trim() && imagePreviews.length === 0) || isGenerating}
                className={cn(
                  "w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all duration-200 touch-target flex-shrink-0",
                  ((prompt.trim() || imagePreviews.length > 0) && !isGenerating)
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)]"
                    : "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed"
                )}
                aria-label="开始生成"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 生成结果区域 */}
        {(isGenerating || generatedImage) && (
          <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
              <h2 className="text-sm md:text-lg font-semibold text-foreground flex items-center gap-1.5 md:gap-2">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
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
                <Loader2 className="w-8 h-8 md:w-12 md:h-12 text-amber-500 animate-spin mb-3 md:mb-4" />
                <p className="text-muted-foreground text-xs md:text-base">正在生成海报...</p>
              </div>
            ) : generatedImage ? (
              <div className="rounded-lg md:rounded-xl overflow-hidden bg-secondary/30 p-2 md:p-4">
                <img
                  src={generatedImage}
                  alt="生成结果"
                  className="max-h-[300px] md:max-h-[400px] w-full mx-auto rounded-lg object-contain"
                />
              </div>
            ) : null}
          </div>
        )}

        {/* 空状态提示 */}
        {!isGenerating && !generatedImage && (
          <div className="text-center py-8 md:py-16">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Sparkles className="w-7 h-7 md:w-10 md:h-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-xs md:text-base mb-2">选择模板，输入需求开始设计</p>
            <p className="text-xs md:text-sm text-muted-foreground/60">支持上传产品图、logo等素材作为参考</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AIPoster;
