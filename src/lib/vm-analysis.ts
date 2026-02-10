/**
 * VM (Visual Merchandising) 分析服务
 * Agent Team 模式：4 位 AI 专家协同分析服装陈列方案
 */

import { supabaseAnonKey } from './supabase';

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
  styleCategory: 'Work/Minimal' | 'Relaxed/Resort' | 'Artistic/Vintage';
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

export interface VMAnalysisResult {
  colorAnalysis: ColorAnalysis;
  styleDetection: StyleDetection;
  compositionPlan: CompositionPlan;
  lightingPlan: LightingPlan;
  summary: string;
}

// ---- Agent 元数据 ----

export interface AgentInfo {
  id: string;
  name: string;
  nameCn: string;
  icon: string;
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
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    description: '提取主色调，推荐背景配色',
  },
  {
    id: 'style',
    name: 'Style Detector',
    nameCn: '风格识别师',
    icon: '👁️',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    description: '识别服装风格，推荐道具搭配',
  },
  {
    id: 'composition',
    name: 'Composition Planner',
    nameCn: '构图规划师',
    icon: '📐',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    description: '规划挂杆布局与空间节奏',
  },
  {
    id: 'lighting',
    name: 'Lighting Director',
    nameCn: '灯光指导',
    icon: '💡',
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
};

// ---- API 调用 ----

export async function analyzeClothingForDisplay(
  images: string[],
  clothingCount: number,
  additionalNotes?: string
): Promise<VMAnalysisResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kzdjqqinkonqlclbwleh.supabase.co';
  const url = `${supabaseUrl}/functions/v1/ai-chat`;

  const prompt = `请分析这张图片中的 ${clothingCount} 件服装，为店铺陈列提供专业方案。图片是一张编号网格图，包含 ${clothingCount} 件衣服（编号 #1 到 #${clothingCount}）。注意：构图规划中的 totalPieces 必须等于 ${clothingCount}。${additionalNotes ? `\n店主补充说明：${additionalNotes}` : ''}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        mode: 'vm-analysis',
        prompt,
        images,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`分析请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('未返回分析内容');
    }

    // 解析 JSON（处理可能的 markdown 包裹）
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis: VMAnalysisResult = JSON.parse(jsonStr);
    return analysis;
  } catch (error) {
    console.error('VM 分析失败:', error);
    // 返回默认分析结果，让用户仍可继续
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('分析超时，请重试');
    }
    // 对于解析错误，返回默认值
    console.warn('使用默认分析结果');
    return DEFAULT_ANALYSIS;
  }
}
