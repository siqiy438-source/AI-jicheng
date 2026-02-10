/**
 * AI 图像生成服务 - 通过 Supabase Edge Function 调用
 * 使用 Gemini 2.5 Flash Image (Nano Banana) 模型
 */

import { supabaseAnonKey } from './supabase';

// 对话消息类型（用于多轮对话）
export interface ConversationMessage {
  role: 'user' | 'model';
  parts: Array<{ text?: string } | { inlineData?: { mimeType: string; data: string } }>;
}

// 图像生成参数
export interface ImageGenerationParams {
  prompt?: string;
  style?: string;
  aspectRatio?: string;
  negativePrompt?: string;
  styleId?: string;
  images?: string[];
  line?: "standard" | "premium";
  resolution?: "default" | "2k" | "4k";
  hasFrameworkPrompt?: boolean;
  conversationHistory?: ConversationMessage[];
}

// 图像生成结果
export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  rawContent?: string;
  error?: string;
}

// Supabase Edge Function URL
const getEdgeFunctionUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kzdjqqinkonqlclbwleh.supabase.co';
  return `${supabaseUrl}/functions/v1/ai-image`;
};

/**
 * 生成图像
 */
export async function generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  try {
    // 获取当前用户的 session（用于认证）
    // 注意：如果 session token 过期，Supabase 会返回 401
    // 所以我们总是使用 anon key，这样更稳定
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    };

    // 设置 120 秒超时（AI 图像生成可能需要较长时间）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      // 处理 504 Gateway Timeout
      if (response.status === 504) {
        throw new Error('请求超时，AI 服务响应过慢。请切换到高级线路或稍后重试');
      }
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    // 处理 AbortError（前端超时）
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: '请求超时，AI 服务响应过慢。请切换到高级线路或稍后重试',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成图像失败',
    };
  }
}

// 风格预设
export const IMAGE_STYLES = [
  { id: 'realistic', name: '写实风格', prompt: 'photorealistic, high quality, detailed' },
  { id: 'anime', name: '动漫风格', prompt: 'anime style, vibrant colors, clean lines' },
  { id: 'watercolor', name: '水彩画', prompt: 'watercolor painting, soft colors, artistic' },
  { id: 'oil-painting', name: '油画风格', prompt: 'oil painting, rich textures, classical art' },
  { id: 'minimalist', name: '极简风格', prompt: 'minimalist, clean, simple, modern' },
  { id: 'cyberpunk', name: '赛博朋克', prompt: 'cyberpunk, neon lights, futuristic, dark' },
  { id: 'chinese-ink', name: '国画水墨', prompt: 'traditional Chinese ink painting, elegant, flowing' },
  { id: 'poster', name: '海报设计', prompt: 'professional poster design, eye-catching, marketing' },
];

// 尺寸比例
export const ASPECT_RATIOS = [
  { id: '1:1', name: '1:1 方形', value: '1:1' },
  { id: '16:9', name: '16:9 横版', value: '16:9' },
  { id: '9:16', name: '9:16 竖版', value: '9:16' },
  { id: '4:3', name: '4:3 标准', value: '4:3' },
  { id: '3:4', name: '3:4 竖版', value: '3:4' },
];
