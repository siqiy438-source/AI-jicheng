import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image-utils";
import { generateImage } from "@/lib/ai-image";
import {
  analyzeGenerativeReport,
  exportGenerativeReportToPPTX,
  REPORT_DEPTH_OPTIONS,
  REPORT_DOMAIN_OPTIONS,
  type GenerativeReportDocument,
  type ReportDepth,
  type ReportDomain,
  type VisualFocusArea,
} from "@/lib/generative-report";
import { useToast } from "@/hooks/use-toast";

type ReportPhase = "config" | "ready" | "analyzing" | "review" | "exporting";

interface UploadedImage {
  image_id: string;
  url: string;
  label: string;
}

async function convertImageUrlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("图解页下载失败");
  }

  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("图解页格式转换失败"));
    reader.readAsDataURL(blob);
  });
}

function getDomainNarrative(domain: ReportDomain): string {
  if (domain === "veterinary") return "宠物医疗沟通";
  if (domain === "dental") return "口腔治疗沟通";
  if (domain === "k12_education") return "学习诊断沟通";
  if (domain === "gym") return "训练恢复沟通";
  return "通用诊断沟通";
}

function toKeyPoint(input: string, max = 18): string {
  const normalized = input
    .replace(/\.\.\.|…+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "重点待补充";

  const firstClause =
    normalized
      .split(/[。；;，,、:\n]/)
      .map((part) => part.trim())
      .find((part) => part.length >= 2) || normalized;

  const concise = firstClause.slice(0, max).replace(/[。；;，,:：!?！？]+$/g, "").trim();
  return concise || "重点待补充";
}

function readExplanationTriples(slide: GenerativeReportDocument["slides"][number]) {
  const lines = (slide.plain_language_explanation || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const pick = (prefix: string) => {
    const hit = lines.find((line) => line.startsWith(prefix));
    if (!hit) return "";
    return hit.replace(new RegExp(`^${prefix}[:：]?\\s*`), "").trim();
  };

  const observe =
    pick("本图重点") ||
    pick("本图观察") ||
    lines[0] ||
    `重点在${formatFocusAreaText(slide.visual_focus_area)}，请重点关注。`;

  const action = slide.action_items[0] || "已按计划进行处理和跟进。";

  const result =
    pick("当前建议") ||
    lines[2] ||
    slide.action_items[1] ||
    "目前状态正在变化中，建议继续观察。";

  const followup = slide.key_metaphor?.trim() || slide.action_items[1] || "按计划继续复查";

  return {
    observe: toKeyPoint(observe, 16),
    action: toKeyPoint(action, 16),
    result: toKeyPoint(result, 16),
    followup: toKeyPoint(followup, 16),
  };
}

function buildHandDrawnPagePrompt(params: {
  domain: ReportDomain;
  hospitalName: string;
  globalNote?: string;
  title: string;
  focusArea: string;
  observe: string;
  action: string;
  result: string;
  followup: string;
}): string {
  return [
    "请把参考图做成一张 AI PPT 风格手绘图解页（4:3 横版，固定比例）。",
    "必须保留参考图主体，但左侧图片宽度控制在25%-30%，不要超过三分之一画面。",
    "右侧至少70%画面用于文字重点，采用便签+箭头+图标布局。",
    "只保留与诊断相关的信息，不要出现与内容无关的说明文字。",
    "禁止在图里写：场景、机构、整篇说明、页码、第几页、共几页。",
    "文案用4条重点短句，每条8-18字，句子必须完整，禁止省略号。",
    "可以有留白，阅读要清楚。",
    `背景理解（不要直接照抄）：${params.globalNote || "请用通俗方式解释这张图"}`,
    `页面标题：${params.title}`,
    `重点区域：${params.focusArea}`,
    `短句1：${params.observe}`,
    `短句2：${params.action}`,
    `短句3：${params.result}`,
    `短句4：${params.followup}`,
  ].join("\n");
}


function buildCoverImagePrompt(params: {
  domain: ReportDomain;
  coverTitle: string;
  hospitalName: string;
  globalNote?: string;
}): string {
  return [
    "请生成一张手绘风 PPT 封面图（4:3 横版，文生图）。",
    "风格：温暖、专业、可爱，适合给普通用户阅读。",
    "版面：标题醒目，留白干净，插画点缀，不要密集段落。",
    "文字必须是简体中文，禁止英文。",
    `主标题：${params.coverTitle}`,
    `机构名称：${params.hospitalName || "某某医院"}`,
    `主题关键词：${params.globalNote || getDomainNarrative(params.domain)}`,
  ].join("\n");
}

function buildClosingImagePrompt(params: {
  summary: string;
  hospitalName: string;
}): string {
  return [
    "请生成一张手绘风 PPT 总结页（4:3 横版，文生图）。",
    "风格：收尾总结感，清晰、简洁、友好。",
    "版面：一句总结标题 + 3条重点结论，不要大段文字。",
    "文字必须是简体中文，禁止英文，禁止无关信息。",
    `总结内容：${params.summary || "本次报告已完成，建议按计划复查并持续观察变化。"}`,
    `落款机构：${params.hospitalName || "某某医院"}`,
  ].join("\n");
}

function getPrimaryAssetForSlide(
  report: GenerativeReportDocument,
  slide: GenerativeReportDocument["slides"][number],
) {
  const firstRef = slide.image_refs?.[0];
  if (!firstRef) return null;
  return report.assets.images.find((asset) => asset.image_id === firstRef.image_id) || null;
}

const GenerativeReport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<ReportPhase>("config");
  const [reportDepth, setReportDepth] = useState<ReportDepth>(6);
  const [domain, setDomain] = useState<ReportDomain>("veterinary");
  const [userNote, setUserNote] = useState("");
  const [reportTitle, setReportTitle] = useState("AI 生成式报告");
  const [coverTitle, setCoverTitle] = useState("小白的生成式报告");
  const [hospitalName, setHospitalName] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [report, setReport] = useState<GenerativeReportDocument | null>(null);
  const [analysisWarning, setAnalysisWarning] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<{ current: number; total: number } | null>(null);
  const [isGeneratingSlideId, setIsGeneratingSlideId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const selectedDepth = useMemo(
    () => REPORT_DEPTH_OPTIONS.find((option) => option.depth === reportDepth),
    [reportDepth],
  );

  const generatedCount = report?.slides.filter((slide) => Boolean(slide.explanation_image_url)).length || 0;
  const allSlidesReady = Boolean(report) && generatedCount === (report?.slides.length || 0);

  const canAnalyze =
    images.length > 0 &&
    hospitalName.trim().length > 0 &&
    phase !== "analyzing" &&
    phase !== "exporting" &&
    !isGeneratingSlideId;

  const canExport = Boolean(report) && phase === "review" && allSlidesReady && !isGeneratingSlideId;

  const runAnalysis = async (nextImages?: UploadedImage[]) => {
    const activeImages = nextImages ?? images;
    if (!activeImages.length) return;

    setPhase("analyzing");
    setAnalysisProgress({ current: 0, total: activeImages.length });

    try {
      const mergedUserNote = [
        userNote.trim(),
        hospitalName.trim() ? `报告封面机构：${hospitalName.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const result = await analyzeGenerativeReport({
        images: activeImages.map((item) => item.url),
        imageLabels: activeImages.map((item) => item.label),
        domain,
        userNote: mergedUserNote || undefined,
        reportDepth,
        analysisLevel: reportDepth === 8 ? 8 : reportDepth === 6 ? 6 : 4,
        onProgress: (current, total) => setAnalysisProgress({ current, total }),
      });

      setReport(result.report);
      setPhase("review");
      setAnalysisWarning(result.usedFallback ? result.message || "当前为本地草稿结果，非真实 AI 视觉分析" : null);

      if (result.usedFallback) {
        toast({
          title: "已生成可编辑草稿",
          description: result.message || "AI 暂时不可用，先给你一个结构化草稿。",
        });
      } else {
        toast({
          title: "分析完成",
          description: "现在可以按页生成手绘页面，满意后再导出 PPT。",
        });
      }
    } catch (error) {
      setPhase(images.length > 0 ? "ready" : "config");
      setAnalysisWarning(null);
      toast({
        title: "分析失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setAnalysisProgress(null);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setPhase("ready");

    const picked = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!picked.length) {
      setPhase("config");
      setAnalysisWarning(null);
      toast({
        title: "上传失败",
        description: "请上传图片格式文件。",
        variant: "destructive",
      });
      return;
    }

    try {
      const processed = await Promise.all(
        picked.map(async (file, index) => {
          const base64 = await compressImage(file, {
            maxWidth: 1400,
            maxHeight: 1400,
            quality: 0.82,
            mimeType: "image/jpeg",
          });

          return {
            image_id: `img_${index + 1}`,
            url: base64,
            label: `图片${index + 1}`,
          };
        }),
      );

      setImages(processed);
      setReport(null);
      setAnalysisWarning(null);
      setPreviewImage(null);
      setPhase("ready");

      toast({
        title: "照片已准备好",
        description: "请确认后点击“开始分析”，系统才会执行 AI 分析。",
      });
    } catch (error) {
      setPhase("config");
      toast({
        title: "图片处理失败",
        description: error instanceof Error ? error.message : "请重新上传图片",
        variant: "destructive",
      });
    }
  };


  const handleUpdateSummary = (nextValue: string) => {
    setReport((prev) => (prev ? { ...prev, summary: nextValue } : prev));
  };

  const handleUpdateSlide = (
    slideId: string,
    field: "title" | "plain_language_explanation" | "key_metaphor" | "visual_focus_area",
    value: string,
  ) => {
    setReport((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        slides: prev.slides.map((slide) => {
          if (slide.slide_id !== slideId) return slide;

          const baseSlide = {
            ...slide,
            explanation_image_url: undefined,
          };

          if (field === "visual_focus_area") {
            return { ...baseSlide, visual_focus_area: value.trim() || "重点区域待确认" };
          }
          return { ...baseSlide, [field]: value };
        }),
      };
    });
  };

  const handleUpdateActions = (slideId: string, value: string) => {
    const items = value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);

    setReport((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        slides: prev.slides.map((slide) =>
          slide.slide_id === slideId
            ? {
                ...slide,
                explanation_image_url: undefined,
                action_items: items.length > 0 ? items : ["补充操作建议", "确认后生成 PPT"],
              }
            : slide,
        ),
      };
    });
  };

  const handleGenerateSinglePage = async (slideId: string) => {
    if (!report) return;

    const slide = report.slides.find((item) => item.slide_id === slideId);
    if (!slide) return;

    const sourceAsset = getPrimaryAssetForSlide(report, slide);
    if (!sourceAsset?.url) {
      toast({
        title: "未找到原图",
        description: "请先确认该页已关联原图。",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSlideId(slideId);

    try {
      const brief = readExplanationTriples(slide);
      const prompt = buildHandDrawnPagePrompt({
        domain,
        hospitalName: hospitalName.trim(),
        globalNote: userNote.trim() || undefined,
        title: slide.title,
        focusArea: toKeyPoint(formatFocusAreaText(slide.visual_focus_area), 12),
        observe: brief.observe,
        action: brief.action,
        result: brief.result,
        followup: brief.followup,
      });

      const result = await generateImage({
        prompt,
        images: [sourceAsset.url],
        aspectRatio: "4:3",
        line: "standard",
        resolution: "2k",
      });

      if (!result.success) {
        throw new Error(result.error || "图解页生成失败");
      }

      let imageData = result.imageBase64;
      if (!imageData && result.imageUrl) {
        imageData = await convertImageUrlToDataUrl(result.imageUrl);
      }

      if (!imageData) {
        throw new Error("未返回图解页图片");
      }

      setReport((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          slides: prev.slides.map((item) =>
            item.slide_id === slideId
              ? {
                  ...item,
                  explanation_image_url: imageData,
                }
              : item,
          ),
        };
      });

      toast({
        title: `第 ${slide.page_number} 页已生成`,
        description: "你可以先点“查看页面”，满意后再导出。",
      });
    } catch (error) {
      toast({
        title: "页面生成失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSlideId(null);
    }
  };

  const handleExportPpt = async () => {
    if (!report) return;

    if (!allSlidesReady) {
      const missing = report.slides.find((slide) => !slide.explanation_image_url);
      toast({
        title: "请先逐页生成",
        description: `第 ${missing?.page_number || 1} 页还没生成，请先点击该页“生成本页”。`,
        variant: "destructive",
      });
      return;
    }

    setPhase("exporting");

    try {
      let exportReport = report;
      const needCover = !report.cover_generated_image_url;
      const needClosing = !report.closing_generated_image_url;

      if (needCover || needClosing) {
        toast({
          title: "正在准备封面与结尾页",
          description: "将通过文生图自动补齐第一页和最后一页。",
        });

        const nextReport = structuredClone(report) as GenerativeReportDocument;

        if (needCover) {
          const coverResult = await generateImage({
            prompt: buildCoverImagePrompt({
              domain,
              coverTitle: coverTitle || "小白的生成式报告",
              hospitalName: hospitalName || "某某医院",
              globalNote: userNote.trim() || undefined,
            }),
            aspectRatio: "4:3",
            line: "standard",
            resolution: "2k",
          });

          if (!coverResult.success) {
            throw new Error(coverResult.error || "封面生成失败");
          }

          let coverImage = coverResult.imageBase64;
          if (!coverImage && coverResult.imageUrl) {
            coverImage = await convertImageUrlToDataUrl(coverResult.imageUrl);
          }
          if (!coverImage) {
            throw new Error("封面图片为空");
          }
          nextReport.cover_generated_image_url = coverImage;
        }

        if (needClosing) {
          const closingResult = await generateImage({
            prompt: buildClosingImagePrompt({
              summary: nextReport.summary,
              hospitalName: hospitalName || "某某医院",
            }),
            aspectRatio: "4:3",
            line: "standard",
            resolution: "2k",
          });

          if (!closingResult.success) {
            throw new Error(closingResult.error || "总结页生成失败");
          }

          let closingImage = closingResult.imageBase64;
          if (!closingImage && closingResult.imageUrl) {
            closingImage = await convertImageUrlToDataUrl(closingResult.imageUrl);
          }
          if (!closingImage) {
            throw new Error("总结页图片为空");
          }
          nextReport.closing_generated_image_url = closingImage;
        }

        setReport(nextReport);
        exportReport = nextReport;
      }

      await exportGenerativeReportToPPTX(exportReport, reportTitle || "AI 生成式报告", {
        coverTitle: coverTitle || "小白的生成式报告",
        hospitalName: hospitalName || "某某医院",
        includeCover: true,
        includeClosing: true,
        handDrawnFont: "STKaiti",
        preferFullPageIllustration: true,
      });
      setPhase("review");
      toast({
        title: "导出成功",
        description: `PPT 已下载到本地（共 ${exportReport.slides.length + 2} 页）。`,
      });
    } catch (error) {
      setPhase("review");
      toast({
        title: "导出失败",
        description: error instanceof Error ? error.message : "请稍后再试",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setPhase("config");
    setImages([]);
    setReport(null);
    setAnalysisWarning(null);
    setAnalysisProgress(null);
    setIsGeneratingSlideId(null);
    setPreviewImage(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const getAssetById = (imageId: string) => report?.assets.images.find((item) => item.image_id === imageId);

  return (
    <PageLayout maxWidth="6xl" className="py-6 md:py-8">
      <div className="mb-5 flex items-center justify-between gap-3 opacity-0 animate-fade-in">
        <button
          onClick={() => navigate("/creative-tools")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回创意工具
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-primary/80" />
          先确认再分析 · 点哪页生成哪页
        </div>
      </div>

      <section className="glass-card rounded-2xl p-4 md:p-6 mb-5 md:mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "40ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              生成式报告
            </h1>
            <p className="text-sm text-muted-foreground mt-1">先出分析草稿，再按页生成手绘页面，满意后导出 PPT。</p>
            {images.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                当前已上传 {images.length} 张图，导出总页数为 {images.length + 2}（封面 1 页 + 内容 {images.length} 页 + 总结 1 页）。
              </p>
            )}
          </div>
          <div className="text-xs text-muted-foreground bg-background/70 border border-border rounded-lg px-3 py-2">
            当前档位：<span className="text-foreground font-medium">{selectedDepth?.title}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {REPORT_DEPTH_OPTIONS.map((option) => (
            <button
              key={option.depth}
              onClick={() => {
                setReportDepth(option.depth);
                if (images.length > 0 && phase === "review") {
                  runAnalysis();
                }
              }}
              disabled={phase === "analyzing" || phase === "exporting" || Boolean(isGeneratingSlideId)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all",
                reportDepth === option.depth
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                  : "border-border bg-background/70 hover:border-primary/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm md:text-base font-semibold text-foreground">{option.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{option.subtitle}</p>
                </div>
                {reportDepth === option.depth && <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />}
              </div>
              <div className="mt-3 space-y-1">
                {option.strengths.map((strength) => (
                  <p key={strength} className="text-xs text-foreground/80">· {strength}</p>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-2xl p-4 md:p-6 mb-5 md:mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">应用场景</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REPORT_DOMAIN_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setDomain(item.value)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left transition-colors",
                    domain === item.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background/60 hover:border-primary/40",
                  )}
                >
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">角色：{item.role}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">你的备注（可选）</p>
            <Textarea
              value={userNote}
              onChange={(event) => setUserNote(event.target.value)}
              placeholder="例如：整份报告希望重点解释图片里发生了什么、我们做了什么、后续怎么配合。"
              className="min-h-[120px]"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">封面标题</p>
            <Input
              value={coverTitle}
              onChange={(event) => setCoverTitle(event.target.value)}
              placeholder="小白的生成式报告"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">医院名称（必填）</p>
            <Input
              value={hospitalName}
              onChange={(event) => setHospitalName(event.target.value)}
              placeholder="例如：某某医院"
            />
            <p className="text-[11px] text-muted-foreground mt-1">会显示在 PPT 首页，并参与图解页生成语境。</p>
          </div>
        </div>

        <div className="mt-4 border border-dashed border-border rounded-xl p-4 bg-background/60">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className="text-sm font-medium text-foreground">上传图片后可先预览，确认后再开始分析（支持单图/多图）</p>
            <div className="flex items-center gap-2">
              {images.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <X className="w-3.5 h-3.5 mr-1" />
                  清空重来
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={phase === "analyzing" || phase === "exporting" || Boolean(isGeneratingSlideId)}
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                上传照片
              </Button>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleUpload(event.target.files)}
          />

          <div className="mb-3">
            <p className="text-sm font-medium text-foreground mb-1">整篇 PPT 想讲什么（可选，建议填）</p>
            <Textarea
              value={userNote}
              onChange={(event) => setUserNote(event.target.value)}
              placeholder="例如：这组图片主要想告诉家属，当前发生了什么、我们做了什么、接下来怎么配合。"
              className="min-h-[84px]"
            />
            <p className="text-[11px] text-muted-foreground mt-1">这段会作为全局上下文，能让 AI 分析更贴近你要讲的重点。</p>
          </div>

          {images.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {images.map((image) => (
                  <div key={image.image_id} className="rounded-xl overflow-hidden border border-border bg-background">
                    <img src={image.url} alt={image.label} className="w-full h-24 object-cover" />
                    <div className="px-2 py-1.5 text-[11px] text-muted-foreground">{image.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => runAnalysis()} disabled={!canAnalyze}>
                  {phase === "analyzing" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      分析中
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      确认并开始分析
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  {hospitalName.trim()
                    ? "分析会按医院语境输出给用户看的图解内容。"
                    : "请先填写医院名称后再开始分析。"}
                </p>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">上传后先预览，点击“确认并开始分析”才会执行 AI。</p>
          )}
        </div>
      </section>

      {phase === "analyzing" && (
        <section className="glass-card rounded-2xl p-8 md:p-10 text-center opacity-0 animate-fade-in">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-foreground">
            AI 正在逐张分析图片并生成草稿...
            {analysisProgress ? `（${analysisProgress.current}/${analysisProgress.total}）` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-1">分析完成后，你可以逐页手动生成页面。</p>
        </section>
      )}

      {report && phase === "review" && (
        <section className="glass-card rounded-2xl p-4 md:p-6 opacity-0 animate-fade-in" style={{ animationDelay: "80ms" }}>
          {analysisWarning && (
            <div className="mb-4 rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              ⚠️ {analysisWarning}。建议点击“重新分析”或稍后重试。
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-base font-semibold text-foreground">AI 分析草稿（可编辑）</p>
              <p className="text-xs text-muted-foreground mt-1">请按页点击“生成本页”，满意后再导出。</p>
              <p className="text-xs text-primary mt-1">已生成 {generatedCount}/{report.slides.length} 页</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runAnalysis()}
                disabled={!canAnalyze || Boolean(isGeneratingSlideId)}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                重新分析
              </Button>

              <Button size="sm" onClick={handleExportPpt} disabled={!canExport || phase === "exporting"}>
                {phase === "exporting" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    导出中
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 mr-1" />
                    导出 PPT
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/70 p-3 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">导出文件名</p>
                <Input value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">报告摘要（可编辑）</p>
                <Textarea
                  value={report.summary}
                  onChange={(event) => handleUpdateSummary(event.target.value)}
                  className="min-h-[72px]"
                />
              </div>
            </div>
            {!allSlidesReady && (
              <p className="text-xs text-amber-600 mt-2">仍有未生成页面，请先逐页点击“生成本页”。</p>
            )}
          </div>

          <div className="space-y-4">
            {report.slides.map((slide) => {
              const focusArea = formatFocusAreaText(slide.visual_focus_area);
              const actionText = slide.action_items.join("\n");
              const generatingThisSlide = isGeneratingSlideId === slide.slide_id;

              return (
                <article key={slide.slide_id} className="rounded-xl border border-border bg-background/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">第 {slide.page_number} 页</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">{slide.slide_type}</span>
                      {slide.explanation_image_url ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">已生成</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">待生成</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleGenerateSinglePage(slide.slide_id)}
                        disabled={Boolean(isGeneratingSlideId) || phase === "exporting"}
                      >
                        {generatingThisSlide ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            生成中
                          </>
                        ) : (
                          <>
                            <WandSparkles className="w-3.5 h-3.5 mr-1" />
                            生成本页
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPreviewImage({
                            url: slide.explanation_image_url || "",
                            title: `${slide.title} · 手绘图解页`,
                          })
                        }
                        disabled={!slide.explanation_image_url}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        查看页面
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">页面标题</p>
                      <Input
                        value={slide.title}
                        onChange={(event) => handleUpdateSlide(slide.slide_id, "title", event.target.value)}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">建议重点看哪里</p>
                      <Input
                        value={focusArea}
                        onChange={(event) => handleUpdateSlide(slide.slide_id, "visual_focus_area", event.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">这页想对用户说明什么</p>
                      <Textarea
                        value={slide.plain_language_explanation}
                        onChange={(event) =>
                          handleUpdateSlide(slide.slide_id, "plain_language_explanation", event.target.value)
                        }
                        className="min-h-[84px]"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">补充说明（可选）</p>
                      <Textarea
                        value={slide.key_metaphor}
                        onChange={(event) => handleUpdateSlide(slide.slide_id, "key_metaphor", event.target.value)}
                        className="min-h-[84px]"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">建议下一步怎么做（每行一条）</p>
                      <Textarea
                        value={actionText}
                        onChange={(event) => handleUpdateActions(slide.slide_id, event.target.value)}
                        className="min-h-[84px]"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {slide.image_refs.map((ref) => {
                      const asset = getAssetById(ref.image_id);
                      if (!asset) return null;
                      return (
                        <div
                          key={`${slide.slide_id}-${ref.image_id}`}
                          className="inline-flex items-center gap-2 bg-secondary/60 rounded-lg px-2 py-1.5"
                        >
                          <img src={asset.url} alt={asset.label || ref.image_id} className="w-8 h-8 rounded object-cover" />
                          <span className="text-xs text-muted-foreground">{asset.label || ref.image_id}</span>
                        </div>
                      );
                    })}

                    {slide.explanation_image_url && (
                      <div className="inline-flex items-center gap-2 bg-primary/10 rounded-lg px-2 py-1.5">
                        <img src={slide.explanation_image_url} alt="图解页" className="w-8 h-8 rounded object-cover" />
                        <span className="text-xs text-primary">已生成图解页</span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] bg-background rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{previewImage.title}</p>
              <Button variant="ghost" size="sm" onClick={() => setPreviewImage(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-60px)]">
              <img src={previewImage.url} alt={previewImage.title} className="w-full h-auto rounded-xl border border-border" />
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

function formatFocusAreaText(value: VisualFocusArea): string {
  if (typeof value === "string") {
    return value;
  }
  const coord = `x:${value.x}, y:${value.y}, w:${value.width}, h:${value.height}`;
  return value.description ? `${value.description} (${coord})` : coord;
}

export default GenerativeReport;
