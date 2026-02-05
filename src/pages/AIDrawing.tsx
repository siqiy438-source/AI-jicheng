import { useState, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
  ImageIcon,
  Upload,
  X,
  Sparkles,
  Download,
  RefreshCw,
  Loader2,
  Wand2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 提示词和模板合并数据
const styleOptions = {
  模板: ["人像美化", "风景增强", "动漫转换", "艺术风格化", "复古滤镜", "赛博朋克"],
  风格: ["水彩", "油画", "素描", "动漫", "写实", "3D渲染"],
};

// 快捷模板（预设组合）
const quickTemplates = [
  { id: "anime-portrait", name: "动漫头像", desc: "人像 + 动漫风格", presets: ["人像美化", "动漫"] },
  { id: "watercolor-landscape", name: "水彩风景", desc: "风景 + 水彩画风", presets: ["风景增强", "水彩"] },
  { id: "oil-artistic", name: "油画艺术", desc: "艺术风格 + 油画", presets: ["艺术风格化", "油画"] },
  { id: "cyberpunk-3d", name: "赛博科幻", desc: "赛博朋克 + 3D渲染", presets: ["赛博朋克", "3D渲染"] },
];

const AIDrawing = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 状态管理
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedQuickTemplate, setSelectedQuickTemplate] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("模板");

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 切换选项
  const toggleOption = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option) ? prev.filter((p) => p !== option) : [...prev, option]
    );
  };

  // 模拟生成
  const handleGenerate = () => {
    if (!imagePreview) return;
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedImage(imagePreview);
      setIsGenerating(false);
    }, 2000);
  };

  // 清除图片
  const clearImage = () => {
    setImagePreview(null);
    setGeneratedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 切换分类展开
  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className="flex min-h-screen bg-gradient-main">
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI 绘图</h1>
                <p className="text-muted-foreground">上传图片，选择风格，一键生成创意作品</p>
              </div>
            </div>

            {/* 步骤 1: 上传图片 */}
            <div className="glass-card rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center">
                  1
                </span>
                上传图片
              </h2>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-12 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all"
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-2">点击或拖拽上传图片</p>
                  <p className="text-sm text-muted-foreground">支持 JPG、PNG 格式</p>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="预览"
                    className="max-h-64 rounded-xl object-contain"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 步骤 2: 选择风格（合并提示词和模板） */}
            <div className="glass-card rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2 flex-wrap">
                <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <span>选择风格</span>
                {selectedOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOptions.map((option) => (
                      <span
                        key={option}
                        className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full"
                      >
                        {option}
                      </span>
                    ))}
                  </div>
                )}
              </h2>

              {/* 折叠式分类选择 */}
              <div className="space-y-2">
                {Object.entries(styleOptions).map(([category, options]) => (
                  <div key={category} className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <span className="font-medium text-foreground">{category}</span>
                      <div className="flex items-center gap-2">
                        {options.filter((o) => selectedOptions.includes(o)).length > 0 && (
                          <span className="text-xs text-purple-600">
                            {options.filter((o) => selectedOptions.includes(o)).length} 项
                          </span>
                        )}
                        {expandedCategory === category ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    {expandedCategory === category && (
                      <div className="p-4 flex flex-wrap gap-2">
                        {options.map((option) => (
                          <button
                            key={option}
                            onClick={() => toggleOption(option)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-sm transition-all",
                              selectedOptions.includes(option)
                                ? "bg-purple-500 text-white"
                                : "bg-secondary text-secondary-foreground hover:bg-purple-100"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 自定义提示词 */}
              <div className="mt-4">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="自定义提示词（可选）..."
                  className="w-full px-4 py-2 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>

            {/* 步骤 3: 生成结果 */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center">
                  3
                </span>
                生成结果
              </h2>

              <div className="flex gap-3 mb-6">
                <Button
                  onClick={handleGenerate}
                  disabled={!imagePreview || isGenerating}
                  className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      开始生成
                    </>
                  )}
                </Button>

                {generatedImage && (
                  <>
                    <Button variant="outline" onClick={handleGenerate}>
                      <RefreshCw className="w-4 h-4" />
                      重新生成
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4" />
                      下载图片
                    </Button>
                  </>
                )}
              </div>

              {/* 生成结果展示 */}
              {isGenerating ? (
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-12 text-center">
                  <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">正在生成中，请稍候...</p>
                </div>
              ) : generatedImage ? (
                <div className="rounded-xl overflow-hidden bg-secondary/30 p-4">
                  <img
                    src={generatedImage}
                    alt="生成结果"
                    className="max-h-96 mx-auto rounded-lg object-contain"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-12 text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">完成上述步骤后点击生成</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIDrawing;
