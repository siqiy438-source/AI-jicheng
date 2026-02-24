import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getCategoryLabel,
  KNOWLEDGE_CATEGORIES,
  KnowledgeBaseItem,
  listKnowledgeBase,
} from "@/lib/repositories/knowledge-base";
import { cn } from "@/lib/utils";

interface KnowledgeBasePopoverProps {
  onInsert: (items: KnowledgeBaseItem[]) => void;
  disabled?: boolean;
}

export const KnowledgeBasePopover = ({ onInsert, disabled }: KnowledgeBasePopoverProps) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listKnowledgeBase()
      .then(setItems)
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = activeCategory === "all"
    ? items
    : items.filter(i => i.category === activeCategory);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleInsert = () => {
    const toInsert = items.filter(i => selected.has(i.id));
    if (toInsert.length === 0) return;
    onInsert(toInsert);
    setSelected(new Set());
    setOpen(false);
  };

  const usedCategories = KNOWLEDGE_CATEGORIES.filter(c =>
    items.some(i => i.category === c.value)
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
        title="调用知识库"
      >
        <BookOpen className="w-5 h-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
            <DialogTitle className="text-base">调用知识库</DialogTitle>
          </DialogHeader>

          {/* 分类筛选 */}
          {usedCategories.length > 1 && (
            <div className="flex gap-2 px-4 py-2 overflow-x-auto shrink-0 border-b scrollbar-none">
              <button
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  activeCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                全部
              </button>
              {usedCategories.map(c => (
                <button
                  key={c.value}
                  onClick={() => setActiveCategory(c.value)}
                  className={cn(
                    "shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    activeCategory === c.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* 条目列表 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
            {loading && (
              <p className="text-sm text-muted-foreground text-center py-8">加载中...</p>
            )}
            {!loading && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                暂无知识库条目，请先在「我的素材」中添加
              </p>
            )}
            {!loading && filtered.map(item => (
              <label
                key={item.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                  selected.has(item.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary/30"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggle(item.id)}
                  className="mt-0.5 shrink-0 accent-primary"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-muted-foreground">
                      {getCategoryLabel(item.category)}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* 底部操作 */}
          <div className="px-4 py-3 border-t shrink-0 flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {selected.size > 0 ? `已选 ${selected.size} 条` : "请选择要插入的条目"}
            </span>
            <button
              onClick={handleInsert}
              disabled={selected.size === 0}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 transition-opacity"
            >
              插入到对话
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
