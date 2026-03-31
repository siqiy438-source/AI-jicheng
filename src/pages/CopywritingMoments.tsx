import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Copy,
  FileText,
  Loader2,
  Paperclip,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import { CreditCostHint } from "@/components/CreditCostHint";
import { InsufficientBalanceDialog } from "@/components/InsufficientBalanceDialog";
import { cn } from "@/lib/utils";
import { generateCopywriting } from "@/lib/zenmux";
import { saveTextWork } from "@/lib/repositories/works";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const FEATURE_CODE = "ai_copywriting";
const AGENT_ID = "moments";
const GENERATION_COST = 10;
const ICON_SRC = "/icons/ai-copywriting-custom.webp";
const MAX_IMAGE_COUNT = 9;

const MOBILE_PROMISES = [
  "3 条候选文案",
  "自动匹配多图内容",
  "可直接复制发布",
] as const;

const QUICK_NOTE_CHIPS = [
  "轻松一点",
  "更生活化",
  "适合晒新品",
  "不要太销售",
  "偏高级感",
  "像日常分享",
] as const;

interface UploadedImage {
  name: string;
  dataUrl: string;
}

interface ParsedCandidate {
  id: string;
  title: string;
  content: string;
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`读取文件失败：${file.name}`));
    reader.readAsDataURL(file);
  });

const parseMomentsCandidates = (rawText: string): ParsedCandidate[] => {
  const normalized = rawText.trim();
  if (!normalized) return [];

  const candidates: ParsedCandidate[] = [];
  const candidateRegex =
    /(?:^|\n)#{1,3}\s*候选\s*([1-3])\s*\n([\s\S]*?)(?=(?:\n#{1,3}\s*候选\s*[1-3]\s*\n)|$)/g;

  for (const match of normalized.matchAll(candidateRegex)) {
    const index = match[1];
    const content = (match[2] || "").trim();
    if (!content) continue;

    candidates.push({
      id: `candidate-${index}`,
      title: `候选 ${index}`,
      content,
    });
  }

  if (candidates.length > 0) {
    return candidates.sort((a, b) => a.id.localeCompare(b.id));
  }

  return [
    {
      id: "candidate-fallback",
      title: "生成结果",
      content: normalized,
    },
  ];
};

const buildGenerationPrompt = (note: string) => {
  const trimmed = note.trim();
  if (!trimmed) {
    return "请根据我上传的这组图片，生成适合直接发布的朋友圈文案。";
  }
  return `请根据我上传的这组图片生成朋友圈文案。补充说明：${trimmed}`;
};

const CopywritingMoments = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultSectionRef = useRef<HTMLElement>(null);
  const noteTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const {
    checkCredits,
    showInsufficientDialog,
    requiredAmount,
    featureName,
    currentBalance,
    goToRecharge,
    dismissDialog,
    refreshBalance,
  } = useCreditCheck();

  const [note, setNote] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultText, setResultText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const candidates = useMemo(() => parseMomentsCandidates(resultText), [resultText]);
  const remainingImageSlots = Math.max(0, MAX_IMAGE_COUNT - uploadedImages.length);
  const hasResults = !isGenerating && candidates.length > 0;

  const scrollToResults = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;
    window.setTimeout(() => {
      resultSectionRef.current?.scrollIntoView({ behavior, block: "start" });
    }, 120);
  }, []);

  useEffect(() => {
    if (!isGenerating && resultText.trim()) {
      scrollToResults("smooth");
    }
  }, [isGenerating, resultText, scrollToResults]);

  useEffect(() => {
    const textarea = noteTextAreaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.max(textarea.scrollHeight, isMobile ? 140 : 160)}px`;
  }, [isMobile, note]);

  useEffect(() => {
    if (!isMobile || typeof window === "undefined" || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const updateKeyboardState = () => {
      const keyboardHeight = window.innerHeight - viewport.height - viewport.offsetTop;
      setIsKeyboardOpen(keyboardHeight > 160);
    };

    updateKeyboardState();
    viewport.addEventListener("resize", updateKeyboardState);
    viewport.addEventListener("scroll", updateKeyboardState);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardState);
      viewport.removeEventListener("scroll", updateKeyboardState);
    };
  }, [isMobile]);

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("请上传图片文件");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (remainingImageSlots <= 0) {
      toast.error(`最多上传 ${MAX_IMAGE_COUNT} 张图片`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const filesToRead = imageFiles.slice(0, remainingImageSlots);

    try {
      const nextImages = await Promise.all(
        filesToRead.map(async (file) => ({
          name: file.name,
          dataUrl: await readFileAsDataUrl(file),
        }))
      );
      setUploadedImages((prev) => [...prev, ...nextImages]);
      if (filesToRead.length < imageFiles.length) {
        toast.info(`最多上传 ${MAX_IMAGE_COUNT} 张图片，已保留前 ${MAX_IMAGE_COUNT} 张`);
      }
    } catch (error) {
      console.error("读取图片失败", error);
      toast.error("有图片读取失败，请重试");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const copyContent = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("复制失败", error);
      toast.error("复制失败，请重试");
    }
  };

  const handleCopyAll = async () => {
    const text = candidates
      .map((candidate) => `${candidate.title}\n${candidate.content}`)
      .join("\n\n");
    await copyContent("copy-all", text);
  };

  const applyQuickNoteChip = (chip: string) => {
    setNote((prev) => {
      const trimmed = prev.trim();
      if (trimmed.includes(chip)) return prev;
      if (!trimmed) return chip;
      return `${trimmed}，${chip}`;
    });
  };

  const runGeneration = useCallback(async () => {
    if (isGenerating) return;
    if (uploadedImages.length === 0) {
      toast.error("请至少上传一张图片");
      return;
    }
    if (!checkCredits(FEATURE_CODE, GENERATION_COST)) return;

    const prompt = buildGenerationPrompt(note);
    const imagePayload = uploadedImages.map((image) => image.dataUrl);

    noteTextAreaRef.current?.blur();
    setIsGenerating(true);
    setResultText("");
    scrollToResults("smooth");

    let fullContent = "";

    try {
      await generateCopywriting(
        prompt,
        AGENT_ID,
        {
          onStart: () => {
            setResultText("");
          },
          onToken: (token) => {
            fullContent += token;
            setResultText(fullContent);
          },
          onComplete: (finalContent) => {
            const normalized = finalContent.trim();
            setResultText(normalized);
            setIsGenerating(false);

            void refreshBalance();

            if (normalized) {
              const titleText = note.trim().slice(0, 24) || `共 ${uploadedImages.length} 张图片`;
              void saveTextWork({
                title: `朋友圈文案：${titleText}`,
                type: "copywriting",
                tool: "AI 文案-朋友圈文案",
                text: normalized,
                metadata: {
                  agentId: AGENT_ID,
                  prompt,
                  imageCount: uploadedImages.length,
                },
              }).catch((error) => {
                console.error("自动保存文案失败", error);
              });
            }
          },
          onError: (error) => {
            console.error("朋友圈文案生成失败", error);
            setIsGenerating(false);
            setResultText("");
            toast.error(error.message || "生成失败，请稍后重试");
          },
        },
        FEATURE_CODE,
        "generate",
        imagePayload
      );
    } catch (error) {
      console.error("朋友圈文案生成失败", error);
      setIsGenerating(false);
      toast.error("生成失败，请稍后重试");
    }
  }, [checkCredits, isGenerating, note, refreshBalance, scrollToResults, uploadedImages]);

  return (
    <PageLayout className="py-4 md:py-8 pb-[calc(var(--mobile-nav-height)+var(--safe-area-bottom)+7rem)] md:pb-8" maxWidth="6xl">
      <div className="md:hidden mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/copywriting")}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <img src={ICON_SRC} alt="朋友圈文案" className="w-6 h-6 object-contain flex-shrink-0" />
            <span className="font-semibold text-foreground text-sm truncate">朋友圈文案</span>
          </div>
          <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-700">
            10 积分/次
          </span>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-border/60 bg-[linear-gradient(135deg,rgba(255,247,237,0.9),rgba(255,255,255,0.84))] px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/70">Moments Copy</p>
              <p className="mt-1 text-base font-semibold text-foreground">上传图片，直接出朋友圈文案</p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                适合上新、日常分享、门店记录。先传图，再补一句你想要的感觉。
              </p>
            </div>
            <div className="shrink-0 rounded-[18px] bg-white/80 px-3 py-2 text-right shadow-sm">
              <p className="text-[11px] text-muted-foreground">当前已选</p>
              <p className="text-sm font-semibold text-foreground">{uploadedImages.length}/{MAX_IMAGE_COUNT}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {MOBILE_PROMISES.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/70 bg-white/72 px-2.5 py-1 text-[11px] font-medium text-foreground/80"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>图片准备进度</span>
              <span>{uploadedImages.length}/{MAX_IMAGE_COUNT}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-300 transition-all duration-300"
                style={{ width: `${(uploadedImages.length / MAX_IMAGE_COUNT) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate("/copywriting")}
        className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">返回文案工具</span>
      </button>

      <div className="hidden md:flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center">
            <img src={ICON_SRC} alt="朋友圈文案" className="w-14 h-14 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">朋友圈文案</h1>
            <p className="text-muted-foreground text-sm">上传一组图片，自动生成 3 条适合直接发布的朋友圈文案</p>
          </div>
        </div>
        <CreditCostHint label="10 积分/次" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6">
        <section className="glass-card rounded-2xl p-4 md:p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">步骤 1</span>
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">上传图片并补充说明</h2>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            className={cn(
              "w-full min-h-[132px] rounded-2xl border border-dashed border-border/70 bg-background/70 px-4 py-6 text-left transition-colors",
              "hover:border-primary/40 hover:bg-background",
              isGenerating && "opacity-60 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Paperclip className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-foreground">上传图片</div>
                <p className="text-sm text-muted-foreground">支持最多 {MAX_IMAGE_COUNT} 张图片，一次生成 3 条朋友圈文案</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
              <span>建议上传同一组场景或同一次发布要用的图片</span>
              <span>最多 {MAX_IMAGE_COUNT} 张</span>
            </div>
          </button>

          {uploadedImages.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">已上传 {uploadedImages.length}/{MAX_IMAGE_COUNT} 张图片</span>
                {uploadedImages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setUploadedImages([])}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    清空
                  </button>
                )}
              </div>
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scrollbar-none sm:grid sm:grid-cols-3 sm:overflow-visible">
                {uploadedImages.map((image, index) => (
                  <div
                    key={`${image.name}-${index}`}
                    className="relative min-w-[148px] snap-start overflow-hidden rounded-2xl border border-border/60 bg-background/80 sm:min-w-0"
                  >
                    <img src={image.dataUrl} alt={image.name} className="h-36 w-full object-cover sm:h-32" />
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="truncate text-xs text-muted-foreground">{image.name}</span>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="rounded-full p-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
                        aria-label={`移除 ${image.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <label htmlFor="moments-note" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">步骤 2</span>
              <FileText className="w-4 h-4 text-primary" />
              可选补充说明
            </label>
            <textarea
              id="moments-note"
              ref={noteTextAreaRef}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={isGenerating}
              onFocus={() => {
                if (!isMobile) return;
                window.setTimeout(() => {
                  noteTextAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 180);
              }}
              placeholder="比如：想要轻松一点、适合晒新品、偏生活感、不要太销售感。"
              rows={6}
              className="w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm leading-6 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-2 text-xs text-muted-foreground">不填也可以，系统会根据图片内容直接生成朋友圈文案。</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_NOTE_CHIPS.map((chip) => {
                const isActive = note.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => applyQuickNoteChip(chip)}
                    disabled={isGenerating}
                    aria-pressed={isActive}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                      isActive
                        ? "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
                        : "bg-secondary/55 text-muted-foreground hover:bg-secondary hover:text-foreground",
                      isGenerating && "cursor-not-allowed opacity-60"
                    )}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-secondary/35 px-3 py-2.5 md:hidden">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{uploadedImages.length > 0 ? `已选择 ${uploadedImages.length} 张图片` : "至少上传 1 张图片后才能生成"}</span>
              <span>{remainingImageSlots > 0 ? `还能再传 ${remainingImageSlots} 张` : "已达上限"}</span>
            </div>
          </div>

          <div className="mt-5 hidden md:flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {uploadedImages.length > 0 ? `已选择 ${uploadedImages.length} 张图片` : "至少上传 1 张图片后才能生成"}
            </span>
            <button
              type="button"
              onClick={() => void runGeneration()}
              disabled={uploadedImages.length === 0 || isGenerating}
              className={cn(
                "inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all",
                uploadedImages.length > 0 && !isGenerating
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md"
                  : "bg-secondary/60 text-muted-foreground/70 cursor-not-allowed"
              )}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              生成朋友圈文案
            </button>
          </div>
        </section>

        <section ref={resultSectionRef} className="glass-card rounded-2xl p-4 md:p-5 shadow-lg scroll-mt-24">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="mb-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                步骤 3
              </span>
              <h2 className="text-base font-semibold text-foreground">生成结果</h2>
              <p className="text-sm text-muted-foreground">默认返回 3 条候选文案，可直接复制使用</p>
            </div>
            {resultText && !isGenerating && (
              <button
                type="button"
                onClick={() => void runGeneration()}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/60 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                重新生成
              </button>
            )}
          </div>

          {hasResults && (
            <div className="mb-4 rounded-2xl border border-primary/10 bg-primary/[0.04] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">这次生成了 {candidates.length} 条候选文案</p>
                  <p className="mt-1 text-xs text-muted-foreground">先快速浏览，再复制你最顺手的一条去发。</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopyAll()}
                  className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl bg-white/85 px-3 py-2 text-xs text-foreground shadow-sm transition-colors hover:bg-white"
                >
                  {copiedId === "copy-all" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-500">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制全部</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-5">
              <GeneratingLoader size="compact" message="正在生成朋友圈文案..." />
              {resultText && (
                <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground font-sans">
                  {resultText}
                </pre>
              )}
            </div>
          )}

          {!isGenerating && candidates.length > 0 && (
            <div className="space-y-3">
              {candidates.map((candidate) => (
                <article
                  key={candidate.id}
                  className="overflow-hidden rounded-[24px] border border-border/60 bg-background/80 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                >
                  <div className="h-1.5 bg-gradient-to-r from-orange-400/85 via-amber-300/75 to-transparent" />
                  <div className="px-4 py-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                          {candidate.title}
                        </span>
                        <span className="hidden text-[11px] text-muted-foreground sm:inline">适合直接复制发布</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyContent(candidate.id, candidate.content)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/60 transition-colors"
                      >
                        {copiedId === candidate.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-green-500">已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>复制</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">{candidate.content}</div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!isGenerating && candidates.length === 0 && (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/60 px-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">还没有生成结果</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                先上传一组图片，再补充一点你想要的语气或场景，就可以生成 3 条朋友圈文案。
              </p>
            </div>
          )}
        </section>
      </div>

      <InsufficientBalanceDialog
        open={showInsufficientDialog}
        onOpenChange={(open) => {
          if (!open) dismissDialog();
        }}
        balance={currentBalance}
        required={requiredAmount}
        featureName={featureName}
        onRecharge={goToRecharge}
      />

      <div
        className={cn(
          "fixed inset-x-0 bottom-[calc(var(--mobile-nav-height)+var(--safe-area-bottom)+0.5rem)] z-40 px-safe transition-all duration-250 md:hidden",
          isKeyboardOpen ? "pointer-events-none translate-y-6 opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <div className="mx-auto max-w-6xl rounded-[24px] border border-border/70 bg-background/92 px-3 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <span>
              {hasResults
                ? `已生成 ${candidates.length} 条候选文案`
                : uploadedImages.length > 0
                  ? `已选 ${uploadedImages.length}/${MAX_IMAGE_COUNT} 张图片`
                  : "先上传图片再生成"}
            </span>
            <span>{hasResults ? "可继续生成一组" : "10 积分/次"}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasResults ? (
              <button
                type="button"
                onClick={() => scrollToResults("smooth")}
                className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/45"
              >
                查看结果
              </button>
            ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || remainingImageSlots <= 0}
              className={cn(
                "inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 py-2.5 text-sm font-medium text-foreground transition-colors",
                isGenerating || remainingImageSlots <= 0
                  ? "cursor-not-allowed text-muted-foreground/60"
                  : "hover:bg-secondary/45"
              )}
            >
              <Paperclip className="w-4 h-4" />
              {remainingImageSlots > 0 ? "继续上传" : "已达上限"}
            </button>
            )}
            <button
              type="button"
              onClick={() => void runGeneration()}
              disabled={uploadedImages.length === 0 || isGenerating}
              className={cn(
                "inline-flex min-h-[46px] flex-[1.25] items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all",
                uploadedImages.length > 0 && !isGenerating
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                  : "bg-secondary/60 text-muted-foreground/70 cursor-not-allowed"
              )}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? "生成中..." : hasResults ? "重新生成" : "生成文案"}
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CopywritingMoments;
