import { useState, useRef } from "react";
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
  FolderUp,
  Languages,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 风格选项
const stylePresets = [
  { id: "poster", name: "海报设计", icon: "🎨" },
  { id: "sketch", name: "手绘风格", icon: "🖌️" },
  { id: "anime", name: "动漫风格", icon: "✨" },
  { id: "realistic", name: "写实风格", icon: "📷" },
];

// 比例选项
const ratioOptions = [
  { id: "1:1", name: "1:1" },
  { id: "4:3", name: "4:3" },
  { id: "16:9", name: "16:9" },
  { id: "9:16", name: "9:16" },
];

// 语言选项
const languageOptions = [
  { id: "zh", name: "简体中文", flag: "🇨🇳" },
  { id: "en", name: "English", flag: "🇺🇸" },
];


const AIDrawing = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 状态管理
  const [prompt, setPrompt] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState("4:3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showRatioMenu, setShowRatioMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("zh");
  const materialInputRef = useRef<HTMLInputElement>(null);

  // 处理图片上传
  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  // 清除图片
  const clearImage = () => {
    setImagePreview(null);
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

  // 模拟生成
  const handleGenerate = () => {
    if (!prompt.trim() && !imagePreview) return;
    setIsGenerating(true);
    setTimeout(() => {
      // 模拟生成结果
      setGeneratedImage(imagePreview || "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800");
      setIsGenerating(false);
    }, 2000);
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
    setShowStyleMenu(false);
    setShowRatioMenu(false);
    setShowLanguageMenu(false);
  };

  // 处理素材上传
  const handleMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // TODO: 实现素材上传到素材库
      alert(`已选择 ${files.length} 个文件，将上传到素材库`);
    }
  };

  return (
    <PageLayout className="py-4 md:py-8">
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
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-6 h-6 md:w-7 md:h-7 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">AI 绘图</h1>
            <p className="text-muted-foreground text-sm">描述你想要的画面，AI 帮你实现</p>
          </div>
        </div>

        {/* 输入卡片 */}
        <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5 mb-4 md:mb-6 shadow-lg">
          {/* 已上传的图片预览 */}
          {imagePreview && (
            <div className="mb-4 flex items-start gap-3">
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="参考图"
                  className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-lg md:rounded-xl border border-border"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center touch-target"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground mt-1">参考图片</span>
            </div>
          )}

          {/* 输入区域 */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你想要可视化的内容..."
            rows={3}
            enterKeyHint="send"
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-sm md:text-base leading-relaxed"
          />

          {/* 分隔线 */}
          <div className="border-t border-border/50 my-3" />

          {/* 工具栏 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              {/* 风格选择 */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowStyleMenu(!showStyleMenu);
                    setShowRatioMenu(false);
                  }}
                  className={cn(
                    "flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-2 rounded-full text-sm transition-all border touch-target",
                    selectedStyle
                      ? "bg-orange-50 border-orange-200 text-orange-700"
                      : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <span>{stylePresets.find(s => s.id === selectedStyle)?.icon || "🎨"}</span>
                  <span className="hidden xs:inline">{stylePresets.find(s => s.id === selectedStyle)?.name || "风格"}</span>
                </button>
                {showStyleMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 min-w-[140px]">
                    {stylePresets.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setSelectedStyle(style.id);
                          setShowStyleMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors touch-target",
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

              {/* 比例选择 */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowRatioMenu(!showRatioMenu);
                    setShowStyleMenu(false);
                  }}
                  className="flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-2 rounded-full text-sm bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all border border-transparent touch-target"
                >
                  <Ratio className="w-4 h-4" />
                  <span>{selectedRatio}</span>
                </button>
                {showRatioMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 min-w-[100px]">
                    {ratioOptions.map((ratio) => (
                      <button
                        key={ratio.id}
                        onClick={() => {
                          setSelectedRatio(ratio.id);
                          setShowRatioMenu(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors text-left touch-target",
                          selectedRatio === ratio.id && "bg-purple-50 text-purple-700"
                        )}
                      >
                        {ratio.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 分隔符 */}
              <div className="w-px h-5 bg-border mx-0.5 md:mx-1 hidden sm:block" />

              {/* 上传图片按钮 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all touch-target"
                title="上传参考图"
              >
                <Image className="w-4 h-4" />
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
                className="p-2.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all touch-target"
                title="上传素材到素材库"
              >
                <FolderUp className="w-4 h-4" />
              </button>

              {/* 语言选择 */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowLanguageMenu(!showLanguageMenu);
                    setShowStyleMenu(false);
                    setShowRatioMenu(false);
                  }}
                  className="p-2.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all touch-target"
                  title="选择语言"
                >
                  <Languages className="w-4 h-4" />
                </button>
                {showLanguageMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 min-w-[120px]">
                    {languageOptions.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => {
                          setSelectedLanguage(lang.id);
                          setShowLanguageMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors touch-target",
                          selectedLanguage === lang.id && "bg-purple-50 text-purple-700"
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
            <div className="flex items-center justify-end gap-2">
              {/* 一键优化 */}
              <button
                onClick={optimizePrompt}
                disabled={!prompt.trim()}
                className={cn(
                  "hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all border touch-target",
                  prompt.trim()
                    ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                    : "bg-secondary/30 border-transparent text-muted-foreground/50 cursor-not-allowed"
                )}
              >
                <Wand2 className="w-4 h-4" />
                <span>一键优化</span>
              </button>

              {/* 发送按钮 */}
              <button
                onClick={handleGenerate}
                disabled={(!prompt.trim() && !imagePreview) || isGenerating}
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-all touch-target flex-shrink-0",
                  (prompt.trim() || imagePreview) && !isGenerating
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md"
                    : "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed"
                )}
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 生成结果区域 */}
        {(isGenerating || generatedImage) && (
          <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
                生成结果
              </h2>
              {generatedImage && !isGenerating && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleGenerate} className="touch-target">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">重新生成</span>
                  </Button>
                  <Button variant="outline" size="sm" className="touch-target">
                    <Download className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">下载</span>
                  </Button>
                </div>
              )}
            </div>

            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12 md:py-16">
                <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-purple-500 animate-spin mb-4" />
                <p className="text-muted-foreground text-sm md:text-base">正在生成中...</p>
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
          <div className="text-center py-12 md:py-16">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm md:text-base">输入描述或上传参考图片开始创作</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AIDrawing;
