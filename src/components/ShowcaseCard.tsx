import { useState, useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import type { ShowcaseItem } from "@/data/showcaseData";

interface ShowcaseCardProps {
  item: ShowcaseItem;
  delay?: number;
}

const ImagePreview = ({ src, onClose }: { src: string; onClose: () => void }) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtnRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="图片预览" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <button ref={closeBtnRef} onClick={onClose} aria-label="关闭预览" className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10">
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
      <img src={src} alt="作品预览大图" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
    </div>
  );
};

const Thumb = ({ src, alt, fill = true }: { src: string; alt: string; fill?: boolean }) => {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <>
      {fill ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" className="w-full h-full object-cover cursor-pointer" onClick={() => setPreview(src)} />
      ) : (
        <div className="aspect-[3/4] bg-secondary/20 rounded-xl overflow-hidden">
          <img src={src} alt={alt} loading="lazy" decoding="async" className="w-full h-full object-cover cursor-pointer" onClick={() => setPreview(src)} />
        </div>
      )}
      {preview && <ImagePreview src={preview} onClose={() => setPreview(null)} />}
    </>
  );
};

const BeforeAfter = ({ item }: { item: ShowcaseItem }) => (
  <div className="flex flex-col gap-3">
    <div>
      <div className="text-xs text-muted-foreground mb-1.5">上传</div>
      <div className="grid grid-cols-2 gap-1.5" style={item.beforeImages.length === 3 ? { gridTemplateColumns: "repeat(3, 1fr)" } : undefined}>
        {item.beforeImages.map((img, i) => (
          <Thumb key={i} src={img} alt={`上传原图 ${i + 1}`} fill={false} />
        ))}
      </div>
    </div>
    <div className="flex justify-center">
      <ArrowRight className="w-4 h-4 text-muted-foreground/50 rotate-90" aria-hidden="true" />
    </div>
    <div>
      <div className="text-xs text-primary font-medium mb-1.5">效果</div>
      <div className="grid grid-cols-2 gap-1.5" style={item.afterImages.length === 1 ? { gridTemplateColumns: "1fr" } : undefined}>
        {item.afterImages.map((img, i) => (
          <Thumb key={i} src={img} alt={`AI生成效果图 ${i + 1}`} fill={false} />
        ))}
      </div>
    </div>
  </div>
);

const AfterOnly = ({ item }: { item: ShowcaseItem }) => (
  <div className="space-y-1.5">
    {item.afterImages.map((img, i) => (
      <Thumb key={i} src={img} alt={item.title} fill={false} />
    ))}
  </div>
);

export const ShowcaseCard = memo(({ item, delay = 0 }: ShowcaseCardProps) => {
  const navigate = useNavigate();
  const hasBefore = item.beforeImages.length > 0;

  return (
    <div className="glass-card rounded-2xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
        <h3 className="text-base font-bold sm:text-lg">
          <span className="text-gradient">{item.title}</span>
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 sm:line-clamp-1">{item.description}</p>
      </div>
      <div className="px-4 pb-3 sm:px-5">
        {item.promptText && (
          <div className="mb-2.5 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border/50">
            <div className="text-xs text-muted-foreground mb-0.5">{item.promptLabel || "只需输入一句话"}</div>
            <div className="text-xs text-foreground font-medium">"{item.promptText}"</div>
          </div>
        )}
        {hasBefore ? <BeforeAfter item={item} /> : <AfterOnly item={item} />}
      </div>
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <button
          onClick={() => navigate(item.toolRoute)}
          className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 active:bg-primary/25 transition-colors flex items-center justify-center gap-1.5"
        >
          立即体验
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
