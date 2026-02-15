import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { BookOpen, Sparkles, ShirtIcon, ArrowLeft, Rocket, X, ChevronRight } from "lucide-react";
import { tutorials, type ToolTutorial } from "@/data/tutorialData";
import { cn } from "@/lib/utils";

/* ── 图片灯箱（点击放大） ── */
const ImageLightbox = ({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center pt-safe pb-safe"
    onClick={onClose}
  >
    <button
      onClick={onClose}
      className="absolute top-4 right-4 p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors z-10 mt-safe"
    >
      <X className="w-6 h-6" />
    </button>
    <img
      src={src}
      alt={alt}
      className="max-w-full max-h-[90dvh] object-contain"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

/* ── 教程图片（带占位和点击放大） ── */
const TutorialImage = ({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) => {
  const [failed, setFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (failed) {
    return (
      <div className="w-full aspect-[9/16] mx-auto rounded-xl bg-muted/40 border border-border/50 flex flex-col items-center justify-center gap-2 md:max-w-sm">
        <BookOpen className="w-8 h-8 text-muted-foreground/40" />
        <span className="text-xs text-muted-foreground/60">教程图片待添加</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setLightboxOpen(true)}
        className="block w-full mx-auto cursor-zoom-in active:scale-[0.99] transition-transform md:max-w-sm"
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="w-full rounded-xl border border-border/50 shadow-soft"
        />
        <p className="text-xs text-muted-foreground/50 text-center mt-2">点击图片放大查看</p>
      </button>
      {lightboxOpen && (
        <ImageLightbox
          src={src}
          alt={alt}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};

/* ── 详情视图 ── */
const TutorialDetail = ({
  tutorial,
  onBack,
}: {
  tutorial: ToolTutorial;
  onBack: () => void;
}) => (
  <div className="opacity-0 animate-fade-in">
    <button
      onClick={onBack}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      返回教程列表
    </button>

    <div className="flex items-center gap-3 mb-6">
      <img
        src={tutorial.iconSrc}
        alt={tutorial.name}
        className="w-10 h-10 md:w-12 md:h-12 object-contain"
      />
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          {tutorial.name}
        </h1>
        <p className="text-sm text-muted-foreground">{tutorial.summary}</p>
      </div>
    </div>

    {/* 教程图片（单张，9:16） */}
    <TutorialImage src={tutorial.tutorialImage} alt={`${tutorial.name} 使用教程`} />

    {/* 步骤文字列表 */}
    <div className="mt-8 space-y-4">
      <h2 className="text-base font-semibold text-foreground">操作步骤</h2>
      {tutorial.steps.map((step, idx) => (
        <div
          key={step.stepNumber}
          className="flex gap-3 opacity-0 animate-fade-in"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
            {step.stepNumber}
          </span>
          <div>
            <h3 className="text-sm font-medium text-foreground">{step.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
          </div>
        </div>
      ))}
    </div>

    {/* 底部操作 */}
    <div className="mt-8 flex justify-center">
      <Link
        to={tutorial.route}
        className={cn(
          "inline-flex items-center gap-2 px-6 py-3 rounded-xl",
          "bg-primary text-primary-foreground font-medium",
          "hover:bg-primary/90 transition-colors shadow-soft"
        )}
      >
        <Rocket className="w-4 h-4" />
        立即体验
      </Link>
    </div>
  </div>
);

/* ── 主页面 ── */
const fashionTools = tutorials.filter((t) => t.category === "fashion");
const creativeTools = tutorials.filter((t) => t.category === "creative");

const Tutorials = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const selectedId = searchParams.get("tool");
  const selectedTutorial = selectedId
    ? tutorials.find((t) => t.id === selectedId) ?? null
    : null;

  const selectTool = (id: string) => setSearchParams({ tool: id });
  const goBack = () => setSearchParams({});

  const toggleCategory = (cat: string) => {
    setOpenCategory((prev) => (prev === cat ? null : cat));
  };

  if (selectedTutorial) {
    return (
      <PageLayout maxWidth="4xl" className="py-6 md:py-8">
        <TutorialDetail tutorial={selectedTutorial} onBack={goBack} />
      </PageLayout>
    );
  }

  const categories = [
    { key: "fashion", label: "服装工具", icon: <ShirtIcon className="w-5 h-5 text-primary" />, tools: fashionTools },
    { key: "creative", label: "创意工具", icon: <Sparkles className="w-5 h-5 text-primary" />, tools: creativeTools },
  ];

  return (
    <PageLayout maxWidth="6xl" className="py-6 md:py-8">
      <div className="mb-6 md:mb-8 opacity-0 animate-fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          使用教程
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          点击分类查看对应工具的图文教程
        </p>
      </div>

      <div className="space-y-3 md:space-y-4">
        {categories.map((cat, catIdx) => {
          const isOpen = openCategory === cat.key;
          return (
            <div
              key={cat.key}
              className="opacity-0 animate-fade-in"
              style={{ animationDelay: `${100 + catIdx * 100}ms` }}
            >
              {/* 分类标题按钮 */}
              <button
                onClick={() => toggleCategory(cat.key)}
                className={cn(
                  "w-full glass-card px-4 py-4 md:px-6 md:py-5 rounded-xl md:rounded-2xl",
                  "flex items-center justify-between",
                  "active:scale-[0.99] transition-all duration-200",
                  isOpen && "shadow-lg"
                )}
              >
                <div className="flex items-center gap-3">
                  {cat.icon}
                  <span className="text-base md:text-lg font-semibold text-foreground">{cat.label}</span>
                  <span className="text-xs text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full">
                    {cat.tools.length} 个工具
                  </span>
                </div>
                <ChevronRight
                  className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-90"
                  )}
                />
              </button>

              {/* 展开的工具列表 */}
              {isOpen && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                  {cat.tools.map((tool, index) => (
                    <button
                      key={tool.id}
                      onClick={() => selectTool(tool.id)}
                      className="glass-card p-3 md:p-5 rounded-xl md:rounded-2xl hover:shadow-lg transition-shadow duration-200 group relative overflow-hidden text-left active:scale-[0.98] opacity-0 animate-fade-in"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-2.5 md:mb-4 transition-transform group-hover:scale-110">
                        <img src={tool.iconSrc} alt={tool.name} loading="lazy" decoding="async" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 md:mb-2 text-sm md:text-base leading-tight">{tool.name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">{tool.summary}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
};

export default Tutorials;