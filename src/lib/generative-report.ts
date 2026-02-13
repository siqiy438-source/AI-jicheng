import { supabase, supabaseAnonKey } from "./supabase";

export type ReportDomain = "dental" | "veterinary" | "k12_education" | "gym" | "general";
export type ReportAnalysisLevel = 4 | 6 | 8;
export type ReportDepth = number;

export interface ReportDepthOption {
  depth: ReportAnalysisLevel;
  title: string;
  subtitle: string;
  strengths: string[];
}

export interface ReportDomainOption {
  value: ReportDomain;
  label: string;
  role: string;
}

export interface AnalyzeGenerativeReportParams {
  images: string[];
  imageLabels?: string[];
  domain: ReportDomain;
  userNote?: string;
  reportDepth: ReportDepth;
  analysisLevel?: ReportAnalysisLevel;
  onProgress?: (current: number, total: number) => void;
}

export interface AnalyzeGenerativeReportResult {
  report: GenerativeReportDocument;
  usedFallback: boolean;
  message?: string;
}

export interface ReportImageAsset {
  image_id: string;
  url: string;
  label?: string;
}

export type VisualFocusArea =
  | string
  | {
      description?: string;
      x: number;
      y: number;
      width: number;
      height: number;
    };

export interface ReportImageRef {
  image_id: string;
  note?: string;
  crop_bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ReportComparePair {
  before_image_id: string;
  after_image_id: string;
  improvement_points: string[];
  advantages: string[];
}

export interface GenerativeReportSlide {
  slide_id: string;
  page_number: number;
  slide_type: "overview" | "finding" | "comparison" | "action" | "summary";
  title: string;
  visual_focus_area: VisualFocusArea;
  plain_language_explanation: string;
  key_metaphor: string;
  action_items: string[];
  image_refs: ReportImageRef[];
  explanation_image_url?: string;
  compare_pair?: ReportComparePair;
}

export interface GenerativeReportDocument {
  version: "1.0";
  domain: ReportDomain;
  report_depth: ReportDepth;
  generated_at: string;
  summary: string;
  cover_generated_image_url?: string;
  closing_generated_image_url?: string;
  assets: {
    images: ReportImageAsset[];
  };
  slides: GenerativeReportSlide[];
}

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://kzdjqqinkonqlclbwleh.supabase.co";
const CHAT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-chat`;

const DOMAIN_CONFIG: Record<ReportDomain, { label: string; role: string; audience: string }> = {
  dental: {
    label: "口腔健康",
    role: "牙医",
    audience: "患者与家属",
  },
  veterinary: {
    label: "宠物医疗",
    role: "兽医",
    audience: "宠物主人",
  },
  k12_education: {
    label: "K12 教育",
    role: "老师",
    audience: "学生与家长",
  },
  gym: {
    label: "健身训练",
    role: "健身教练",
    audience: "学员",
  },
  general: {
    label: "通用分析",
    role: "专业顾问",
    audience: "普通用户",
  },
};

export const REPORT_DEPTH_OPTIONS: ReportDepthOption[] = [
  {
    depth: 4,
    title: "4 页 · 快速版",
    subtitle: "快速出稿，适合首次沟通",
    strengths: ["生成速度快", "结论清晰", "适合轻量讲解"],
  },
  {
    depth: 6,
    title: "6 页 · 深度版",
    subtitle: "分析更细，适合专业报告",
    strengths: ["覆盖问题与建议", "支持细节解读", "适合复盘沟通"],
  },
  {
    depth: 8,
    title: "8 页 · 全案对比版",
    subtitle: "信息最完整，对比最清楚",
    strengths: ["前后对比更充分", "结论更有说服力", "适合正式交付"],
  },
];

export const REPORT_DOMAIN_OPTIONS: ReportDomainOption[] = [
  { value: "veterinary", label: "兽医场景", role: DOMAIN_CONFIG.veterinary.role },
  { value: "dental", label: "牙医场景", role: DOMAIN_CONFIG.dental.role },
  { value: "k12_education", label: "教学场景", role: DOMAIN_CONFIG.k12_education.role },
  { value: "gym", label: "健身场景", role: DOMAIN_CONFIG.gym.role },
  { value: "general", label: "通用场景", role: DOMAIN_CONFIG.general.role },
];

const FALLBACK_TITLES: Record<ReportAnalysisLevel, string[]> = {
  4: ["整体概览", "关键变化", "处理说明", "结论建议"],
  6: ["资料概览", "重点发现", "细节观察", "原因解释", "执行建议", "结论追踪"],
  8: [
    "资料概览",
    "核心发现",
    "画面变化一",
    "画面变化二",
    "多图差异对比",
    "优势与风险",
    "行动清单",
    "总结与追踪",
  ],
};

const DOMAIN_METAPHOR: Record<ReportDomain, string> = {
  dental: "就像牙齿在做一次路面修复，坑洼正在被慢慢填平",
  veterinary: "就像小动物的伤口在换季，最难熬的阶段已经过去",
  k12_education: "就像做题时卡在岔路口，现在正在重新走回主干道",
  gym: "就像身体在重新学发力，基础动作开始更稳定了",
  general: "就像系统在做一次体检，关键指标正在恢复到安全区",
};

function getAnalysisLevel(params: AnalyzeGenerativeReportParams): ReportAnalysisLevel {
  if (params.analysisLevel) return params.analysisLevel;
  if (params.reportDepth >= 8) return 8;
  if (params.reportDepth >= 6) return 6;
  return 4;
}

function buildFallbackTitles(depth: number, assets: ReportImageAsset[]): string[] {
  if (depth in FALLBACK_TITLES) {
    return FALLBACK_TITLES[depth as ReportAnalysisLevel];
  }

  const labels = assets.map((asset, index) => asset.label || `图片${index + 1}`);
  return Array.from({ length: depth }, (_, index) => {
    const label = labels[index] || `图片${index + 1}`;
    if (index === 0) return `${label}：本页概览`;
    if (index === depth - 1) return `${label}：结论与建议`;
    return `${label}：关键变化说明`;
  });
}

function toUserFriendlyText(input: string): string {
  return input
    .replace(/[A-Za-z]{3,}/g, "")
    .replace(/[{}\[\]<>]/g, "")
    .replace(/病灶|病理|病变|并发症|组织坏死|炎症反应/g, "关键变化")
    .replace(/突发状况|急性风险|危急情况/g, "需要重点留意的变化")
    .replace(/侵入式|创伤性|高危/g, "需要谨慎处理")
    .replace(/\s+/g, " ")
    .trim();
}

function getBeforeAfterLabels(assets: ReportImageAsset[]): { before: string; after: string } {
  const beforeLabeled = assets.find((asset) => {
    const label = (asset.label || "").toLowerCase();
    return label.includes("术前") || label.includes("before") || label.includes("pre");
  });

  const afterLabeled = assets.find((asset) => {
    const label = (asset.label || "").toLowerCase();
    return label.includes("术后") || label.includes("after") || label.includes("post");
  });

  return {
    before: beforeLabeled?.label || assets[0]?.label || "前一阶段",
    after: afterLabeled?.label || assets[assets.length - 1]?.label || "后一阶段",
  };
}

function ensureRichExplanation(params: {
  base: string;
  focusArea: VisualFocusArea;
  actionItems: string[];
  comparePair?: ReportComparePair;
  assets: ReportImageAsset[];
  index: number;
  total: number;
}): string {
  const focusText = toUserFriendlyText(
    typeof params.focusArea === "string"
      ? params.focusArea
      : params.focusArea.description || "关键观察区域",
  );
  const baseText = toUserFriendlyText(params.base || "");
  const actionText = toUserFriendlyText(params.actionItems.slice(0, 3).join("；"));
  const imageLabel = params.assets[params.index]?.label || `图片${params.index + 1}`;

  const observeStarters = ["本图重点", "这张图里", "当前画面", "你先看这里"];
  const causeStarters = ["可能原因", "出现这个情况", "这类变化通常", "背后常见原因"];
  const suggestStarters = ["当前建议", "下一步做法", "你可以这样做", "后续重点"];

  const baseHint =
    baseText
      .split(/[。；\n]/)
      .map((line) => line.trim())
      .find(Boolean) || "关键区域有明显变化";

  const observeText = `${observeStarters[params.index % observeStarters.length]}：${imageLabel}中${focusText || "关键位置"}最值得关注。`;

  const causeDetail = params.comparePair
    ? toUserFriendlyText(params.comparePair.improvement_points.join("；"))
    : baseHint;
  const causeText = `${causeStarters[params.index % causeStarters.length]}：${causeDetail || "多与局部受力或状态波动有关"}。`;

  const suggestDetail = actionText || "按当前方案继续执行，并在下次复查时重点确认这一区域";
  const suggestText = `${suggestStarters[params.index % suggestStarters.length]}：${suggestDetail}。`;

  return [observeText, causeText, suggestText].join("\n");
}


function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("分析超时，请稍后重试")), timeoutMs);
    promise
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function getDefaultImageLabel(index: number, total: number): string {
  if (total === 1) return "当前图片";
  return `图片${index + 1}`;
}

function createInputAssets(params: AnalyzeGenerativeReportParams): ReportImageAsset[] {
  return params.images.map((image, index) => ({
    image_id: `img_${index + 1}`,
    url: image,
    label: params.imageLabels?.[index] || getDefaultImageLabel(index, params.images.length),
  }));
}

function shouldUseComparison(params: AnalyzeGenerativeReportParams): boolean {
  return getAnalysisLevel(params) >= 6 && params.images.length >= 2;
}

function buildPrompt(params: AnalyzeGenerativeReportParams): string {
  const domainInfo = DOMAIN_CONFIG[params.domain];
  const analysisLevel = getAnalysisLevel(params);
  const needsComparison = shouldUseComparison(params);
  const actualPageCount = Math.max(1, params.images.length || params.reportDepth || 1);
  const imageDescriptions = createInputAssets(params)
    .map((asset) => `${asset.image_id}: ${asset.label}`)
    .join("\n");

  return `你是一位${domainInfo.role}，请为${domainInfo.audience}输出可直接用于 PPT 渲染的结构化 JSON 报告。

输入信息：
- domain: ${params.domain}（${domainInfo.label}）
- report_depth(分析档位): ${analysisLevel}
- output_pages(最终页数): ${actualPageCount}
- image_count: ${params.images.length}
- user_note: ${params.userNote || "无"}
- image_ids:
${imageDescriptions}

强制要求：
1) 只输出 JSON，不要输出解释文字或 Markdown。
2) slides 数组长度必须严格等于 ${actualPageCount}（一张图对应一页）。
3) 每页都必须包含：title、visual_focus_area、plain_language_explanation、key_metaphor、action_items、image_refs。
4) plain_language_explanation 必须是大白话，避免晦涩术语。
5) key_metaphor 必须是生活化比喻，且不可为空。
6) 每一页都只讲“这张图发生了什么”，不要写空泛长段落。
7) 每页用三段短句：本图观察 / 可能原因 / 当前建议。
8) 每页总字数控制在 70-120 字，尽量让普通用户一眼看懂。
9) action_items 必须是 2-4 条可执行建议。
10) 如果 分析档位 >= 6 且 image_count >= 2，则至少有 1 页 slide_type="comparison"，且 compare_pair 必填（before_image_id、after_image_id、improvement_points、advantages）。
11) 不要使用“突发状况、病灶、病理、并发症”这类面向专业人士的术语，改成用户能听懂的表达。
12) image_refs 必须引用给定 image_id，且每页至少关联一张图片。
13) 输出必须是简体中文，禁止英文句子。
14) 除非用户在备注里明确要求，否则不要写“术前/术后/恢复第几张”这类阶段词。
15) 多页内容必须有差异，每页重点与建议不能只是换同义词。

输出 JSON 结构：
{
  "version": "1.0",
  "domain": "${params.domain}",
  "report_depth": ${actualPageCount},
  "generated_at": "ISO8601",
  "summary": "一句话总结",
  "assets": {
    "images": [
      {"image_id":"img_1","url":"原图地址","label":"图片1"}
    ]
  },
  "slides": [
    {
      "slide_id": "slide_1",
      "page_number": 1,
      "slide_type": "overview",
      "title": "页面标题",
      "visual_focus_area": "左侧缝合区域",
      "plain_language_explanation": "大白话说明",
      "key_metaphor": "生活化比喻",
      "action_items": ["建议1","建议2"],
      "image_refs": [{"image_id":"img_1","note":"重点区域"}]
    }
  ]
}

对比要求：${needsComparison ? "必须输出多图差异对比页并填写 compare_pair" : "如果没有多图，不需要 compare_pair"}`;
}

function safeParseJson(input: string): unknown {
  const cleaned = input
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("无法解析返回 JSON");
  }
}

function normalizeFocusArea(value: unknown, fallback: string): VisualFocusArea {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === "object") {
    const data = value as Record<string, unknown>;
    const x = Number(data.x);
    const y = Number(data.y);
    const width = Number(data.width);
    const height = Number(data.height);

    if ([x, y, width, height].every((item) => Number.isFinite(item))) {
      return {
        description: typeof data.description === "string" ? data.description : undefined,
        x,
        y,
        width,
        height,
      };
    }
  }

  return fallback;
}

function normalizeActionItems(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["保持当前方案连续执行", "按计划进行下一次复查"];
  }

  const items = value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 4);

  if (items.length >= 2) return items;
  if (items.length === 1) return [...items, "按当前节奏继续追踪变化"];
  return ["保持当前方案连续执行", "按计划进行下一次复查"];
}

function normalizeImageRefs(
  value: unknown,
  assets: ReportImageAsset[],
  fallbackIndex: number,
): ReportImageRef[] {
  const assetIds = new Set(assets.map((asset) => asset.image_id));
  const refs = Array.isArray(value) ? value : [];

  const normalized = refs
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const imageId = typeof row.image_id === "string" ? row.image_id : "";
      if (!assetIds.has(imageId)) return null;

      const ref: ReportImageRef = { image_id: imageId };
      if (typeof row.note === "string" && row.note.trim()) {
        ref.note = row.note.trim();
      }

      if (row.crop_bbox && typeof row.crop_bbox === "object") {
        const bbox = row.crop_bbox as Record<string, unknown>;
        const x = Number(bbox.x);
        const y = Number(bbox.y);
        const width = Number(bbox.width);
        const height = Number(bbox.height);
        if ([x, y, width, height].every((point) => Number.isFinite(point))) {
          ref.crop_bbox = { x, y, width, height };
        }
      }

      return ref;
    })
    .filter((item): item is ReportImageRef => Boolean(item));

  if (normalized.length > 0) {
    return normalized;
  }

  return [{ image_id: assets[fallbackIndex % assets.length].image_id }];
}

function normalizeComparePair(
  value: unknown,
  assets: ReportImageAsset[],
  fallback: ReportComparePair,
): ReportComparePair {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const row = value as Record<string, unknown>;
  const assetIds = new Set(assets.map((asset) => asset.image_id));

  const before = typeof row.before_image_id === "string" ? row.before_image_id : "";
  const after = typeof row.after_image_id === "string" ? row.after_image_id : "";

  const improvementPoints = Array.isArray(row.improvement_points)
    ? row.improvement_points.map((item) => String(item).trim()).filter(Boolean).slice(0, 4)
    : [];
  const advantages = Array.isArray(row.advantages)
    ? row.advantages.map((item) => String(item).trim()).filter(Boolean).slice(0, 4)
    : [];

  return {
    before_image_id: assetIds.has(before) ? before : fallback.before_image_id,
    after_image_id: assetIds.has(after) ? after : fallback.after_image_id,
    improvement_points:
      improvementPoints.length > 0 ? improvementPoints : fallback.improvement_points,
    advantages: advantages.length > 0 ? advantages : fallback.advantages,
  };
}

function buildFallbackComparePair(assets: ReportImageAsset[]): ReportComparePair {
  const before = assets[0]?.image_id || "img_1";
  const after = assets[assets.length - 1]?.image_id || before;
  return {
    before_image_id: before,
    after_image_id: after,
    improvement_points: ["主要区域状态趋于稳定", "颜色与边缘变化更平缓"],
    advantages: ["恢复趋势清晰", "后续管理更容易执行"],
  };
}

function normalizeReport(
  raw: unknown,
  params: AnalyzeGenerativeReportParams,
): GenerativeReportDocument {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const inputAssets = createInputAssets(params);
  const inputAssetMap = new Map(inputAssets.map((asset) => [asset.image_id, asset]));

  const rawAssets =
    row.assets && typeof row.assets === "object"
      ? ((row.assets as Record<string, unknown>).images as unknown)
      : null;

  const assets = Array.isArray(rawAssets)
    ? rawAssets
        .map((item, index) => {
          if (!item || typeof item !== "object") return null;
          const asset = item as Record<string, unknown>;
          const rawImageId = typeof asset.image_id === "string" ? asset.image_id : `img_${index + 1}`;
          const sourceAsset = inputAssetMap.get(rawImageId) || inputAssets[index];
          const imageId = sourceAsset?.image_id || `img_${index + 1}`;

          const rawUrl = typeof asset.url === "string" ? asset.url : "";
          const url = sourceAsset?.url || (rawUrl.startsWith("data:") ? rawUrl : undefined);

          if (!url) return null;
          return {
            image_id: imageId,
            url,
            label:
              typeof asset.label === "string"
                ? asset.label
                : sourceAsset?.label || getDefaultImageLabel(index, params.images.length),
          };
        })
        .filter((asset): asset is ReportImageAsset => Boolean(asset))
    : [];

  const usableAssets = inputAssets.length
    ? inputAssets.map((inputAsset) => {
        const fromModel = assets.find((asset) => asset.image_id === inputAsset.image_id);
        return {
          image_id: inputAsset.image_id,
          url: inputAsset.url,
          label: fromModel?.label || inputAsset.label,
        };
      })
    : assets;

  const rawSlides = Array.isArray(row.slides) ? row.slides : [];
  const fallbackComparePair = buildFallbackComparePair(usableAssets);
  const pageCount = Math.max(1, params.images.length || params.reportDepth || 1);
  const analysisLevel = getAnalysisLevel(params);
  const fallbackTitles = buildFallbackTitles(pageCount, usableAssets);

  const slides = rawSlides
    .slice(0, pageCount)
    .map((item, index): GenerativeReportSlide => {
      const slide = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const type =
        slide.slide_type === "overview" ||
        slide.slide_type === "finding" ||
        slide.slide_type === "comparison" ||
        slide.slide_type === "action" ||
        slide.slide_type === "summary"
          ? slide.slide_type
          : index === 0
            ? "overview"
            : index === pageCount - 1
              ? "summary"
              : "finding";

      const focusArea = normalizeFocusArea(slide.visual_focus_area, "重点区域待人工确认");
      const actionItems = normalizeActionItems(slide.action_items);
      const comparePair =
        type === "comparison"
          ? normalizeComparePair(slide.compare_pair, usableAssets, fallbackComparePair)
          : undefined;
      const baseExplanation =
        typeof slide.plain_language_explanation === "string" && slide.plain_language_explanation.trim()
          ? slide.plain_language_explanation
          : "从图片看，整体趋势正在向好的方向发展，关键点是按节奏继续观察。";

      return {
        slide_id:
          typeof slide.slide_id === "string" && slide.slide_id.trim()
            ? slide.slide_id
            : `slide_${index + 1}`,
        page_number: index + 1,
        slide_type: type,
        title:
          typeof slide.title === "string" && slide.title.trim()
            ? slide.title
            : fallbackTitles[index] || `第 ${index + 1} 页`,
        visual_focus_area: focusArea,
        plain_language_explanation: ensureRichExplanation({
          base: baseExplanation,
          focusArea,
          actionItems,
          comparePair,
          assets: usableAssets,
          index,
          total: pageCount,
        }),
        key_metaphor:
          typeof slide.key_metaphor === "string" && slide.key_metaphor.trim()
            ? slide.key_metaphor
            : DOMAIN_METAPHOR[params.domain],
        action_items: actionItems,
        image_refs: normalizeImageRefs(slide.image_refs, usableAssets, index),
        explanation_image_url:
          typeof slide.explanation_image_url === "string" && slide.explanation_image_url.trim()
            ? slide.explanation_image_url
            : undefined,
        compare_pair: comparePair,
      };
    });

  while (slides.length < pageCount) {
    const index = slides.length;
    const focusArea = "重点区域待人工确认";
    const actionItems = ["补充关键观察说明", "确认后进入一键生成 PPT"];
    slides.push({
      slide_id: `slide_${index + 1}`,
      page_number: index + 1,
      slide_type: index === 0 ? "overview" : index === pageCount - 1 ? "summary" : "finding",
      title: fallbackTitles[index] || `第 ${index + 1} 页`,
      visual_focus_area: focusArea,
      plain_language_explanation: ensureRichExplanation({
        base: "当前分析可先作为沟通草稿，建议结合你的现场观察继续校正。",
        focusArea,
        actionItems,
        assets: usableAssets,
        index,
        total: pageCount,
      }),
      key_metaphor: DOMAIN_METAPHOR[params.domain],
      action_items: actionItems,
      image_refs: [{ image_id: usableAssets[index % usableAssets.length].image_id }],
    });
  }

  if (analysisLevel >= 6 && usableAssets.length >= 2 && !slides.some((slide) => slide.slide_type === "comparison")) {
    const compareIndex = Math.min(2, slides.length - 2);
    slides[compareIndex] = {
      ...slides[compareIndex],
      slide_type: "comparison",
      title: analysisLevel === 8 ? "前后对比" : "关键对比",
      compare_pair: fallbackComparePair,
      image_refs: [
        { image_id: fallbackComparePair.before_image_id, note: "对比图A" },
        { image_id: fallbackComparePair.after_image_id, note: "对比图B" },
      ],
      plain_language_explanation: ensureRichExplanation({
        base: "和前一阶段相比，当前状态更稳定，说明恢复方向是对的，但仍需持续管理。",
        focusArea: slides[compareIndex].visual_focus_area,
        actionItems: ["保持当前方案连续执行", "按周期复查变化趋势"],
        comparePair: fallbackComparePair,
        assets: usableAssets,
        index: compareIndex,
        total: pageCount,
      }),
      key_metaphor: "像修路后第一次通车，已经顺畅很多，但还要继续养护路面",
      action_items: ["保持当前方案连续执行", "按周期复查变化趋势"],
    };
  }

  return {
    version: "1.0",
    domain: params.domain,
    report_depth: pageCount,
    generated_at:
      typeof row.generated_at === "string" && row.generated_at.trim()
        ? row.generated_at
        : new Date().toISOString(),
    summary:
      typeof row.summary === "string" && row.summary.trim()
        ? row.summary
        : "本次报告面向用户沟通，已按“这张图发生了什么-我们做了什么-下一步建议”整理完成。",
    assets: {
      images: usableAssets,
    },
    slides,
  };
}

function buildFallbackReport(params: AnalyzeGenerativeReportParams): GenerativeReportDocument {
  const assets = createInputAssets(params);
  const pageCount = Math.max(1, params.images.length || params.reportDepth || 1);
  const analysisLevel = getAnalysisLevel(params);
  const comparePair = buildFallbackComparePair(assets);
  const shouldCompare = analysisLevel >= 6 && assets.length >= 2;
  const titles = buildFallbackTitles(pageCount, assets);

  const slides: GenerativeReportSlide[] = titles.map((title, index) => {
    const isSummary = index === titles.length - 1;
    const isOverview = index === 0;
    const isComparison = shouldCompare && (index === 2 || (analysisLevel === 8 && index === 4));

    const imageRefs = isComparison
      ? [
          { image_id: comparePair.before_image_id, note: "阶段前" },
          { image_id: comparePair.after_image_id, note: "阶段后" },
        ]
      : [{ image_id: assets[index % assets.length].image_id }];

    const focusArea = "请重点关注变化最明显的区域";
    const actionItems = isSummary
      ? ["向顾客解释当前结论", "预约下一次复查或复盘"]
      : ["结合现场情况确认细节", "按当前节奏继续执行并记录变化"];

    return {
      slide_id: `slide_${index + 1}`,
      page_number: index + 1,
      slide_type: isComparison ? "comparison" : isSummary ? "summary" : isOverview ? "overview" : "finding",
      title,
      visual_focus_area: focusArea,
      plain_language_explanation: ensureRichExplanation({
        base: isComparison
          ? "前后对比看得出关键区域已经更稳定，说明恢复方向没问题。"
          : "这部分可以理解为状态检查点：先确认趋势，再决定下一步动作。",
        focusArea,
        actionItems,
        comparePair: isComparison ? comparePair : undefined,
        assets,
        index,
        total: pageCount,
      }),
      key_metaphor: DOMAIN_METAPHOR[params.domain],
      action_items: actionItems,
      image_refs: imageRefs,
      compare_pair: isComparison ? comparePair : undefined,
    };
  });

  return {
    version: "1.0",
    domain: params.domain,
    report_depth: pageCount,
    generated_at: new Date().toISOString(),
    summary: "已按用户视角完成草稿：逐页解释这张图发生了什么与下一步建议。",
    assets: { images: assets },
    slides,
  };
}

export async function analyzeGenerativeReport(
  params: AnalyzeGenerativeReportParams,
): Promise<AnalyzeGenerativeReportResult> {
  if (!params.images.length) {
    return {
      report: buildFallbackReport(params),
      usedFallback: true,
      message: "未检测到图片，已生成空白草稿。",
    };
  }

  const totalImages = params.images.length;
  const mergedAssets = createInputAssets(params);
  const mergedSlides: GenerativeReportSlide[] = [];
  let fallbackCount = 0;
  const fallbackMessages: string[] = [];

  for (let index = 0; index < totalImages; index += 1) {
    params.onProgress?.(index + 1, totalImages);

    const singleLabel =
      params.imageLabels?.[index] || getDefaultImageLabel(index, totalImages);

    const singleParams: AnalyzeGenerativeReportParams = {
      ...params,
      images: [params.images[index]],
      imageLabels: [singleLabel],
      reportDepth: 1,
      userNote: [
        params.userNote || "",
        `当前任务：仅分析第 ${index + 1}/${totalImages} 张图，只输出这一张图对应的一页内容。`,
      ]
        .filter(Boolean)
        .join("\n"),
    };

    let singleReport: GenerativeReportDocument;

    try {
      singleReport = await requestSingleImageReport(singleParams);
    } catch (firstError) {
      try {
        singleReport = await requestSingleImageReport({
          ...singleParams,
          userNote: `${singleParams.userNote || ""}\n请严格输出合法 JSON，尤其检查数组结尾的逗号和括号闭合。`,
        });
      } catch (secondError) {
        fallbackCount += 1;
        fallbackMessages.push(
          secondError instanceof Error ? secondError.message : `第 ${index + 1} 张图分析失败`,
        );
        singleReport = buildFallbackReport(singleParams);
      }
    }

    const sourceSlide = singleReport.slides[0] || buildFallbackReport(singleParams).slides[0];
    const currentAsset = mergedAssets[index];
    const focusArea = sourceSlide.visual_focus_area || "重点区域待人工确认";
    const actionItems = normalizeActionItems(sourceSlide.action_items);

    const slide: GenerativeReportSlide = {
      ...sourceSlide,
      slide_id: `slide_${index + 1}`,
      page_number: index + 1,
      slide_type: index === 0 ? "overview" : index === totalImages - 1 ? "summary" : "finding",
      title: sourceSlide.title || `${currentAsset.label || `图 ${index + 1}`} 分析`,
      visual_focus_area: focusArea,
      plain_language_explanation: ensureRichExplanation({
        base: sourceSlide.plain_language_explanation,
        focusArea,
        actionItems,
        assets: mergedAssets,
        index,
        total: totalImages,
      }),
      key_metaphor: sourceSlide.key_metaphor || DOMAIN_METAPHOR[params.domain],
      action_items: actionItems,
      image_refs: [{ image_id: currentAsset.image_id, note: currentAsset.label }],
      compare_pair: undefined,
      explanation_image_url: sourceSlide.explanation_image_url,
    };

    mergedSlides.push(slide);
  }

  const mergedReport: GenerativeReportDocument = {
    version: "1.0",
    domain: params.domain,
    report_depth: totalImages,
    generated_at: new Date().toISOString(),
    summary:
      fallbackCount > 0
        ? "已完成逐张分析，其中部分页面已自动切换为可编辑草稿。"
        : "已完成逐张分析，请按顺序确认每页内容后导出。",
    assets: { images: mergedAssets },
    slides: mergedSlides,
  };

  if (fallbackCount > 0) {
    return {
      report: mergedReport,
      usedFallback: true,
      message: `逐张分析完成，${fallbackCount} 张图使用了草稿兜底。${fallbackMessages[0] || ""}`,
    };
  }

  return {
    report: mergedReport,
    usedFallback: false,
  };
}

async function requestSingleImageReport(
  params: AnalyzeGenerativeReportParams,
): Promise<GenerativeReportDocument> {
  const prompt = buildPrompt(params);
  const { data: { session } } = await supabase.auth.getSession();
  const response = await withTimeout(
    fetch(CHAT_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session?.access_token || supabaseAnonKey}`,
      },
      body: JSON.stringify({
        mode: "generative-report",
        prompt,
        images: params.images,
        stream: false,
        feature_code: 'ai_report_page',
      }),
    }),
    80000,
  );

  if (!response.ok) {
    throw new Error(`分析请求失败: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("未获取到有效分析内容");
  }

  const parsed = safeParseJson(content);
  return normalizeReport(parsed, params);
}

function formatFocusArea(focusArea: VisualFocusArea): string {
  if (typeof focusArea === "string") {
    return focusArea;
  }

  const coord = `x:${focusArea.x}, y:${focusArea.y}, w:${focusArea.width}, h:${focusArea.height}`;
  return focusArea.description ? `${focusArea.description}（${coord}）` : coord;
}

function sanitizeFileName(input: string): string {
  return input.replace(/[\\/:*?"<>|]/g, "-").trim() || "生成式报告";
}

async function ensureDataUrlForPptImage(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;

  const response = await fetch(url);
  if (!response.ok) return url;

  const blob = await response.blob();
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || url));
    reader.onerror = () => resolve(url);
    reader.readAsDataURL(blob);
  });
}

function clampText(input: string, max = 36): string {
  const text = toUserFriendlyText(input || "").replace(/[；;]+/g, "；").replace(/[，,]+/g, "，").trim();
  if (!text) return "待补充";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function getSlideDigest(slide: GenerativeReportSlide): {
  observe: string;
  cause: string;
  suggest: string;
} {
  const lines = (slide.plain_language_explanation || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const extract = (keyword: string) => {
    const hit = lines.find((line) => line.startsWith(keyword));
    if (!hit) return "";
    return hit.replace(new RegExp(`^${keyword}[:：]?\\s*`), "").trim();
  };

  const observe =
    extract("本图观察") ||
    extract("现在情况") ||
    lines[0] ||
    `重点在${formatFocusArea(slide.visual_focus_area)}，可见明显变化。`;

  const cause =
    extract("可能原因") ||
    lines[1] ||
    (slide.compare_pair
      ? `与前期相比，主要变化是${slide.compare_pair.improvement_points.join("；")}`
      : "通常与受力异常或局部损伤有关。");

  const suggest =
    extract("当前建议") ||
    lines[2] ||
    slide.action_items.slice(0, 2).join("；") ||
    "按当前方案继续观察并按时复查。";

  return {
    observe: clampText(observe, 42),
    cause: clampText(cause, 42),
    suggest: clampText(suggest, 42),
  };
}

export async function exportGenerativeReportToPPTX(
  report: GenerativeReportDocument,
  fileName: string,
  options?: {
    coverTitle?: string;
    hospitalName?: string;
    includeCover?: boolean;
    includeClosing?: boolean;
    fixedTotalPages?: number;
    handDrawnFont?: string;
    preferFullPageIllustration?: boolean;
  },
): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  const assetMap = new Map(report.assets.images.map((image) => [image.image_id, image]));
  const handDrawnFont = options?.handDrawnFont || "STKaiti";
  const bodyFont = handDrawnFont;
  const includeCover = options?.includeCover !== false;
  const includeClosing = options?.includeClosing !== false;
  const fixedTotalPages = options?.fixedTotalPages;
  const preferFullPageIllustration = options?.preferFullPageIllustration === true;

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "灵犀创意工具";
  pptx.company = "Lingxi Creative Studio";
  pptx.subject = "生成式报告";
  pptx.title = fileName;

  if (includeCover) {
    const coverSlide = pptx.addSlide();
    coverSlide.background = { color: "FFFDF8" };

    const coverImage = report.cover_generated_image_url
      ? await ensureDataUrlForPptImage(report.cover_generated_image_url)
      : undefined;

    if (coverImage) {
      coverSlide.addImage({
        data: coverImage,
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
        sizing: { type: "cover", x: 0, y: 0, w: 13.333, h: 7.5 },
      });
    } else {
      coverSlide.addShape(pptx.ShapeType.line, {
        x: 0.95,
        y: 1.55,
        w: 11,
        h: 0,
        line: { color: "C89B6D", pt: 1.5 },
      });

      coverSlide.addText(options?.coverTitle || "小白的生成式报告", {
        x: 1.0,
        y: 2.0,
        w: 10.5,
        h: 1.0,
        fontSize: 42,
        bold: true,
        color: "3E2723",
        fontFace: handDrawnFont,
        align: "center",
      });

      coverSlide.addText(options?.hospitalName || "某某医院", {
        x: 1.0,
        y: 3.35,
        w: 10.5,
        h: 0.5,
        fontSize: 24,
        color: "6D4C41",
        fontFace: handDrawnFont,
        align: "center",
      });

      coverSlide.addText("原图 + 图解页 · 一眼看懂诊断重点", {
        x: 1.0,
        y: 4.08,
        w: 10.5,
        h: 0.3,
        fontSize: 13,
        color: "8D6E63",
        fontFace: bodyFont,
        align: "center",
      });

      coverSlide.addText(`生成时间：${new Date().toLocaleString()}`, {
        x: 1.0,
        y: 6.32,
        w: 10.5,
        h: 0.24,
        fontSize: 11,
        color: "8D6E63",
        fontFace: bodyFont,
        align: "center",
      });
    }
  }

  const expectedContentPages = Math.max(1, fixedTotalPages ? Math.max(1, fixedTotalPages - (includeCover ? 1 : 0) - (includeClosing ? 1 : 0)) : report.slides.length);
  const slidesForExport = report.slides.slice(0, expectedContentPages);

  while (slidesForExport.length < expectedContentPages) {
    const idx = slidesForExport.length;
    slidesForExport.push({
      slide_id: `pad_${idx + 1}`,
      page_number: idx + 1,
      slide_type: "finding",
      title: `补充说明 ${idx + 1}`,
      visual_focus_area: "重点区域待补充",
      plain_language_explanation: "本图观察：待补充\n可能原因：待补充\n当前建议：待补充",
      key_metaphor: "",
      action_items: ["补充这页图像说明", "确认后再次导出"],
      image_refs: [],
    });
  }

  for (let slideIdx = 0; slideIdx < slidesForExport.length; slideIdx += 1) {
    const slide = slidesForExport[slideIdx];
    const pptSlide = pptx.addSlide();
    pptSlide.background = { color: "FFFDF8" };

    const sourceImages = slide.image_refs
      .map((ref) => assetMap.get(ref.image_id))
      .filter((asset): asset is ReportImageAsset => Boolean(asset));

    const primaryImage = sourceImages[0]?.url
      ? await ensureDataUrlForPptImage(sourceImages[0].url)
      : undefined;
    const explanationImage = slide.explanation_image_url
      ? await ensureDataUrlForPptImage(slide.explanation_image_url)
      : undefined;
    const compareImage = sourceImages[1]?.url
      ? await ensureDataUrlForPptImage(sourceImages[1].url)
      : undefined;
    const improvementImage = explanationImage || compareImage || primaryImage;
    const improvementLabel = explanationImage
      ? "图解页"
      : compareImage
        ? "对照图"
        : "重点图";

    const displayPage = slideIdx + 1 + (includeCover ? 1 : 0);
    const totalPages = (includeCover ? 1 : 0) + expectedContentPages + (includeClosing ? 1 : 0);
    const digest = getSlideDigest(slide);

    if (preferFullPageIllustration && explanationImage) {
      pptSlide.addImage({
        data: explanationImage,
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
        sizing: { type: "cover", x: 0, y: 0, w: 13.333, h: 7.5 },
      });

      pptSlide.addShape(pptx.ShapeType.roundRect, {
        x: 10.9,
        y: 7.02,
        w: 2.0,
        h: 0.28,
        radius: 0.06,
        fill: { color: "FFFFFF", transparency: 20 },
        line: { color: "D7CCC8", pt: 0.6 },
      });

      pptSlide.addText(`第 ${displayPage} 页 / 共 ${totalPages} 页`, {
        x: 11.0,
        y: 7.07,
        w: 1.8,
        h: 0.16,
        fontSize: 9,
        color: "5D4037",
        fontFace: bodyFont,
        align: "center",
      });

      continue;
    }

    pptSlide.addShape(pptx.ShapeType.line, {
      x: 0.58,
      y: 0.72,
      w: 12.0,
      h: 0,
      line: { color: "C89B6D", pt: 1.2 },
    });

    pptSlide.addText(`${displayPage}. ${slide.title}`, {
      x: 0.7,
      y: 0.32,
      w: 9,
      h: 0.34,
      fontSize: 22,
      bold: true,
      color: "3E2A1F",
      fontFace: handDrawnFont,
    });

    pptSlide.addText(`${report.domain} 报告 · 第 ${displayPage} 页 / 共 ${totalPages} 页`, {
      x: 9.2,
      y: 0.38,
      w: 3.4,
      h: 0.2,
      fontSize: 10,
      color: "8D6E63",
      align: "right",
      fontFace: bodyFont,
    });

    const leftX = 0.68;
    const cardY = 1.0;
    const cardH = 3.95;
    const leftW = 5.82;
    const rightX = 6.78;
    const rightW = 5.82;

    pptSlide.addShape(pptx.ShapeType.roundRect, {
      x: leftX,
      y: cardY,
      w: leftW,
      h: cardH,
      radius: 0.06,
      fill: { color: "FFFFFF" },
      line: { color: "D9B58C", pt: 1.2 },
    });

    pptSlide.addShape(pptx.ShapeType.roundRect, {
      x: rightX,
      y: cardY,
      w: rightW,
      h: cardH,
      radius: 0.06,
      fill: { color: "FFFFFF" },
      line: { color: "D9B58C", pt: 1.2 },
    });

    if (primaryImage) {
      pptSlide.addImage({
        data: primaryImage,
        x: leftX + 0.16,
        y: cardY + 0.18,
        w: leftW - 0.32,
        h: cardH - 0.52,
        sizing: { type: "contain", x: leftX + 0.16, y: cardY + 0.18, w: leftW - 0.32, h: cardH - 0.52 },
      });
    } else {
      pptSlide.addText("等待原图", {
        x: leftX,
        y: cardY + 1.8,
        w: leftW,
        h: 0.3,
        align: "center",
        fontSize: 12,
        color: "8D6E63",
      });
    }

    if (improvementImage) {
      pptSlide.addImage({
        data: improvementImage,
        x: rightX + 0.16,
        y: cardY + 0.18,
        w: rightW - 0.32,
        h: cardH - 0.52,
        sizing: { type: "contain", x: rightX + 0.16, y: cardY + 0.18, w: rightW - 0.32, h: cardH - 0.52 },
      });
    } else {
      pptSlide.addText("等待讲解图", {
        x: rightX,
        y: cardY + 1.8,
        w: rightW,
        h: 0.3,
        align: "center",
        fontSize: 12,
        color: "8D6E63",
      });
    }

    pptSlide.addText(`原图 · ${sourceImages[0]?.label || "本图"}`, {
      x: leftX + 0.06,
      y: cardY + cardH - 0.22,
      w: leftW - 0.12,
      h: 0.18,
      align: "center",
      fontSize: 10,
      color: "6D4C41",
      fontFace: bodyFont,
    });

    pptSlide.addText(`${improvementLabel} · 重点解释`, {
      x: rightX + 0.06,
      y: cardY + cardH - 0.22,
      w: rightW - 0.12,
      h: 0.18,
      align: "center",
      fontSize: 10,
      color: "6D4C41",
      fontFace: bodyFont,
    });

    const noteY = 5.12;
    const noteH = 1.23;
    const noteW = 3.86;
    const noteGap = 0.26;

    const notes = [
      { x: 0.72, bg: "FFF3E8", title: "👀 本图发生了什么", text: digest.observe },
      { x: 0.72 + noteW + noteGap, bg: "EEF7FF", title: "🧩 可能原因", text: digest.cause },
      { x: 0.72 + (noteW + noteGap) * 2, bg: "F1FAEE", title: "✅ 当前建议", text: digest.suggest },
    ];

    notes.forEach((note) => {
      pptSlide.addShape(pptx.ShapeType.roundRect, {
        x: note.x,
        y: noteY,
        w: noteW,
        h: noteH,
        radius: 0.06,
        fill: { color: note.bg },
        line: { color: "D9B58C", pt: 0.8 },
      });
      pptSlide.addText(note.title, {
        x: note.x + 0.12,
        y: noteY + 0.1,
        w: noteW - 0.2,
        h: 0.2,
        fontSize: 11,
        bold: true,
        color: "5D4037",
        fontFace: handDrawnFont,
      });
      pptSlide.addText(note.text, {
        x: note.x + 0.12,
        y: noteY + 0.37,
        w: noteW - 0.22,
        h: 0.74,
        fontSize: 10,
        color: "4E342E",
        breakLine: true,
        valign: "top",
        fontFace: bodyFont,
      });
    });

    const quickActions = slide.action_items.slice(0, 3);
    if (quickActions.length) {
      quickActions.forEach((action, index) => {
        pptSlide.addShape(pptx.ShapeType.roundRect, {
          x: 0.82 + index * 4.05,
          y: 6.64,
          w: 3.78,
          h: 0.34,
          radius: 0.08,
          fill: { color: "FFFFFF" },
          line: { color: "D9B58C", pt: 0.8 },
        });
        pptSlide.addText(`• ${clampText(action, 22)}`, {
          x: 0.95 + index * 4.05,
          y: 6.72,
          w: 3.5,
          h: 0.18,
          fontSize: 9,
          color: "5D4037",
          fontFace: bodyFont,
          breakLine: false,
        });
      });
    }
  }

  if (includeClosing) {
    const closingSlide = pptx.addSlide();
    closingSlide.background = { color: "FFFDF8" };

    const closingImage = report.closing_generated_image_url
      ? await ensureDataUrlForPptImage(report.closing_generated_image_url)
      : undefined;

    if (closingImage) {
      closingSlide.addImage({
        data: closingImage,
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
        sizing: { type: "cover", x: 0, y: 0, w: 13.333, h: 7.5 },
      });
    } else {
      closingSlide.addText("总结与后续建议", {
        x: 0.8,
        y: 0.9,
        w: 11.8,
        h: 0.6,
        fontSize: 34,
        bold: true,
        color: "3E2723",
        align: "center",
        fontFace: handDrawnFont,
      });

      closingSlide.addShape(pptx.ShapeType.roundRect, {
        x: 1.1,
        y: 1.9,
        w: 11.1,
        h: 3.9,
        radius: 0.08,
        fill: { color: "FFF8E1" },
        line: { color: "D7CCC8", pt: 1.2 },
      });

      closingSlide.addText(clampText(report.summary || "本次报告已完成，建议按计划复查并持续观察关键变化。", 120), {
        x: 1.5,
        y: 2.35,
        w: 10.3,
        h: 2.9,
        fontSize: 22,
        color: "4E342E",
        align: "center",
        valign: "middle",
        breakLine: true,
        fontFace: bodyFont,
      });

      closingSlide.addText(options?.hospitalName || "某某医院", {
        x: 0.9,
        y: 6.45,
        w: 11.8,
        h: 0.3,
        fontSize: 12,
        color: "8D6E63",
        align: "center",
        fontFace: bodyFont,
      });
    }
  }

  const finalName = sanitizeFileName(fileName);
  await pptx.writeFile({ fileName: `${finalName}.pptx` });
}
