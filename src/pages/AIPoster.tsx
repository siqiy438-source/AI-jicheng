import { useState, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
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
  FolderUp,
  Type,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 海报模板/智能体选项
const posterTemplates = [
  { id: "ecommerce", name: "电商海报", icon: "🛒", description: "促销、活动、新品上市" },
  { id: "social", name: "社交媒体", icon: "📱", description: "小红书、朋友圈、公众号" },
  { id: "event", name: "活动海报", icon: "🎉", description: "展会、会议、活动宣传" },
  { id: "brand", name: "品牌海报", icon: "🏢", description: "品牌形象、企业宣传" },
  { id: "festival", name: "节日海报", icon: "🎊", description: "节日祝福、节庆活动" },
  { id: "food", name: "美食海报", icon: "🍔", description: "餐饮、美食、菜单" },
];

// 风格选项
const stylePresets = [
  { id: "modern", name: "现代简约", icon: "✨" },
  { id: "retro", name: "复古风格", icon: "🎞️" },
  { id: "gradient", name: "渐变炫彩", icon: "🌈" },
  { id: "minimal", name: "极简设计", icon: "⬜" },
  { id: "bold", name: "大胆撞色", icon: "🎨" },
  { id: "elegant", name: "优雅轻奢", icon: "💎" },
];

// 尺寸选项
const sizeOptions = [
  { id: "square", name: "1:1 正方形", ratio: "1:1" },
  { id: "portrait", name: "3:4 竖版", ratio: "3:4" },
  { id: "landscape", name: "4:3 横版", ratio: "4:3" },
  { id: "story", name: "9:16 故事", ratio: "9:16" },
  { id: "banner", name: "16:9 横幅", ratio: "16:9" },
];

const AIPoster = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);

  // 状态管理
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(posterTemplates[0]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);

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
    const optimizations: Record<string, string> = {
      ecommerce: "，要求：突出促销信息、价格醒目、产品清晰、引导下单",
      social: "，要求：吸引眼球、适合分享、比例适配、风格年轻化",
      event: "，要求：活动主题突出、时间地点清晰、视觉冲击力强",
      brand: "，要求：品牌调性统一、专业大气、logo突出",
      festival: "，要求：节日氛围浓厚、祝福语醒目、喜庆热闹",
      food: "，要求：色彩诱人、食欲感强、主体突出",
    };
    setPrompt(prompt + (optimizations[selectedTemplate.id] || ""));
  };

  // 处理素材上传
  const handleMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      alert(`已选择 ${files.length} 个文件，将上传到素材库`);
    }
  };

  // 模拟生成
  const handleGenerate = () => {
    if (!prompt.trim() && !imagePreview) return;
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedImage(imagePreview || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800");
      setIsGenerating(false);
    }, 2500);
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
    setShowTemplateMenu(false);
    setShowStyleMenu(false);
    setShowSizeMenu(false);
  };

  return (
    <div className="flex min-h-screen bg-gradient-main" onClick={closeAllMenus}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* 返回按钮 */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回首页</span>
            </button>

            {/* 页面标题 */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                <Palette className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI 海报</h1>
                <p className="text-muted-foreground text-sm">选择模板，描述需求，智能生成专业海报</p>
              </div>
            </div>

            {/* 输入卡片 */}
            <div className="glass-card rounded-2xl p-5 mb-6 shadow-lg">
              {/* 已上传的图片预览 */}
              {imagePreview && (
                <div className="mb-4 flex items-start gap-3">
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="参考图"
                      className="h-20 w-20 object-cover rounded-xl border border-border"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                placeholder="描述你想要的海报内容，如：双十一促销海报，主推运动鞋，红色背景..."
                rows={3}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base leading-relaxed"
              />

              {/* 分隔线 */}
              <div className="border-t border-border/50 my-3" />

              {/* 工具栏 */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* 模板选择 */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setShowTemplateMenu(!showTemplateMenu);
                        setShowStyleMenu(false);
                        setShowSizeMenu(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all border",
                        "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      )}
                    >
                      <span>{selectedTemplate.icon}</span>
                      <span>{selectedTemplate.name}</span>
                      <ChevronDown className={cn("w-4 h-4 transition-transform", showTemplateMenu && "rotate-180")} />
                    </button>
                    {showTemplateMenu && (
                      <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-2 z-10 min-w-[200px]">
                        {posterTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowTemplateMenu(false);
                            }}
                            className={cn(
                              "w-full flex items-start gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors text-left",
                              selectedTemplate.id === template.id && "bg-blue-50"
                            )}
                          >
                            <span className="text-lg">{template.icon}</span>
                            <div>
                              <div className={cn(
                                "text-sm font-medium",
                                selectedTemplate.id === template.id ? "text-blue-700" : "text-foreground"
                              )}>
                                {template.name}
                              </div>
                              <div className="text-xs text-muted-foreground">{template.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 风格选择 */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setShowStyleMenu(!showStyleMenu);
                        setShowTemplateMenu(false);
                        setShowSizeMenu(false);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all border",
                        selectedStyle
                          ? "bg-purple-50 border-purple-200 text-purple-700"
                          : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <Type className="w-4 h-4" />
                      <span>{stylePresets.find(s => s.id === selectedStyle)?.name || "选择风格"}</span>
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
                              "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/50 transition-colors",
                              selectedStyle === style.id && "bg-purple-50 text-purple-700"
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
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setShowSizeMenu(!showSizeMenu);
                        setShowTemplateMenu(false);
                        setShowStyleMenu(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all border border-transparent"
                    >
                      <Ratio className="w-4 h-4" />
                      <span>{selectedSize.ratio}</span>
                    </button>
                    {showSizeMenu && (
                      <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-10 min-w-[130px]">
                        {sizeOptions.map((size) => (
                          <button
                            key={size.id}
                            onClick={() => {
                              setSelectedSize(size);
                              setShowSizeMenu(false);
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-sm hover:bg-secondary/50 transition-colors text-left",
                              selectedSize.id === size.id && "bg-blue-50 text-blue-700"
                            )}
                          >
                            {size.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 分隔符 */}
                  <div className="w-px h-5 bg-border mx-1" />

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
                    className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
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
                    className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    title="上传素材到素材库"
                  >
                    <FolderUp className="w-4 h-4" />
                  </button>
                </div>

                {/* 右侧按钮 */}
                <div className="flex items-center gap-2">
                  {/* 一键优化 */}
                  <button
                    onClick={optimizePrompt}
                    disabled={!prompt.trim()}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all border",
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
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      (prompt.trim() || imagePreview) && !isGenerating
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md"
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
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    生成结果
                  </h2>
                  {generatedImage && !isGenerating && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleGenerate}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        重新生成
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        下载
                      </Button>
                    </div>
                  )}
                </div>

                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-muted-foreground">正在生成海报...</p>
                  </div>
                ) : generatedImage ? (
                  <div className="rounded-xl overflow-hidden bg-secondary/30 p-4">
                    <img
                      src={generatedImage}
                      alt="生成结果"
                      className="max-h-[500px] mx-auto rounded-lg object-contain"
                    />
                  </div>
                ) : null}
              </div>
            )}

            {/* 空状态提示 */}
            {!isGenerating && !generatedImage && (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground mb-2">选择模板，输入需求开始设计</p>
                <p className="text-sm text-muted-foreground/70">支持上传产品图、logo等素材作为参考</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIPoster;
