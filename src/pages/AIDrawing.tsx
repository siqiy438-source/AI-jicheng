import { useState, useRef, useEffect } from "react";
import { PageLayout } from "@/components/PageLayout";
import {
  ArrowLeft,
  ImageIcon,
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
  Languages,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { generateImage } from "@/lib/ai-image";
import { compressImage } from "@/lib/image-utils";

// 提示词类型
interface PromptPreset {
  id: string;
  name: string;
  icon: string;
  prompt: string;
  description?: string;
}

// 默认风格选项（本地）- 自由模式放第一个
const defaultStylePresets = [
  { id: "free", name: "自由模式", icon: "✍️" },
  { id: "sketch", name: "手绘风格", icon: "🖌️" },
];

// 比例选项
const ratioOptions = [
  { id: "1:1", name: "1:1" },
  { id: "4:3", name: "4:3" },
  { id: "16:9", name: "16:9" },
  { id: "9:16", name: "9:16" },
];

// 线路选项
const lineOptions = [
  { id: "premium", name: "优质线路" },
  { id: "standard", name: "普通线路" },
];

// 语言选项
const languageOptions = [
  { id: "zh", name: "中文", flag: "🇨🇳" },
  { id: "en", name: "English", flag: "🇺🇸" },
];

// 手绘子风格选项
const sketchSubStyles = [
  { id: "cute", name: "可爱风", icon: "🎀", prompt: "cute kawaii style, adorable, soft colors, rounded shapes" },
  { id: "chibi", name: "Q版", icon: "🧸", prompt: "chibi style, super deformed, big head small body, playful" },
  { id: "minimalist", name: "简约风", icon: "✨", prompt: "minimalist clean style, simple lines, elegant, less is more" },
  { id: "watercolor", name: "水彩风", icon: "🎨", prompt: "watercolor style, soft washes, flowing colors, artistic" },
  { id: "vintage", name: "复古风", icon: "📜", prompt: "vintage retro style, nostalgic, warm tones, classic feel" },
];


const AIDrawing = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);

  // 状态管理
  const [prompt, setPrompt] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>("free");
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState("4:3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showRatioMenu, setShowRatioMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLine, setSelectedLine] = useState<"standard" | "premium">("standard");
  const [selectedLanguage, setSelectedLanguage] = useState("zh");
  const [selectedSketchSubStyle, setSelectedSketchSubStyle] = useState<string | null>(null);
  const [showSketchSubStyleMenu, setShowSketchSubStyleMenu] = useState(false);

  // 风格预设列表（从数据库加载）
  const [stylePresets, setStylePresets] = useState<PromptPreset[]>(
    defaultStylePresets.map(s => ({ ...s, prompt: '' }))
  );

  // 从 Supabase 加载提示词
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const { data, error } = await supabase
          .from('prompts')
          .select('id, name, icon, prompt, description')
          .eq('category', 'drawing')
          .eq('is_active', true);

        if (error) {
          console.error('加载提示词失败:', error);
          return;
        }

        if (data && data.length > 0) {
          // 合并默认选项和数据库选项（去重，避免重复 key）
          const defaultIds = new Set(defaultStylePresets.map(s => s.id));
          const dbPresets: PromptPreset[] = data
            .filter(item => !defaultIds.has(item.id))
            .map(item => ({
            id: item.id,
            name: item.name,
            icon: item.icon || '🎨',
            prompt: item.prompt,
            description: item.description,
          }));

          // 默认选项放前面，数据库选项放后面
          const defaultWithPrompt = defaultStylePresets.map(s => ({ ...s, prompt: '' }));
          setStylePresets([...defaultWithPrompt, ...dbPresets]);
        }
      } catch (err) {
        console.error('加载提示词出错:', err);
      }
    };

    loadPrompts();
  }, []);

  // 处理风格选择
  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);

    // 如果选中的风格有预设提示词（来自数据库），清空输入框并设置提示
    const selected = stylePresets.find(s => s.id === styleId);
    if (selected?.prompt) {
      // 不填充提示词，保持输入框为空或显示提示
      setPrompt('');
      // 如果是女装搭配类风格，自动设置比例为 9:16
      if (styleId === 'fashion-outfit' || styleId === 'outfit-model') {
        setSelectedRatio('9:16');
      }
    }
  };

  // 获取当前风格是否有预设提示词（需要上传图片模式）
  const currentStyleHasPrompt = stylePresets.find(s => s.id === selectedStyle)?.prompt;

  // 处理图片上传（支持多张，自动压缩）
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
    // 模拟优化
    setPrompt(prompt + "，高清，细节丰富，光影效果好");
  };

  // 调用 AI 生成
  const handleGenerate = async () => {
    if (!prompt.trim() && imagePreviews.length === 0 && !currentStyleHasPrompt) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // 构建最终提示词，包含子风格
      let finalPrompt = prompt || "";
      if (selectedSketchSubStyle) {
        const subStyle = sketchSubStyles.find(s => s.id === selectedSketchSubStyle);
        if (subStyle) {
          finalPrompt = finalPrompt
            ? `${subStyle.prompt}, ${finalPrompt}`
            : subStyle.prompt;
        }
      }

      const data = await generateImage({
        prompt: finalPrompt,
        styleId: currentStyleHasPrompt ? selectedStyle : undefined,
        aspectRatio: selectedRatio,
        images: imagePreviews.length > 0 ? imagePreviews : undefined,
        line: selectedLine,
      });

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
      const filename = `ai-drawing-${Date.now()}.png`;

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
                <img src="${url}" alt="AI生成图片" />
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
    setShowRatioMenu(false);
    setShowLineMenu(false);
    setShowStyleMenu(false);
    setShowLanguageMenu(false);
    setShowSketchSubStyleMenu(false);
  };

  // 处理素材上传
  const handleMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      alert(`已选择 ${files.length} 个文件，将上传到素材库`);
    }
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
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-5 h-5 md:w-7 md:h-7 text-purple-600" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-foreground">AI 绘图</h1>
            <p className="text-muted-foreground text-xs md:text-sm">描述你想要的画面，AI 帮你实现</p>
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
            placeholder={currentStyleHasPrompt ? "已选择预设风格，直接上传图片即可（也可输入补充说明）" : "输入你想要可视化的内容..."}
            rows={2}
            enterKeyHint="send"
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-xs md:text-base leading-relaxed"
          />

          {/* 分隔线 */}
          <div className="border-t border-border/50 my-2 md:my-3" />

          {/* 工具栏 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 md:gap-1.5 flex-1 min-w-0 flex-wrap overflow-visible">
              {/* 风格/模式选择 */}
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowStyleMenu(!showStyleMenu);
                    setShowRatioMenu(false);
                    setShowLineMenu(false);
                    setShowLanguageMenu(false);
                  }}
                  className={cn(
                    "flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-xs md:text-sm transition-all duration-200 border touch-target",
                    selectedStyle === "free"
                      ? "bg-secondary/50 text-muted-foreground hover:bg-secondary border-transparent"
                      : "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                  )}
                >
                  <span>{stylePresets.find(s => s.id === selectedStyle)?.icon || "✍️"}</span>
                  <span className="hidden sm:inline">{stylePresets.find(s => s.id === selectedStyle)?.name || "自由模式"}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showStyleMenu && "rotate-180")} />
                </button>
                {showStyleMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 min-w-[140px] animate-dropdown">
                    {stylePresets.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          handleStyleSelect(style.id);
                          setShowStyleMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target",
                          selectedStyle === style.id && "bg-orange-50 text-orange-700"
                        )}
                      >
                        <span>{style.icon}</span>
                        <span>{style.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 设计风格选择 - 所有模式都显示 */}
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowSketchSubStyleMenu(!showSketchSubStyleMenu);
                    setShowStyleMenu(false);
                    setShowRatioMenu(false);
                    setShowLineMenu(false);
                    setShowLanguageMenu(false);
                  }}
                  className={cn(
                    "flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-xs md:text-sm transition-all duration-200 border touch-target",
                    selectedSketchSubStyle
                      ? "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary border-transparent"
                  )}
                >
                  <span>{sketchSubStyles.find(s => s.id === selectedSketchSubStyle)?.icon || "🎭"}</span>
                  <span className="hidden sm:inline">{sketchSubStyles.find(s => s.id === selectedSketchSubStyle)?.name || "设计风格"}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showSketchSubStyleMenu && "rotate-180")} />
                </button>
                {showSketchSubStyleMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 min-w-[140px] animate-dropdown">
                    <button
                      onClick={() => {
                        setSelectedSketchSubStyle(null);
                        setShowSketchSubStyleMenu(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target",
                        !selectedSketchSubStyle && "bg-pink-50 text-pink-700"
                      )}
                    >
                      <span>🎭</span>
                      <span>默认风格</span>
                    </button>
                    {sketchSubStyles.map((subStyle) => (
                      <button
                        key={subStyle.id}
                        onClick={() => {
                          setSelectedSketchSubStyle(subStyle.id);
                          setShowSketchSubStyleMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target",
                          selectedSketchSubStyle === subStyle.id && "bg-pink-50 text-pink-700"
                        )}
                      >
                        <span>{subStyle.icon}</span>
                        <span>{subStyle.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 比例选择 */}
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowRatioMenu(!showRatioMenu);
                    setShowStyleMenu(false);
                    setShowLineMenu(false);
                    setShowLanguageMenu(false);
                  }}
                  className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-full text-xs md:text-sm bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all duration-200 border border-transparent touch-target"
                >
                  <Ratio className="w-3.5 h-3.5" />
                  <span>{selectedRatio}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showRatioMenu && "rotate-180")} />
                </button>
                {showRatioMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 min-w-[100px] animate-dropdown">
                    {ratioOptions.map((ratio) => (
                      <button
                        key={ratio.id}
                        onClick={() => {
                          setSelectedRatio(ratio.id);
                          setShowRatioMenu(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target",
                          selectedRatio === ratio.id && "bg-orange-50 text-orange-700"
                        )}
                      >
                        {ratio.name}
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
                    setShowStyleMenu(false);
                    setShowRatioMenu(false);
                    setShowLanguageMenu(false);
                  }}
                  className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-full text-xs md:text-sm bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all duration-200 border border-transparent touch-target"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{lineOptions.find(l => l.id === selectedLine)?.name}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showLineMenu && "rotate-180")} />
                </button>
                {showLineMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 min-w-[110px] animate-dropdown">
                    {lineOptions.map((line) => (
                      <button
                        key={line.id}
                        onClick={() => {
                          setSelectedLine(line.id as "standard" | "premium");
                          setShowLineMenu(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target",
                          selectedLine === line.id && "bg-orange-50 text-orange-700"
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

              {/* 语言选择 */}
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowLanguageMenu(!showLanguageMenu);
                    setShowStyleMenu(false);
                    setShowRatioMenu(false);
                    setShowLineMenu(false);
                  }}
                  className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 touch-target"
                  title="选择语言"
                >
                  <Languages className="w-3.5 h-3.5" />
                </button>
                {showLanguageMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 min-w-[120px] animate-dropdown">
                    {languageOptions.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => {
                          setSelectedLanguage(lang.id);
                          setShowLanguageMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target",
                          selectedLanguage === lang.id && "bg-orange-50 text-orange-700"
                        )}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                    ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                    : "bg-secondary/30 border-transparent text-muted-foreground/50 cursor-not-allowed"
                )}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>一键优化</span>
              </button>

              {/* 发送按钮 */}
              <button
                onClick={handleGenerate}
                disabled={(!prompt.trim() && imagePreviews.length === 0 && !currentStyleHasPrompt) || isGenerating}
                className={cn(
                  "w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all duration-200 touch-target flex-shrink-0",
                  ((prompt.trim() || imagePreviews.length > 0 || currentStyleHasPrompt) && !isGenerating)
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)]"
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
                </div>
              )}
            </div>

            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-16">
                <Loader2 className="w-8 h-8 md:w-12 md:h-12 text-purple-500 animate-spin mb-3 md:mb-4" />
                <p className="text-muted-foreground text-xs md:text-base">正在生成中...</p>
              </div>
            ) : generatedImage ? (
              <div className="rounded-lg md:rounded-xl overflow-hidden bg-secondary/30 p-2 md:p-4">
                <img
                  src={generatedImage}
                  alt="生成结果"
                  className="max-h-[400px] md:max-h-[500px] w-full mx-auto rounded-lg object-contain"
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
            <p className="text-muted-foreground text-xs md:text-base">输入描述或上传参考图片开始创作</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AIDrawing;
