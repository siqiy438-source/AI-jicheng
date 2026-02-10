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
import { saveGeneratedImageWork } from "@/lib/repositories/works";

// 提示词类型
interface PromptPreset {
  id: string;
  name: string;
  icon: string;
  prompt: string;
  description?: string;
}

// 内容框架选项（第一栏）- 定义内容的组织结构
const contentFrameworks = [
  {
    id: "free",
    name: "自由模式",
    icon: "✍️",
    prompt: "" // 无框架限制
  },
  {
    id: "sketch",
    name: "手绘风格",
    icon: "🖌️",
    prompt: "Create a hand-drawn style poster illustration.\n\n【STYLE - Hand-drawn Journal Aesthetic】\n- Hand-drawn illustration style, like a cute travel journal or planner\n- Clean sketch aesthetic with soft pastel colors\n- Doodle icons and decorative elements\n- Whimsical hand-lettering for titles and text\n- Cozy, warm illustration style\n- White or light cream background\n\n【COMPOSITION】\n- Clear visual hierarchy with main title at top\n- Organized sections with cute dividers\n- Small illustrated icons and doodles scattered throughout\n- Balance between text areas and illustrations\n- Easy to read layout\n\n【TECHNICAL REQUIREMENTS】\n1. Soft, harmonious color palette (pastels preferred)\n2. Clean lines, not messy or over-sketched\n3. Include relevant illustrated elements based on the topic\n4. Professional but approachable hand-drawn look\n5. NO photorealistic elements\n6. NO AI-generated perfection - keep it warm and human\n\nUser request: {user_prompt}"
  },
  {
    id: "comic-story",
    name: "漫画故事",
    icon: "📖",
    prompt: "manga/comic story narrative layout with SEQUENTIAL PANELS: 1) 4-8 comic panels arranged in reading order (left-to-right, top-to-bottom), 2) each panel tells part of the story with characters, scenes, and actions, 3) speech bubbles and thought bubbles with dialogue/narration, 4) expressive character faces showing emotions, 5) dynamic poses and action lines for movement, 6) panel transitions showing story progression, 7) sound effects text (e.g., 'BOOM', 'whoosh'), 8) varied panel sizes for pacing and emphasis, 9) clear narrative flow that tells a complete mini-story about the topic."
  },
  {
    id: "flowchart",
    name: "流程图",
    icon: "🔄",
    prompt: "professional flowchart diagram structure: 1) MULTIPLE BOXES with clear directional arrows showing flow and relationships, 2) central main topic box, 3) varied box shapes and sizes for visual hierarchy, 4) mix of solid and dashed connecting lines, 5) color-coded sections, 6) organized layout showing step-by-step process or relationships."
  },
  {
    id: "mindmap",
    name: "思维导图",
    icon: "🧠",
    prompt: "comprehensive mind map structure: 1) central concept box with large emphasis, 2) radiating branches where each node connects to related concepts, 3) visual connections using arrows and lines (solid and dashed), 4) color coding for different branches, 5) varied sizes for hierarchy, 6) dense information layout showing relationships and connections."
  },
  {
    id: "infographic",
    name: "图文并茂",
    icon: "📊",
    prompt: "detailed infographic layout: 1) MULTIPLE BOXES each containing BOTH relevant illustrations/icons AND concise text descriptions (60% images, 40% text), 2) clear hierarchical structure with main title at top, 3) various sized rectangular frames connected by arrows, 4) visual hierarchy using different box sizes and colors, 5) proper visual labels and annotations, 6) organized layout showing relationships and flow."
  },
  {
    id: "comparison",
    name: "对比分析",
    icon: "⚖️",
    prompt: "professional comparison analysis layout with SIDE-BY-SIDE structure: 1) TITLE at top center showing 'A vs B' or 'A 对比 B', 2) TWO MAIN COLUMNS divided by a vertical line or VS symbol in the middle, 3) LEFT COLUMN for Item A with icon/illustration at top, 4) RIGHT COLUMN for Item B with icon/illustration at top, 5) COMPARISON ROWS showing key dimensions (price, features, pros/cons, performance, design, etc.), 6) each row aligned horizontally across both columns for easy comparison, 7) use different background colors or borders to distinguish the two items (e.g., blue tint for left, orange tint for right), 8) include visual indicators like checkmarks ✓ for advantages, X marks for disadvantages, or star ratings, 9) summary section at bottom highlighting key differences, 10) clean table-like structure with clear labels. CRITICAL: Make it easy to scan and compare - align corresponding features horizontally, use consistent spacing, and maintain visual balance between both sides."
  },
];

// 视觉风格选项（第二栏）- 定义视觉呈现风格
const visualStyles = [
  {
    id: "default",
    name: "默认风格",
    icon: "🎭",
    prompt: "" // 无特殊风格
  },
  {
    id: "cute",
    name: "可爱风",
    icon: "🎀",
    prompt: "Visual style: kawaii cute aesthetic with 1) pastel colors (pink, lavender, mint, peach), 2) rounded shapes and soft edges, 3) cute decorative elements (hearts, stars, sparkles), 4) soft lighting and gentle features, 5) dreamy atmosphere, 6) playful and friendly appearance."
  },
  {
    id: "chibi",
    name: "Q版",
    icon: "🧸",
    prompt: "Visual style: chibi Q-version cartoon style with 1) bold outlines and simplified features, 2) oversized heads and small bodies, 3) exaggerated expressions, 4) bright vibrant colors, 5) playful and cute character representations, 6) cartoon aesthetic with rounded shapes."
  },
  {
    id: "minimalist",
    name: "简约风",
    icon: "✨",
    prompt: "Visual style: minimalist clean aesthetic with 1) simple elegant lines and geometric shapes, 2) monochromatic or limited color palette (black, white, one accent color), 3) plenty of white space for clarity, 4) clean straight lines, 5) 'less is more' principle, 6) modern and sophisticated look."
  },
  {
    id: "watercolor",
    name: "水彩风",
    icon: "🎨",
    prompt: "Visual style: watercolor artistic aesthetic with 1) soft watercolor washes and flowing colors, 2) artistic color blending and gradients, 3) watercolor splashes and organic textures, 4) soft edges and natural flow, 5) painted artistic quality, 6) gentle and artistic appearance."
  },
  {
    id: "vintage",
    name: "复古风",
    icon: "📜",
    prompt: "Visual style: vintage retro aesthetic with 1) nostalgic warm tones (sepia, cream, brown, muted colors), 2) ornate decorative borders and flourishes, 3) aged paper texture, 4) classic typography, 5) retro ornamental elements, 6) nostalgic and timeless appearance."
  },
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
  { id: "premium", name: "灵犀 Pro", line: "premium" as const, resolution: "2k" as const, badge: "优质" },
  { id: "standard", name: "灵犀标准", line: "standard" as const, resolution: "default" as const },
  { id: "standard_2k", name: "灵犀 2K", line: "standard" as const, resolution: "2k" as const },
  { id: "standard_4k", name: "灵犀 4K", line: "standard" as const, resolution: "4k" as const },
];

// 语言选项
const languageOptions = [
  { id: "zh", name: "中文", flag: "🇨🇳" },
  { id: "en", name: "English", flag: "🇺🇸" },
];


const AIDrawing = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);

  // 状态管理
  const [prompt, setPrompt] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<string>("free"); // 内容框架
  const [selectedVisualStyle, setSelectedVisualStyle] = useState<string>("default"); // 视觉风格
  const [showFrameworkMenu, setShowFrameworkMenu] = useState(false);
  const [showVisualStyleMenu, setShowVisualStyleMenu] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState("4:3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showRatioMenu, setShowRatioMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLine, setSelectedLine] = useState("standard");
  const [selectedLanguage, setSelectedLanguage] = useState("zh");

  // 风格预设列表（从数据库加载）- 保留用于兼容性
  const [stylePresets, setStylePresets] = useState<PromptPreset[]>([]);

  // 从 Supabase 加载提示词（保留用于兼容性）
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
          const dbPresets: PromptPreset[] = data.map(item => ({
            id: item.id,
            name: item.name,
            icon: item.icon || '🎨',
            prompt: item.prompt,
            description: item.description,
          }));
          setStylePresets(dbPresets);
        }
      } catch (err) {
        console.error('加载提示词出错:', err);
      }
    };

    loadPrompts();
  }, []);

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
    if (!prompt.trim() && imagePreviews.length === 0) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // 构建最终提示词：组合内容框架 + 视觉风格
      let finalPrompt = prompt || "";

      // 添加内容框架提示词
      const framework = contentFrameworks.find(f => f.id === selectedFramework);
      if (framework && framework.prompt) {
        if (framework.prompt.includes('{user_prompt}')) {
          // 替换占位符为用户输入
          finalPrompt = framework.prompt.replace('{user_prompt}', finalPrompt || '参考上传的图片');
        } else {
          finalPrompt = framework.prompt + (finalPrompt ? ` Content: ${finalPrompt}` : "");
        }
      }

      // 添加视觉风格提示词
      const visualStyle = visualStyles.find(s => s.id === selectedVisualStyle);
      if (visualStyle && visualStyle.prompt) {
        finalPrompt = finalPrompt + " " + visualStyle.prompt;
      }

      // 添加语言要求
      const languageInstruction = selectedLanguage === "zh"
        ? "IMPORTANT: ALL text in the image must be in Chinese (Simplified Chinese characters only). Do not mix English with Chinese. Use pure Chinese for all labels, titles, descriptions, and annotations."
        : "IMPORTANT: ALL text in the image must be in English only. Do not mix Chinese with English. Use pure English for all labels, titles, descriptions, and annotations.";

      finalPrompt = `${languageInstruction} ${finalPrompt}`;

      // 调试信息
      console.log('=== AI 绘图调试信息 ===');
      console.log('内容框架:', selectedFramework);
      console.log('视觉风格:', selectedVisualStyle);
      console.log('最终提示词长度:', finalPrompt.length);
      console.log('最终提示词:', finalPrompt);
      console.log('比例:', selectedRatio);
      console.log('线路:', selectedLine);
      console.log('图片数量:', imagePreviews.length);

      const selectedLineOption = lineOptions.find(l => l.id === selectedLine) || lineOptions[1];
      const data = await generateImage({
        prompt: finalPrompt,
        styleId: undefined, // 不再使用 styleId，完全由提示词控制
        aspectRatio: selectedRatio,
        images: imagePreviews.length > 0 ? imagePreviews : undefined,
        line: selectedLineOption.line,
        resolution: selectedLineOption.resolution,
        hasFrameworkPrompt: !!(framework && framework.prompt),
      });

      console.log('API 返回结果:', data);

      if (!data.success) {
        throw new Error(data.error || '生成失败');
      }

      // 优先使用 imageUrl，其次使用 base64
      const resultImage = data.imageUrl || data.imageBase64;
      if (resultImage) {
        setGeneratedImage(resultImage);
        const title = prompt.trim() ? `绘图：${prompt.trim().slice(0, 24)}` : "AI 绘图作品";
        void saveGeneratedImageWork({
          title,
          type: "drawing",
          tool: "AI 绘图",
          prompt: finalPrompt,
          imageDataUrl: resultImage,
          metadata: {
            selectedFramework,
            selectedVisualStyle,
            selectedRatio,
            selectedLine,
            selectedLanguage,
          },
        }).catch((error) => {
          console.error("自动保存绘图作品失败", error);
        });
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
    setShowFrameworkMenu(false);
    setShowVisualStyleMenu(false);
    setShowLanguageMenu(false);
  };

  // 处理素材上传
  const handleMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      alert(`已选择 ${files.length} 个文件，将上传到素材库`);
    }
  };

  return (
    <PageLayout className="pt-6 pb-2 md:py-8">
      <div onClick={closeAllMenus}>
        {/* 返回按钮 - 仅桌面端显示 */}
        <button
          onClick={() => navigate("/")}
          className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回首页</span>
        </button>

        {/* 页面标题 - 移动端隐藏避免与 Header logo 重叠 */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0">
            <img 
              src="/icons/ai-drawing-custom.png" 
              alt="AI 绘图" 
              className="w-14 h-14 object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI 绘图</h1>
            <p className="text-muted-foreground text-sm">描述你想要的画面，AI 帮你实现</p>
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
            placeholder="输入你想要可视化的内容..."
            rows={2}
            enterKeyHint="send"
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base leading-relaxed"
          />

          {/* 分隔线 */}
          <div className="border-t border-border/50 my-2 md:my-3" />

          {/* 工具栏 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 md:gap-1.5 flex-1 min-w-0 flex-wrap overflow-visible" style={{ rowGap: '6px' }}>
              {/* 内容框架选择（第一栏） */}
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowFrameworkMenu(!showFrameworkMenu);
                    setShowVisualStyleMenu(false);
                    setShowRatioMenu(false);
                    setShowLineMenu(false);
                    setShowLanguageMenu(false);
                  }}
                  className={cn(
                    "flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-full text-[11px] md:text-sm transition-all duration-200 border touch-target whitespace-nowrap",
                    selectedFramework === "free"
                      ? "bg-secondary/50 text-muted-foreground hover:bg-secondary border-transparent"
                      : "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                  )}
                >
                  <span className="text-sm md:text-base">{contentFrameworks.find(f => f.id === selectedFramework)?.icon || "✍️"}</span>
                  <span>{contentFrameworks.find(f => f.id === selectedFramework)?.name || "自由模式"}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showFrameworkMenu && "rotate-180")} />
                </button>
                {showFrameworkMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 w-[160px] max-w-[calc(100vw-2rem)] animate-dropdown max-h-[128px] overflow-y-auto scrollbar-thin dropdown-panel">
                    {contentFrameworks.map((framework) => (
                      <button
                        key={framework.id}
                        onClick={() => {
                          setSelectedFramework(framework.id);
                          setShowFrameworkMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target",
                          selectedFramework === framework.id && "bg-orange-50 text-orange-700"
                        )}
                      >
                        <span>{framework.icon}</span>
                        <span>{framework.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 视觉风格选择（第二栏） */}
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowVisualStyleMenu(!showVisualStyleMenu);
                    setShowFrameworkMenu(false);
                    setShowRatioMenu(false);
                    setShowLineMenu(false);
                    setShowLanguageMenu(false);
                  }}
                  className={cn(
                    "flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-full text-[11px] md:text-sm transition-all duration-200 border touch-target whitespace-nowrap",
                    selectedVisualStyle === "default"
                      ? "bg-secondary/50 text-muted-foreground hover:bg-secondary border-transparent"
                      : "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
                  )}
                >
                  <span className="text-sm md:text-base">{visualStyles.find(s => s.id === selectedVisualStyle)?.icon || "🎭"}</span>
                  <span>{visualStyles.find(s => s.id === selectedVisualStyle)?.name || "默认风格"}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showVisualStyleMenu && "rotate-180")} />
                </button>
                {showVisualStyleMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 w-[140px] max-w-[calc(100vw-2rem)] animate-dropdown max-h-[128px] overflow-y-auto scrollbar-thin dropdown-panel">
                    {visualStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setSelectedVisualStyle(style.id);
                          setShowVisualStyleMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target",
                          selectedVisualStyle === style.id && "bg-pink-50 text-pink-700"
                        )}
                      >
                        <span>{style.icon}</span>
                        <span>{style.name}</span>
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
                    setShowFrameworkMenu(false);
                    setShowVisualStyleMenu(false);
                    setShowLineMenu(false);
                    setShowLanguageMenu(false);
                  }}
                  className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-full text-[11px] md:text-sm bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all duration-200 border border-transparent touch-target whitespace-nowrap"
                >
                  <Ratio className="w-3.5 h-3.5" />
                  <span>{selectedRatio}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showRatioMenu && "rotate-180")} />
                </button>
                {showRatioMenu && (
                  <div className="absolute top-full left-0 right-0 sm:right-auto mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 sm:w-[100px] max-w-[calc(100vw-2rem)] animate-dropdown max-h-[128px] overflow-y-auto scrollbar-thin dropdown-panel">
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
                    setShowFrameworkMenu(false);
                    setShowVisualStyleMenu(false);
                    setShowRatioMenu(false);
                    setShowLanguageMenu(false);
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
                  <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 w-[130px] max-w-[calc(100vw-2rem)] animate-dropdown max-h-[180px] overflow-y-auto scrollbar-thin dropdown-panel">
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

              {/* 分隔符 */}
              <div className="w-px h-4 bg-border mx-0.5" />

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
                    setShowFrameworkMenu(false);
                    setShowVisualStyleMenu(false);
                    setShowRatioMenu(false);
                    setShowLineMenu(false);
                  }}
                  className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 touch-target"
                  title="选择语言"
                >
                  <Languages className="w-3.5 h-3.5" />
                </button>
                {showLanguageMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 w-[120px] max-w-[calc(100vw-2rem)] animate-dropdown max-h-[128px] overflow-y-auto scrollbar-thin dropdown-panel">
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
                disabled={(!prompt.trim() && imagePreviews.length === 0) || isGenerating}
                className={cn(
                  "w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all duration-200 touch-target flex-shrink-0",
                  ((prompt.trim() || imagePreviews.length > 0) && !isGenerating)
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
                <Loader2 className="w-8 h-8 md:w-12 md:h-12 text-purple-500 animate-spin mb-3 md:mb-4" />
                <p className="text-muted-foreground text-xs md:text-base">正在生成中...</p>
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
            <p className="text-muted-foreground text-xs md:text-base">输入描述或上传参考图片开始创作</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AIDrawing;
