import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import type { ShowcaseItem } from "@/data/showcaseData";

interface ShowcaseCardProps {
  item: ShowcaseItem;
  delay?: number;
}

const ImagePreview = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10">
      <X className="w-5 h-5" />
    </button>
    <img src={src} alt="预览" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
  </div>
);

const Thumb = ({ src, alt }: { src: string; alt: string }) => {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <>
      <img src={src} alt={alt} loading="lazy" decoding="async" className="w-full h-full object-cover cursor-pointer" onClick={() => setPreview(src)} />
      {preview && <ImagePreview src={preview} onClose={() => setPreview(null)} />}
    </>
  );
};

const BeforeAfter = ({ item }: { item: ShowcaseItem }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 min-w-0">
      <div className="text-[10px] text-muted-foreground mb-1">上传</div>
      <div className="flex gap-1">
        {item.beforeImages.map((img, i) => (
          <div key={i} className="aspect-square rounded-lg bg-secondary/30 overflow-hidden flex-1">
            <Thumb src={img} alt="上传图" />
          </div>
        ))}
      </div>
    </div>
    <ArrowRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-3" />
    <div className="flex-1 min-w-0">
      <div className="text-[10px] text-primary font-medium mb-1">效果</div>
      <div className="flex gap-1">
        {item.afterImages.map((img, i) => (
          <div key={i} className="aspect-square rounded-lg bg-secondary/30 overflow-hidden flex-1">
            <Thumb src={img} alt="效果图" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AfterOnly = ({ item }: { item: ShowcaseItem }) => (
  <div className="flex gap-1">
    {item.afterImages.map((img, i) => (
      <div key={i} className="aspect-[4/3] rounded-lg bg-secondary/30 overflow-hidden flex-1">
        <Thumb src={img} alt={item.title} />
      </div>
    ))}
  </div>
);

export const ShowcaseCard = ({ item, delay = 0 }: ShowcaseCardProps) => {
  const navigate = useNavigate();
  const hasBefore = item.beforeImages.length > 0;

  return (
    <div className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
      </div>
      <div className="px-4 pb-3">
        {item.promptText && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50">
            <div className="text-[10px] text-muted-foreground mb-0.5">只需输入一句话</div>
            <div className="text-xs text-foreground font-medium">"{item.promptText}"</div>
          </div>
        )}
        {hasBefore ? <BeforeAfter item={item} /> : <AfterOnly item={item} />}
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate(item.toolRoute)}
          className="w-full py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 active:bg-primary/25 transition-colors flex items-center justify-center gap-1.5"
        >
          立即体验
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
