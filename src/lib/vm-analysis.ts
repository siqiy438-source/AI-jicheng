/**
 * VM (Visual Merchandising) 分析服务
 * Agent Team 模式：4 位 AI 专家协同分析服装陈列方案
 */

import { supabaseAnonKey, getAccessToken, forceRefreshToken } from './supabase';

// ---- 景别类型 ----
export type SceneType = 'wide' | 'medium' | 'closeup';

// ---- 类型定义 ----

export interface DominantColor {
  name: string;
  hex: string;
}

export interface ColorAnalysis {
  dominantColors: DominantColor[];
  colorFamily: string;
  backgroundRecommendation: {
    color: string;
    hex: string;
    reasoning: string;
  };
}

export interface StyleDetection {
  styleCategory: string;
  styleDescription: string;
  recommendedProps: string[];
  propPlacement: string;
}

export interface CompositionPlan {
  totalPieces: number;
  soloHangers: number;
  layeredHangers: number;
  spacingPercent: number;
  hemRhythm: string;
  anchorItems: string;
  railDescription: string;
}

export interface LightingPlan {
  direction: string;
  warmth: string;
  colorTemperature: string;
  shadowStyle: string;
  specialNotes: string;
}

export interface DisplayGuide {
  garmentList: string[];
  railStyle: string;
  arrangementSteps: string[];
  pairingAdvice: string[];
  heightRhythmDescription: string;
  salesTalk: string[];
  overallNarrative: string;
}

export interface VMAnalysisResult {
  colorAnalysis: ColorAnalysis;
  styleDetection: StyleDetection;
  compositionPlan: CompositionPlan;
  lightingPlan: LightingPlan;
  displayGuide: DisplayGuide;
  summary: string;
}

// ---- Agent 元数据 ----

export interface AgentInfo {
  id: string;
  name: string;
  nameCn: string;
  icon: string;
  iconSrc?: string;
  color: string;
  bgColor: string;
  description: string;
}

export const VM_AGENTS: AgentInfo[] = [
  {
    id: 'color',
    name: 'Color Analyst',
    nameCn: '色彩分析师',
    icon: '🎨',
    iconSrc: '/icons/vm-agent-color.png',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    description: '提取主色调，推荐背景配色',
  },
  {
    id: 'style',
    name: 'Style Detector',
    nameCn: '风格识别师',
    icon: '👁️',
    iconSrc: '/icons/vm-agent-style.png',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    description: '识别服装风格，推荐道具搭配',
  },
  {
    id: 'composition',
    name: 'Composition Planner',
    nameCn: '构图规划师',
    icon: '📐',
    iconSrc: '/icons/vm-agent-composition.png',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    description: '规划挂杆布局与空间节奏',
  },
  {
    id: 'lighting',
    name: 'Lighting Director',
    nameCn: '灯光指导',
    icon: '💡',
    iconSrc: '/icons/vm-agent-lighting.png',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    description: '设计灯光方案与阴影效果',
  },
];

// ---- 默认分析结果（API 失败时的兜底） ----

const DEFAULT_ANALYSIS: VMAnalysisResult = {
  colorAnalysis: {
    dominantColors: [{ name: '中性色', hex: '#8B7D6B' }],
    colorFamily: '大地色系',
    backgroundRecommendation: {
      color: '暖米色',
      hex: '#F5F0EB',
      reasoning: '中性暖色背景，适配大多数服装',
    },
  },
  styleDetection: {
    styleCategory: 'Work/Minimal',
    styleDescription: '简约通勤风格',
    recommendedProps: ['几何书立', '哑光陶瓷花瓶', '皮质收纳盘'],
    propPlacement: '花瓶置于挂杆右下方地面，书立靠墙',
  },
  compositionPlan: {
    totalPieces: 6,
    soloHangers: 4,
    layeredHangers: 2,
    spacingPercent: 18,
    hemRhythm: '长-短-长-短 交替节奏',
    anchorItems: '皮鞋一双置于挂杆下方，艺术画册斜靠墙面',
    railDescription: '抛光金属挂杆，延伸超出画面两侧边缘',
  },
  lightingPlan: {
    direction: '左上方 45 度柔光',
    warmth: '暖调',
    colorTemperature: '3200K',
    shadowStyle: '柔和漫射阴影，面料褶皱处有微妙明暗变化',
    specialNotes: '画廊级暖白光，让面料质感更丰富',
  },
  summary: '建议采用简约通勤风格陈列，以大地色系为主调，搭配暖米色背景墙，营造高级感。',
  displayGuide: {
    garmentList: [
      '驼色长款风衣，垂坠感好，面料偏厚实',
      '黑色修身西装外套，一粒扣，面料挺括',
      '白色丝质衬衫，V领，面料有光泽',
      '灰色羊绒针织开衫，宽松版型',
      '米色A字半裙，中长款，面料有质感',
      '浅蓝色棉质打底衫，圆领，薄款',
    ],
    railStyle: '法式轻通勤风 — 干练但不刻板，有女人味但不甜腻，适合 25-35 岁职场女性日常穿搭',
    arrangementSteps: [
      '最左边单挂驼色长款风衣，它是这组里最有气场的单品，放在起始位撑住整面墙',
      '风衣旁边，把黑色西装外套套在白色丝质衬衫外面叠挂，展示一组通勤搭配',
      '接着单挂灰色针织开衫，和前面的西装叠挂组拉开高度差',
      '最右边把米色半裙和浅蓝打底衫叠挂收尾，用一组轻松的搭配平衡前面的正式感',
    ],
    pairingAdvice: [
      '黑色西装 + 白色丝质衬衫叠挂：经典黑白配，面料一硬一软，对比很高级，顾客一眼就能看到穿搭方案',
      '驼色风衣单独挂：它够长够有分量，单独展示更有气场，顾客会被它的垂坠感吸引过来',
      '米色半裙 + 浅蓝打底衫叠挂：颜色清爽，放在最右边让整杆衣服的色调有个渐变收尾',
    ],
    heightRhythmDescription: '从左到右：驼色风衣（长，约110cm）→ 黑色西装+白衬衫叠挂（中，约75cm）→ 灰色开衫（中短，约65cm）→ 米色半裙+打底叠挂（中，约70cm），形成"长-中-短-中"的波浪节奏',
    salesTalk: [
      '姐，这件风衣您看一下，今年很流行这种驼色，搭配里面这件白衬衫特别显气质，通勤约会都能穿',
      '这套黑色西装配白衬衫是我们店搭配好的，您直接拿走就能穿，面试、开会都很得体，丝质衬衫贴身也很舒服',
      '如果您周末想穿得轻松一点，这件针织开衫配这条米色半裙就很合适，温柔又不会太随意',
    ],
    overallNarrative: '这一杆我给您搭的是法式轻通勤风，左边驼色风衣镇场，中间黑白西装组展示搭配功力，右边针织和半裙收尾让整体不会太严肃。顾客从左看到右，能看到从正式到休闲的过渡，每一组都是可以直接带走的穿搭方案。',
  },
};

// ---- API 调用 ----

// ---- 单件衣服识别 ----

export async function identifySingleGarment(image: string): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kzdjqqinkonqlclbwleh.supabase.co';
  const url = `${supabaseUrl}/functions/v1/ai-chat`;

  const doFetch = async (token: string | null) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mode: 'vm-identify',
        prompt: '请描述这件衣服：颜色+款式+关键特征',
        images: [image],
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  };

  try {
    let token = await getAccessToken();
    let response = await doFetch(token);

    // 401 时强制刷新 token 重试一次
    if (response.status === 401) {
      token = await forceRefreshToken();
      response = await doFetch(token);
    }

    if (!response.ok) {
      throw new Error(`识别失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return content?.trim() || '未能识别';
  } catch {
    return '识别失败';
  }
}

export async function identifyAllGarments(
  images: string[],
  onProgress?: (index: number, total: number, desc: string) => void
): Promise<string[]> {
  const results: string[] = [];

  // 每次并发 3 个，避免 API 限流
  const batchSize = 3;
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (img, j) => {
        const desc = await identifySingleGarment(img);
        onProgress?.(i + j + 1, images.length, desc);
        return desc;
      })
    );
    results.push(...batchResults);
  }

  return results;
}

// ---- 陈列分析（基于已识别的衣服清单） ----

export async function analyzeClothingForDisplay(
  garmentList: string[],
  clothingCount: number,
  additionalNotes?: string
): Promise<VMAnalysisResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kzdjqqinkonqlclbwleh.supabase.co';
  const url = `${supabaseUrl}/functions/v1/ai-chat`;

  const garmentListText = garmentList.map((g, i) => `第${i + 1}件：${g}`).join('\n');

  const prompt = `你是顶级女装陈列师。以下是店主这一杆挂杆上的 ${clothingCount} 件衣服（已逐件识别）：

${garmentListText}

请严格基于以上 ${clothingCount} 件衣服来做陈列方案。

重要规则：
- displayGuide 里的 garmentList 直接复制上面每件衣服的描述
- arrangementSteps、pairingAdvice、heightRhythmDescription、salesTalk 里提到的每件衣服，必须是上面列表中实际存在的衣服，用它们的名称来写（如"深蓝色高腰阔腿裤"），绝对不能编造列表中没有的衣服
- totalPieces = ${clothingCount}
${additionalNotes ? `\n店主补充说明：${additionalNotes}` : ''}`;

  const doFetch = async (token: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        mode: 'vm-analysis',
        prompt,
        stream: false,
        feature_code: 'ai_display_standard',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  };

  try {
    let token = await getAccessToken();
    if (!token) {
      throw new Error('请先登录后再使用陈列分析功能');
    }
    let response = await doFetch(token);

    // 401 时强制刷新 token 重试一次
    if (response.status === 401) {
      const newToken = await forceRefreshToken();
      if (!newToken) {
        throw new Error('登录已过期，请重新登录');
      }
      response = await doFetch(newToken);
    }

    if (!response.ok) {
      throw new Error(`分析请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('未返回分析内容');
    }

    // 解析 JSON（处理可能的 markdown 包裹）
    let jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // 尝试修复被截断的 JSON
    try {
      const analysis: VMAnalysisResult = JSON.parse(jsonStr);
      return analysis;
    } catch {
      console.warn('JSON 解析失败，尝试修复截断的 JSON...');
      // 尝试补全截断的 JSON：加上缺失的引号和括号
      let repaired = jsonStr;
      // 如果在字符串中间截断，先闭合字符串
      const openQuotes = (repaired.match(/"/g) || []).length;
      if (openQuotes % 2 !== 0) repaired += '"';
      // 补全缺失的括号
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;
      for (let k = 0; k < openBrackets - closeBrackets; k++) repaired += ']';
      for (let k = 0; k < openBraces - closeBraces; k++) repaired += '}';

      try {
        const analysis: VMAnalysisResult = JSON.parse(repaired);
        return analysis;
      } catch {
        throw new Error('AI 返回的数据格式异常，请重试');
      }
    }
  } catch (error) {
    console.error('VM 分析失败:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('分析超时，请重试');
    }
    // 不再静默返回默认值，直接抛出错误让用户知道
    throw new Error(`陈列分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}
