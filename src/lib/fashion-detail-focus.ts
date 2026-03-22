import { forceRefreshToken, getAccessToken, supabaseAnonKey, supabaseUrl } from "./supabase";

export type DetailOptionCategory = "structure" | "feature" | "craft" | "fabric" | "custom";

export interface DetailOption {
  id: string;
  category: DetailOptionCategory;
  title: string;
  instruction: string;
  reason: string;
  priority: number;
}

export interface DetailFocusOptionsResult {
  itemType: string;
  summary: string;
  suggestions: DetailOption[];
}

export const DEFAULT_DETAIL_FOCUS_OPTIONS: DetailOption[] = [
  {
    id: "structure",
    category: "structure",
    title: "结构特写",
    instruction:
      "自动识别单品类型。若是外套/上衣，重点展示领口、袖口、门襟等真实存在的结构；若是裤装，重点展示腰头、裤脚、口袋结构。必须是近景。",
    reason: "先把这件衣服最能说明版型和做工的结构部位拍清楚，适合商品详情页第一张细节图。",
    priority: 100,
  },
  {
    id: "feature",
    category: "feature",
    title: "元素特写",
    instruction:
      "聚焦参考图中真实存在、最有辨识度的局部元素，优先从纽扣、拉链、口袋、抽绳、腰带、门襟、袖袢、肩章等中选择；若没有五金或配件，则改拍其他真实存在的元素，禁止臆造。",
    reason: "突出顾客最容易一眼记住的标志性元素，提升记忆点。",
    priority: 90,
  },
  {
    id: "craft",
    category: "craft",
    title: "工艺细节",
    instruction:
      "聚焦参考图中真实存在的工艺细节，优先展示走线、压线、拼接、刺绣、提花、压花等；如果没有特殊工艺，则展示最有代表性的结构细节，避免与其他细节图重复。",
    reason: "适合体现做工精细度，让细节图更有说服力。",
    priority: 80,
  },
  {
    id: "fabric",
    category: "fabric",
    title: "面料纹理",
    instruction:
      "聚焦衣服真实可见的面料纹理和纤维质感，必须拍出织纹、表面肌理、垂感或绒感等真实材质特征，不得改变颜色和面料。",
    reason: "把手感和面料质感视觉化，适合电商详情页的质感表达。",
    priority: 70,
  },
  {
    id: "stitching",
    category: "craft",
    title: "缝线与压线",
    instruction:
      "聚焦衣服真实存在的缝线、压线、接缝或收边处理，细节主体占画面 60% 以上，要求清晰呈现做工与结构关系。",
    reason: "适合补充说明工艺品质，尤其是版型硬挺或结构感强的单品。",
    priority: 60,
  },
  {
    id: "finish",
    category: "structure",
    title: "袖口或裤脚收口",
    instruction:
      "优先展示袖口、裤脚、下摆等真实存在的收口处理，体现边缘结构、厚薄层次和成衣完成度，必须保持近景与真实质感。",
    reason: "作为补充特写很稳，适合避免几张细节图拍得太像。",
    priority: 50,
  },
];

const MAX_SUGGESTIONS = 8;

export function normalizeDetailSuggestions(
  suggestions: unknown,
): DetailOption[] {
  if (!Array.isArray(suggestions)) return [];

  const normalized = suggestions
    .map((item, index) => {
      const raw = item as Record<string, unknown>;
      const category = raw.category;
      const normalizedCategory: DetailOptionCategory =
        category === "structure" ||
        category === "feature" ||
        category === "craft" ||
        category === "fabric" ||
        category === "custom"
          ? category
          : "feature";

      const title = typeof raw.title === "string" ? raw.title.trim() : "";
      const instruction = typeof raw.instruction === "string" ? raw.instruction.trim() : "";
      const reason = typeof raw.reason === "string" ? raw.reason.trim() : "";
      const priority =
        typeof raw.priority === "number" && Number.isFinite(raw.priority)
          ? raw.priority
          : MAX_SUGGESTIONS - index;

      if (!title || !instruction) return null;

      return {
        id:
          typeof raw.id === "string" && raw.id.trim()
            ? raw.id.trim()
            : `${normalizedCategory}-${index + 1}`,
        category: normalizedCategory,
        title,
        instruction,
        reason: reason || "AI 根据这件衣服的真实可见细节给出的推荐选项。",
        priority,
      } satisfies DetailOption;
    })
    .filter((item): item is DetailOption => Boolean(item))
    .slice(0, MAX_SUGGESTIONS);

  const deduped: DetailOption[] = [];
  const seen = new Set<string>();

  for (const item of normalized) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }

  return deduped;
}

export function parseDetailFocusOptionsContent(content: string): DetailFocusOptionsResult {
  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  const tryParse = (payload: string) => {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    const suggestions = normalizeDetailSuggestions(parsed.suggestions);
    if (suggestions.length === 0) {
      throw new Error("missing suggestions");
    }

    return {
      itemType: typeof parsed.itemType === "string" ? parsed.itemType.trim() : "",
      summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
      suggestions,
    } satisfies DetailFocusOptionsResult;
  };

  try {
    return tryParse(cleaned);
  } catch {
    let repaired = cleaned;
    const openQuotes = (repaired.match(/"/g) || []).length;
    if (openQuotes % 2 !== 0) repaired += '"';
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    for (let index = 0; index < openBrackets - closeBrackets; index += 1) repaired += "]";
    for (let index = 0; index < openBraces - closeBraces; index += 1) repaired += "}";
    return tryParse(repaired);
  }
}

export function getFallbackDetailFocusOptions(): DetailFocusOptionsResult {
  return {
    itemType: "未知单品",
    summary: "未能稳定识别候选细节，已为你准备通用但安全的细节特写选项。",
    suggestions: DEFAULT_DETAIL_FOCUS_OPTIONS,
  };
}

async function ensureDataUrl(image: string): Promise<string> {
  if (image.startsWith("data:")) return image;

  const response = await fetch(image);
  if (!response.ok) {
    throw new Error(`图片读取失败: ${response.status}`);
  }

  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("图片转换失败"));
    reader.readAsDataURL(blob);
  });
}

export async function getDetailFocusOptions(
  sourceImage: string,
  mainImage: string,
): Promise<DetailFocusOptionsResult> {
  const token = await getAccessToken();
  if (!token) throw new Error("请先登录后再使用 AI 细节特写");

  const url = `${supabaseUrl}/functions/v1/ai-chat`;
  const [sourceImageDataUrl, mainImageDataUrl] = await Promise.all([
    ensureDataUrl(sourceImage),
    ensureDataUrl(mainImage),
  ]);
  const body = {
    mode: "detail-focus-options",
    prompt:
      "请基于参考图和主图，输出这件衣服最值得展示的细节候选项，供用户自行选择生成细节特写。",
    images: [sourceImageDataUrl, mainImageDataUrl],
    stream: false,
  };

  const doFetch = async (accessToken: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  };

  let response = await doFetch(token);
  if (response.status === 401) {
    const newToken = await forceRefreshToken();
    if (!newToken) throw new Error("登录已过期，请重新登录");
    response = await doFetch(newToken);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`细节建议分析失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("未返回细节建议内容");
  return parseDetailFocusOptionsContent(content);
}
